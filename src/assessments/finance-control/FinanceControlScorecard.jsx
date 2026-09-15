import { useEffect, useMemo, useState } from 'react'
import './FinanceControlScorecard.css'

const dimensions = {
  control: { label: 'Financial control & accuracy', short: 'Control', weight: 0.3 },
  automation: { label: 'Close, reconciliation & automation', short: 'Automation', weight: 0.25 },
  performance: { label: 'Profitability & operational performance', short: 'Performance', weight: 0.25 },
  decision: { label: 'Liquidity & decision readiness', short: 'Decision readiness', weight: 0.2 },
}

const industries = {
  retail: {
    label: 'Retail',
    description: 'Stores, eCommerce, marketplaces, inventory, and tender control',
    topics: ['Sales integrity', 'Tender reconciliation', 'Inventory control', 'Margin visibility', 'Period close', 'Ledger integrity', 'Finance effort', 'Location governance', 'Control environment', 'Working capital', 'Decision readiness'],
  },
  fnb: {
    label: 'Food & Beverage',
    description: 'Outlets, kitchens, food cost, delivery platforms, and settlement control',
    topics: ['Daily sales integrity', 'Settlement control', 'Food-cost integrity', 'Wastage & leakage', 'Menu economics', 'Outlet performance', 'Period close', 'Ledger integrity', 'Finance effort', 'Stock movement', 'Control environment', 'Liquidity', 'Decision readiness'],
  },
  manufacturing: {
    label: 'Manufacturing',
    description: 'Plants, production costing, WIP, inventory, procurement, and variance control',
    topics: ['Production transaction integrity', 'Procure-to-pay control', 'Product costing', 'WIP integrity', 'Inventory productivity', 'Manufacturing variance', 'Period close', 'Ledger integrity', 'Finance effort', 'Plant governance', 'Control environment', 'Working capital', 'Decision readiness'],
  },
}

const questionTemplates = {
  control: [
    'How reliably does operational activity reach NetSuite and the General Ledger?',
    'How consistently do subledgers reconcile with the General Ledger?',
    'How standardized are accounting rules across locations, entities, and currencies?',
    'How well do approvals, permissions, period locks, and audit trails protect transactions?',
  ],
  automation: [
    'How are transactions, settlements, and bank activity reconciled?',
    'What best describes the month-end close?',
    'How much accounting and reporting still depends on spreadsheets or manual journals?',
    'How quickly are exceptions routed to an owner with an aging and resolution path?',
  ],
  performance: [
    'Can finance explain margin by product, location, and operating channel?',
    'How quickly can your team identify aged, slow-moving, or margin-dilutive activity?',
    'When cost or yield variance moves off target, how quickly can finance explain why?',
    'How reliably does NetSuite reflect inventory, cost, and operational performance?',
  ],
  decision: [
    'How current is finance’s view of cash, obligations, and working capital?',
    'When performance moves off target, how quickly do leaders see why?',
    'How quickly can leaders drill from a KPI to the transactions driving the variance?',
  ],
}

const answerOptions = [
  'Mostly manual, inconsistent, or discovered during close',
  'Partly controlled, but recurring investigation and rework remain',
  'Generally reliable with defined ownership and manageable exceptions',
  'Automated, monitored continuously, and visible through clear controls',
]

function buildQuestions(industry) {
  const topics = industries[industry].topics
  const keys = ['control', 'automation', 'performance', 'decision']
  return Array.from({ length: 15 }, (_, index) => {
    const dimension = keys[index % keys.length]
    return {
      id: `${industry}-${index}`,
      topic: topics[index % topics.length],
      dimension,
      prompt: questionTemplates[dimension][index % questionTemplates[dimension].length],
    }
  })
}

function scoreTier(score) {
  if (score >= 80) return ['Finance performance leader', 'Controls and decision insight are working together.', 'good']
  if (score >= 65) return ['Controlled, but constrained', 'The foundation is sound; targeted gaps are limiting speed and insight.', 'cyan']
  if (score >= 45) return ['Operationally exposed', 'Manual work and delayed visibility are creating material finance risk.', 'warn']
  return ['High control risk', 'Core accuracy, control, or reporting weaknesses need immediate attention.', 'danger']
}

