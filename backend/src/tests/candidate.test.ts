import request from 'supertest';
import { app } from '../index';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

describe('Candidate API', () => {
  let authToken: string;

  beforeAll(async () => {
    // Crear usuario de prueba
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        password: 'hashedPassword',
        firstName: 'Test',
        lastName: 'User',
        role: 'RECRUITER',
      },
    });

    // Generar token
    authToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    await prisma.user.deleteMany();
    await prisma.candidate.deleteMany();
    await prisma.$disconnect();
  });

  describe('POST /api/v1/candidates', () => {
    it('should create a new candidate', async () => {
      const candidateData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '+34600000000',
      };

      const response = await request(app)
        .post('/api/v1/candidates')
        .set('Authorization', `Bearer ${authToken}`)
        .send(candidateData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.email).toBe(candidateData.email);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/v1/candidates')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/v1/candidates', () => {
    it('should return a list of candidates', async () => {
      const response = await request(app)
        .get('/api/v1/candidates')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.candidates)).toBe(true);
    });

    it('should handle pagination', async () => {
      const response = await request(app)
        .get('/api/v1/candidates?page=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.pagination).toHaveProperty('currentPage');
      expect(response.body.pagination).toHaveProperty('total');
    });
  });
});