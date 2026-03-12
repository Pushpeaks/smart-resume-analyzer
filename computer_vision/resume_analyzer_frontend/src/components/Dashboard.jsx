import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import ResultCard from './ResultCard'

function truncateName(name, max = 18) {
    const base = name.replace(/\.(pdf|docx|txt)$/i, '')
    return base.length > max ? base.slice(0, max) + '…' : base
}

function getBarColor(score) {
    if (score >= 70) return '#00e5a0'
    if (score >= 45) return '#00d4e8'
    if (score >= 25) return '#ffc845'
    return '#ff5f7a'
}

const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        const d = payload[0].payload
        return (
            <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-hover)',
                borderRadius: '10px',
                padding: '0.75rem 1rem',
                fontSize: '0.85rem',
                color: 'var(--text-primary)',
                boxShadow: 'var(--shadow-md)',
            }}>
                <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>{d.fullName}</div>
                <div style={{ color: getBarColor(d.score) }}>{d.score.toFixed(1)}% match</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>#{d.rank} overall</div>
            </div>
        )
    }
    return null
}

export default function Dashboard({ results, jobTitle, jobId, onReset }) {
    if (!results || results.length === 0) return null

    const topScore = Math.max(...results.map(r => r.score))
    const avgScore = results.reduce((a, b) => a + b.score, 0) / results.length
    const matched = results.filter(r => r.score >= 50).length

    const chartData = results.map(r => ({
        name: truncateName(r.resume_filename),
        fullName: r.resume_filename,
        score: r.score,
        rank: r.rank,
    }))

    return (
        <div id="results-dashboard" className="animate-in">
            {/* Header */}
            <div className="results-header">
                <div>
                    <h2 className="results-title">
                        Here's how they stack up
                        {jobTitle && <span style={{ color: 'var(--aqua-primary)', marginLeft: '0.5rem', fontSize: '1.1rem' }}>— {jobTitle}</span>}
                    </h2>
                    <p className="results-subtitle">
                        {results.length} resume{results.length !== 1 ? 's' : ''} ranked by fit
                    </p>
                </div>
                <button id="reset-btn" className="btn-reset" onClick={onReset}>
                    ← Start over
                </button>
            </div>

            {/* Stats */}
            <div className="stats-row animate-in delay-1">
                <div className="stat-card">
                    <div className="stat-value">{results.length}</div>
                    <div className="stat-label">Resumes reviewed</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{topScore.toFixed(0)}%</div>
                    <div className="stat-label">Best match</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{avgScore.toFixed(0)}%</div>
                    <div className="stat-label">Average score</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{matched}</div>
                    <div className="stat-label">Strong candidates</div>
                </div>
            </div>

            {/* Bar Chart */}
            <div className="chart-container animate-in delay-2">
                <p className="chart-title">Score comparison</p>
                <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 4 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                        <XAxis
                            dataKey="name"
                            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            domain={[0, 100]}
                            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={v => `${v}%`}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,212,232,0.06)' }} />
                        <Bar dataKey="score" radius={[6, 6, 0, 0]} maxBarSize={56}>
                            {chartData.map((entry, idx) => (
                                <Cell key={idx} fill={getBarColor(entry.score)} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Result Cards */}
            <div className="results-grid">
                {results.map((result, i) => (
                    <ResultCard key={result.id} result={result} index={i} total={results.length} />
                ))}
            </div>
        </div>
    )
}