function FinanceControlScorecard() {
  const [phase, setPhase] = useState('intro')
  const [industry, setIndustry] = useState(null)
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  const questions = useMemo(() => (industry ? buildQuestions(industry) : []), [industry])
  const result = useMemo(() => {
    if (!industry) return null
    const scores = Object.fromEntries(Object.keys(dimensions).map((key) => {
      const set = questions.filter((question) => question.dimension === key)
      const total = set.reduce((sum, question) => sum + (answers[question.id] ?? 0), 0)
      return [key, Math.round((total / (set.length * 3)) * 100)]
    }))
    const overall = Math.round(Object.entries(dimensions).reduce((sum, [key, dimension]) => sum + scores[key] * dimension.weight, 0))
    const ranked = Object.keys(dimensions).sort((a, b) => scores[a] - scores[b])
    return { scores, overall, ranked, tier: scoreTier(overall) }
  }, [answers, industry, questions])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [phase, index])

  const startIndustry = (key) => {
    setIndustry(key)
    setAnswers({})
    setIndex(0)
    setPhase('quiz')
  }

  const chooseAnswer = (value) => {
    const question = questions[index]
    setAnswers((current) => ({ ...current, [question.id]: value }))
    window.setTimeout(() => {
      if (index === questions.length - 1) setPhase('results')
      else setIndex((current) => current + 1)
    }, 160)
  }

  const restart = () => {
    setPhase('intro')
    setIndustry(null)
    setIndex(0)
    setAnswers({})
    setEmail('')
    setSent(false)
  }

  return (
    <main className="finance-scorecard">
      <div className="scorecard-shell">
        <header className="scorecard-topbar">
          <a className="scorecard-brand" href="/" aria-label="Amzur assessment library">
            <img src="https://amzur.com/wp-content/uploads/2022/07/Amzur-logo-2022.png" alt="Amzur" />
          </a>
          <span>Finance Control &amp; Performance Scorecard</span>
        </header>

        {phase === 'intro' && <Intro onStart={() => setPhase('industry')} />}
        {phase === 'industry' && <IndustryPicker onBack={() => setPhase('intro')} onSelect={startIndustry} />}
        {phase === 'quiz' && <Quiz question={questions[index]} number={index + 2} total={16} value={answers[questions[index].id]} onBack={() => index === 0 ? setPhase('industry') : setIndex((current) => current - 1)} onAnswer={chooseAnswer} industry={industries[industry].label} />}
        {phase === 'results' && result && <Results result={result} industry={industries[industry].label} email={email} setEmail={setEmail} sent={sent} setSent={setSent} onRestart={restart} />}

        <footer className="scorecard-footer"><span>Amzur Technologies</span><span>NetSuite implementation, optimization, integration, and managed support</span><a href="https://www.amzur.com" target="_blank" rel="noreferrer">www.amzur.com</a></footer>
      </div>
    </main>
  )
}

function Intro({ onStart }) {
  return <section className="scorecard-intro fade-in"><p className="scorecard-eyebrow">FOR RETAIL, F&amp;B &amp; MANUFACTURING FINANCE LEADERS USING NETSUITE</p><h1>Is your finance function <strong>in control - or compensating?</strong></h1><p className="scorecard-lede">Get an industry-specific view of where NetSuite is supporting control, where manual work is masking gaps, and what finance should improve next.</p><div className="promise-grid"><div><b>5-7 minutes</b><span>15 focused interactions</span></div><div><b>Directional</b><span>Risk-based findings</span></div><div><b>Industry-specific</b><span>Three distinct assessment paths</span></div></div><button className="scorecard-primary" type="button" onClick={onStart}>Start the scorecard <span>&rarr;</span></button><small>See your score and immediate priorities without signing in.</small></section>
}

function IndustryPicker({ onBack, onSelect }) {
  return <section className="scorecard-question fade-in"><QuestionMeta number="1" label="Assessment path" progress={6} /><h2>Which industry should this assessment reflect?</h2><p className="question-help">Your choice changes the questions, scoring signals, findings, and improvement direction.</p><div className="industry-options">{Object.entries(industries).map(([key, value]) => <button type="button" key={key} onClick={() => onSelect(key)}><b>{value.label}</b><span>{value.description}</span><i>&rarr;</i></button>)}</div><button className="scorecard-back" type="button" onClick={onBack}>&lt;- Back</button></section>
}

function Quiz({ question, number, total, value, onBack, onAnswer, industry }) {
  return <section className="scorecard-question fade-in"><QuestionMeta number={number} label={question.topic} progress={(number / total) * 100} path={industry} /><h2>{question.prompt}</h2><div className="answer-options" role="radiogroup">{answerOptions.map((option, answer) => <button type="button" role="radio" aria-checked={value === answer} className={value === answer ? 'selected' : ''} key={option} onClick={() => onAnswer(answer)}><i>{value === answer ? 'x' : ''}</i><span>{option}</span></button>)}</div><button className="scorecard-back" type="button" onClick={onBack}>&lt;- Back</button></section>
}

