export const openapiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'K12 Hunar CRM & Inquiry System API',
    version: '1.0.0',
    description: 'Production-ready REST API for public inquiry submission and protected administrator CRM workflows.',
  },
  servers: [
    {
      url: '/api',
      description: 'Default API Server',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Provide custom admin JWT token in format: Bearer <token>',
      },
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'VALIDATION_ERROR' },
              message: { type: 'string', example: 'Validation failed' },
              details: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    field: { type: 'string', example: 'email' },
                    message: { type: 'string', example: 'Invalid email address' },
                  },
                },
              },
              requestId: { type: 'string', example: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d' },
            },
            required: ['code', 'message', 'requestId'],
          },
        },
      },
      InquiryInput: {
        type: 'object',
        required: ['userType', 'category', 'name', 'email', 'phone', 'message'],
        properties: {
          userType: { type: 'string', enum: ['Parent', 'Student', 'School'], example: 'Parent' },
          category: { type: 'string', enum: ['Scholarship', 'Concert', 'Admission', 'General Query'], example: 'Scholarship' },
          name: { type: 'string', example: 'Aarav Sharma' },
          email: { type: 'string', example: 'aarav.sharma@example.com' },
          phone: { type: 'string', example: '+91 98765 43210' },
          message: { type: 'string', example: 'Inquiring about Grade 10 scholarship criteria and audition dates.' },
          website: { type: 'string', description: 'Bot honeypot - must be empty', example: '' },
        },
      },
      LoginInput: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', example: 'admin@k12hunar.com' },
          password: { type: 'string', example: 'Admin@12345' },
        },
      },
      StatusUpdateInput: {
        type: 'object',
        required: ['status'],
        properties: {
          status: { type: 'string', enum: ['New', 'In Progress', 'Resolved'], example: 'In Progress' },
        },
      },
      NoteInput: {
        type: 'object',
        required: ['note'],
        properties: {
          note: { type: 'string', example: 'Called parent; arranged campus tour for next Monday.' },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        summary: 'Health Check',
        tags: ['System'],
        responses: {
          '200': { description: 'Server and database operational' },
        },
      },
    },
    '/auth/login': {
      post: {
        summary: 'Admin Login',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginInput' } } },
        },
        responses: {
          '200': { description: 'Authenticated successfully' },
          '401': { description: 'Invalid email or password' },
          '429': { description: 'Account locked due to consecutive failed attempts' },
        },
      },
    },
    '/auth/me': {
      get: {
        summary: 'Get Authenticated Admin',
        security: [{ BearerAuth: [] }],
        tags: ['Authentication'],
        responses: {
          '200': { description: 'Admin profile returned' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/inquiries': {
      post: {
        summary: 'Public Inquiry Submission',
        tags: ['Inquiries'],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/InquiryInput' } } },
        },
        responses: {
          '201': { description: 'Inquiry received successfully' },
          '400': { description: 'Validation failed' },
          '429': { description: 'Rate limit exceeded' },
        },
      },
      get: {
        summary: 'List Inquiries (Filtered, Paginated, Sorted)',
        security: [{ BearerAuth: [] }],
        tags: ['Inquiries'],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'category', in: 'query', schema: { type: 'string' } },
          { name: 'userType', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string' } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'sort', in: 'query', schema: { type: 'string', default: 'createdAt' } },
          { name: 'order', in: 'query', schema: { type: 'string', default: 'desc' } },
        ],
        responses: {
          '200': { description: 'Paginated inquiry list returned' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/inquiries/stats': {
      get: {
        summary: 'Inquiry Overview Statistics',
        security: [{ BearerAuth: [] }],
        tags: ['Inquiries'],
        responses: {
          '200': { description: 'Aggregated totals by status, last 24h, and last 7d' },
        },
      },
    },
    '/inquiries/analytics': {
      get: {
        summary: '30-Day Analytics & Categorical Breakdowns',
        security: [{ BearerAuth: [] }],
        tags: ['Inquiries'],
        responses: {
          '200': { description: 'Timeseries and categorical breakdown counts' },
        },
      },
    },
    '/inquiries/export': {
      get: {
        summary: 'Export Inquiries as CSV',
        security: [{ BearerAuth: [] }],
        tags: ['Inquiries'],
        responses: {
          '200': { description: 'CSV file attachment' },
        },
      },
    },
    '/inquiries/{id}': {
      get: {
        summary: 'Get Inquiry Details with Notes and Activity',
        security: [{ BearerAuth: [] }],
        tags: ['Inquiries'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': { description: 'Full inquiry details returned' },
          '404': { description: 'Inquiry not found' },
        },
      },
    },
    '/inquiries/{id}/status': {
      patch: {
        summary: 'Update Inquiry Status',
        security: [{ BearerAuth: [] }],
        tags: ['Inquiries'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/StatusUpdateInput' } } },
        },
        responses: {
          '200': { description: 'Status updated and activity logged' },
          '404': { description: 'Inquiry not found' },
        },
      },
    },
    '/inquiries/{id}/notes': {
      get: {
        summary: 'Get Inquiry Notes',
        security: [{ BearerAuth: [] }],
        tags: ['Inquiries'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { '200': { description: 'List of internal notes' } },
      },
      post: {
        summary: 'Add Internal Inquiry Note',
        security: [{ BearerAuth: [] }],
        tags: ['Inquiries'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/NoteInput' } } },
        },
        responses: {
          '201': { description: 'Note added and activity logged' },
        },
      },
    '/inquiries/{id}/priority': {
      patch: {
        summary: 'Update Inquiry Priority',
        security: [{ BearerAuth: [] }],
        tags: ['Inquiries'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['priority'],
                properties: {
                  priority: { type: 'string', enum: ['Low', 'Normal', 'High', 'Urgent'], example: 'Urgent' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Priority updated and activity logged' },
          '404': { description: 'Inquiry not found' },
        },
      },
    },
    '/inquiries/{id}/assign': {
      patch: {
        summary: 'Assign Inquiry to Team Member',
        security: [{ BearerAuth: [] }],
        tags: ['Inquiries'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  adminId: { type: 'string', format: 'uuid', nullable: true, example: '4a1f... or null to unassign' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Assignee updated and activity logged' },
          '404': { description: 'Inquiry not found' },
        },
      },
    },
    '/track': {
      post: {
        summary: 'Track Public Inquiry Status by Reference Code',
        tags: ['Public'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['referenceCode', 'email'],
                properties: {
                  referenceCode: { type: 'string', example: 'KH-7F2A9B1C' },
                  email: { type: 'string', format: 'email', example: 'parent@example.com' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Sanitized public progress timeline and inquiry details' },
          '404': { description: 'No inquiry matching reference code and email combination' },
        },
      },
    },
    '/public/stats': {
      get: {
        summary: 'Get Public Aggregated Inquiry Statistics',
        tags: ['Public'],
        responses: {
          '200': { description: 'Approximate inquiries handled, resolution rate, and avg response time' },
        },
      },
    },
    '/admins/options': {
      get: {
        summary: 'Get List of Active Admins for Assignment',
        security: [{ BearerAuth: [] }],
        tags: ['Admins'],
        responses: {
          '200': { description: 'List of active admins with id, name, email, avatarUrl, and role' },
        },
      },
    },
    '/auth/password': {
      patch: {
        summary: 'Change Admin Password and Invalidate Other Sessions',
        security: [{ BearerAuth: [] }],
        tags: ['Auth'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['currentPassword', 'newPassword'],
                properties: {
                  currentPassword: { type: 'string', example: 'OldSecret123!' },
                  newPassword: { type: 'string', example: 'NewSecret123!' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Password updated and fresh JWT returned' },
          '400': { description: 'Current password invalid or new password lacks complexity' },
        },
      },
    },
    '/auth/logout-all': {
      post: {
        summary: 'Emergency Logout and Invalidation of All Active Sessions',
        security: [{ BearerAuth: [] }],
        tags: ['Auth'],
        responses: {
          '200': { description: 'All active sessions invalidated via token_version increment' },
        },
      },
    },
    '/activity': {
      get: {
        summary: 'Get Chronological Activity Feed with Cursor Pagination',
        security: [{ BearerAuth: [] }],
        tags: ['Audit'],
        parameters: [
          { name: 'cursor', in: 'query', schema: { type: 'string' }, description: 'ISO date cursor' },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 }, description: 'Page limit (1-100)' },
          { name: 'action', in: 'query', schema: { type: 'string' }, description: 'Filter by action type' },
          { name: 'inquiryId', in: 'query', schema: { type: 'string', format: 'uuid' }, description: 'Filter by inquiry' },
        ],
        responses: {
          '200': { description: 'Paginated activity log items with inquiry details and nextCursor' },
        },
      },
    },
  },
};

export default openapiSpec;
