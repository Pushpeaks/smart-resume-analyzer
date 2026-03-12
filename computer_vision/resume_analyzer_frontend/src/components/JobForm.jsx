import { useState } from 'react'

function formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function JobForm({ onAnalyze, loading }) {
    const [jobTitle, setJobTitle] = useState('')
    const [jobDescription, setJobDescription] = useState('')
    const [files, setFiles] = useState([])
    const [dragOver, setDragOver] = useState(false)
    const [error, setError] = useState('')

    const addFiles = (incoming) => {
        const allowed = Array.from(incoming).filter(
            f => f.name.endsWith('.pdf') || f.name.endsWith('.docx') || f.name.endsWith('.txt')
        )
        setFiles(prev => {
            const existing = new Set(prev.map(f => f.name))
            return [...prev, ...allowed.filter(f => !existing.has(f.name))]
        })
    }

    const removeFile = (name) => setFiles(prev => prev.filter(f => f.name !== name))

    const handleDrop = (e) => {
        e.preventDefault()
        setDragOver(false)
        addFiles(e.dataTransfer.files)
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        setError('')
        if (!jobDescription.trim()) { setError('Please paste the job description first.'); return }
        if (files.length === 0) { setError('You need to upload at least one resume.'); return }
        onAnalyze({ jobTitle, jobDescription, files })
    }

    return (
        <form id="analyze-form" onSubmit={handleSubmit}>
            <div className="card animate-in">

                {/* Job Title */}
                <div className="form-section">
                    <label className="form-label" htmlFor="job-title-input">
                        Role you're hiring for
                    </label>
                    <input
                        id="job-title-input"
                        className="form-input"
                        type="text"
                        placeholder="e.g. Backend Developer, Data Analyst, Product Manager..."
                        value={jobTitle}
                        onChange={e => setJobTitle(e.target.value)}
                    />
                </div>

                {/* Job Description */}
                <div className="form-section">
                    <label className="form-label" htmlFor="job-desc-textarea">
                        Job description
                        <span style={{ color: 'var(--danger)', fontWeight: 400 }}> *</span>
                        <span style={{ color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none', letterSpacing: 0, fontSize: '0.8rem', marginLeft: '0.5rem' }}>paste it straight from your job post</span>
                    </label>
                    <textarea
                        id="job-desc-textarea"
                        className="form-textarea"
                        placeholder="Paste the full job post here — requirements, responsibilities, skills needed, any of it works..."
                        value={jobDescription}
                        onChange={e => setJobDescription(e.target.value)}
                    />
                </div>

                {/* File Upload */}
                <div className="form-section">
                    <label className="form-label">
                        Resumes to compare
                        <span style={{ color: 'var(--danger)', fontWeight: 400 }}> *</span>
                        <span style={{ color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none', letterSpacing: 0, fontSize: '0.8rem', marginLeft: '0.5rem' }}>you can upload as many as you like</span>
                    </label>
                    <div
                        className={`drop-zone${dragOver ? ' drag-over' : ''}`}
                        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleDrop}
                    >
                        <input
                            id="resume-upload-input"
                            type="file"
                            multiple
                            accept=".pdf,.docx,.txt"
                            onChange={e => addFiles(e.target.files)}
                        />
                        <span className="drop-icon" style={{ fontFamily: 'monospace', fontWeight: 700 }}>+</span>
                        <p className="drop-primary">Drop resumes here, or click to pick files</p>
                        <p className="drop-secondary">Works with PDF, Word docs, and plain text files</p>
                        <div className="drop-formats">
                            <span className="format-tag">PDF</span>
                            <span className="format-tag">DOCX</span>
                            <span className="format-tag">TXT</span>
                        </div>
                    </div>

                    {files.length > 0 && (
                        <div className="file-list">
                            {files.map(f => (
                                <div className="file-pill" key={f.name}>
                                    <span className="file-pill-name">{f.name}</span>
                                    <span className="file-pill-size">{formatBytes(f.size)}</span>
                                    <button
                                        type="button"
                                        className="file-pill-remove"
                                        onClick={() => removeFile(f.name)}
                                        aria-label={`Remove ${f.name}`}
                                    >x</button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {error && (
                    <div className="error-banner" role="alert">
                        {error}
                    </div>
                )}

                <button
                    id="analyze-submit-btn"
                    type="submit"
                    className="btn-analyze"
                    disabled={loading}
                >
                    {loading
                        ? <><div className="spinner" /> Reading through the resumes...</>
                        : <>Compare {files.length > 0 ? files.length : ''} resume{files.length !== 1 ? 's' : ''} against this role</>
                    }
                </button>
            </div>
        </form>
    )
}