function QuestionMeta({ number, label, progress, path }) {
  return <div className="question-meta"><div><span>Question {number} of 16</span>{path && <b>{path} path</b>}</div><i><em style={{ width: `${progress}%` }} /></i><small>{label}</small></div>
}

function Results({ result, industry, email, setEmail, sent, setSent, onRestart }) {
  const [tierName, tierNote, tierClass] = result.tier
  const [sending, setSending] = useState(false)
  const [_error, setError] = useState('')
  const submit = async (event) => {
    event.preventDefault()
    if (!email.trim() || sending) return
    setSending(true)
    setError('')
    try {
      const response = await fetch('/api/send-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, industry, score: result.overall, tier: tierName, dimensions: result.scores }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'Unable to send the report.')
      setSent(true)
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setSending(false)
    }
  }
  return <section className="scorecard-results fade-in"><div className="result-heading"><div><p className="scorecard-eyebrow">YOUR {industry.toUpperCase()} FINANCE SCORECARD</p><h1>Your next finance priorities are clear.</h1></div><button className="retake-button" type="button" onClick={onRestart}>Reset <span>↻</span></button></div><div className="score-hero"><ScoreGauge score={result.overall} /><div><small>MATURITY LEVEL</small><h2 className={tierClass}>{tierName}</h2><p>{tierNote}</p></div></div>{result.overall < 65 && <div className="critical-callout"><strong>!</strong><div><b>1 critical control signal detected</b><p>These risks remain a priority even if stronger areas raise the overall score.</p></div></div>}<div className="dimension-grid">{Object.entries(dimensions).map(([key, dimension]) => <div className="dimension-card" key={key}><div><span>{dimension.short}</span><strong>{result.scores[key]}</strong></div><i><em style={{ width: `${result.scores[key]}%` }} /></i><small>{dimension.label}</small></div>)}</div><section className="result-section"><p className="section-kicker">WHAT YOUR ANSWERS INDICATE</p><h2>Priority findings - not generic advice</h2><div className="finding-list">{result.ranked.slice(0, 3).map((key, item) => <article key={key}><b>{item + 1}</b><div><strong>{dimensions[key].label} needs attention</strong><p>Start with ownership, exception visibility, and a controlled workflow for {industry.toLowerCase()} finance operations.</p></div></article>)}</div></section><section className="result-section"><p className="section-kicker">YOUR 30 / 60 / 90-DAY DIRECTION</p><h2>Sequence the improvement work</h2><div className="roadmap-grid">{result.ranked.slice(0, 3).map((key, item) => <article key={key}><small>{['30 DAYS', '60 DAYS', '90 DAYS'][item]}</small><h3>{dimensions[key].label}</h3><p>Document the process, automate recurring exceptions, and give leaders a visible scorecard for this dimension.</p></article>)}</div></section><section className="report-gate">{sent ? <p className="sent-state"><strong>Your report request is captured.</strong><span>The detailed report will be sent to {email}.</span></p> : <><strong>Get the detailed prioritized report</strong><p>Receive your dimension breakdown, control signals, and industry-specific improvement direction.</p><form onSubmit={submit}><input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Work email address" aria-label="Work email address" /><button className="scorecard-primary" type="submit">Email my report <span>&rarr;</span></button></form></>}</section><section className="scorecard-cta"><div><small>NEED A CLOSER LOOK?</small><h2>Turn the scorecard into a NetSuite finance improvement plan.</h2><p>Review the control gaps, process dependencies, and reporting opportunities behind your result with an Amzur NetSuite finance specialist.</p></div><a href="https://amzur.com/contact-us/">Request a finance diagnostic <span>&rarr;</span></a></section></section>
}

function ScoreGauge({ score }) {
  const radius = 66
  const circumference = 2 * Math.PI * radius
  const progress = circumference * (score / 100)

  return <div className="score-gauge" role="img" aria-label={`Score ${score} out of 100`}><svg viewBox="0 0 168 168" aria-hidden="true"><defs><linearGradient id="score-gauge-gradient" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="var(--fc-cyan)" /><stop offset="100%" stopColor="var(--fc-violet)" /></linearGradient></defs><circle className="score-gauge-track" cx="84" cy="84" r={radius} /><circle className="score-gauge-progress" cx="84" cy="84" r={radius} strokeDasharray={`${progress} ${circumference - progress}`} /></svg><div className="score-gauge-label"><strong>{score}</strong><span>/ 100</span></div></div>
}

export default FinanceControlScorecard
