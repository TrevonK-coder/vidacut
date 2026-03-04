import React, { useState, useEffect, useRef } from 'react';
import {
    Sliders, Zap, Repeat, Palette, ChevronDown, ChevronUp,
    Play, Pause, RotateCcw, Gauge, Check
} from 'lucide-react';
import {
    DEFAULT_SETTINGS, PRESETS, TRANSITIONS,
    toCSSFilter, toFFmpegVF, buildXfadeFilter
} from '../../lib/editing/effectsProcessor';
import './EditorPanel.css';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function Slider({ label, value, min, max, step = 1, unit = '', onChange }) {
    const pct = ((value - min) / (max - min)) * 100;
    return (
        <div className="ep-slider-row">
            <div className="ep-slider-header">
                <span className="ep-slider-label">{label}</span>
                <span className="ep-slider-val">{value > 0 ? '+' : ''}{value}{unit}</span>
            </div>
            <div className="ep-slider-track">
                <div className="ep-slider-fill" style={{ width: `${pct}%` }} />
                <input
                    type="range"
                    min={min} max={max} step={step}
                    value={value}
                    onChange={e => onChange(parseFloat(e.target.value))}
                    className="ep-range"
                />
            </div>
        </div>
    );
}

function Section({ title, icon: Icon, children, defaultOpen = true }) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="ep-section">
            <button className="ep-section-hdr" onClick={() => setOpen(o => !o)}>
                <span className="ep-section-title"><Icon size={14} />{title}</span>
                {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {open && <div className="ep-section-body">{children}</div>}
        </div>
    );
}

// ─── Transition preview cell ──────────────────────────────────────────────────

function TransitionCard({ t, active, onSelect }) {
    return (
        <button
            className={`transition-card ${active ? 'active' : ''}`}
            onClick={() => onSelect(t.id)}
            title={t.label}
        >
            <div className={`transition-preview tp-${t.id}`}>
                <div className="tp-a" />
                <div className="tp-b" />
            </div>
            <span className="transition-label">{t.label}</span>
            {active && <div className="transition-check"><Check size={10} /></div>}
        </button>
    );
}

// ─── Main EditorPanel ─────────────────────────────────────────────────────────

