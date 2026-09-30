import { useEffect, useMemo, useState } from 'react'
import './App.css'
import FinanceControlScorecard from './assessments/finance-control/FinanceControlScorecard'
import NetSuiteHealthAssessment from './assessments/netsuite-health/NetSuiteHealthAssessment'
import { initGoogleAnalytics, trackPageView } from './ga'

const bottlenecks = [
  'Bank & card reconciliation',
  'POS & payment reconciliation',
  'Accounts receivable',
  'Accounts payable',
  'Inventory & COGS',
  'Intercompany reconciliation',
  'Accruals & prepaids',
  'Manual journal entries',
  'Revenue recognition',
  'Fixed assets',
  'Currency & consolidation',
  'Data from other systems',
  'Spreadsheet preparation',
  'Review & approvals',
  'Late transactions',
  'Corrections & rework',
]

const integrationOptions = {
  automated: ['Highly automated', 'Most systems integrate directly with little intervention.'],
  partial: ['Partially automated', 'Some uploads or spreadsheet manipulation remain.'],
  manual: ['Mostly manual', 'Finance regularly exports, transforms, and uploads data.'],
  fragmented: ['Highly fragmented', 'Multiple systems and spreadsheets must be reconciled.'],
}

const correctionOptions = {
  rarely: ['Rarely', 'Exceptions are unusual.'],
  occasionally: ['Occasionally', 'A few adjustments each month.'],
  frequently: ['Frequently', 'Material adjustments occur most months.'],
  very: ['Very frequently', 'Late entries, rework, or reopening are normal.'],
}

const governanceOptions = {
  4: ['Controlled', 'Owners, deadlines, progress, and exceptions are centrally visible.'],
  3: ['Structured', 'A documented checklist exists, but follow-up is still manual.'],
  2: ['Partially structured', 'Email, spreadsheets, and individual knowledge still drive the close.'],
  1: ['Reactive', 'People chase information and resolve issues as they appear.'],
}

const complexityOptions = [
  'Multiple entities',
  'Multiple currencies',
  'Multiple countries',
  'Multiple locations',
  'Significant inventory',
  'High transaction volume',
  'Multiple payment processors',
  'Multiple connected systems',
  'Intercompany transactions',
]

const currencyMap = {
  USD: 'en-US',
  EUR: 'en-IE',
  GBP: 'en-GB',
  AED: 'en-AE',
  INR: 'en-IN',
}

