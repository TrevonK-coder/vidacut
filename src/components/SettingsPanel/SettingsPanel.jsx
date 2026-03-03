import React from 'react';
import { X, Zap, Sparkles } from 'lucide-react';
import { usePlan } from '../../context/PlanContext';
import './SettingsPanel.css';

export default function SettingsPanel({ onClose }) {
    const { plan, setPlan } = usePlan();

    return (
        <div className="settings-overlay" onClick={onClose}>
            <div className="settings-panel glass-panel" onClick={(e) => e.stopPropagation()}>
                <div className="settings-header">
                    <h3>Settings</h3>
                    <button className="settings-close" onClick={onClose}><X size={18} /></button>
                </div>

                <div className="settings-section">
                    <label className="settings-label">Your Plan</label>
                    <div className="plan-selector">
                        <button
                            className={`plan-btn ${plan === 'free' ? 'active' : ''}`}
                            onClick={() => setPlan('free')}
                        >
                            <Zap size={15} /> Free
                        </button>
                        <button
                            className={`plan-btn pro ${plan === 'pro' ? 'active' : ''}`}
                            onClick={() => setPlan('pro')}
                        >
                            <Sparkles size={15} /> Pro ✨
                        </button>
                    </div>

                    {plan === 'free' && (
                        <div className="plan-info">
                            <p className="settings-hint">Free plan includes all planning templates and guiding questions to help you get started quickly.</p>
                            <p className="settings-hint" style={{ marginTop: '0.4rem' }}>
                                <strong>Upgrade to Pro</strong> to unlock AI-powered idea refinement, AI storyboard frame generation, and AI checklist suggestions — all <strong>completely free</strong>, no API key needed.
                            </p>
                        </div>
                    )}

                    {plan === 'pro' && (
                        <div className="plan-info">
                            <p className="settings-hint success">
                                ✅ <strong>Pro active</strong> — AI refinement is enabled across all pre-production tools, powered by Pollinations AI (free, no key required).
                            </p>
                        </div>
                    )}
                </div>

                <div className="settings-footer">
                    <button className="btn-primary" onClick={onClose} style={{ flex: 'unset', padding: '0.6rem 2rem' }}>
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
}
