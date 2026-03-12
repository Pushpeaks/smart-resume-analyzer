import { useState, useEffect } from 'react'
import axios from 'axios'
import Navbar from './components/Navbar'
import JobForm from './components/JobForm'
import Dashboard from './components/Dashboard'

const API_BASE = '/api'

export default function App() {
    const [theme, setTheme] = useState('dark')
    const [loading, setLoading] = useState(false)
    const [results, setResults] = useState(null)
    const [jobMeta, setJobMeta] = useState({ title: '', id: null })
    const [apiError, setApiError] = useState('')

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme)
    }, [theme])

    const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark')

    const handleAnalyze = async ({ jobTitle, jobDescription, files }) => {
        setLoading(true)
        setApiError('')
        setResults(null)

        const formData = new FormData()
        formData.append('job_title', jobTitle)
        formData.append('job_description', jobDescription)
        files.forEach(f => formData.append('resumes', f))

        try {
            const response = await axios.post(`${API_BASE}/analyze/`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                timeout: 60000,
            })
            setResults(response.data.results)
            setJobMeta({ title: response.data.job_title, id: response.data.job_id })
            setTimeout(() => {
                document.getElementById('results-dashboard')?.scrollIntoView({ behavior: 'smooth' })
            }, 200)
        } catch (err) {
            const msg = err.response?.data?.error || err.message || 'Something went wrong. Make sure the Django server is running.'
            setApiError(msg)
        } finally {
            setLoading(false)
        }
    }

    const handleReset = () => {
        setResults(null)
        setApiError('')
        setJobMeta({ title: '', id: null })
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    return (
        <>
            <Navbar theme={theme} onToggleTheme={toggleTheme} />

            <main className="app-container">
                <section className="hero animate-in">
                    <div className="hero-eyebrow">
                        For Recruiters &amp; Hiring Teams
                    </div>
                    <h1>
                        Find the right candidate,<br />
                        <span className="highlight">without the guesswork</span>
                    </h1>
                    <p className="hero-sub">
                        Drop in a job description, upload some resumes, and we'll tell you who actually fits the role — with a clear breakdown of why.
                    </p>
                </section>

                {!results && (
                    <>
                        <JobForm onAnalyze={handleAnalyze} loading={loading} />
                        {apiError && (
                            <div className="error-banner animate-in" style={{ marginTop: '1rem' }} role="alert">
                                {apiError}
                            </div>
                        )}
                    </>
                )}

                {results && (
                    <Dashboard
                        results={results}
                        jobTitle={jobMeta.title}
                        jobId={jobMeta.id}
                        onReset={handleReset}
                    />
                )}
            </main>

            <footer className="footer">
                <div>A product by <span>P.E.A.K.S Industries</span></div>
                <div style={{ marginTop: '0.35rem', fontSize: '0.75rem' }}>
                    Built with Django &amp; React &nbsp;&middot;&nbsp; Resume Analyzer &copy; 2026
                </div>
            </footer>
        </>
    )
}
