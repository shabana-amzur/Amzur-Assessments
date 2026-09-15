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
  const notificationEmail = process.env.RESEND_NOTIFICATION_EMAIL || 'shabana.sheik@amzur.com'
  const from = process.env.RESEND_FROM_EMAIL || 'Amzur Technologies <noreply@assessments.amzur.com>'
  if (!apiKey) {
    return response.status(500).json({ error: 'Email delivery is not configured. Add RESEND_API_KEY in Vercel.' })
  }

  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character])
  const dimensionRows = Object.entries(dimensions || {})
    .map(([name, value]) => `<tr><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">${escapeHtml(name)}</td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right"><strong>${escapeHtml(value)}/100</strong></td></tr>`)
    .join('')

  const userHtml = `<div style="font-family:Arial,sans-serif;color:#142c4d;max-width:680px"><p style="color:#1769e8;font-weight:700;letter-spacing:2px">AMZUR FINANCE SCORECARD</p><h1>${escapeHtml(industry)} finance scorecard</h1><p>Your overall finance maturity score is <strong>${escapeHtml(score)}/100</strong>.</p><p><strong>${escapeHtml(tier)}</strong></p><h2>Dimension breakdown</h2><table style="border-collapse:collapse;width:100%;margin-top:20px"><tbody>${dimensionRows}</tbody></table><h2>Next steps</h2><p>Use the lowest-scoring dimensions to prioritize ownership, exception visibility, workflow control, and automation in your finance operation.</p><p style="margin-top:24px;color:#667894">This directional scorecard is based on the answers provided and is intended for improvement planning.</p></div>`
  const notificationHtml = `<div style="font-family:Arial,sans-serif;color:#142c4d;max-width:680px"><p style="color:#1769e8;font-weight:700;letter-spacing:2px">NEW FINANCE SCORECARD COMPLETED</p><h1>${escapeHtml(industry)} assessment completed</h1><p>A user completed the Finance Control &amp; Performance Scorecard.</p><table style="border-collapse:collapse;width:100%;margin-top:20px"><tbody><tr><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">User email</td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb"><strong>${escapeHtml(email)}</strong></td></tr><tr><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">Industry</td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb"><strong>${escapeHtml(industry)}</strong></td></tr><tr><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">Overall score</td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb"><strong>${escapeHtml(score)}/100</strong></td></tr><tr><td style="padding:8px 12px">Maturity</td><td style="padding:8px 12px"><strong>${escapeHtml(tier)}</strong></td></tr></tbody></table><h2>Dimension scores</h2><table style="border-collapse:collapse;width:100%"><tbody>${dimensionRows}</tbody></table></div>`

  const sendEmail = async (payload) => fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, ...payload }),
  })

  try {
    const [userResponse, notificationResponse] = await Promise.all([
      sendEmail({ to: [email], subject: `Your ${industry} Finance Scorecard`, html: userHtml }),
      sendEmail({ to: [notificationEmail], subject: `New ${industry} Finance Scorecard completed`, html: notificationHtml }),
    ])

    if (!userResponse.ok || !notificationResponse.ok) {
      const failedResponse = userResponse.ok ? notificationResponse : userResponse
      const resendError = await failedResponse.json().catch(() => ({}))
      return response.status(502).json({ error: resendError.message || resendError.name || 'Resend could not deliver the report.' })
    }

    return response.status(200).json({ sent: true })
  } catch {
    return response.status(502).json({ error: 'Unable to reach the email service.' })
  }
}
