import React from 'react';
import { Sparkles, Type } from 'lucide-react';
import './PromptBox.css';

export default function PromptBox({ prompt, setPrompt }) {
    return (
        <div className="prompt-container glass-panel">
            <div className="prompt-header">
                <Sparkles className="icon-gradient" size={20} />
                <h3>Creative Direction</h3>
            </div>

            <p className="text-muted text-sm mb-md">
                Describe the pacing, mood, and style. The AI will analyze this to determine where to cut the video perfectly to your audio track.
            </p>

            <div className="prompt-input-wrapper">
                <Type className="input-icon" size={18} color="var(--text-muted)" />
                <textarea
                    className="prompt-textarea"
                    placeholder="e.g. Create a fast-paced, energetic hype montage. Cut on the downbeats of the track. Prioritize clips with lots of movement."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={5}
                />

                {/* Decorative corner accents */}
                <div className="corner corner-tl"></div>
                <div className="corner corner-tr"></div>
                <div className="corner corner-bl"></div>
                <div className="corner corner-br"></div>
            </div>
        </div>
    );
}
