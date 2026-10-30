import { describe, it, expect } from 'vitest';
import app from '../../src/app.js';
import openapiSpec from '../../src/docs/openapi.js';

function getRegisteredExpressRoutes(expressApp) {
  const routes = [];

  function walk(stack, prefix = '') {
    for (const layer of stack) {
      if (layer.route && layer.route.path) {
        const fullPath = (prefix + layer.route.path).replace(/\/+/g, '/');
        // Strip trailing slash if any (unless root '/')
        const normalized = fullPath.length > 1 && fullPath.endsWith('/') ? fullPath.slice(0, -1) : fullPath;
        // Convert Express :param to OpenAPI {param}
        const openApiPath = normalized.replace(/:([a-zA-Z0-9_]+)/g, '{$1}');
        const methods = Object.keys(layer.route.methods).map((m) => m.toLowerCase());
        routes.push({
          path: openApiPath,
          rawPath: fullPath,
          methods,
        });
      } else if (layer.name === 'router' && layer.handle && layer.handle.stack) {
        let mountPath = '';
        if (layer.regexp) {
          const source = layer.regexp.source;
          const match = source
            .replace('^\\/?', '/')
            .replace('\\/?(?=\\/|$)', '')
            .replace(/\\\//g, '/')
            .replace('(?=\\/|$)', '')
            .replace('^', '')
            .replace(/\$$/, '');
          if (match && match !== '/') {
            mountPath = match;
          }
        }
        walk(layer.handle.stack, prefix + mountPath);
      }
    }
  }

  if (expressApp._router && expressApp._router.stack) {
    walk(expressApp._router.stack);
  }

  return routes;
}

describe('OpenAPI Documentation Coverage', () => {
  const expressRoutes = getRegisteredExpressRoutes(app);
  const documentedPaths = Object.keys(openapiSpec.paths);

  it('registers all functional Express routes in OpenAPI paths', () => {
    const missingRoutes = [];

    for (const r of expressRoutes) {
      // Exclude Swagger UI docs endpoint itself and standard root fallback
      if (r.path.includes('/docs') || r.path === '/') continue;

      // Express routes are mounted under /api, OpenAPI paths are relative to /api server prefix
      const apiRelativePath = r.path.startsWith('/api') ? r.path.replace(/^\/api/, '') : r.path;
      const normalizedPath = apiRelativePath.startsWith('/') ? apiRelativePath : `/${apiRelativePath}`;

      if (!openapiSpec.paths[normalizedPath]) {
        missingRoutes.push(`${r.methods.join(',').toUpperCase()} ${r.rawPath} (expected: ${normalizedPath})`);
      }
    }

    if (missingRoutes.length > 0) {
      console.error('Missing OpenAPI routes detected:\n' + missingRoutes.join('\n'));
    }

    expect(missingRoutes).toEqual([]);
  });

  it('ensures each documented OpenAPI path maps to an HTTP operation', () => {
    for (const [pathKey, operations] of Object.entries(openapiSpec.paths)) {
      const methods = Object.keys(operations).filter((k) =>
        ['get', 'post', 'put', 'patch', 'delete', 'options', 'head'].includes(k.toLowerCase())
      );
      expect(
        methods.length,
        `OpenAPI path ${pathKey} must define at least one valid HTTP operation`
      ).toBeGreaterThan(0);
    }
  });

  it('documents critical data fields and schemas for key entities', () => {
    expect(openapiSpec.components).toBeDefined();
    expect(openapiSpec.components.schemas).toBeDefined();
    expect(openapiSpec.components.schemas.InquiryInput).toBeDefined();
    expect(openapiSpec.components.schemas.LoginInput).toBeDefined();
  });
});