function formatMoney(value, currency) {
  return new Intl.NumberFormat(currencyMap[currency] || 'en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value)
}

function calculateAssessment(values) {
  const excessDays = Math.max(0, values.currentDays - Math.min(values.targetDays, values.currentDays))
  const annualCost = values.annualCost || 0
  const hourlyRate = annualCost / 2080
  const annualCloseLabor = values.hours * hourlyRate * 12
  const excessCapacity = values.currentDays ? annualCloseLabor * (excessDays / values.currentDays) : 0

  const recon = ['Bank & card reconciliation', 'POS & payment reconciliation', 'Accounts receivable', 'Accounts payable', 'Intercompany reconciliation']
  const data = ['Data from other systems', 'Spreadsheet preparation']
  const quality = ['Late transactions', 'Corrections & rework', 'Manual journal entries', 'Accruals & prepaids', 'Revenue recognition']
  const consolidation = ['Inventory & COGS', 'Currency & consolidation', 'Fixed assets']

  const selected = (pool) => values.selectedBottlenecks.filter((item) => pool.includes(item))
  const scoreFor = (pool, weight) => selected(pool).length * weight

  const reconScore = scoreFor(recon, 2) + (values.manualPercent > 50 ? 2 : values.manualPercent > 25 ? 1 : 0)
  const automationScore = scoreFor(data, 2) + ({ automated: 0, partial: 2, manual: 4, fragmented: 6 })[values.integration]
  const qualityScore = scoreFor(quality, 2) + ({ rarely: 0, occasionally: 2, frequently: 4, very: 6 })[values.corrections]
  const governanceScore = (4 - Number(values.governance)) * 2 + (values.selectedBottlenecks.includes('Review & approvals') ? 3 : 0)
  const complexityScore = scoreFor(consolidation, 2) + Math.min(5, Math.floor(values.complexity.length / 2))

  const dimensions = [
    {
      dimension: 'Reconciliation',
      score: reconScore,
      cap: 8,
    },
    {
      dimension: 'Automation & integration',
      score: automationScore,
      cap: 10,
    },
    {
      dimension: 'Data quality & adjustments',
      score: qualityScore,
      cap: 12,
    },
    {
      dimension: 'Close governance',
      score: governanceScore,
      cap: 9,
    },
    {
      dimension: 'Complexity & consolidation',
      score: complexityScore,
      cap: 10,
    },
  ]

  const healthScore = Math.round(
    dimensions.reduce((total, entry) => total + Math.max(0, Math.round(100 - (entry.score / entry.cap) * 100)), 0) / dimensions.length,
  )

  return {
    excessDays,
    annualCloseLabor,
    monthlyLoss: excessCapacity / 12,
    quarterlyLoss: excessCapacity / 4,
    yearlyLoss: excessCapacity,
    annualManualHours: values.hours * (values.manualPercent / 100) * 12,
    annualManualCost: (values.hours * (values.manualPercent / 100) * 12) * hourlyRate,
    decisionLag: excessDays * 12,
    healthScore,
  }
}

const assessmentCards = [
  {
    title: 'NetSuite Health Assessment',
    summary: 'Measure operational health, control maturity, and process risk across your NetSuite footprint.',
    href: '/netsuite-health-assessment',
    cap: 'Diagnostic',
    icon: '/netsuite_health_check.png',
  },
  {
    title: 'Finance Control Scorecard',
    summary: 'Benchmark your finance function against leading control, automation, and decision-readiness patterns.',
    href: '/finance-control-scorecard',
    cap: 'Scorecard',
    icon: '/Finance_control_scorecard.png',
  },
  {
    title: 'Slow Close Calculator',
    summary: 'Estimate the labor and value impact of a slower close and identify where the bottlenecks sit.',
    href: '/slow-close-calculator',
    cap: 'Calculator',
    icon: '/slow%20cose%20calculator.png',
  },
]

function AmzurFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__left">
          <span className="site-footer__dot" aria-hidden="true" />
          <a className="site-footer__link" href="https://amzur.com/terms-and-conditions/" target="_blank" rel="noreferrer">Terms &amp; Conditions</a>
          <a className="site-footer__link" href="https://amzur.com/privacy-policy/" target="_blank" rel="noreferrer">Privacy Policy</a>
        </div>

        <div className="site-footer__copy">© 2026 Amzur Technologies, Inc. All Rights Reserved.</div>
      </div>
    </footer>
  )
}

function App() {
  const path = typeof window !== 'undefined' ? window.location.pathname : '/'

  useEffect(() => {
    initGoogleAnalytics()
    trackPageView(window.location.pathname + window.location.search)
  }, [])

  if (path === '/slow-close-calculator') {
    return <ReferenceCalculator />
  }

  if (path === '/finance-control-scorecard') {
    return <FinanceControlScorecard />
  }

  if (path === '/netsuite-health-assessment') {
    return <NetSuiteHealthAssessment />
  }

  return <HomeLanding />
}

