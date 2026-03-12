export default function Navbar({ theme, onToggleTheme }) {
    const isDark = theme === 'dark'

    return (
        <nav className="navbar">
            <a className="navbar-brand" href="/">
                <div className="navbar-logo">R</div>
                <span className="navbar-title">
                    Resume<span>Rank</span>
                </span>
            </a>
            <div className="navbar-right">
                <span className="badge-pro">Free to use</span>

                {/* Sliding pill theme toggle */}
                <button
                    id="theme-toggle-btn"
                    className="theme-pill"
                    onClick={onToggleTheme}
                    aria-label="Toggle theme"
                    title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                >
                    <span className={`pill-option${isDark ? ' pill-active' : ''}`}>Dark</span>
                    <span className={`pill-option${!isDark ? ' pill-active' : ''}`}>Light</span>
                    <span className={`pill-thumb${isDark ? '' : ' pill-thumb-right'}`} />
                </button>
            </div>
        </nav>
    )
}
