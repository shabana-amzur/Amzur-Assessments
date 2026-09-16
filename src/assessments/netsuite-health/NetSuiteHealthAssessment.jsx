import { useEffect, useMemo, useState } from 'react'
import './NetSuiteHealthAssessment.css'

const sections = [
  {
    key: 'performance',
    title: 'Performance & Customization Health',
    summary: 'NetSuite performance, change velocity, and customization risk.',
    prompts: [
      {
        question: 'Has NetSuite become noticeably slower after adding new workflows, automations, or customizations?',
        options: [
          'No, performance has remained consistent',
          'Slightly slower, but manageable',
          'Yes, we’ve noticed a clear decline',
          'Performance has become a regular business concern',
        ],
      },
      {
        question: 'How easy is it to introduce new NetSuite automations or business workflows without affecting existing processes?',
        options: [
          'Very easy',
          'Somewhat manageable',
          'Difficult and requires extensive testing',
          'We avoid making changes because something usually breaks',
        ],
      },
      {
        question: 'Have NetSuite customizations or scripts ever delayed a system upgrade or release?',
        options: [
          'Never',
          'Once',
          'Multiple times',
          'Almost every release requires significant effort',
        ],
      },
      {
        question: 'How often do NetSuite changes require support from a consultant due to the complexity of your current customizations?',
        options: [
          'Rarely',
          'Sometimes',
          'Often',
          'Nearly every change',
        ],
      },
    ],
  },
  {
    key: 'integrations',
    title: 'Broken Integrations',
    summary: 'Data movement and system-to-system reliability.',
    prompts: [
      {
        question: 'How often do integrations between NetSuite and external systems such as Salesforce, Shopify, EDI platforms, or payroll software experience data transfer errors or synchronization issues?',
        options: [
          'Never',
          'Occasionally',
          'Frequently',
          'Regularly',
        ],
      },
      {
        question: 'How often do employees need to export, re-enter, or manually transfer data because NetSuite and other systems are not fully integrated?',
        options: [
          'Data transfers are fully automated',
          'Only for exceptions',
          'For several processes',
          'Manual transfer is a standard process',
        ],
      },
      {
        question: 'Have integration issues caused delays in order processing, invoicing, fulfillment, or the financial close process?',
        options: [
          'Never',
          'Once or twice',
          'Several times',
          'Frequently',
        ],
      },
      {
        question: 'How confident are you that the data flowing into NetSuite is complete, accurate, and reliable each day?',
        options: [
          'Very confident',
          'Mostly confident',
          'Somewhat confident',
          'Not confident',
        ],
      },
    ],
  },
  {
    key: 'customizations',
    title: 'Outdated Customizations',
    summary: 'Dependency, workarounds, and change readiness.',
    prompts: [
      {
        question: 'To what extent does your organization rely on one or two key individuals to understand and manage your NetSuite customizations?',
        options: [
          'Not dependent',
          'Light dependency',
          'Moderate dependency',
          'Heavy dependency',
        ],
      },
      {
        question: 'To what extent are employees relying on workarounds because NetSuite workflows no longer align with your current business processes?',
        options: [
          'Very little',
          'Occasionally',
          'Regularly',
          'This is the norm',
        ],
      },
      {
        question: 'How often are requested NetSuite enhancements delayed due to the complexity of existing customizations?',
        options: [
          'Rarely',
          'Sometimes',
          'Often',
          'Almost always',
        ],
      },
      {
        question: 'How prepared is your NetSuite environment to support the launch of a new product line, subsidiary, or business?',
        options: [
          'Very prepared',
          'Somewhat prepared',
          'Not well prepared',
          'Not prepared at all',
        ],
      },
    ],
  },
  {
    key: 'reporting',
    title: 'Inaccurate Reporting',
    summary: 'Trust in finance data and reporting reliability.',
    prompts: [
      {
        question: 'How often do executives question the accuracy or reliability of NetSuite reports before making business decisions?',
        options: [
          'Rarely',
          'Sometimes',
          'Frequently',
          'Almost every decision',
        ],
      },
      {
        question: 'Does your finance team still use Excel to validate or reconcile NetSuite reports?',
        options: [
          'No',
          'Sometimes',
          'Often',
          'Yes, routinely',
        ],
      },
      {
        question: 'How much time is added to the month-end reporting process due to manual data validation and corrections?',
        options: [
          'Very little',
          'A moderate amount',
          'A significant amount',
          'A major burden',
        ],
      },
      {
        question: 'How confident are you that leadership relies on a consistent and trusted source of data for decision-making?',
        options: [
          'Very confident',
          'Mostly confident',
          'Not fully confident',
          'Leadership does not trust the data',
        ],
      },
    ],
  },
  {
    key: 'support',
    title: 'Increasing Support Tickets',
    summary: 'Issue volume, response speed, and support continuity.',
    prompts: [
      {
        question: 'How frequently do NetSuite issues disrupt day-to-day finance or operational activities?',
        options: [
          'Rarely',
          'Occasionally',
          'Frequently',
          'Almost daily',
        ],
      },
      {
        question: 'How often are the same NetSuite issues reported across multiple users or departments?',
        options: [
          'Rarely',
          'Sometimes',
          'Often',
          'Very often',
        ],
      },
      {
        question: 'How quickly are NetSuite issues investigated and resolved?',
        options: [
          'Within a day',
          'Within a few days',
          'Within a week',
          'Longer than a week',
        ],
      },
      {
        question: 'How confident are you that business operations would continue smoothly if your NetSuite administrator or primary support resource became unavailable?',
        options: [
          'Very confident',
          'Somewhat confident',
          'Not very confident',
          'Not confident at all',
        ],
      },
    ],
  },
]

