import autocannon from 'autocannon';
import { app } from '../../index';
import jwt from 'jsonwebtoken';

describe('Load Tests', () => {
  let server: any;
  let authToken: string;

  beforeAll(async () => {
    server = app.listen(3011); // Puerto diferente para tests de carga
    authToken = jwt.sign(
      { userId: 1, email: 'load@test.com', role: 'ADMIN' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  });

  afterAll((done) => {
    server.close(done);
  });

  it('should handle sustained load', (done) => {
    const instance = autocannon({
      url: 'http://localhost:3011/api/v1/candidates',
      connections: 10, // Conexiones concurrentes
      duration: 10, // Duración en segundos
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
      requests: [
        {
          method: 'GET',
        },
      ],
    });

    autocannon.track(instance, { renderProgressBar: true });

    instance.on('done', (result) => {
      console.log('Load Test Results:');
      console.log(`Avg Throughput: ${result.requests.average} req/sec`);
      console.log(`Latency: ${result.latency.average}ms`);
      console.log(`Error Rate: ${result.errors}%`);

      expect(result.errors).toBeLessThan(1); // Menos del 1% de errores
      expect(result.latency.average).toBeLessThan(100); // Latencia promedio menor a 100ms
      done();
    });
  }, 15000);
});