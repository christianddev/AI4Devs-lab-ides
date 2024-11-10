import request from 'supertest';
import { app } from '../index';
import { PrismaClient } from '@prisma/client';

describe('Performance Tests', () => {
  it('should handle multiple concurrent requests', async () => {
    const numberOfRequests = 50;
    const requests = Array(numberOfRequests).fill(null).map(() =>
      request(app).get('/api/v1/candidates')
    );

    const startTime = Date.now();
    const responses = await Promise.all(requests);
    const endTime = Date.now();

    const totalTime = endTime - startTime;
    console.log(`Processed ${numberOfRequests} requests in ${totalTime}ms`);

    responses.forEach(response => {
      expect(response.status).toBe(200);
    });

    // El tiempo promedio por solicitud no debe superar los 100ms
    expect(totalTime / numberOfRequests).toBeLessThan(100);
  });

  it('should handle large datasets efficiently', async () => {
    // Test con una lista grande de candidatos
  });
});