const buildQuestions = () => sections.flatMap((section) =>
  section.prompts.map((promptItem, promptIndex) => ({
    id: `${section.key}-${promptIndex}`,
    sectionKey: section.key,
    sectionTitle: section.title,
    prompt: promptItem.question,
    options: promptItem.options,
  })),
)

function scoreTier(score) {
  if (score >= 46) return ['Good health', 'Your NetSuite environment is generally healthy and aligned with your operating needs.']
  if (score >= 31) return ['Early performance gaps', 'Small but noticeable gaps are beginning to affect performance, visibility, or change readiness.']
  if (score >= 16) return ['Business value at risk', 'Operational friction is creating meaningful business risk and reducing the value of the platform.']
  return ['Critical stage', 'The environment is showing material health issues that require immediate attention.']
}

function calculateAssessment(questions, answers) {
  const scores = {}
  let total = 0

  for (const section of sections) {
    const sectionQuestions = questions.filter((question) => question.sectionKey === section.key)
    const values = sectionQuestions.map((question) => {
      const answerValue = answers[question.id]
      return answerValue === undefined ? 0 : answerValue + 1
    })

    const sectionScore = values.length
      ? values.reduce((sum, value) => sum + value, 0)
      : 0

    scores[section.key] = Math.round((sectionScore / (values.length * 3)) * 100)
    total += sectionScore
  }

  const overall = Math.round((total / 60) * 100)

  return {
    scores,
    overall,
    tier: scoreTier(Math.round((total / 60) * 100)),
    ranked: [...sections.map((section) => section.key)].sort((a, b) => scores[a] - scores[b]),
  }
}

