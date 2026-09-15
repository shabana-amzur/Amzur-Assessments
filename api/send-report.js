export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    return response.status(405).json({ error: 'Method not allowed' })
  }

  const { email, industry, score, tier, dimensions } = request.body || {}
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return response.status(400).json({ error: 'A valid email address is required.' })
  }

  const apiKey = process.env.RESEND_API_KEY
  const notificationEmail = 'shabana.sheik@amzur.com'
  const from = process.env.RESEND_FROM_EMAIL || 'Amzur Technologies <noreply@assessments.amzur.com>'
  if (!apiKey) {
    return response.status(500).json({ error: 'Email delivery is not configured. Add RESEND_API_KEY in Vercel.' })
  }

  const dimensionRows = Object.entries(dimensions || {})
    .map(([name, value]) => `<tr><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">${name}</td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right"><strong>${value}/100</strong></td></tr>`)
    .join('')

  const html = `<div style="font-family:Arial,sans-serif;color:#142c4d;max-width:680px"><p style="color:#1769e8;font-weight:700;letter-spacing:2px">AMZUR FINANCE SCORECARD</p><h1>${industry} finance scorecard</h1><p>Your overall finance maturity score is <strong>${score}/100</strong>.</p><p><strong>${tier}</strong></p><table style="border-collapse:collapse;width:100%;margin-top:20px"><tbody>${dimensionRows}</tbody></table><p style="margin-top:24px;color:#667894">This directional scorecard is based on the answers provided and is intended for improvement planning.</p></div>`

  try {
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [email], bcc: [notificationEmail], subject: `${industry} Finance Scorecard`, html }),
    })

    if (!resendResponse.ok) {
      const resendError = await resendResponse.json().catch(() => ({}))
      return response.status(502).json({ error: resendError.message || resendError.name || 'Resend could not deliver the report.' })
    }

    return response.status(200).json({ sent: true })
  } catch {
    return response.status(502).json({ error: 'Unable to reach the email service.' })
  }
}
