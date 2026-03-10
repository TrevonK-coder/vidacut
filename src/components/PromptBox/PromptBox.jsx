import React, { useEffect } from 'react';
import { Sparkles, Type } from 'lucide-react';
import { usePlan } from '../../context/PlanContext';
import './PromptBox.css';

export default function PromptBox({ prompt, setPrompt }) {
    const { projectScript } = usePlan();

    useEffect(() => {
        if (projectScript && !prompt) {
            setPrompt("Generate a video based on this script:\n\n" + projectScript);
        }
    }, [projectScript, setPrompt, prompt]);

    return (
        <div className="prompt-container glass-panel">
            <div className="prompt-header">
                <Sparkles className="icon-gradient" size={20} />
                <h3>Creative Direction</h3>
            </div>

            <p className="text-muted text-sm mb-md">
                Describe the pacing, mood, and style. The AI will analyze this to determine where to cut the video perfectly to your audio track. {projectScript && " (Your generated script has been loaded!)"}
            </p>

            <div className="prompt-templates">
                <span className="template-label">Try a style:</span>
                <button className="template-btn" onClick={() => setPrompt("Create a fast-paced, energetic hype montage. Cut quickly on the downbeats. Use high-contrast color grading with saturated primary colors.")}>🔥 Hype Montage</button>
                <button className="template-btn" onClick={() => setPrompt("Create a slow, cinematic sequence. Emphasize long, sweeping shots and hold on emotional moments. Use a moody, desaturated teal-and-orange color palette.")}>🎬 Cinematic & Moody</button>
                <button className="template-btn" onClick={() => setPrompt("Create a clean, corporate explainer style. Transitions should be smooth crossfades. Colors should be bright, neutral, and professional.")}>📊 Clean & Corporate</button>
                <button className="template-btn" onClick={() => setPrompt("Create a raw, documentary-style edit. Keep cuts natural and unforced. Colors should reflect a realistic, unpolished aesthetic.")}>📹 Raw Documentary</button>
            </div>

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
