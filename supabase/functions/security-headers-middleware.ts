/**
 * Security Headers Middleware para Supabase Edge Functions
 *
 * Aplica headers de seguridad a TODOS los edge functions
 * Uso: Importa en cada función edge
 */

export function getSecurityHeaders() {
  return {
    // 1. Previene clickjacking - no permite meter la página en iframes ajenos
    'X-Frame-Options': 'SAMEORIGIN',

    // 2. Content Security Policy - controla qué recursos pueden cargar
    // 'self' = solo mi dominio, 'unsafe-inline' = estilos inline (necesario para algunos frameworks)
    'Content-Security-Policy':
      "default-src 'self'; " +
      "script-src 'self'; " +
      "img-src 'self' https: data:; " +
      "style-src 'self' 'unsafe-inline'; " +
      "font-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com; " +
      "connect-src 'self' https://api.cacaofrutabrutal.com https://api.stripe.com https://api.mercadopago.com https://api.resend.com; " +
      "object-src 'none'; " +
      "base-uri 'self'; " +
      "form-action 'self'; " +
      "frame-ancestors 'none'",

    // 3. No adivinar tipo de archivo - previene ataques con archivos disfrazados
    'X-Content-Type-Options': 'nosniff',

    // 4. Forzar HTTPS siempre - durante 1 año incluindo subdomios
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',

    // 5. Referrer Policy - controlar info cuando el usuario navega a otro sitio
    // strict-origin-when-cross-origin = envía origin solo a HTTPS
    'Referrer-Policy': 'strict-origin-when-cross-origin',

    // 6. Permissions Policy - desactivar cámara, micrófono, ubicación
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=(), payment=()',

    // 7. Evitar que Google/otros indexen información sensible
    'X-Robots-Tag': 'noindex,nofollow',

    // 8. Información XSRF - identifica al servidor
    'X-XSS-Protection': '1; mode=block',

    // 9. Remove server info
    'X-Powered-By': 'CAUA',
  };
}

export function addSecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  const securityHeaders = getSecurityHeaders();

  Object.entries(securityHeaders).forEach(([key, value]) => {
    headers.set(key, value);
  });

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

// Wrapper para aplicar a cualquier edge function
export function withSecurityHeaders(
  handler: (req: Request) => Promise<Response>
) {
  return async (req: Request): Promise<Response> => {
    const response = await handler(req);
    return addSecurityHeaders(response);
  };
}
