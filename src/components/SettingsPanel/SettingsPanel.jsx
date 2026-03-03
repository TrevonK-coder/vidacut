import React, { useState } from 'react';
import { X, Key, Zap, Sparkles } from 'lucide-react';
import { usePlan } from '../../context/PlanContext';
import './SettingsPanel.css';

export default function SettingsPanel({ onClose }) {
    const { plan, setPlan, apiKey, setApiKey } = usePlan();
    const [keyInput, setKeyInput] = useState(apiKey);
    const [showKey, setShowKey] = useState(false);

    const handleSave = () => {
        setApiKey(keyInput.trim());
        onClose();
    };

    return (
        <div className="settings-overlay" onClick={onClose}>
            <div className="settings-panel glass-panel" onClick={(e) => e.stopPropagation()}>
                <div className="settings-header">
                    <h3>Settings</h3>
                    <button className="settings-close" onClick={onClose}><X size={18} /></button>
                </div>

                {/* Plan Toggle */}
                <div className="settings-section">
                    <label className="settings-label">Your Plan</label>
                    <div className="plan-selector">
                        <button
                            className={`plan-btn ${plan === 'free' ? 'active' : ''}`}
                            onClick={() => setPlan('free')}
                        >
                            <Zap size={15} />
                            Free
                        </button>
                        <button
                            className={`plan-btn pro ${plan === 'pro' ? 'active' : ''}`}
                            onClick={() => setPlan('pro')}
                        >
                            <Sparkles size={15} />
                            Pro ✨
                        </button>
                    </div>
                    {plan === 'free' && (
                        <p className="settings-hint">
                            Upgrade to Pro to unlock AI idea refinement, editable AI output, and AI storyboard image generation.
                        </p>
                    )}
                    {plan === 'pro' && (
                        <p className="settings-hint success">
                            Pro active — AI refinement is enabled across all pre-production tools.
                        </p>
                    )}
                </div>

                {/* API Key — only shown in pro mode */}
                {plan === 'pro' && (
                    <div className="settings-section">
                        <label className="settings-label">
                            <Key size={13} /> Gemini API Key
                        </label>
                        <p className="settings-hint" style={{ marginBottom: '0.6rem' }}>
                            Required for AI refinement. Get your free key at{' '}
                            <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" className="settings-link">
                                aistudio.google.com
                            </a>
                        </p>
                        <div className="key-input-wrap">
                            <input
                                className="key-input"
                                type={showKey ? 'text' : 'password'}
                                placeholder="AIza…"
                                value={keyInput}
                                onChange={(e) => setKeyInput(e.target.value)}
                            />
                            <button className="key-toggle" onClick={() => setShowKey((v) => !v)}>
                                {showKey ? 'Hide' : 'Show'}
                            </button>
                        </div>
                        <p className="settings-hint" style={{ marginTop: '0.4rem' }}>
                            Your key is stored locally in your browser — never sent to any server other than Google.
                        </p>
                    </div>
                )}

                <div className="settings-footer">
                    <button className="btn-secondary" onClick={onClose}>Cancel</button>
                    <button className="btn-primary" onClick={handleSave} style={{ flex: 'unset', padding: '0.6rem 1.5rem' }}>
                        Save Settings
                    </button>
                </div>
            </div>
        </div>
    );
}
