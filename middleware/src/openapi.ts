/**
 * OpenAPI 3.1.0 Contract Specification for SP-PLASTECH ERP
 * Conforms to Architecture Overhaul Standard (Part A2)
 */

export const openApiSpec = {
  openapi: '3.1.0',
  info: {
    title: 'SP-PLASTECH ERP API',
    version: '1.0.0',
    description:
      'Enterprise Plastic Manufacturing ERP API — Production Scheduling, MRP, BOM Explosion, Quality Governance, Warehouse, Procurement, Sales, Maintenance, and Finance.',
    contact: {
      name: 'SP-PLASTECH Engineering Architecture',
      email: 'architecture@sp-plastech.com',
    },
  },
  servers: [
    {
      url: '/api/v1',
      description: 'API v1 Gateway',
    },
  ],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'better-auth.session_token',
        description: 'HTTP-only secure session cookie',
      },
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        description: 'Bearer authentication token',
      },
    },
    schemas: {
      StandardError: {
        type: 'object',
        required: ['error'],
        properties: {
          error: {
            type: 'object',
            required: ['code', 'message'],
            properties: {
              code: { type: 'string', example: 'CONCURRENCY_CONFLICT' },
              message: { type: 'string', example: 'Record was modified elsewhere. Reload and retry.' },
              details: { type: 'object', additionalProperties: true },
              reference: { type: 'string', example: 'c1b4e2d3-...' },
            },
          },
        },
      },
      PaginationMeta: {
        type: 'object',
        required: ['page', 'limit', 'total', 'totalPages', 'hasMore'],
        properties: {
          page: { type: 'integer', example: 1 },
          limit: { type: 'integer', example: 20 },
          total: { type: 'integer', example: 1746 },
          totalPages: { type: 'integer', example: 88 },
          hasMore: { type: 'boolean', example: true },
          cursor: { type: 'string', nullable: true, example: 'eyJ0IjoiMjAyNi...=' },
          nextCursor: { type: 'string', nullable: true, example: 'eyJ0IjoiMjAyNi...=' },
        },
      },
      SingleResponse: {
        type: 'object',
        required: ['data'],
        properties: {
          data: { type: 'object', additionalProperties: true },
        },
      },
      ListResponse: {
        type: 'object',
        required: ['data', 'meta'],
        properties: {
          data: {
            type: 'array',
            items: { type: 'object', additionalProperties: true },
          },
          meta: { $ref: '#/components/schemas/PaginationMeta' },
        },
      },
    },
    parameters: {
      PageQuery: {
        name: 'page',
        in: 'query',
        schema: { type: 'integer', default: 1 },
        description: '1-indexed page number',
      },
      LimitQuery: {
        name: 'limit',
        in: 'query',
        schema: { type: 'integer', default: 20, maximum: 100 },
        description: 'Number of records per page (max 100)',
      },
      CursorQuery: {
        name: 'cursor',
        in: 'query',
        schema: { type: 'string' },
        description: 'Opaque base64url keyset pagination cursor',
      },
      SearchQuery: {
        name: 'search',
        in: 'query',
        schema: { type: 'string' },
        description: 'Search string across text columns',
      },
      SortByQuery: {
        name: 'sortBy',
        in: 'query',
        schema: { type: 'string', default: 'created_at' },
        description: 'Sort column (allowlisted only)',
      },
      SortOrderQuery: {
        name: 'sortOrder',
        in: 'query',
        schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
        description: 'Sort ordering direction',
      },
      IdempotencyHeader: {
        name: 'Idempotency-Key',
        in: 'header',
        schema: { type: 'string' },
        required: false,
        description: 'UUID v4 or opaque unique key protecting against duplicate document creation within 24h',
      },
    },
  },
  security: [{ cookieAuth: [] }, { bearerAuth: [] }],
  paths: {
    '/items': {
      get: {
        summary: 'List Master Items',
        tags: ['Master Data'],
        parameters: [
          { $ref: '#/components/parameters/PageQuery' },
          { $ref: '#/components/parameters/LimitQuery' },
          { $ref: '#/components/parameters/CursorQuery' },
          { $ref: '#/components/parameters/SearchQuery' },
          { $ref: '#/components/parameters/SortByQuery' },
          { $ref: '#/components/parameters/SortOrderQuery' },
        ],
        responses: {
          '200': {
            description: 'Paginated list of master items',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ListResponse' } } },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
      post: {
        summary: 'Create Master Item',
        tags: ['Master Data'],
        parameters: [{ $ref: '#/components/parameters/IdempotencyHeader' }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object' } } },
        },
        responses: {
          '201': {
            description: 'Item created successfully',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/SingleResponse' } } },
          },
          '409': { description: 'Duplicate natural key or Idempotency mismatch', content: { 'application/json': { schema: { $ref: '#/components/schemas/StandardError' } } } },
          '422': { description: 'Validation failed', content: { 'application/json': { schema: { $ref: '#/components/schemas/StandardError' } } } },
        },
      },
    },
    '/items/{id}': {
      get: {
        summary: 'Get Master Item by ID',
        tags: ['Master Data'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Item details', content: { 'application/json': { schema: { $ref: '#/components/schemas/SingleResponse' } } } },
          '404': { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/StandardError' } } } },
        },
      },
      patch: {
        summary: 'Update Master Item with OCC',
        tags: ['Master Data'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['version'] } } },
        },
        responses: {
          '200': { description: 'Updated item', content: { 'application/json': { schema: { $ref: '#/components/schemas/SingleResponse' } } } },
          '409': { description: 'Concurrency conflict (OCC version mismatch)', content: { 'application/json': { schema: { $ref: '#/components/schemas/StandardError' } } } },
        },
      },
      delete: {
        summary: 'Soft-delete Master Item',
        tags: ['Master Data'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '204': { description: 'Item soft-deleted' },
          '404': { description: 'Not found' },
        },
      },
    },
    '/work-orders': {
      get: { summary: 'List Work Orders', tags: ['Manufacturing'] },
      post: { summary: 'Create Work Order', tags: ['Manufacturing'] },
    },
    '/bill-of-materials': {
      get: { summary: 'List Bill of Materials', tags: ['Engineering'] },
      post: { summary: 'Create BOM Header & Lines', tags: ['Engineering'] },
    },
    '/sales-orders': {
      get: { summary: 'List Sales Orders', tags: ['Sales'] },
      post: { summary: 'Create Sales Order', tags: ['Sales'] },
    },
    '/purchase-orders': {
      get: { summary: 'List Purchase Orders', tags: ['Procurement'] },
      post: { summary: 'Create Purchase Order', tags: ['Procurement'] },
    },
    '/warehouses': {
      get: { summary: 'List Warehouses', tags: ['Warehouse'] },
      post: { summary: 'Create Warehouse', tags: ['Warehouse'] },
    },
    '/machines': {
      get: { summary: 'List Injection Molding Machines', tags: ['Manufacturing'] },
      post: { summary: 'Register Machine', tags: ['Manufacturing'] },
    },
    '/quality/inspections': {
      get: { summary: 'List Quality Inspections', tags: ['Quality'] },
      post: { summary: 'Create Quality Inspection', tags: ['Quality'] },
    },
    '/planning/mrp': {
      get: { summary: 'Get MRP Runs', tags: ['Planning'] },
      post: { summary: 'Trigger MRP Calculation', tags: ['Planning'] },
    },
    '/analytics/oee': {
      get: { summary: 'Get Real-time Machine OEE Metrics', tags: ['Analytics'] },
    },
  },
  responses: {
    Unauthorized: {
      description: 'Authentication token missing or invalid',
      content: { 'application/json': { schema: { $ref: '#/components/schemas/StandardError' } } },
    },
  },
};

export const swaggerDocsHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>SP-PLASTECH ERP — Interactive API Documentation</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
  <style>
    body { margin: 0; padding: 0; background-color: #0b0f19; }
    .swagger-ui { filter: invert(88%) hue-rotate(180deg); }
    .swagger-ui .topbar { display: none; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js"></script>
  <script>
    window.onload = () => {
      window.ui = SwaggerUIBundle({
        url: '/api/v1/openapi.json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIBundle.SwaggerUIStandalonePreset
        ],
      });
    };
  </script>
</body>
</html>`;
