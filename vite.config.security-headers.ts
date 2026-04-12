/**
 * Security Headers Configuration para Vite
 *
 * Configuración local para desarrollo
 * Para producción (Vercel), ver vercel.json
 */

export const securityHeaders = [
  // Previene clickjacking
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },

  // Content Security Policy - granular control de recursos
  {
    key: 'Content-Security-Policy',
    value:
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; " + // unsafe-inline para Vite HMR
      "img-src 'self' https: data:; " +
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
      "font-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com; " +
      "connect-src 'self' http://localhost:* https://api.cacaofrutabrutal.com https://api.stripe.com https://api.mercadopago.com https://api.resend.com; " +
      "object-src 'none'; " +
      "base-uri 'self'; " +
      "form-action 'self'"
  },

  // No adivinar tipo de contenido
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },

  // Forzar HTTPS
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains'
  },

  // Referrer Policy
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  },

  // Deshabilitar APIs peligrosas
  {
    key: 'Permissions-Policy',
    value: 'geolocation=(), microphone=(), camera=(), payment=()'
  },

  // Anti XSS
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  }
];

// Middleware para Vite dev server
export function securityHeadersMiddleware(server: any) {
  return () => {
    server.middlewares.use((req: any, res: any, next: any) => {
      securityHeaders.forEach(header => {
        res.setHeader(header.key, header.value);
      });
      next();
    });
  };
}
