import request from 'supertest';
import { app } from '../index';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs/promises';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

describe('File Management', () => {
  let authToken: string;
  let candidateId: number;
  const testFilePath = path.join(__dirname, 'fixtures', 'test.pdf');
  const uploadDir = process.env.FILE_UPLOAD_PATH || 'uploads';

  beforeAll(async () => {
    // Crear directorio de fixtures si no existe
    await fs.mkdir(path.join(__dirname, 'fixtures'), { recursive: true });
    // Crear archivo de prueba
    await fs.writeFile(testFilePath, 'Test PDF content');

    // Crear usuario de prueba
    const user = await prisma.user.create({
      data: {
        email: 'filetest@example.com',
        password: 'hashedPassword',
        firstName: 'File',
        lastName: 'Test',
        role: 'RECRUITER',
      },
    });

    // Crear candidato de prueba
    const candidate = await prisma.candidate.create({
      data: {
        firstName: 'File',
        lastName: 'Candidate',
        email: 'filecandidate@example.com',
        phone: '+34600000000',
      },
    });

    candidateId = candidate.id;
    authToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    // Limpiar archivos y datos de prueba
    await fs.unlink(testFilePath).catch(() => {});
    await fs.rm(uploadDir, { recursive: true, force: true }).catch(() => {});
    await prisma.fileRecord.deleteMany();
    await prisma.candidate.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  describe('POST /api/v1/files/upload/:candidateId', () => {
    it('should upload a file successfully', async () => {
      const response = await request(app)
        .post(`/api/v1/files/upload/${candidateId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', testFilePath);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('filename');
      expect(response.body.candidateId).toBe(candidateId);
    });

    it('should reject invalid file types', async () => {
      // Crear archivo temporal con extensión no permitida
      const invalidFilePath = path.join(__dirname, 'fixtures', 'test.txt');
      await fs.writeFile(invalidFilePath, 'Invalid file content');

      const response = await request(app)
        .post(`/api/v1/files/upload/${candidateId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', invalidFilePath);

      expect(response.status).toBe(400);
      await fs.unlink(invalidFilePath);
    });

    it('should handle missing files', async () => {
      const response = await request(app)
        .post(`/api/v1/files/upload/${candidateId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/v1/files/:id', () => {
    let fileId: number;

    beforeEach(async () => {
      // Subir archivo para pruebas
      const response = await request(app)
        .post(`/api/v1/files/upload/${candidateId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', testFilePath);

      fileId = response.body.id;
    });

    it('should retrieve a file successfully', async () => {
      const response = await request(app)
        .get(`/api/v1/files/${fileId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('application/pdf');
    });

    it('should handle non-existent files', async () => {
      const response = await request(app)
        .get('/api/v1/files/99999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });
});