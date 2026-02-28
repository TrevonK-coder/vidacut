import React from 'react';
import { Clapperboard, Sparkles } from 'lucide-react';
import './AILoading.css';

export default function AILoading({ renderProgress, statusText }) {
    return (
        <div className="ai-loading-container">
            <div className="pulse-ring-outer">
                <div className="pulse-ring-inner">
                    <div className="ai-core glass-panel">
                        <Sparkles className="icon-gradient spin-slow" size={40} />
                    </div>
                </div>
            </div>

            <h3 className="gradient-text status-text">
                {statusText || 'Initializing FFmpeg…'}
            </h3>

            {renderProgress > 0 && (
                <div className="progress-container">
                    <div className="progress-header">
                        <span className="text-sm text-muted">
                            <Clapperboard size={14} style={{ display: 'inline', marginRight: 4 }} />
                            FFmpeg WebAssembly
                        </span>
                        <span className="text-sm font-bold">{Math.round(renderProgress)}%</span>
                    </div>
                    <div className="progress-bar-bg">
                        <div
                            className="progress-bar-fill"
                            style={{ width: `${renderProgress}%` }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
