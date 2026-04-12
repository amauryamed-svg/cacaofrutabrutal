import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const resendApiKey = Deno.env.get('RESEND_API_KEY')!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface EmailRequest {
  user_id: string
  email: string
  type: 'order_created' | 'payment_confirmed'
  order_id?: string
  lots_count?: number
  amount_usd?: number
}

async function sendEmail(to: string, subject: string, html: string, type: string) {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: 'hola@cacaofrutabrutal.com',
        to,
        subject,
        html,
      }),
    })

    const data = await response.json()

    // Log email in database
    if (data.id) {
      await supabase.from('email_log').insert([{
        user_id: undefined, // Will be set if we pass it
        email: to,
        type,
        subject,
        status: 'sent',
        resend_id: data.id,
      }])
    }

    return { success: true, resend_id: data.id }
  } catch (error) {
    console.error('Resend error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

function getEmailTemplate(type: 'order_created' | 'payment_confirmed', lotsCount?: number, amountUsd?: number): { subject: string; html: string } {
  const baseStyles = `
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #040C06; color: #D4C9C0; margin: 0; padding: 0; }
      .container { max-width: 600px; margin: 0 auto; background: #0A1A0C; border: 1px solid #335533; border-radius: 16px; overflow: hidden; }
      .header { background: linear-gradient(135deg, #91A63B, #6B1B5A); padding: 40px 24px; text-align: center; }
      .header h1 { margin: 0; font-size: 28px; color: #040C06; font-weight: 900; }
      .content { padding: 32px 24px; }
      .content h2 { color: #91A63B; font-size: 20px; margin: 0 0 16px; }
      .content p { line-height: 1.6; margin: 0 0 16px; }
      .highlight { color: #91A63B; font-weight: 700; }
      .cta { display: inline-block; background: linear-gradient(135deg, #91A63B, #6B1B5A); color: #040C06; padding: 12px 28px; border-radius: 999px; text-decoration: none; font-weight: 700; margin-top: 12px; }
      .footer { background: #132B1C; padding: 20px 24px; text-align: center; font-size: 12px; color: #335533; border-top: 1px solid #335533; }
      .footer a { color: #91A63B; text-decoration: none; }
    </style>
  `

  if (type === 'order_created') {
    return {
      subject: '🫘 Tu reserva está confirmada — CAUA',
      html: `
        ${baseStyles}
        <div class="container">
          <div class="header">
            <h1>🫘 RESERVA CONFIRMADA</h1>
          </div>
          <div class="content">
            <h2>¡Tu inversión está en camino!</h2>
            <p>Hemos recibido tu reserva de <span class="highlight">${lotsCount || 1} ${lotsCount === 1 ? 'lote' : 'lotes'}</span> en CAUA.</p>
            <p>Estamos procesando tu pago en este momento. Recibirás una confirmación de pago en los próximos minutos.</p>
            <p><strong>Monto:</strong> <span class="highlight">$${amountUsd?.toFixed(2) || '0.00'} USD</span></p>
            <p>Si tienes preguntas, responde este correo o contacta a hello@caua.co</p>
            <a href="https://cacaofrutabrutal.com/dashboard" class="cta">Ver tu reserva →</a>
          </div>
          <div class="footer">
            <p>© 2026 CAUA · Cultivo regenerativo, ciencia y territorio</p>
            <p><a href="https://cacaofrutabrutal.com">cacaofrutabrutal.com</a></p>
          </div>
        </div>
      `,
    }
  } else {
    return {
      subject: '✓ Tu pago está confirmado — CAUA',
      html: `
        ${baseStyles}
        <div class="container">
          <div class="header">
            <h1>✓ PAGO CONFIRMADO</h1>
          </div>
          <div class="content">
            <h2>¡Tu inversión está activa!</h2>
            <p>Tu pago de <span class="highlight">$${amountUsd?.toFixed(2) || '0.00'} USD</span> por <span class="highlight">${lotsCount || 1} ${lotsCount === 1 ? 'lote' : 'lotes'}</span> ha sido procesado correctamente.</p>
            <p>Accede a tu dashboard para:</p>
            <ul>
              <li>Seguimiento en tiempo real de tu inversión</li>
              <li>Actualizaciones de cosecha y procesamiento</li>
              <li>Documentación de trazabilidad</li>
              <li>Comunicación directa con los Guardianes</li>
            </ul>
            <a href="https://cacaofrutabrutal.com/dashboard" class="cta">Ir a mi inversión →</a>
          </div>
          <div class="footer">
            <p>© 2026 CAUA · Cultivo regenerativo, ciencia y territorio</p>
            <p><a href="https://cacaofrutabrutal.com">cacaofrutabrutal.com</a></p>
          </div>
        </div>
      `,
    }
  }
}

serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } })
    }

    const body = await req.json() as EmailRequest

    const { subject, html } = getEmailTemplate(body.type, body.lots_count, body.amount_usd)

    const result = await sendEmail(body.email, subject, html, body.type)

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 400,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
