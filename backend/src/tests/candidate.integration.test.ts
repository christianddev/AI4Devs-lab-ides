import request from 'supertest';
import { app } from '../index';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

describe('Candidate Integration Tests', () => {
  let authToken: string;
  let adminToken: string;

  beforeAll(async () => {
    // Crear usuario recruiter
    const recruiter = await prisma.user.create({
      data: {
        email: 'recruiter@example.com',
        password: 'hashedPassword',
        firstName: 'Test',
        lastName: 'Recruiter',
        role: 'RECRUITER',
      },
    });

    // Crear usuario admin
    const admin = await prisma.user.create({
      data: {
        email: 'admin@example.com',
        password: 'hashedPassword',
        firstName: 'Test',
        lastName: 'Admin',
        role: 'ADMIN',
      },
    });

    authToken = jwt.sign(
      { userId: recruiter.id, email: recruiter.email, role: recruiter.role },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    adminToken = jwt.sign(
      { userId: admin.id, email: admin.email, role: admin.role },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    await prisma.candidateInteraction.deleteMany();
    await prisma.fileRecord.deleteMany();
    await prisma.experience.deleteMany();
    await prisma.education.deleteMany();
    await prisma.candidate.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  describe('Complete Candidate Lifecycle', () => {
    let candidateId: number;

    it('should create a candidate with full details', async () => {
      const candidateData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+34600000000',
        address: 'Test Address',
        linkedinUrl: 'https://linkedin.com/in/johndoe',
        experiences: [
          {
            title: 'Software Engineer',
            company: 'Tech Corp',
            startDate: '2020-01-01',
            endDate: '2023-01-01',
            description: 'Full stack development',
          },
        ],
        education: [
          {
            title: 'Computer Science',
            institution: 'Test University',
            startDate: '2016-01-01',
            endDate: '2020-01-01',
            description: 'Bachelor degree',
          },
        ],
      };

      const response = await request(app)
        .post('/api/v1/candidates')
        .set('Authorization', `Bearer ${authToken}`)
        .send(candidateData);

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        email: candidateData.email,
        status: 'NEW',
      });
      expect(response.body.experiences).toHaveLength(1);
      expect(response.body.education).toHaveLength(1);

      candidateId = response.body.id;
    });

    it('should update candidate status', async () => {
      const response = await request(app)
        .put(`/api/v1/candidates/${candidateId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'REVIEWING',
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('REVIEWING');
    });

    it('should add an interaction', async () => {
      const interactionData = {
        type: 'INTERVIEW_SCHEDULED',
        notes: 'First interview scheduled for next week',
      };

      const response = await request(app)
        .post(`/api/v1/candidates/${candidateId}/interactions`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(interactionData);

      expect(response.status).toBe(201);
      expect(response.body.notes).toBe(interactionData.notes);
    });

    it('should retrieve candidate with all relations', async () => {
      const response = await request(app)
        .get(`/api/v1/candidates/${candidateId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('experiences');
      expect(response.body).toHaveProperty('education');
      expect(response.body).toHaveProperty('interactions');
    });

    it('should delete candidate (admin only)', async () => {
      const response = await request(app)
        .delete(`/api/v1/candidates/${candidateId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(204);
    });
  });

  describe('Search and Filters', () => {
    beforeEach(async () => {
      // Crear varios candidatos para pruebas de búsqueda
      await prisma.candidate.createMany({
        data: [
          {
            firstName: 'Alice',
            lastName: 'Smith',
            email: 'alice@example.com',
            phone: '+34600000001',
            status: 'NEW',
          },
          {
            firstName: 'Bob',
            lastName: 'Johnson',
            email: 'bob@example.com',
            phone: '+34600000002',
            status: 'NEW',
          },
        ],
      });
    });

    it('should search candidates by name', async () => {
      const response = await request(app)
        .get('/api/v1/candidates?search=John')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
    });

    it('should filter candidates by status', async () => {
      const response = await request(app)
        .get('/api/v1/candidates?status=NEW')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
    });
  });
});