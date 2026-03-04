import React from 'react';
import './GTBHub.css';

const members = [
    { num: '01', role: 'The Polymath', tags: 'Artist · Journalist · Producer', emoji: '🎙️' },
    { num: '02', role: 'The Performer', tags: 'Actor · Front-End Developer', emoji: '🎭' },
    { num: '03', role: 'The Visionary', tags: 'Videographer · Visual Tech Dev', emoji: '🎬' },
    { num: '04', role: 'The Specialist', tags: 'Doctor · Gym Enthusiast', emoji: '💊' },
    { num: '05', role: 'The Gastronomist', tags: 'Chef · Performance Nutrition', emoji: '🍽️' },
    { num: '06', role: 'The Architect', tags: 'Lead Dev · Backend · APIs · Security', emoji: '🏗️' },
    { num: '07', role: 'The Artist', tags: 'Music & Creative Direction', emoji: '🎵' },
    { num: '08', role: 'The Engineer', tags: 'Full-Stack · Deployment · Scaling', emoji: '⚙️' },
];

export default function GTBHub({ open, onClose }) {
    if (!open) return null;

    return (
        <div className="gtb-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="gtb-panel glass-panel">

                {/* ── Top Bar ── */}
                <div className="gtb-topbar">
                    <div className="gtb-brand">
                        <img
                            src="/vidacut/partner-logo.png"
                            alt="GTB Logo"
                            className="gtb-brand-logo"
                            onError={e => { e.currentTarget.style.display = 'none'; }}
                        />
                        <div>
                            <div className="gtb-brand-name gradient-text">Glad To Be</div>
                            <div className="gtb-brand-sub">The Creative Collective · 8 Dimensions</div>
                        </div>
                    </div>
                    <button className="gtb-close" onClick={onClose} aria-label="Close GTB Hub">✕</button>
                </div>

                {/* ── Tagline ── */}
                <p className="gtb-tagline">
                    Eight elite multi-hyphenates. One unified field. No gravity, no limits.
                </p>

                {/* ── Member Grid ── */}
                <div className="gtb-section-label">// 8 Dimensions</div>
                <div className="gtb-grid">
                    {members.map(m => (
                        <div className="gtb-member-card" key={m.num}>
                            <span className="gtb-member-emoji">{m.emoji}</span>
                            <div className="gtb-member-num">{m.num}</div>
                            <div className="gtb-member-role">{m.role}</div>
                            <div className="gtb-member-tags">{m.tags}</div>
                        </div>
                    ))}
                </div>

                {/* ── Developer Section ── */}
                <div className="gtb-section-label">// Meet the Developer</div>
                <div className="gtb-dev-card">
                    <div className="gtb-dev-info">
                        <div className="gtb-dev-name">Trevon Kiprop Korir</div>
                        <div className="gtb-dev-title">The Architect · Full-Stack Developer · Toronto, ON</div>
                        <p className="gtb-dev-desc">
                            Building the GTB digital infrastructure — from AI video tools and cinematic editors
                            to full-stack web platforms. Graduating 2026.
                        </p>
                    </div>
                    <div className="gtb-dev-links">
                        <a
                            href="https://trevonk-coder.github.io/myCV/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="gtb-link-btn gtb-link-cv"
                        >
                            <svg viewBox="0 0 24 24" className="gtb-link-icon" fill="currentColor">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM6 20V4h5v7h7v9H6z" />
                            </svg>
                            View CV Site
                        </a>
                        <a
                            href="https://github.com/TrevonK-coder"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="gtb-link-btn gtb-link-gh"
                        >
                            <svg viewBox="0 0 24 24" className="gtb-link-icon" fill="currentColor">
                                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                            </svg>
                            GitHub
                        </a>
                    </div>
                </div>

                {/* ── Footer ── */}
                <div className="gtb-footer-note">
                    <a href="https://trevonk-coder.github.io/GTB/" target="_blank" rel="noopener noreferrer" className="gtb-site-link">🌐 GTB Collective Site ↗</a>
                    <span style={{ margin: '0 6px', opacity: 0.3 }}>·</span>
                    <span className="gradient-text">Glad To Be</span> · Powered by VidaCut AI · © 2026
                </div>

            </div>
        </div>
    );
}