function HomeLanding() {
  return (
    <main className="landing-page">
      <header className="landing-header">
        <div className="brand-block" aria-label="Amzur logo">
          <img
            className="brand-word"
            src="https://amzur.com/wp-content/uploads/2023/04/Anzur_logo_2023.png"
            alt="Amzur"
          />
        </div>

        <a className="nav-cta" href="https://amzur.com/contact-us/" target="_blank" rel="noreferrer">
          Get in Touch <span>→</span>
        </a>
      </header>

      <div className="landing-content">
        <section className="hero-shell">
          <div className="hero-inner">
            <div className="hero-copy">
              <p className="kicker">BUSINESS ASSESSMENTS &amp; CALCULATORS</p>
              <h1>Assess. Identify. Improve.</h1>
              <p className="hero-subtext">
                Explore interactive assessments and calculators designed to help you identify gaps, quantify impact,
                and uncover opportunities for improvement.
              </p>
              <a className="cta-button" href="#assessment-section">
                Explore Assessments <span>→</span>
              </a>
            </div>

            <div className="hero-visual" aria-hidden="true" />
          </div>
        </section>

        <section id="assessment-section" className="assessment-section">
          <div className="section-title-row">
            <h2>Choose Your Assessment</h2>
          </div>

          <div className="assessment-card-grid">
            {assessmentCards.map((card, index) => (
              <a key={card.title} href={card.href} className="assessment-card assessment-card--gradient">
                <div className="assessment-step" aria-hidden="true">
                  <img src={card.icon} alt="" className="assessment-step-icon" />
                </div>
                <div className="assessment-header">
                  <h3>{card.title}</h3>
                </div>
                <p>{card.summary}</p>
                <span className="assessment-link">{index === 0 ? 'Calculate Now' : index === 1 ? 'Take the Scorecard' : 'Start Assessment'} →</span>
              </a>
            ))}
          </div>
        </section>

        <section className="benefits-section">
          <div className="benefits-copy">
            <h2>Why Take an Assessment?</h2>
            <p>
              Our assessments help you make informed decisions and drive meaningful improvements across your business.
            </p>
          </div>

          <div className="benefits-grid">
            <article className="benefit-item">
              <div className="benefit-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="11" cy="11" r="5.5" stroke="currentColor" strokeWidth="1.7" />
                  <path d="M15.5 15.5L20 20" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                  <path d="M11 6.5V11L13.8 13.8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3>Identify Gaps</h3>
              <p>Uncover process, financial, or system-level gaps that may be affecting your business.</p>
            </article>

            <article className="benefit-item">
              <div className="benefit-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 18.5H20" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                  <path d="M7 15.5V11" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                  <path d="M12 15.5V7.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                  <path d="M17 15.5V4.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                  <path d="M3.5 20.5L7 18L10.5 19.5L14 16L18 17.5L20.5 15.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3>Quantify Impact</h3>
              <p>Turn operational challenges into measurable business impact.</p>
            </article>

            <article className="benefit-item">
              <div className="benefit-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 14.5L10 18.5L18.5 6.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M5 9.5H8.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                  <path d="M15.5 5.5H18.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                  <circle cx="5.5" cy="9.5" r="1.5" stroke="currentColor" strokeWidth="1.4" />
                  <circle cx="18.5" cy="5.5" r="1.5" stroke="currentColor" strokeWidth="1.4" />
                </svg>
              </div>
              <h3>Get Actionable Insights</h3>
              <p>Use your results to identify practical areas for improvement.</p>
            </article>

            <article className="benefit-item">
              <div className="benefit-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="7.2" stroke="currentColor" strokeWidth="1.7" />
                  <path d="M12 4.8V2.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                  <path d="M12 21.5V19.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                  <path d="M19.2 12H21.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                  <path d="M2.5 12H4.8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                  <path d="M16.5 7.5L18.3 5.7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                  <path d="M5.7 18.3L7.5 16.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                  <path d="M7.5 7.5L5.7 5.7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                  <path d="M18.3 18.3L16.5 16.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                  <circle cx="12" cy="12" r="2.3" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </div>
              <h3>Make Informed Decisions</h3>
              <p>Get a clearer picture before investing time and resources in change.</p>
            </article>
          </div>
        </section>

        <section className="cta-banner">
          <div className="cta-badge" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2.8V7.4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              <path d="M12 16.6V21.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              <path d="M4.1 12H8.7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              <path d="M15.3 12H19.9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              <path d="M6.1 6.1L8.8 8.8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              <path d="M15.2 15.2L17.9 17.9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              <path d="M17.9 6.1L15.2 8.8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              <path d="M8.8 15.2L6.1 17.9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.3" />
            </svg>
          </div>
          <div className="cta-copy">
            <h3>We&apos;re here to help you succeed.</h3>
            <p>Need help choosing the right assessment? Contact our experts today.</p>
          </div>
          <a className="cta-banner-button" href="https://amzur.com/contact-us/" target="_blank" rel="noreferrer">
            Get in Touch <span>→</span>
          </a>
        </section>
      </div>

      <AmzurFooter />
    </main>
  )
}

