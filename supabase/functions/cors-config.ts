/**
 * CORS Configuration Helper for All Edge Functions
 *
 * Uso: Importa esta función en cada edge function
 * export { default } from '../cors-config.ts'
 */

// Dominios permitidos (actualiza según tu ambiente)
const ALLOWED_ORIGINS = [
  'http://localhost:3000',           // Desarrollo local
  'http://localhost:5173',           // Vite fallback
  'https://cacaofrutabrutal.com',    // Producción
  'https://www.cacaofrutabrutal.com',
  'https://staging.cacaofrutabrutal.com', // Si tienes staging
];

const ALLOWED_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'];
const ALLOWED_HEADERS = [
  'Content-Type',
  'Authorization',
  'X-Client-Info',
  'Apikey',
];

export function getCorsHeaders(origin?: string) {
  const isAllowed = origin && ALLOWED_ORIGINS.includes(origin);

  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : '',
    'Access-Control-Allow-Methods': ALLOWED_METHODS.join(', '),
    'Access-Control-Allow-Headers': ALLOWED_HEADERS.join(', '),
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400', // Cache preflight 24 horas
  };
}

export function handleCorsPreFlight(origin?: string) {
  const headers = getCorsHeaders(origin);

  return new Response(null, {
    status: 204,
    headers,
  });
}

// Wrapper para cualquier edge function
export function withCors(
  handler: (req: Request) => Promise<Response>
) {
  return async (req: Request): Promise<Response> => {
    const origin = req.headers.get('origin') || '';

    // Preflight request
    if (req.method === 'OPTIONS') {
      return handleCorsPreFlight(origin);
    }

    // Ejecuta handler
    const response = await handler(req);

    // Agrega CORS headers a response
    const corsHeaders = getCorsHeaders(origin);
    const newHeaders = new Headers(response.headers);

    Object.entries(corsHeaders).forEach(([key, value]) => {
      if (value) newHeaders.set(key, value);
    });

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  };
}
