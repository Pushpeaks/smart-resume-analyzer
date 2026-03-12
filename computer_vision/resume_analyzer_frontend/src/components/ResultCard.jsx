function getScoreClass(score) {
    if (score >= 70) return 'high'
    if (score >= 45) return 'mid'
    if (score >= 25) return 'low'
    return 'poor'
}

function SeniorityBadge({ level }) {
    const colors = {
        'Lead / Executive': { bg: 'rgba(255,200,69,0.12)', color: '#ffc845', border: 'rgba(255,200,69,0.3)' },
        'Senior': { bg: 'rgba(0,229,160,0.10)', color: '#00e5a0', border: 'rgba(0,229,160,0.3)' },
        'Mid-Level': { bg: 'rgba(0,212,232,0.10)', color: '#00d4e8', border: 'rgba(0,212,232,0.3)' },
        'Junior': { bg: 'rgba(160,160,200,0.10)', color: '#aab0cc', border: 'rgba(160,160,200,0.3)' },
    }
    const style = colors[level] || colors['Junior']
    return (
        <span style={{
            fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px',
            borderRadius: '99px', border: `1px solid ${style.border}`,
            background: style.bg, color: style.color, letterSpacing: '0.04em',
        }}>
            {level}
        </span>
    )
}

function QuantBar({ score }) {
    const color = score >= 60 ? '#00e5a0' : score >= 30 ? '#ffc845' : '#ff5f7a'
    const label = score >= 60 ? 'Data-driven' : score >= 30 ? 'Partially quantified' : 'Needs numbers'
    return (
        <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)' }}>
                    Achievement Proof Score
                </span>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color }}>
                    {score.toFixed(0)}% <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: '0.72rem' }}>— {label}</span>
                </span>
            </div>
            <div style={{ height: '5px', background: 'var(--bg-input)', borderRadius: '99px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${score}%`, background: color, borderRadius: '99px', transition: 'width 0.8s ease' }} />
            </div>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                Measures how many bullet points include numbers, percentages, or measurable results.
            </p>
        </div>
    )
}

function Accordion({ title, count, color, children }) {
    const [open, setOpen] = useState(false)
    return (
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.85rem', marginTop: '0.85rem' }}>
            <button
                onClick={() => setOpen(o => !o)}
                style={{
                    background: 'none', border: 'none', cursor: 'pointer', width: '100%',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    color: 'var(--text-primary)', padding: 0,
                }}
            >
                <span style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color }}>
                    {title}
                    {count > 0 && (
                        <span style={{
                            marginLeft: '0.5rem', fontSize: '0.68rem', padding: '1px 7px',
                            borderRadius: '99px', background: color === '#ff5f7a' ? 'rgba(255,95,122,0.12)' : 'rgba(0,212,232,0.10)',
                            color, border: `1px solid ${color}33`,
                        }}>{count}</span>
                    )}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{open ? 'hide' : 'show'}</span>
            </button>
            {open && <div style={{ marginTop: '0.75rem' }}>{children}</div>}
        </div>
    )
}

import { useState } from 'react'

export default function ResultCard({ result, index, total }) {
    const cls = getScoreClass(result.score)
    const delayClass = index < 4 ? `delay-${index + 1}` : ''

    return (
        <div
            id={`result-card-${result.rank}`}
            className={`result-card rank-${result.rank} animate-in ${delayClass}`}
        >
            {/* Header */}
            <div className="result-card-header">
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
                    <div className="result-rank-badge">#{result.rank}</div>
                    <div>
                        <div className="result-filename">{result.resume_filename}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '4px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Rank {result.rank} of {total}</span>
                            <SeniorityBadge level={result.seniority_level} />
                        </div>
                    </div>
                </div>
                <div className="score-display">
                    <div className={`score-value score-${cls}`}>
                        {result.score.toFixed(1)}<span style={{ fontSize: '1rem', fontWeight: 500 }}>%</span>
                    </div>
                    <div className="score-label">Match</div>
                </div>
            </div>

            {/* Score Bar */}
            <div className="progress-bar-wrap">
                <div className={`progress-bar-fill fill-${cls}`} style={{ width: `${result.score}%` }} />
            </div>

            {/* Achievement Proof Score */}
            <QuantBar score={result.quantification_score || 0} />

            {/* Skills */}
            <div className="skills-section">
                <div className="skills-row">
                    <span className="skills-label matched">Skills found</span>
                    <div className="skill-tags">
                        {result.matched_skills.length > 0
                            ? result.matched_skills.map(s => <span key={s} className="skill-tag matched">{s}</span>)
                            : <span className="skill-tag none">None detected</span>
                        }
                    </div>
                </div>
                {result.missing_skills.length > 0 && (
                    <div className="skills-row">
                        <span className="skills-label missing">Skills missing</span>
                        <div className="skill-tags">
                            {result.missing_skills.map(s => <span key={s} className="skill-tag missing">{s}</span>)}
                        </div>
                    </div>
                )}
            </div>

            {/* Red Flags — collapsible */}
            {result.red_flags && result.red_flags.length > 0 && (
                <Accordion title="Red flags" count={result.red_flags.length} color="#ff5f7a">
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {result.red_flags.map((flag, i) => (
                            <li key={i} style={{
                                fontSize: '0.83rem', color: 'var(--text-secondary)',
                                padding: '0.5rem 0.75rem', background: 'var(--danger-bg)',
                                borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--danger)',
                            }}>
                                {flag}
                            </li>
                        ))}
                    </ul>
                </Accordion>
            )}

            {/* Interview Questions — collapsible */}
            {result.interview_questions && result.interview_questions.length > 0 && (
                <Accordion title="Suggested interview questions" count={result.interview_questions.length} color="var(--aqua-primary)">
                    <ol style={{ paddingLeft: '1.2rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        {result.interview_questions.map((q, i) => (
                            <li key={i} style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: '1.55' }}>
                                {q}
                            </li>
                        ))}
                    </ol>
                </Accordion>
            )}
        </div>
    )
}