function ReferenceCalculator() {
  const [step, setStep] = useState(1)
  const [values, setValues] = useState({
    currentDays: 10,
    targetDays: 5,
    team: 8,
    hours: 240,
    annualCost: 100000,
    manualPercent: 40,
    selectedBottlenecks: [],
    integration: 'partial',
    corrections: 'occasionally',
    governance: 3,
    complexity: [],
    currency: 'USD',
  })

  const updateValue = (field, value) => {
    setValues((current) => ({ ...current, [field]: value }))
  }

  const toggleSelect = (field, item) => {
    setValues((current) => {
      const existing = current[field]
      const next = existing.includes(item)
        ? existing.filter((entry) => entry !== item)
        : [...existing, item]
      return { ...current, [field]: next }
    })
  }

  const baselineValid =
    values.currentDays >= 1 && values.targetDays >= 1 && values.team >= 1 && values.targetDays <= values.currentDays
  const costValid = values.hours >= 1 && values.annualCost >= 1000
  const bottleneckValid = values.selectedBottlenecks.length >= 1

  const report = useMemo(() => calculateAssessment(values), [values])

  useEffect(() => {
    if (step === 4) {
      window.scrollTo(0, 0)
    }
  }, [step])

  const renderStepContent = () => {
    if (step === 1) {
      return (
        <ReferenceFrame
          eyebrow="01 / YOUR CLOSE"
          title="Establish your close baseline"
          description="Count from period end until management considers the financials substantially final."
        >
          <div className="reference-fields">
            <NumberField
              label="Current monthly close"
              value={values.currentDays}
              suffix="days"
              onChange={(value) => updateValue('currentDays', Number(value))}
            />
            <NumberField
              label="Achievable target"
              value={values.targetDays}
              suffix="days"
              hint="Your internal target matters more than a universal benchmark."
              onChange={(value) => updateValue('targetDays', Number(value))}
            />
          </div>
          <NumberField
            label="Team members involved"
            value={values.team}
            suffix="people"
            hint="Include reconciliation, journals, reporting, consolidation, review, and close management."
            onChange={(value) => updateValue('team', Number(value))}
          />
          <ReferenceActions
            back={null}
            next={() => baselineValid && setStep(2)}
            nextLabel="Continue"
            disabled={!baselineValid}
          />
        </ReferenceFrame>
      )
    }

    if (step === 2) {
      return (
        <ReferenceFrame
          eyebrow="02 / YOUR COST"
          title="Estimate the financial burden"
          description="Use reasonable estimates — the goal is a credible directional business case."
        >
          <NumberField
            label="Total team hours per monthly close"
            value={values.hours}
            suffix="hours"
            hint={`${values.team} people × 5 hours/day × ${values.currentDays} days = ${values.team * 5 * values.currentDays} hours`}
            onChange={(value) => updateValue('hours', Number(value))}
          />

          <label className="reference-field currency-field">
            <span className="field-label">Average fully loaded annual cost</span>
            <div className="currency-input-wrap">
              <select value={values.currency} onChange={(e) => updateValue('currency', e.target.value)}>
                {Object.keys(currencyMap).map((currency) => (
                  <option key={currency} value={currency}>
                    {currency}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min="1000"
                value={values.annualCost}
                onChange={(e) => updateValue('annualCost', Number(e.target.value))}
              />
            </div>
            <small>Salary, benefits, and employer costs. An estimate is sufficient.</small>
          </label>

          <label className="reference-slider">
            <span className="field-label-inline">
              <span>Close effort spent on manual work or rework</span>
              <b>{values.manualPercent}%</b>
            </span>
            <input
              type="range"
              min="0"
              max="100"
              value={values.manualPercent}
              onChange={(e) => updateValue('manualPercent', Number(e.target.value))}
            />
            <small>
              <span>Mostly automated</span>
              <span>Mostly manual</span>
            </small>
            <em>Include reconciliation, spreadsheet manipulation, data collection, and corrections.</em>
          </label>

          <ReferenceActions
            back={() => setStep(1)}
            next={() => costValid && setStep(3)}
            nextLabel="Continue"
            disabled={!costValid}
          />
        </ReferenceFrame>
      )
    }

    if (step === 3) {
      return (
        <ReferenceFrame
          eyebrow="03 / BOTTLENECKS"
          title="What is slowing the close?"
          description="Choose the activities and operating patterns that best describe your process."
        >
          <div className="reference-question activities-question">
            <div className="question-header-row">
              <strong>Which activities most often delay your close?</strong>
              <span>
                {values.selectedBottlenecks.length}/3 selected
              </span>
            </div>
            <div className="reference-activities">
              {bottlenecks.map((item) => {
                const selected = values.selectedBottlenecks.includes(item)
                return (
                  <button
                    key={item}
                    type="button"
                    className={selected ? 'selected' : ''}
                    onClick={() => {
                      if (!selected && values.selectedBottlenecks.length >= 3) return
                      toggleSelect('selectedBottlenecks', item)
                    }}
                  >
                    {selected ? '✓ ' : '+ '}
                    {item}
                  </button>
                )
              })}
            </div>
          </div>

          <ChoiceCard
            title="How does financial data reach NetSuite?"
            value={values.integration}
            options={integrationOptions}
            onChange={(value) => updateValue('integration', value)}
          />

          <ChoiceCard
            title="How often are late adjustments or corrections required?"
            value={values.corrections}
            options={correctionOptions}
            onChange={(value) => updateValue('corrections', value)}
          />

          <ChoiceCard
            title="How is your close managed?"
            value={values.governance}
            options={governanceOptions}
            onChange={(value) => updateValue('governance', value)}
          />

          <details className="reference-complexity">
            <summary>
              Add complexity context <small>OPTIONAL</small>
            </summary>
            <div className="complexity-list">
              {complexityOptions.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={values.complexity.includes(item) ? 'selected' : ''}
                  onClick={() => toggleSelect('complexity', item)}
                >
                  {values.complexity.includes(item) ? '✓ ' : '+ '}
                  {item}
                </button>
              ))}
            </div>
          </details>

          <ReferenceActions
            back={() => setStep(2)}
            next={() => bottleneckValid && setStep(4)}
            nextLabel="See my results"
            disabled={!bottleneckValid}
          />
        </ReferenceFrame>
      )
    }

    return (
      <ReferenceResults report={report} values={values} onRestart={() => setStep(1)} />
    )
  }

  return (
    <main className="reference-calculator">
      <header className="reference-header">
        <a className="brand" href="/" aria-label="Amzur assessment library">
          <img src="https://amzur.com/wp-content/uploads/2022/07/Amzur-logo-2022.png" alt="Amzur" />
        </a>
        <span className="tool-label">CFO DECISION TOOL</span>
      </header>

      <div className={`reference-body ${step === 4 ? 'report-mode' : ''}`}>
        {step < 4 && <aside className="reference-rail">
          <div className="rail-copy">
            <b>SLOW CLOSE CALCULATOR</b>
            <h1>
              Turn close friction<br />into a business<br />case.
            </h1>
            <p>
              Your estimates are enough. The model separates total close labor, excess-close
              capacity, and manual effort to avoid double counting.
            </p>
          </div>

          <div className="why-matters">
            <span>i</span>
            <div>
              <strong>Why this matters</strong>
              <p>Your result shows capacity — not a claim that every dollar can be eliminated.</p>
            </div>
          </div>

          <div className="rail-circles" />
        </aside>}

        <section className="reference-form">
          {step < 4 && (
            <div className="reference-progress">
              <div>
                <b>STEP {step} OF 3</b>
                <span>
                  {step === 1
                    ? 'About 3 minutes remaining'
                    : step === 2
                      ? 'About 2 minutes remaining'
                      : 'Almost there'}
                </span>
              </div>
              <a href="/">Save &amp; exit</a>
              <i>
                <em style={{ width: `${step * 33.33}%` }} />
              </i>
            </div>
          )}

          {renderStepContent()}
        </section>
      </div>

      <AmzurFooter />
    </main>
  )
}

function NumberField({ label, value, suffix, hint, onChange }) {
  return (
    <label className="reference-field">
      <span className="field-label">{label}</span>
      <span className="number-input-wrap">
        <input
          type="number"
          min="1"
          step="1"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        <em>{suffix}</em>
      </span>
      {hint ? <small>{hint}</small> : null}
    </label>
  )
}

function ChoiceCard({ title, value, options, onChange }) {
  const entries = Object.entries(options)
  return (
    <div className="reference-question choice-question">
      <strong>{title}</strong>
      <div className="reference-choice-grid">
        {entries.map(([key, [label, detail]]) => (
          <button
            key={key}
            type="button"
            className={String(value) === String(key) ? 'reference-choice selected' : 'reference-choice'}
            onClick={() => onChange(key)}
          >
            <i />
            <span>
              <b>{label}</b>
              <small>{detail}</small>
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

function ReferenceActions({ back, next, nextLabel = 'Continue', disabled = false }) {
  return (
    <div className="reference-actions">
      <button type="button" className="reference-back" onClick={back} disabled={!back}>
        ← Back
      </button>
      <button type="button" className="reference-next" onClick={next} disabled={disabled}>
        {nextLabel}
        <b>→</b>
      </button>
    </div>
  )
}

function ReferenceFrame({ eyebrow, title, description, children }) {
  return (
    <div className="reference-frame">
      <p className="reference-eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      <p className="reference-description">{description}</p>
      {children}
    </div>
  )
}

function ReferenceResults({ report, values, onRestart }) {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const submitReport = async (event) => {
    event.preventDefault()
    if (!email.trim()) return
    setError('')

    try {
      const response = await fetch('/api/send-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          assessment: 'slow_close_calculator',
          assessment_name: 'Slow Close Calculator',
          industry: 'Slow Close',
          score: report.healthScore,
          tier: 'Close health score',
          dimensions: {
            Reconciliation: Math.min(99, 46 + values.selectedBottlenecks.filter((item) => item.toLowerCase().includes('reconciliation')).length * 18),
            'Automation & integration': Math.min(99, 42 + ({ automated: 0, partial: 16, manual: 32, fragmented: 45 })[values.integration]),
            'Data quality & adjustments': Math.min(99, 38 + ({ rarely: 0, occasionally: 18, frequently: 32, very: 45 })[values.corrections]),
          },
          ranked: ['Reconciliation', 'Automation & integration', 'Data quality & adjustments'],
          questions: [
            { id: 'close_days', prompt: 'Current monthly close duration' },
            { id: 'manual_effort', prompt: 'Manual effort share' },
            { id: 'bottlenecks', prompt: 'Selected bottlenecks' },
          ],
          answers: {
            close_days: `${values.currentDays} days`,
            manual_effort: `${values.manualPercent}%`,
            bottlenecks: values.selectedBottlenecks.join(', '),
          },
        }),
      })

      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || 'Unable to send the report.')

      setSent(true)
    } catch (submitError) {
      setError(submitError.message)
    }
  }

  const rootCauses = [
    {
      number: '01', label: 'RECONCILIATION', title: 'Reconciliation',
      detail: 'Bank, card, and payment processor activity is creating repeat work before the close can move forward.',
      score: Math.min(99, 46 + values.selectedBottlenecks.filter((item) => item.toLowerCase().includes('reconciliation')).length * 18), tone: 'coral',
    },
    {
      number: '02', label: 'AUTOMATION & INTEGRATION', title: 'Automation & integration',
      detail: 'Manual uploads and spreadsheet manipulation are keeping the close dependent on individual operators.',
      score: Math.min(99, 42 + ({ automated: 0, partial: 16, manual: 32, fragmented: 45 })[values.integration]), tone: 'amber',
    },
    {
      number: '03', label: 'DATA QUALITY & ADJUSTMENTS', title: 'Data quality & adjustments',
      detail: 'Late transactions and corrections are forcing the team to revisit work that should already be final.',
      score: Math.min(99, 38 + ({ rarely: 0, occasionally: 18, frequently: 32, very: 45 })[values.corrections]), tone: 'amber',
    },
  ]
  const priorities = [
    ['RECONCILIATION', 'Find repeat reconciliation exceptions', 'Review the highest-volume accounts and isolate the patterns that keep every close open longer.'],
    ['AUTOMATION & INTEGRATION', 'Map manual data movement', 'Document where files, spreadsheets, and system handoffs still rely on manual intervention.'],
    ['DATA QUALITY & ADJUSTMENTS', 'Trace late entries to their source', 'Identify the upstream owners and timing gaps behind recurring late or corrected transactions.'],
  ]

  return (
    <div className="report-page">
      <section className="report-hero"><div className="report-hero-inner">
        <div className="report-toolbar"><button type="button" onClick={onRestart}>← Edit answers</button><button type="button" onClick={() => window.print()}>Print / save report</button></div>
        <p className="report-kicker">YOUR SLOW CLOSE SNAPSHOT</p><h2>Don't just close faster.<br />Find the work that shouldn't be there.</h2>
        <p className="report-intro">Based on your estimates, this is the finance capacity associated with close duration beyond your target.</p>
        <div className="loss-grid">{[['MONTHLY LOSS', report.monthlyLoss], ['QUARTERLY LOSS', report.quarterlyLoss], ['YEARLY LOSS', report.yearlyLoss]].map(([label, amount]) => <div className="loss-card" key={label}><span>{label}</span><strong>{formatMoney(amount, values.currency)}</strong><small>per period</small></div>)}</div>
        <p className="report-footnote">One directional estimate based on your inputs. This is capacity tied up in excess close work, not guaranteed savings.</p>
      </div></section>

      <div className="report-content">
        <section className="health-panel"><div className="score-wrap"><div className="score-ring"><strong>{report.healthScore}</strong><span>/100</span></div><div><p className="report-kicker">YOUR CLOSE HEALTH SCORE</p><h3>Material friction is slowing the close</h3><p>There is a clear blend of manual effort, data movement, and rework behind your current close duration.</p></div></div><div className="health-bars">{rootCauses.map((cause) => <div key={cause.title}><span>{cause.title}</span><b>{cause.score}/100</b><i><em style={{ width: `${cause.score}%` }} /></i></div>)}</div></section>
        <section className="stat-grid"><div><span>◷</span><small>CURRENT CLOSE</small><strong>{values.currentDays} days</strong><em>Target: {values.targetDays} days</em></div><div><span>◇</span><small>ANNUAL CLOSE LABOR</small><strong>{formatMoney(report.annualCloseLabor, values.currency)}</strong><em>Across your close team</em></div><div><span>↻</span><small>ANNUAL MANUAL EFFORT</small><strong>{Math.round(report.annualManualHours).toLocaleString()} hrs</strong><em>{values.manualPercent}% of close effort</em></div><div><span>⌁</span><small>DECISION LAG</small><strong>{report.decisionLag} days</strong><em>Capacity delayed by excess close</em></div></section>
        <section className="compare-panel"><div><p className="report-kicker">CONTEXT, NOT A VERDICT</p><h3>How your close compares</h3><p>Your internal target is the most useful benchmark because complexity, industry, and reporting requirements differ.</p></div><div className="compare-bars"><div><span>Your close</span><b>{values.currentDays} days</b><i><em style={{ width: '86%' }} /></i></div><div><span>Close-industry median</span><b>{Math.max(6, values.targetDays + 3)} days</b><i><em className="orange" style={{ width: '64%' }} /></i></div><div><span>Your target</span><b>{values.targetDays} days</b><i><em className="green" style={{ width: '43%' }} /></i></div></div></section>
        <section className="cause-section"><p className="report-kicker">ROOT-CAUSE SIGNALS</p><h3>What is most likely slowing your close</h3><p className="section-copy">These are not generic recommendations. Each signal combines the operating patterns you selected.</p><div className="cause-grid">{rootCauses.map((cause) => <article key={cause.title}><div className="cause-top"><small>{cause.number}</small><b className={cause.tone}>HIGH PRIORITY</b></div><p className="report-kicker">{cause.label}</p><h4>{cause.title}</h4><div className="cause-score"><span>Category score</span><strong>{cause.score}/100</strong></div><p>{cause.detail}</p><footer>RISK SIGNAL <i><em style={{ width: `${cause.score}%` }} /></i></footer></article>)}</div></section>
        <section className="priority-panel"><p className="report-kicker">YOUR ACTION PLAN</p><h3>Three priorities for the next close</h3>{priorities.map(([label, title, detail], index) => <div className="priority-row" key={title}><span>{index + 1}</span><div><p className="report-kicker">{label}</p><h4>{title}</h4><p>{detail}</p><b>Goal: Reduce exceptions and reclaim capacity.</b></div></div>)}</section>
        <section className="report-cta"><div><p className="report-kicker">NEED HELP FINDING THE ROOT CAUSE?</p><h3>Turn this snapshot into a close improvement plan.</h3><p>Amzur's NetSuite specialists can help trace reconciliation, integration, and process issues to their source.</p></div><a href="https://amzur.com/contact-us/">Schedule a NetSuite close diagnostic <b>→</b></a></section>
        <section className="report-email-panel" style={{ marginTop: '24px', padding: '20px 22px', border: '1px solid rgba(136, 150, 181, 0.35)', borderRadius: '16px', background: 'rgba(255,255,255,0.04)' }}>
          <p className="report-kicker">EMAIL THIS REPORT</p>
          <form onSubmit={submitReport} style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '12px' }}>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Work email address"
              aria-label="Work email address"
              style={{ flex: '1 1 240px', minHeight: '46px', borderRadius: '12px', border: '1px solid rgba(136, 150, 181, 0.5)', background: 'rgba(10, 12, 25, 0.3)', color: '#eef2ff', padding: '0 14px' }}
            />
            <button type="submit" disabled={!email.trim() || sent} style={{ minHeight: '46px', borderRadius: '12px', border: 'none', background: 'linear-gradient(90deg, #3CC0FA, #963DC0)', color: '#fff', fontWeight: 700, padding: '0 18px', cursor: 'pointer' }}>
              {sent ? 'Report sent' : 'Send my report'}
            </button>
          </form>
          {error && <p style={{ marginTop: '10px', color: '#f8c7d2' }}>{error}</p>}
          {sent && !error && <p style={{ marginTop: '10px', color: '#d3f9e5' }}>Your report has been queued for delivery.</p>}
        </section>
        <div className="report-disclaimer"><b>About this estimate</b><span>This snapshot is directional and based on the inputs provided. It is not a promise of savings or a substitute for a detailed process review.</span></div>
      </div>
    </div>
  )
}

export default App
