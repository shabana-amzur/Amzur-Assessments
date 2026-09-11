import { useMemo, useState } from 'react'
import './App.css'

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

function App() {
  const path = typeof window !== 'undefined' ? window.location.pathname : '/'

  if (path === '/slow-close-calculator') {
    return <ReferenceCalculator />
  }

  return <AssessmentHub />
}

function AssessmentHub() {
  return (
    <main className="library-page">
      <header className="library-header">
        <a className="library-brand" href="/" aria-label="Amzur assessment library">
          <img src="/amzur-logo.png" alt="Amzur" />
        </a>
        <a className="contact-cta" href="https://amzur.com/contact-us/">
          Contact us <b>→</b>
        </a>
      </header>

      <section className="library-body">
        <div className="library-intro">
          <p className="eyebrow">AMZUR DECISION TOOLS</p>
          <h1>
            Assessments for sharper <i>operations.</i>
          </h1>
          <p>
            A working library of diagnostic tools that turn finance data into clear,
            defensible decisions.
          </p>
          <div className="library-strip">
            <span>ASSESSMENT LIBRARY</span>
            <span>2026 EDITION</span>
          </div>
        </div>

        <div className="library-grid">
          <a className="featured-assessment" href="/slow-close-calculator">
            <div className="card-top">
              <span>FEATURED</span>
              <b>01 / 03</b>
            </div>
            <div className="featured-copy">
              <h2>Slow Close Calculator</h2>
              <p>
                Map the month-end close against target dates and surface the exact steps
                keeping you behind schedule.
              </p>
            </div>
            <div className="card-meta">
              <span>~12 min</span>
              <span>3 modules</span>
              <span>Close ops</span>
            </div>
            <span className="open-button">
              Open assessment <b>→</b>
            </span>
          </a>

          <div className="secondary-assessments">
            <article>
              <div className="card-top">
                <span>02 / 03</span>
                <b>Revenue</b>
              </div>
              <h3>Revenue Leakage Assessment</h3>
              <p>
                Trace margin loss across billing, dunning, and discounting to find what’s
                quietly slipping away.
              </p>
              <div className="secondary-meta">
                <span>~15 min · 4 modules</span>
                <a href="/">Open →</a>
              </div>
            </article>

            <article>
              <div className="card-top">
                <span>03 / 03</span>
                <b>Planning</b>
              </div>
              <h3>Forecast Confidence Check</h3>
              <p>
                Score the inputs behind your projections and see where assumptions are
                carrying too much risk.
              </p>
              <div className="secondary-meta">
                <span>~10 min · 3 modules</span>
                <a href="/">Open →</a>
              </div>
            </article>
          </div>
        </div>
      </section>

      <footer>
        <span>© 2026 Amzur Technologies</span>
        <span>Built for better finance decisions.</span>
      </footer>
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
          <img src="/amzur-logo.png" alt="Amzur" />
        </a>
        <span className="tool-label">CFO DECISION TOOL</span>
      </header>

      <div className="reference-body">
        <aside className="reference-rail">
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
        </aside>

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
  return (
    <div className="reference-results">
      <p className="reference-eyebrow">YOUR CLOSE CAPACITY REPORT</p>
      <h2>
        The cost is visible.<br />
        Now make it smaller.
      </h2>
      <p>
        Based on your answers, excess close work is absorbing capacity that could be
        redirected to better decisions.
      </p>

      <div className="reference-result-card">
        <span>Estimated annual capacity tied to excess close</span>
        <strong>{formatMoney(report.yearlyLoss, values.currency)}</strong>
        <small>Illustrative estimate based on your inputs</small>

        <div className="result-metrics">
          <span>
            Current close <b>{values.currentDays} days</b>
          </span>
          <span>
            Target close <b>{values.targetDays} days</b>
          </span>
          <span>
            Manual effort <b>{values.manualPercent}%</b>
          </span>
        </div>

        <b>Focus areas</b>
        <p>{values.selectedBottlenecks.join(' · ') || 'No bottlenecks selected yet.'}</p>
      </div>

      <button type="button" className="reference-next" onClick={onRestart}>
        Run assessment again <b>↗</b>
      </button>
    </div>
  )
}

export default App
