import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Cash Register API',
      version: '1.0.0',
      description: 'API for calculating change in cash register transactions',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    components: {
      schemas: {
        CalculateRequest: {
          type: 'object',
          required: ['amountOwed', 'amountPaid'],
          properties: {
            amountOwed: {
              type: 'number',
              description: 'Amount owed in dollars',
              example: 2.12,
            },
            amountPaid: {
              type: 'number',
              description: 'Amount paid in dollars',
              example: 3.0,
            },
            currencyCode: {
              type: 'string',
              description: 'Currency code',
              default: 'USD',
              example: 'USD',
            },
          },
        },
        CalculateResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'object',
              properties: {
                totalChangeInCents: {
                  type: 'integer',
                  description: 'Total change in cents',
                  example: 88,
                },
                denominations: {
                  type: 'object',
                  description: 'Change breakdown by denomination',
                  example: {},
                },
                formattedOutput: {
                  type: 'string',
                  description: 'Human-readable change description',
                  example: '3 quarters + 1 dime + 3 pennies',
                },
              },
            },
          },
        },
        BatchRequest: {
          type: 'object',
          required: ['transactions'],
          properties: {
            transactions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  amountOwed: {
                    type: 'number',
                    example: 2.12,
                  },
                  amountPaid: {
                    type: 'number',
                    example: 3.0,
                  },
                },
              },
            },
            currency: {
              type: 'string',
              default: 'USD',
              example: 'USD',
            },
          },
        },
        BatchResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            results: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  index: {
                    type: 'integer',
                    example: 0,
                  },
                  success: {
                    type: 'boolean',
                    example: true,
                  },
                  totalChangeInCents: {
                    type: 'integer',
                    example: 88,
                  },
                  formattedOutput: {
                    type: 'string',
                    example: '3 quarters + 1 dime + 3 pennies',
                  },
                },
              },
            },
            summary: {
              type: 'object',
              properties: {
                totalTransactions: {
                  type: 'integer',
                  example: 5,
                },
                successfulTransactions: {
                  type: 'integer',
                  example: 5,
                },
                failedTransactions: {
                  type: 'integer',
                  example: 0,
                },
                totalChangeInCents: {
                  type: 'integer',
                  example: 813,
                },
                currency: {
                  type: 'string',
                  example: 'USD',
                },
              },
            },
          },
        },
        HealthResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'healthy',
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-01T00:00:00.000Z',
            },
            service: {
              type: 'string',
              example: 'Cash Register API',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              example: 'Error message',
            },
          },
        },
      },
    },
    paths: {
      '/api/health': {
        get: {
          tags: ['Health'],
          summary: 'Health check endpoint',
          description: 'Returns the health status of the API',
          responses: {
            '200': {
              description: 'API is healthy',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/HealthResponse',
                  },
                },
              },
            },
          },
        },
      },
      '/api/v1/change/calculate': {
        post: {
          tags: ['Change Calculator'],
          summary: 'Calculate change for a single transaction',
          description: 'Calculates the optimal change for a given transaction',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/CalculateRequest',
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Change calculated successfully',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/CalculateResponse',
                  },
                },
              },
            },
            '400': {
              description: 'Bad request - Invalid input',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
            '500': {
              description: 'Internal server error',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
          },
        },
      },
      '/api/v1/change/batch': {
        post: {
          tags: ['Change Calculator'],
          summary: 'Calculate change for multiple transactions',
          description: 'Processes multiple transactions and returns change calculations for each',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/BatchRequest',
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Batch processing completed',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/BatchResponse',
                  },
                },
              },
            },
            '400': {
              description: 'Bad request - Invalid input',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
            '500': {
              description: 'Internal server error',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  apis: ['./src/api/controllers/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);