export default function EditorPanel({ videoUrl, onSettingsChange }) {
    const [settings, setSettings] = useState(DEFAULT_SETTINGS);
    const [activeTab, setActiveTab] = useState('color');
    const [playing, setPlaying] = useState(false);
    const videoRef = useRef(null);
    const cssFilter = toCSSFilter(settings);
    const ffmpegVF = toFFmpegVF(settings);

    // Notify parent whenever settings change (for use in FFmpeg render)
    useEffect(() => {
        onSettingsChange?.({ settings, cssFilter, ffmpegVF });
    }, [settings]); // eslint-disable-line

    const update = (key, val) => setSettings(p => ({ ...p, [key]: val }));

    const applyPreset = (preset) => {
        setSettings({ ...DEFAULT_SETTINGS, ...preset.settings });
    };

    const reset = () => setSettings(DEFAULT_SETTINGS);

    const togglePlay = () => {
        const v = videoRef.current;
        if (!v) return;
        if (playing) { v.pause(); setPlaying(false); }
        else { v.play(); setPlaying(true); }
    };

    const TABS = [
        { id: 'color', label: 'Color', icon: Palette },
        { id: 'effects', label: 'Effects', icon: Zap },
        { id: 'transition', label: 'Transitions', icon: Repeat },
        { id: 'speed', label: 'Speed', icon: Gauge },
    ];

    return (
        <div className="editor-panel glass-panel">
            {/* ── Preview ── */}
            {videoUrl && (
                <div className="ep-preview">
                    <video
                        ref={videoRef}
                        src={videoUrl}
                        style={{ filter: cssFilter }}
                        className="ep-video"
                        loop
                        playsInline
                        muted
                        onEnded={() => setPlaying(false)}
                    />
                    <div className="ep-preview-controls">
                        <button className="ep-play-btn" onClick={togglePlay}>
                            {playing ? <Pause size={16} /> : <Play size={16} />}
                        </button>
                        <span className="ep-filter-label">Live Preview</span>
                        <button className="ep-reset-btn" onClick={reset} title="Reset all">
                            <RotateCcw size={14} /> Reset
                        </button>
                    </div>
                </div>
            )}

            {/* ── Tabs ── */}
            <div className="ep-tabs">
                {TABS.map(t => {
                    const Icon = t.icon;
                    return (
                        <button
                            key={t.id}
                            className={`ep-tab ${activeTab === t.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(t.id)}
                        >
                            <Icon size={13} /> {t.label}
                        </button>
                    );
                })}
            </div>

            <div className="ep-body">
                {/* ── COLOR TAB ── */}
                {activeTab === 'color' && (
                    <>
                        {/* Presets row */}
                        <div className="presets-row">
                            {PRESETS.map(p => (
                                <button key={p.id} className="preset-btn" onClick={() => applyPreset(p)} title={p.label}>
                                    <span className="preset-icon">{p.icon}</span>
                                    <span className="preset-name">{p.label.split(' ').slice(1).join(' ')}</span>
                                </button>
                            ))}
                        </div>

                        <Section title="Basic" icon={Sliders} defaultOpen={true}>
                            <Slider label="Brightness" value={settings.brightness} min={-100} max={100} onChange={v => update('brightness', v)} />
                            <Slider label="Contrast" value={settings.contrast} min={-100} max={100} onChange={v => update('contrast', v)} />
                            <Slider label="Saturation" value={settings.saturation} min={-100} max={100} onChange={v => update('saturation', v)} />
                            <Slider label="Hue" value={settings.hue} min={-180} max={180} unit="°" onChange={v => update('hue', v)} />
                        </Section>

                        <Section title="Tone" icon={Palette} defaultOpen={false}>
                            <Slider label="Temperature" value={settings.temperature} min={-100} max={100} onChange={v => update('temperature', v)} />
                            <Slider label="Highlights" value={settings.highlights} min={-100} max={100} onChange={v => update('highlights', v)} />
                            <Slider label="Shadows" value={settings.shadows} min={-100} max={100} onChange={v => update('shadows', v)} />
                        </Section>

                        <Section title="Style" icon={Zap} defaultOpen={false}>
                            <Slider label="Vignette" value={settings.vignette} min={0} max={100} onChange={v => update('vignette', v)} />
                            <div className="ep-toggle-row">
                                <span className="ep-slider-label">Black &amp; White</span>
                                <button
                                    className={`ep-toggle ${settings.grayscale ? 'on' : ''}`}
                                    onClick={() => update('grayscale', !settings.grayscale)}
                                >
                                    {settings.grayscale ? 'ON' : 'OFF'}
                                </button>
                            </div>
                        </Section>
                    </>
                )}

                {/* ── EFFECTS TAB ── */}
                {activeTab === 'effects' && (
                    <>
                        <Section title="Lens" icon={Zap} defaultOpen={true}>
                            <Slider label="Blur" value={settings.blur} min={0} max={20} onChange={v => update('blur', v)} />
                            <Slider label="Sharpen" value={settings.sharpen} min={0} max={100} onChange={v => update('sharpen', v)} />
                        </Section>
                        <Section title="Film" icon={Palette} defaultOpen={true}>
                            <Slider label="Grain / Noise" value={settings.grain} min={0} max={100} onChange={v => update('grain', v)} />
                            <Slider label="Vignette" value={settings.vignette} min={0} max={100} onChange={v => update('vignette', v)} />
                        </Section>
                        <div className="ep-hint glass-panel">
                            💡 <strong>Blur</strong>, <strong>Sharpen</strong>, <strong>Grain</strong>, and <strong>Vignette</strong> are applied in the final render using FFmpeg's <code>boxblur</code>, <code>unsharp</code>, <code>noise</code>, and <code>vignette</code> filters.
                        </div>
                    </>
                )}

                {/* ── TRANSITIONS TAB ── */}
                {activeTab === 'transition' && (
                    <>
                        <p className="ep-hint-text">Select the transition used <strong>between every clip</strong> in your edit.</p>
                        <div className="transitions-grid">
                            {TRANSITIONS.map(t => (
                                <TransitionCard
                                    key={t.id}
                                    t={t}
                                    active={settings.transition === t.id}
                                    onSelect={id => update('transition', id)}
                                />
                            ))}
                        </div>
                        {settings.transition !== 'none' && (
                            <Slider
                                label="Duration"
                                value={settings.transitionDuration}
                                min={0.2} max={2} step={0.1} unit="s"
                                onChange={v => update('transitionDuration', v)}
                            />
                        )}
                        <div className="ep-hint glass-panel" style={{ marginTop: '1rem' }}>
                            💡 Transitions use FFmpeg's built-in <code>xfade</code> filter — <strong>free &amp; no plugins needed</strong>. Rendered on export.
                        </div>
                    </>
                )}

                {/* ── SPEED TAB ── */}
                {activeTab === 'speed' && (
                    <>
                        <p className="ep-hint-text">Change the playback speed of your entire edit.</p>
                        <div className="speed-grid">
                            {[0.25, 0.5, 1, 1.5, 2, 4].map(sp => (
                                <button
                                    key={sp}
                                    className={`speed-btn ${settings.speed === sp ? 'active' : ''}`}
                                    onClick={() => update('speed', sp)}
                                >
                                    {sp}×
                                    {sp < 1 && <span className="speed-sub">Slow Motion</span>}
                                    {sp === 1 && <span className="speed-sub">Normal</span>}
                                    {sp > 1 && <span className="speed-sub">Timelapse</span>}
                                </button>
                            ))}
                        </div>
                        <div className="ep-hint glass-panel" style={{ marginTop: '1rem' }}>
                            💡 Speed uses FFmpeg's <code>setpts</code> + <code>atempo</code> filters — audio pitch is preserved.
                        </div>
                    </>
                )}
            </div>

            {/* ── FFmpeg filter preview ── */}
            <div className="ep-filter-chip-row">
                <span className="ep-filter-chip">
                    <code>-vf</code>
                    <span className="ep-filter-code">{ffmpegVF.length > 60 ? ffmpegVF.slice(0, 60) + '…' : ffmpegVF}</span>
                </span>
            </div>
        </div>
    );
}
