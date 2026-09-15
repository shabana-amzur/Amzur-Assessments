export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    return response.status(405).json({ error: 'Method not allowed' })
  }

  const { email, industry, score, tier, dimensions, ranked = Object.keys(dimensions || {}), questions = [], answers = {} } = request.body || {}
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return response.status(400).json({ error: 'A valid email address is required.' })
  }

  const apiKey = process.env.RESEND_API_KEY
  const assessmentName = 'Finance Control & Performance Scorecard'
  const notificationEmail = process.env.RESEND_NOTIFICATION_EMAIL || 'shabana.sheik@amzur.com'
  const from = process.env.RESEND_FROM_EMAIL || 'Amzur Technologies <noreply@assessments.amzur.com>'
  if (!apiKey) {
    return response.status(500).json({ error: 'Email delivery is not configured. Add RESEND_API_KEY in Vercel.' })
  }

  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character])
  const dimensionRows = Object.entries(dimensions || {})
    .map(([name, value]) => `<tr><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">${escapeHtml(name)}</td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right"><strong>${escapeHtml(value)}/100</strong></td></tr>`)
    .join('')
  const dimensionLabels = {
    control: 'Financial control & accuracy',
    automation: 'Close, reconciliation & automation',
    performance: 'Profitability & operational performance',
    decision: 'Liquidity & decision readiness',
  }
  const dimensionCards = Object.entries(dimensions || {})
    .map(([name, value]) => `<td style="width:25%;padding:12px;background:#151a43;color:#eef2ff;border-right:6px solid #090b27"><small style="color:#a9b3d3">${escapeHtml(dimensionLabels[name] || name)}</small><br><strong style="font-size:24px">${escapeHtml(value)}</strong><br><span style="color:#747ea4;font-size:11px">out of 100</span></td>`)
    .join('')
  const answerLabels = [
    'Mostly manual, inconsistent, or discovered during close',
    'Partly controlled, but recurring investigation and rework remain',
    'Generally reliable with defined ownership and manageable exceptions',
    'Automated, monitored continuously, and visible through clear controls',
  ]
  const selectedAnswerRows = questions
    .map((question) => `<tr><td style="padding:10px 12px;border-bottom:1px solid #2a3164"><strong>${escapeHtml(question.topic)}</strong><br><span style="color:#a9b3d3">${escapeHtml(question.prompt)}</span></td><td style="padding:10px 12px;border-bottom:1px solid #2a3164;color:#eef2ff">${escapeHtml(answerLabels[answers[question.id]] || 'Not answered')}</td></tr>`)
    .join('')
  const findingRows = ranked.slice(0, 3)
    .map((name, index) => `<tr><td style="width:34px;padding:12px;background:linear-gradient(135deg,#2bb7e9,#7c5ce6);color:#090b27;font-weight:700;text-align:center">${index + 1}</td><td style="padding:12px;border-bottom:1px solid #2a3164"><strong>${escapeHtml(dimensionLabels[name] || name)} needs attention</strong><br><span style="color:#a9b3d3">Start with ownership, exception visibility, and a controlled workflow for ${escapeHtml(industry.toLowerCase())} finance operations.</span></td></tr>`)
    .join('')
  const roadmapRows = ranked.slice(0, 3)
    .map((name, index) => `<td style="width:33%;padding:14px;background:#0f1235;border:1px solid #2a3164;vertical-align:top"><strong style="color:#2bb7e9;font-size:11px;letter-spacing:1px">${['30 DAYS', '60 DAYS', '90 DAYS'][index]}</strong><h3 style="color:#eef2ff;font-size:16px">${escapeHtml(dimensionLabels[name] || name)}</h3><p style="color:#a9b3d3;font-size:13px;line-height:1.5">Document the process, automate recurring exceptions, and give leaders a visible scorecard for this dimension.</p></td>`)
    .join('')

  const userHtml = `<div style="font-family:Arial,sans-serif;background:#090b27;color:#eef2ff;padding:28px;max-width:760px"><p style="color:#2bb7e9;font-weight:700;letter-spacing:2px">YOUR ${escapeHtml(industry).toUpperCase()} FINANCE SCORECARD</p><h1 style="font-size:34px;margin:12px 0">Your next finance priorities are clear.</h1><p style="color:#a9b3d3">${escapeHtml(assessmentName)} results based on your completed assessment.</p><table style="width:100%;border-collapse:collapse;margin:24px 0"><tr><td style="padding:24px;background:#151a43;width:180px;text-align:center"><strong style="font-size:52px;color:#eef2ff">${escapeHtml(score)}</strong><br><span style="color:#a9b3d3">/ 100</span></td><td style="padding:24px;background:#151a43"><small style="color:#747ea4;letter-spacing:2px">MATURITY LEVEL</small><h2 style="color:#f06d8e;margin:8px 0">${escapeHtml(tier)}</h2><p style="color:#a9b3d3">Core accuracy, control, or reporting weaknesses need immediate attention.</p></td></tr></table>${Number(score) < 65 ? '<div style="padding:16px;background:#24182e;border:1px solid #f06d8e;margin:16px 0"><strong style="color:#ffc0cf">1 critical control signal detected</strong><p style="color:#a9b3d3">These risks remain a priority even if stronger areas raise the overall score.</p></div>' : ''}<h2 style="margin-top:28px">Dimension scores</h2><table style="width:100%;border-collapse:collapse"><tr>${dimensionCards}</tr></table><section style="margin-top:28px;padding:22px;background:#151a43"><p style="color:#2bb7e9;letter-spacing:2px;font-size:11px">WHAT YOUR ANSWERS INDICATE</p><h2>Priority findings - not generic advice</h2><table style="width:100%;border-collapse:collapse">${findingRows}</table></section><section style="margin-top:16px;padding:22px;background:#151a43"><p style="color:#2bb7e9;letter-spacing:2px;font-size:11px">YOUR 30 / 60 / 90-DAY DIRECTION</p><h2>Sequence the improvement work</h2><table style="width:100%;border-spacing:8px"><tr>${roadmapRows}</tr></table></section><section style="margin-top:16px;padding:22px;background:#151a43"><p style="color:#2bb7e9;letter-spacing:2px;font-size:11px">YOUR SELECTED ANSWERS</p><h2>Assessment response details</h2><table style="width:100%;border-collapse:collapse">${selectedAnswerRows}</table></section><div style="margin-top:16px;padding:22px;background:linear-gradient(135deg,#7c5ce6,#e4448f)"><h2>Turn the scorecard into a NetSuite finance improvement plan.</h2><p>Review the control gaps, process dependencies, and reporting opportunities behind your result with an Amzur NetSuite finance specialist.</p><a href="https://amzur.com/contact-us/" style="display:inline-block;margin-top:12px;padding:13px 20px;border-radius:8px;background:#ffffff;color:#1769e8;text-decoration:none;font-weight:700">Contact Amzur about your results &rarr;</a></div><p style="margin-top:24px;color:#747ea4;font-size:12px">This directional scorecard is based on the answers provided and is intended for improvement planning.</p></div>`
  const notificationHtml = `<div style="font-family:Arial,sans-serif;color:#142c4d;max-width:680px"><p style="color:#1769e8;font-weight:700;letter-spacing:2px">NEW ASSESSMENT SUBMISSION</p><h1>${escapeHtml(assessmentName)}</h1><p>A user submitted the assessment for <strong>${escapeHtml(industry)}</strong>.</p><table style="border-collapse:collapse;width:100%;margin-top:20px"><tbody><tr><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">User email</td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb"><strong>${escapeHtml(email)}</strong></td></tr><tr><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">Assessment</td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb"><strong>${escapeHtml(assessmentName)}</strong></td></tr><tr><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">Industry</td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb"><strong>${escapeHtml(industry)}</strong></td></tr><tr><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">Overall score</td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb"><strong>${escapeHtml(score)}/100</strong></td></tr><tr><td style="padding:8px 12px">Maturity</td><td style="padding:8px 12px"><strong>${escapeHtml(tier)}</strong></td></tr></tbody></table><h2>Dimension scores</h2><table style="border-collapse:collapse;width:100%"><tbody>${dimensionRows}</tbody></table><h2>Selected answers</h2><table style="border-collapse:collapse;width:100%">${selectedAnswerRows}</table></div>`

  const sendEmail = async (payload) => fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, ...payload }),
  })

  try {
    const [userResponse, notificationResponse] = await Promise.all([
      sendEmail({ to: [email], subject: `Your ${assessmentName} results - ${industry}`, html: userHtml }),
      sendEmail({ to: [notificationEmail], subject: 'New user submitted the NetSuite assessment', html: notificationHtml }),
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
