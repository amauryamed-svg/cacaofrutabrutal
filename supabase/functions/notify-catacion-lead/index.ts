import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'

const resendApiKey = Deno.env.get('RESEND_API_KEY')!

interface CatacionNotification {
  full_name: string
  email: string
  status: string
}

async function sendNotification(payload: CatacionNotification) {
  const { full_name, email, status } = payload

  const baseStyles = `
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #040C06; color: #F7F1EE; margin: 0; padding: 0; }
      .container { max-width: 600px; margin: 0 auto; background: #0A1A0C; border: 1px solid #335533; border-radius: 16px; overflow: hidden; }
      .header { background: linear-gradient(135deg, #91A63B, #1C3B26); padding: 40px 24px; text-align: center; }
      .header h1 { margin: 0; font-size: 28px; color: #F1A91E; font-weight: 900; }
      .content { padding: 32px 24px; }
      .content h2 { color: #91A63B; font-size: 20px; margin: 0 0 16px; }
      .field { margin-bottom: 16px; padding: 12px; background: #132B1C; border-left: 3px solid #91A63B; }
      .field-label { color: #91A63B; font-weight: 700; font-size: 12px; text-transform: uppercase; }
      .field-value { color: #F7F1EE; font-size: 16px; margin-top: 4px; }
      .status-badge { display: inline-block; padding: 4px 12px; border-radius: 99px; font-size: 12px; font-weight: 700; }
      .status-magic_sent { background: #F1A91E; color: #040C06; }
      .status-lead { background: #91A63B; color: #040C06; }
      .status-confirmed { background: #8D2679; color: #F7F1EE; }
      .meta { margin-top: 24px; padding-top: 24px; border-top: 1px solid #335533; font-size: 12px; color: #91A63B; }
      .footer { background: #132B1C; padding: 20px 24px; text-align: center; font-size: 12px; color: #91A63B; border-top: 1px solid #335533; }
    </style>
  `

  const html = `
    ${baseStyles}
    <div class="container">
      <div class="header">
        <h1>🫘 Nuevo Lead — CATACIÓN</h1>
      </div>
      <div class="content">
        <h2>Información del Lead</h2>

        <div class="field">
          <div class="field-label">Nombre</div>
          <div class="field-value">${full_name}</div>
        </div>

        <div class="field">
          <div class="field-label">Email</div>
          <div class="field-value">${email}</div>
        </div>

        <div class="field">
          <div class="field-label">Status</div>
          <div class="field-value">
            <span class="status-badge status-${status}">${status.toUpperCase()}</span>
          </div>
        </div>

        <div class="meta">
          <p><strong>Fuente:</strong> /catacion</p>
          <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        </div>

        <p style="margin-top:24px;color:#91A63B;"><strong>📌 Próximo paso:</strong> El lead recibió un magic link OTP en su email. Al hacer clic, quedará autenticado en la plataforma y se creará su perfil en user_profiles.</p>
      </div>
      <div class="footer">
        <p>© 2026 CAUA · Catación Regenerativa</p>
      </div>
    </div>
  `

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${resendApiKey}`,
    },
    body: JSON.stringify({
      from: 'hola@cacaofrutabrutal.com',
      to: 'amaury@cauaculture.co',
      subject: `🫘 Nuevo lead catación: ${full_name}`,
      html,
    }),
  })

  const data = await response.json()
  return { success: !!data.id, resend_id: data.id, error: data.error }
}

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const body = await req.json() as CatacionNotification

    if (!body.full_name || !body.email || !body.status) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: full_name, email, status' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const result = await sendNotification(body)

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Catación notification error:', message)

    return new Response(JSON.stringify({ error: message, success: false }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  }
})