function NetSuiteHealthAssessment() {
  const questions = useMemo(() => buildQuestions(), [])
  const [phase, setPhase] = useState('intro')
  const [questionIndex, setQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  const currentQuestion = questions[questionIndex]
  const answeredCount = Object.keys(answers).length
  const progress = Math.round((answeredCount / questions.length) * 100)
  const result = useMemo(() => calculateAssessment(questions, answers), [questions, answers])
  const currentSectionIndex = currentQuestion ? sections.findIndex((section) => section.key === currentQuestion.sectionKey) : 0
  const currentSectionQuestions = currentQuestion ? questions.filter((question) => question.sectionKey === currentQuestion.sectionKey) : []
  const currentQuestionPosition = currentQuestion ? currentSectionQuestions.findIndex((question) => question.id === currentQuestion.id) + 1 : 0

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [phase, questionIndex])

  const chooseAnswer = (value) => {
    if (!currentQuestion) return
    setAnswers((current) => ({ ...current, [currentQuestion.id]: value }))
  }

  const advanceQuestion = () => {
    if (answers[currentQuestion.id] === undefined) return
    if (questionIndex === questions.length - 1) {
      setPhase('results')
      return
    }
    setQuestionIndex((current) => current + 1)
  }

  const goBack = () => {
    if (phase === 'results') {
      setPhase('quiz')
      setQuestionIndex(questions.length - 1)
      return
    }

    if (questionIndex === 0) {
      setPhase('intro')
      return
    }

    setQuestionIndex((current) => current - 1)
  }

  const reset = () => {
    setPhase('intro')
    setQuestionIndex(0)
    setAnswers({})
    setEmail('')
    setSent(false)
  }

  const submitAssessment = () => {
    if (!email.trim()) return
    setSent(true)
  }

  return (
    <main className="net-health-assessment">
      <div className="net-health-shell">
        <header className="net-health-header">
          <a className="net-health-brand" href="/" aria-label="Amzur assessment library">
            <img src="https://amzur.com/wp-content/uploads/2022/07/Amzur-logo-2022.png" alt="Amzur" />
          </a>
          <span>NetSuite Health Assessment</span>
        </header>

        {phase === 'intro' && (
          <section className="net-health-intro">
            <p className="net-health-kicker">Health Check</p>
            <h1>
              Your NetSuite <strong>diagnostic</strong>
            </h1>
            <p>
              Questions are used to generate your diagnostic snapshot and highlight which parts of your NetSuite environment need attention first.
            </p>

            <div className="net-health-progress">
              <strong>0 of {questions.length} answered</strong>
              <span>0%</span>
            </div>
            <div className="net-health-progress-bar"><span style={{ width: '0%' }} /></div>

            <div className="net-health-roadmap">
              {sections.map((section, index) => (
                <div key={section.key} className="net-health-roadmap-item">
                  <strong>{String(index + 1).padStart(2, '0')}</strong>
                  <b>{section.title}</b>
                  <span>{section.summary}</span>
                </div>
              ))}
            </div>

            <button type="button" className="net-health-start" onClick={() => setPhase('quiz')}>
              Start the assessment
            </button>
          </section>
        )}

        {phase === 'quiz' && currentQuestion && (
          <div className="net-health-stage">
            <aside className="net-health-sidebar">
              <p className="net-health-kicker">Health Check</p>
              <h1 className="net-health-sidebar-title">Your NetSuite Diagnostic</h1>

              <div className="net-health-sidebar-progress">
                <span>{answeredCount} of {questions.length} answered</span>
                <strong>{progress}%</strong>
              </div>
              <div className="net-health-progress-bar"><span style={{ width: `${progress}%` }} /></div>

              <div className="net-health-step-list">
                {sections.map((section, index) => {
                  const sectionQuestions = questions.filter((question) => question.sectionKey === section.key)
                  const isCurrent = section.key === currentQuestion.sectionKey
                  const answeredSectionCount = sectionQuestions.filter((question) => answers[question.id] !== undefined).length

                  return (
                    <button
                      key={section.key}
                      type="button"
                      className={isCurrent ? 'net-health-step active' : 'net-health-step'}
                      onClick={() => {
                        if (isCurrent) return
                        const targetIndex = questions.findIndex((question) => question.sectionKey === section.key)
                        if (targetIndex >= 0) setQuestionIndex(targetIndex)
                      }}
                    >
                      <span className="step-count">{index + 1}</span>
                      <span className="step-copy">
                        <b>{section.title}</b>
                        <small>{section.summary}</small>
                      </span>
                    </button>
                  )
                })}
              </div>

              <p className="net-health-callout">Questions are used to generate your diagnostic snapshot.</p>
            </aside>

            <section className="net-health-question-panel">
              <div className="net-health-panel-header">
                <button type="button" className="net-health-back-link" onClick={goBack} disabled={questionIndex === 0}>
                  ← Back
                </button>
                <span>Section {currentSectionIndex + 1} of {sections.length}</span>
              </div>

              <div className="net-health-section-badge">
                <span className="net-health-badge-icon">↗</span>
                <span>{currentQuestion.sectionTitle}</span>
              </div>

              <div className="net-health-question-meta">QUESTION {currentQuestionPosition} OF {currentSectionQuestions.length}</div>
              <h2>{currentQuestion.prompt}</h2>

              <div className="net-health-options" role="radiogroup" aria-label={currentQuestion.sectionTitle}>
                {currentQuestion.options.map((option, optionIndex) => (
                  <button
                    key={option}
                    type="button"
                    className={answers[currentQuestion.id] === optionIndex ? 'net-health-option selected' : 'net-health-option'}
                    role="radio"
                    aria-checked={answers[currentQuestion.id] === optionIndex}
                    onClick={() => chooseAnswer(optionIndex)}
                  >
                    <strong>{String.fromCharCode(65 + optionIndex)}</strong>
                    <span>{option}</span>
                  </button>
                ))}
              </div>

              <div className="net-health-panel-footer">
                <button type="button" className="net-health-button secondary" onClick={goBack} disabled={questionIndex === 0}>
                  Previous
                </button>
                <button type="button" className="net-health-button primary" onClick={advanceQuestion}>
                  Next <span>→</span>
                </button>
              </div>
            </section>
          </div>
        )}

        {phase === 'results' && (
          <section className="net-health-results">
            <div className="net-health-results-header">
              <p className="net-health-kicker">Your NetSuite Diagnostic</p>
              <button type="button" className="net-health-button secondary" onClick={reset}>Reset</button>
            </div>
            <h1>Your next priorities are clear.</h1>

            <div className="net-health-score">
              <div className="net-health-ring" style={{ '--score': `${result.overall * 3.6}deg` }}>
                <strong>{result.overall}</strong>
                <span>/100</span>
              </div>
              <div className="net-health-score-copy">
                <p className="net-health-kicker">Maturity</p>
                <h2>{result.tier[0]}</h2>
                <p>{result.tier[1]}</p>
              </div>
            </div>

            <div className="net-health-dimensions">
              {sections.map((section) => (
                <div key={section.key} className="net-health-dimension">
                  <div className="net-health-dimension-header">
                    <span>{section.title}</span>
                    <strong>{result.scores[section.key]}</strong>
                  </div>
                  <i><em style={{ width: `${result.scores[section.key]}%` }} /></i>
                  <small>{section.summary}</small>
                </div>
              ))}
            </div>

            <div className="net-health-priority">
              <p className="net-health-kicker">Priority Focus</p>
              <h3>What to fix next</h3>
              <ul>
                {result.ranked.slice(0, 3).map((key) => (
                  <li key={key}>{sections.find((section) => section.key === key).title} should be the first place to improve.</li>
                ))}
              </ul>
            </div>

            <div className="net-health-email">
              <label>
                Email address
                <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" />
              </label>
              <button type="button" className="net-health-button primary" onClick={submitAssessment} disabled={!email.trim()}>
                {sent ? 'Report sent' : 'Send my assessment'}
              </button>
              {!sent && <small className="net-health-form-note">Questions are used to generate your diagnostic snapshot.</small>}
              {sent && <small className="net-health-form-note">Your report has been queued for delivery.</small>}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}

export default NetSuiteHealthAssessment
