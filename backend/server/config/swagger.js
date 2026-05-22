/**
 * API Documentation - Swagger/OpenAPI Configuration
 * Install: npm install swagger-ui-express swagger-jsdoc
 */

const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Course Progress Visualizer API',
      version: '1.0.0',
      description: 'API documentation for Course Progress Visualizer application',
      contact: {
        name: 'API Support',
        email: 'support@example.com',
      },
      license: {
        name: 'MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000/api',
        description: 'Development server',
      },
      {
        url: 'https://api.example.com/api',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT Authorization header using the Bearer scheme',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'User ID',
            },
            name: {
              type: 'string',
              description: 'User name',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email',
            },
            emailVerified: {
              type: 'boolean',
              description: 'Email verification status',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Course: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
            },
            title: {
              type: 'string',
            },
            description: {
              type: 'string',
            },
            platform: {
              type: 'string',
            },
            totalHours: {
              type: 'number',
            },
            modules: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Module',
              },
            },
            progress: {
              type: 'number',
              minimum: 0,
              maximum: 100,
            },
            status: {
              type: 'string',
              enum: ['not-started', 'in-progress', 'completed'],
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Module: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
            },
            title: {
              type: 'string',
            },
            lessons: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Lesson',
              },
            },
          },
        },
        Lesson: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
            },
            title: {
              type: 'string',
            },
            duration: {
              type: 'number',
              description: 'Duration in minutes',
            },
            videoUrl: {
              type: 'string',
              format: 'uri',
            },
            completed: {
              type: 'boolean',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
            },
            code: {
              type: 'string',
              description: 'Error code for machine-readable error handling',
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: [
    './routes/*.js',
    './controllers/*.js',
  ],
};

const specs = swaggerJsdoc(options);

const swaggerSetup = {
  specs,
  swaggerUi,
  options: {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Course Progress Visualizer API Docs',
    swaggerOptions: {
      persistAuthorization: true,
      displayOperationId: false,
    },
  },
};

module.exports = swaggerSetup;
