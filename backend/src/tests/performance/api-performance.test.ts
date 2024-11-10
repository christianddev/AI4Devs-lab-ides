import request from 'supertest';
import { app } from '../../index';
import { PrismaClient } from '@prisma/client';
import { TestDataGenerator } from '../helpers/test-data-generator';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const dataGenerator = new TestDataGenerator(prisma);

describe('API Performance Tests', () => {
  let authToken: string;

  beforeAll(async () => {
    // Crear usuario de prueba y generar token
    const user = await prisma.user.create({
      data: {
        email: 'performance@test.com',
        password: 'hashedPassword',
        firstName: 'Performance',
        lastName: 'Tester',
        role: 'ADMIN',
      },
    });

    authToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    // Generar datos de prueba
    await dataGenerator.generateCandidates(1000);
  });

  afterAll(async () => {
    await dataGenerator.cleanup();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  describe('Concurrent Requests', () => {
    it('should handle multiple concurrent GET requests efficiently', async () => {
      const numberOfRequests = 50;
      const startTime = Date.now();

      const requests = Array(numberOfRequests).fill(null).map(() =>
        request(app)
          .get('/api/v1/candidates')
          .set('Authorization', `Bearer ${authToken}`)
      );

      const responses = await Promise.all(requests);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      console.log(`Processed ${numberOfRequests} concurrent requests in ${totalTime}ms`);
      console.log(`Average time per request: ${totalTime / numberOfRequests}ms`);

      // Verificaciones
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.candidates).toBeDefined();
      });

      // El tiempo promedio por solicitud no debe superar los 100ms
      expect(totalTime / numberOfRequests).toBeLessThan(100);
    }, 30000); // Aumentar timeout para tests de rendimiento
  });

  describe('Pagination Performance', () => {
    it('should maintain consistent response times across different page sizes', async () => {
      const pageSizes = [10, 50, 100];
      const results = [];

      for (const pageSize of pageSizes) {
        const startTime = Date.now();
        const response = await request(app)
          .get(`/api/v1/candidates?limit=${pageSize}&page=1`)
          .set('Authorization', `Bearer ${authToken}`);
        const endTime = Date.now();

        results.push({
          pageSize,
          time: endTime - startTime,
          status: response.status,
          count: response.body.candidates.length,
        });

        expect(response.status).toBe(200);
        expect(response.body.candidates.length).toBeLessThanOrEqual(pageSize);
      }

      console.table(results);

      // Verificar que el tiempo de respuesta escala linealmente
      const timeRatios = results.map(r => r.time / r.pageSize);
      const maxRatioDifference = Math.max(...timeRatios) - Math.min(...timeRatios);
      expect(maxRatioDifference).toBeLessThan(5); // máximo 5ms de diferencia por elemento
    });
  });

  describe('Search Performance', () => {
    it('should perform text search efficiently', async () => {
      const startTime = Date.now();
      const response = await request(app)
        .get('/api/v1/candidates?search=Performance')
        .set('Authorization', `Bearer ${authToken}`);
      const endTime = Date.now();

      const searchTime = endTime - startTime;
      console.log(`Search completed in ${searchTime}ms`);

      expect(response.status).toBe(200);
      expect(searchTime).toBeLessThan(200); // La búsqueda debe completarse en menos de 200ms
    });
  });

  describe('Memory Usage', () => {
    it('should handle large result sets without excessive memory usage', async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      const response = await request(app)
        .get('/api/v1/candidates?limit=500')
        .set('Authorization', `Bearer ${authToken}`);

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024; // MB

      console.log(`Memory increase: ${memoryIncrease.toFixed(2)}MB`);

      expect(response.status).toBe(200);
      expect(memoryIncrease).toBeLessThan(50); // No debe aumentar más de 50MB
    });
  });

  describe('Database Query Performance', () => {
    it('should optimize complex queries with joins', async () => {
      const startTime = Date.now();

      const response = await request(app)
        .get('/api/v1/candidates?include=experiences,education,interactions')
        .set('Authorization', `Bearer ${authToken}`);

      const queryTime = Date.now() - startTime;
      console.log(`Complex query completed in ${queryTime}ms`);

      expect(response.status).toBe(200);
      expect(queryTime).toBeLessThan(500); // Consulta compleja debe completarse en menos de 500ms
    });
  });
});