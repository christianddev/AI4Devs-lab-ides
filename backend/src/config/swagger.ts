import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ATS API Documentation',
      version: '1.0.0',
      description: 'API documentation for the ATS (Applicant Tracking System)',
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3010}`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.ts'], // Rutas donde están los comentarios de Swagger
};

export const swaggerSpec = swaggerJsdoc(options);