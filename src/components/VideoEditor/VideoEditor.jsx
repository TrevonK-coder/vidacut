import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
    Play, Pause, SkipBack, SkipForward, Scissors, Trash2, Plus,
    Upload, Music, Type, Sticker, Layers, Sliders, Download,
    ChevronLeft, RotateCcw, RotateCw, FlipHorizontal, FlipVertical,
    ZoomIn, ZoomOut, Volume2, VolumeX, Gauge, Film, Square,
    Monitor, Smartphone, Sun, Contrast, Droplets, Wind,
    AlignCenter, Bold, Italic, Underline, Check, X, Palette
} from 'lucide-react';
import { toCSSFilter } from '../../lib/editing/effectsProcessor';
import './VideoEditor.css';

// ─── Filter Presets ──────────────────────────────────────────────────────────
const FILTERS = [
    { id: 'original', label: 'Original', css: '' },
    { id: 'vivid', label: 'Vivid', css: 'saturate(1.6) contrast(1.1)' },
    { id: 'cool', label: 'Cool', css: 'hue-rotate(20deg) saturate(1.2) brightness(1.05)' },
    { id: 'warm', label: 'Warm', css: 'sepia(0.3) saturate(1.3) brightness(1.05)' },
    { id: 'film', label: 'Film', css: 'contrast(1.2) saturate(0.85) brightness(0.95) sepia(0.1)' },
    { id: 'fade', label: 'Fade', css: 'contrast(0.85) brightness(1.1) saturate(0.8)' },
    { id: 'vintage', label: 'Vintage', css: 'sepia(0.5) contrast(1.1) brightness(0.9) saturate(0.8)' },
    { id: 'matte', label: 'Matte', css: 'contrast(0.9) brightness(1.05) saturate(0.7)' },
    { id: 'cinema', label: 'Cinema', css: 'contrast(1.35) saturation(0.8) brightness(0.9)' },
    { id: 'drama', label: 'Drama', css: 'contrast(1.5) saturate(1.2) brightness(0.85)' },
    { id: 'bw', label: 'B&W', css: 'saturate(0) contrast(1.2)' },
    { id: 'noir', label: 'Noir', css: 'saturate(0) contrast(1.5) brightness(0.8)' },
    { id: 'summer', label: 'Summer', css: 'hue-rotate(-10deg) saturate(1.5) brightness(1.1)' },
    { id: 'moody', label: 'Moody', css: 'hue-rotate(200deg) saturate(0.9) contrast(1.1) brightness(0.85)' },
    { id: 'lomo', label: 'Lomo', css: 'contrast(1.3) saturate(1.2) brightness(0.9) sepia(0.15)' },
];

// ─── Text Animations ────────────────────────────────────────────────────────
const TEXT_ANIMS = [
    { id: 'none', label: 'None', animClass: '' },
    { id: 'fade', label: 'Fade In', animClass: 'ta-fade' },
    { id: 'slide-up', label: 'Slide Up', animClass: 'ta-slide-up' },
    { id: 'slide-left', label: 'Slide Left', animClass: 'ta-slide-left' },
    { id: 'zoom', label: 'Zoom', animClass: 'ta-zoom' },
    { id: 'bounce', label: 'Bounce', animClass: 'ta-bounce' },
    { id: 'typewriter', label: 'Typewriter', animClass: 'ta-typewriter' },
];

// ─── Text Style Presets ─────────────────────────────────────────────────────
const TEXT_STYLES = [
    { id: 'plain', label: 'Plain', style: { color: '#fff', fontSize: '2rem', fontWeight: 700 } },
    { id: 'shadow', label: 'Shadow', style: { color: '#fff', fontSize: '2rem', fontWeight: 800, textShadow: '0 4px 12px rgba(0,0,0,0.9)' } },
    { id: 'outline', label: 'Outline', style: { color: '#fff', fontSize: '2rem', fontWeight: 900, WebkitTextStroke: '2px #000' } },
    { id: 'lower3rd', label: 'Lower 3rd', style: { color: '#22c55e', fontSize: '1.3rem', fontWeight: 700, background: 'rgba(0,0,0,0.7)', padding: '6px 14px', borderRadius: '4px' } },
    { id: 'title', label: 'Title', style: { color: '#fff', fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.02em', textShadow: '0 2px 20px rgba(99,102,241,0.8)' } },
    { id: 'caption', label: 'Caption', style: { color: '#f8fafc', fontSize: '1rem', background: 'rgba(0,0,0,0.55)', padding: '4px 10px' } },
    { id: 'neon', label: 'Neon', style: { color: '#22c55e', fontSize: '2rem', fontWeight: 800, textShadow: '0 0 10px #22c55e, 0 0 30px #22c55e' } },
    { id: 'fire', label: 'Fire', style: { color: '#f97316', fontSize: '2rem', fontWeight: 800, textShadow: '0 0 10px #ef4444, 0 0 25px #f97316' } },
];

// ─── Stickers ───────────────────────────────────────────────────────────────
const STICKER_CATS = {
    '🔥 Trending': ['🔥', '💯', '✨', '🎉', '👑', '💎', '⚡', '🚀', '💪', '🎯', '🏆', '💥'],
    '❤️ Love': ['❤️', '💕', '💖', '💗', '💓', '💘', '💝', '🥰', '😍', '💌', '💟', '🫶'],
    '😂 Reactions': ['😂', '🤣', '😭', '🥹', '😮', '🤯', '🤔', '😏', '😎', '🥶', '🤩', '🫠'],
    '🎬 Film': ['🎬', '🎥', '🎞', '📽', '🎭', '🎨', '🎵', '🎶', '📸', '🎙', '🎤', '📹'],
    '✍️ Arrows': ['➡️', '⬆️', '⬇️', '↗️', '↙️', '🔄', '💫', '⭐', '🌟', '💢', '💦', '💨'],
};

// ─── Background Options ─────────────────────────────────────────────────────
const BACKGROUNDS = [
    { id: 'none', label: 'None', bg: 'transparent' },
    { id: 'black', label: 'Black', bg: '#000000' },
    { id: 'white', label: 'White', bg: '#ffffff' },
    { id: 'blur', label: 'Blur', bg: 'blur' },    // special
    { id: 'grad1', label: 'Indigo', bg: 'linear-gradient(135deg,#6366f1,#8b5cf6)' },
    { id: 'grad2', label: 'Sunset', bg: 'linear-gradient(135deg,#f97316,#ef4444)' },
    { id: 'grad3', label: 'Ocean', bg: 'linear-gradient(135deg,#06b6d4,#3b82f6)' },
    { id: 'grad4', label: 'Forest', bg: 'linear-gradient(135deg,#22c55e,#16a34a)' },
];

// ─── Aspect Ratios ──────────────────────────────────────────────────────────
const RATIOS = [
    { id: '9:16', label: '9:16 TikTok', css: '9/16' },
    { id: '16:9', label: '16:9 YouTube', css: '16/9' },
    { id: '1:1', label: '1:1 Instagram', css: '1/1' },
    { id: '4:3', label: '4:3 Classic', css: '4/3' },
    { id: '4:5', label: '4:5 Portrait', css: '4/5' },
];

// ─── Tool Button ─────────────────────────────────────────────────────────────
function ToolBtn({ id, icon: Icon, label, active, onClick }) {
    return (
        <button className={`cc-tool-btn ${active ? 'active' : ''}`} onClick={() => onClick(id)}>
            <span className="cc-tool-icon"><Icon size={20} /></span>
            <span className="cc-tool-label">{label}</span>
        </button>
    );
}

// ─── Filter thumbnail ────────────────────────────────────────────────────────
function FilterThumb({ filter, videoUrl, active, onSelect }) {
    return (
        <button className={`filter-thumb ${active ? 'active' : ''}`} onClick={() => onSelect(filter.id)}>
            {videoUrl ? (
                <video src={videoUrl} className="filter-thumb-video" style={{ filter: filter.css }} muted playsInline />
            ) : (
                <div className="filter-thumb-placeholder" style={{ filter: filter.css }} />
            )}
            <span className="filter-thumb-label">{filter.label}</span>
        </button>
    );
}

// ─── Main Editor ─────────────────────────────────────────────────────────────
export default function VideoEditor({ onBack, initialFiles = [] }) {
    // Clips
    const [clips, setClips] = useState(() =>
        initialFiles.map((f, i) => ({
            id: i, name: f.name, file: f, url: URL.createObjectURL(f),
            duration: 5, trimStart: 0, trimEnd: 0,
            volume: 1, speed: 1, opacity: 1,
            reversed: false, flipH: false, flipV: false,
            rotate: 0, brightness: 0, contrast: 0, saturation: 0,
            filter: 'original',
        }))
    );
    const [selClip, setSelClip] = useState(null);
    const [curClipIdx, setCurClipIdx] = useState(0);
    const [audioTrack, setAudioTrack] = useState(null);
    const [audioVol, setAudioVol] = useState(1);
    const [audioMuted, setAudioMuted] = useState(false);
    const [audioFadeIn, setAudioFadeIn] = useState(0);
    const [audioFadeOut, setAudioFadeOut] = useState(0);

    // Text overlays
    const [textItems, setTextItems] = useState([]);
    const [selText, setSelText] = useState(null);

    // Stickers
    const [stickers, setStickers] = useState([]);
    const [stickerCat, setStickerCat] = useState(Object.keys(STICKER_CATS)[0]);

    // Playback
    const [playing, setPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const videoRef = useRef(null);

    // UI
    const [activeTool, setActiveTool] = useState(null);
    const [ratio, setRatio] = useState('16:9');
    const [bgOption, setBgOption] = useState('black');
    const [globalFilter, setGlobalFilter] = useState('original');
    const [pxPerSec, setPxPerSec] = useState(50);

    // Adjust sliders
    const [adjustVals, setAdjustVals] = useState({ brightness: 0, contrast: 0, saturation: 0, hue: 0, vignette: 0 });

    // Text editor state
    const [newTextContent, setNewTextContent] = useState('Your Text Here');
    const [newTextStyle, setNewTextStyle] = useState(TEXT_STYLES[0].id);
    const [newTextAnim, setNewTextAnim] = useState(TEXT_ANIMS[0].id);

    // Export
    const [exporting, setExporting] = useState(false);
    const [exportPct, setExportPct] = useState(0);

    const fileInputRef = useRef(null);
    const audioInputRef = useRef(null);

    const clip = clips[selClip] || null;
    const curRatio = RATIOS.find(r => r.id === ratio) || RATIOS[0];
    const filterObj = FILTERS.find(f => f.id === globalFilter) || FILTERS[0];

    // Build CSS filter for preview (global filter + adjust)
    const previewFilter = [
        filterObj.css,
        adjustVals.brightness !== 0 ? `brightness(${1 + adjustVals.brightness / 100})` : '',
        adjustVals.contrast !== 0 ? `contrast(${1 + adjustVals.contrast / 100})` : '',
        adjustVals.saturation !== 0 ? `saturate(${1 + adjustVals.saturation / 100})` : '',
        adjustVals.hue !== 0 ? `hue-rotate(${adjustVals.hue}deg)` : '',
    ].filter(Boolean).join(' ');

    const togglePlay = () => {
        const v = videoRef.current;
        if (!v) return;
        if (playing) { v.pause(); setPlaying(false); }
        else { v.play().catch(() => { }); setPlaying(true); }
    };

    const handleImport = (files) => {
        const newClips = Array.from(files).filter(f => f.type.startsWith('video/')).map((f, i) => ({
            id: Date.now() + i, name: f.name, file: f, url: URL.createObjectURL(f),
            duration: 5, trimStart: 0, trimEnd: 0,
            volume: 1, speed: 1, opacity: 1,
            reversed: false, flipH: false, flipV: false, rotate: 0,
            brightness: 0, contrast: 0, saturation: 0, filter: 'original',
        }));
        setClips(p => [...p, ...newClips]);
    };

    const removeClip = (idx) => { setClips(p => p.filter((_, i) => i !== idx)); setSelClip(null); };

    const updateClip = (field, val) => {
        if (selClip === null) return;
        setClips(p => p.map((c, i) => i === selClip ? { ...c, [field]: val } : c));
    };

    const splitClip = () => {
        if (selClip === null) return;
        const c = clips[selClip];
        const pt = Math.min(Math.max(currentTime, c.trimStart + 0.1), c.duration - c.trimEnd - 0.1);
        const a = { ...c, id: Date.now(), trimEnd: c.duration - pt };
        const b = { ...c, id: Date.now() + 1, trimStart: pt };
        const arr = [...clips]; arr.splice(selClip, 1, a, b);
        setClips(arr);
    };

    // Drag reorder
    const dragIdx = useRef(null);
    const onDragStart = i => { dragIdx.current = i; };
    const onDragOver = (e, i) => {
        e.preventDefault();
        if (dragIdx.current === null || dragIdx.current === i) return;
        const arr = [...clips];
        const [mv] = arr.splice(dragIdx.current, 1);
        arr.splice(i, 0, mv);
        dragIdx.current = i;
        setClips(arr);
    };

    const addText = () => {
        const styleObj = TEXT_STYLES.find(s => s.id === newTextStyle) || TEXT_STYLES[0];
        const animObj = TEXT_ANIMS.find(a => a.id === newTextAnim) || TEXT_ANIMS[0];
        setTextItems(p => [...p, {
            id: Date.now(), text: newTextContent,
            style: styleObj.style, animClass: animObj.animClass,
            x: 50, y: 80, startTime: currentTime, endTime: currentTime + 3,
        }]);
        setActiveTool(null);
    };

    const addSticker = (emoji) => {
        setStickers(p => [...p, { id: Date.now(), emoji, x: 50, y: 40, size: 3 }]);
    };

    const handleExport = async () => {
        if (clips.length === 0) return;
        setExporting(true); setExportPct(0);
        try {
            const { processVideos } = await import('../../lib/ffmpeg/videoProcessor');
            const url = await processVideos(
                clips.map(c => c.file),
                audioTrack?.file || null,
                null,
                setExportPct,
                () => { },
                { ffmpegVF: previewFilter ? `scale=trunc(iw/2)*2:trunc(ih/2)*2,${previewFilter.replace(/ /g, ',')}` : null }
            );
            const a = Object.assign(document.createElement('a'), { href: url, download: 'vidacut_edit.mp4' });
            a.click();
        } catch (e) { alert('Export failed: ' + e.message); }
        finally { setExporting(false); }
    };

    const TOOLS = [
        { id: 'clip', icon: Film, label: 'Clip', cond: true },
        { id: 'audio', icon: Music, label: 'Audio', cond: true },
        { id: 'text', icon: Type, label: 'Text', cond: true },
        { id: 'sticker', icon: Layers, label: 'Sticker', cond: true },
        { id: 'filter', icon: Palette, label: 'Filter', cond: true },
        { id: 'adjust', icon: Sun, label: 'Adjust', cond: true },
        { id: 'speed', icon: Gauge, label: 'Speed', cond: !!clip },
        { id: 'crop', icon: ZoomIn, label: 'Crop', cond: !!clip },
        { id: 'bg', icon: Square, label: 'BG', cond: true },
        { id: 'ratio', icon: Monitor, label: 'Ratio', cond: true },
        { id: 'split', icon: Scissors, label: 'Split', cond: !!clip },
    ];

    return (
        <div className="cc-root">
            {/* ── Top Bar ── */}
            <div className="cc-topbar">
                <button className="cc-back-btn" onClick={onBack}><ChevronLeft size={18} /> Back</button>
                <span className="cc-project-name">Vidacut Edit</span>
                <button className="cc-export-btn" onClick={handleExport} disabled={exporting || clips.length === 0}>
                    {exporting ? `${exportPct}%` : <><Download size={15} /> Export</>}
                </button>
            </div>

            {/* ── Preview ── */}
            <div className="cc-preview-wrap">
                <div
                    className="cc-canvas"
                    style={{
                        aspectRatio: curRatio.css,
                        background: bgOption === 'blur' ? '#000' : (BACKGROUNDS.find(b => b.id === bgOption)?.bg || '#000'),
                    }}
                >
                    {clips[curClipIdx] ? (
                        <video
                            ref={videoRef}
                            src={clips[curClipIdx].url}
                            className="cc-video"
                            style={{
                                filter: previewFilter,
                                opacity: (clip?.opacity ?? 1),
                                transform: `scaleX(${clip?.flipH ? -1 : 1}) scaleY(${clip?.flipV ? -1 : 1}) rotate(${clip?.rotate ?? 0}deg)`,
                            }}
                            onTimeUpdate={e => setCurrentTime(e.target.currentTime)}
                            onLoadedMetadata={e => {
                                const dur = e.target.duration;
                                if (!isNaN(dur)) setClips(p => p.map((c, i) => i === curClipIdx ? { ...c, duration: dur } : c));
                            }}
                            onEnded={() => setPlaying(false)}
                            playsInline muted={audioMuted}
                        />
                    ) : (
                        <div className="cc-empty-preview">
                            <Film size={48} className="text-muted" />
                            <p className="text-muted">Import clips to begin</p>
                            <button className="cc-import-btn" onClick={() => fileInputRef.current?.click()}>
                                <Upload size={16} /> Import Video
                            </button>
                        </div>
                    )}

                    {/* Stickers on canvas */}
                    {stickers.map((s, i) => (
                        <div key={s.id} className="cc-sticker"
                            style={{ left: `${s.x}%`, top: `${s.y}%`, fontSize: `${s.size}rem` }}
                            onClick={() => setStickers(p => p.filter((_, j) => j !== i))}
                            title="Tap to remove"
                        >{s.emoji}</div>
                    ))}

                    {/* Text overlays */}
                    {textItems.map((t, i) => (
                        <div key={t.id}
                            className={`cc-text-overlay ${t.animClass} ${selText === i ? 'cc-text-selected' : ''}`}
                            style={{ left: `${t.x}%`, top: `${t.y}%`, ...t.style }}
                            onClick={() => setSelText(i)}
                        >{t.text}</div>
                    ))}
                </div>

                {/* Playback bar */}
                <div className="cc-playback">
                    <button className="cc-pb-btn" onClick={() => { if (videoRef.current) videoRef.current.currentTime = 0; }}>
                        <SkipBack size={16} />
                    </button>
                    <button className="cc-pb-play" onClick={togglePlay}>
                        {playing ? <Pause size={22} /> : <Play size={22} />}
                    </button>
                    <button className="cc-pb-btn" onClick={() => { if (videoRef.current) videoRef.current.currentTime = videoRef.current.duration; }}>
                        <SkipForward size={16} />
                    </button>
                    <span className="cc-time">
                        {String(Math.floor(currentTime / 60)).padStart(2, '0')}:{String(Math.floor(currentTime % 60)).padStart(2, '0')}
                    </span>
                    <div className="cc-pb-right">
                        <button className="cc-icon-btn" onClick={() => setAudioMuted(m => !m)}>
                            {audioMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Timeline ── */}
            <div className="cc-timeline">
                {/* Clip track */}
                <div className="cc-track">
                    {clips.map((c, i) => (
                        <div key={c.id}
                            className={`cc-tl-clip ${selClip === i ? 'selected' : ''}`}
                            style={{ width: Math.max(48, (c.duration - c.trimStart - c.trimEnd) * pxPerSec) }}
                            onClick={() => { setSelClip(i); setCurClipIdx(i); }}
                            draggable
                            onDragStart={() => onDragStart(i)}
                            onDragOver={e => onDragOver(e, i)}
                        >
                            <video src={c.url} className="cc-tl-thumb" muted playsInline />
                            <span className="cc-tl-name">{c.name.replace(/\.[^.]+$/, '')}</span>
                            {selClip === i && (
                                <button className="cc-tl-del" onClick={e => { e.stopPropagation(); removeClip(i); }}>
                                    <X size={10} />
                                </button>
                            )}
                        </div>
                    ))}
                    <button className="cc-tl-add" onClick={() => fileInputRef.current?.click()}>
                        <Plus size={20} />
                    </button>
                </div>

                {/* Audio track (if any) */}
                {audioTrack && (
                    <div className="cc-track cc-audio-track">
                        <div className="cc-audio-bar"><Music size={11} /> {audioTrack.name}</div>
                        <button onClick={() => setAudioTrack(null)}><X size={12} /></button>
                    </div>
                )}

                {/* Text track */}
                {textItems.length > 0 && (
                    <div className="cc-track cc-text-track">
                        {textItems.map((t, i) => (
                            <div key={t.id} className={`cc-tl-text-chip ${selText === i ? 'selected' : ''}`}
                                style={{ marginLeft: t.startTime * pxPerSec, width: (t.endTime - t.startTime) * pxPerSec }}
                                onClick={() => setSelText(i)}
                            >
                                <Type size={10} /> {t.text.slice(0, 12)}
                            </div>
                        ))}
                    </div>
                )}

                {/* Timeline zoom */}
                <div className="cc-tl-zoom">
                    <button className="cc-icon-btn" onClick={() => setPxPerSec(p => Math.max(10, p - 10))}><ZoomOut size={13} /></button>
                    <span className="cc-tl-zoom-lbl">{pxPerSec}px/s</span>
                    <button className="cc-icon-btn" onClick={() => setPxPerSec(p => Math.min(120, p + 10))}><ZoomIn size={13} /></button>
                </div>
            </div>

            {/* ── Tool Panel (slides up) ── */}
            {activeTool && (
                <div className="cc-tool-panel glass-panel">
                    <div className="cc-panel-header">
                        <span className="cc-panel-title">{activeTool.toUpperCase()}</span>
                        <button className="cc-panel-close" onClick={() => setActiveTool(null)}><X size={16} /></button>
                    </div>

                    {/* FILTER */}
                    {activeTool === 'filter' && (
                        <div className="cc-filter-row">
                            {FILTERS.map(f => (
                                <FilterThumb key={f.id} filter={f}
                                    videoUrl={clips[curClipIdx]?.url}
                                    active={globalFilter === f.id}
                                    onSelect={setGlobalFilter}
                                />
                            ))}
                        </div>
                    )}

                    {/* ADJUST */}
                    {activeTool === 'adjust' && (
                        <div className="cc-adjust-grid">
                            {[
                                { k: 'brightness', label: 'Brightness', icon: '☀️', min: -100, max: 100 },
                                { k: 'contrast', label: 'Contrast', icon: '◑', min: -100, max: 100 },
                                { k: 'saturation', label: 'Saturation', icon: '🎨', min: -100, max: 100 },
                                { k: 'hue', label: 'Hue', icon: '🌈', min: -180, max: 180 },
                                { k: 'vignette', label: 'Vignette', icon: '⭕', min: 0, max: 100 },
                            ].map(item => (
                                <div key={item.k} className="adj-item">
                                    <div className="adj-icon">{item.icon}</div>
                                    <input type="range" min={item.min} max={item.max} step={1}
                                        value={adjustVals[item.k]}
                                        onChange={e => setAdjustVals(p => ({ ...p, [item.k]: +e.target.value }))}
                                        className="adj-range"
                                    />
                                    <span className="adj-val">{adjustVals[item.k] > 0 ? '+' : ''}{adjustVals[item.k]}</span>
                                    <div className="adj-label">{item.label}</div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* TEXT */}
                    {activeTool === 'text' && (
                        <div className="cc-text-editor">
                            <input
                                className="cc-text-input"
                                value={newTextContent}
                                onChange={e => setNewTextContent(e.target.value)}
                                placeholder="Enter text…"
                            />
                            <div className="cc-text-section-label">Style</div>
                            <div className="cc-text-style-row">
                                {TEXT_STYLES.map(s => (
                                    <button key={s.id} className={`text-style-btn ${newTextStyle === s.id ? 'active' : ''}`}
                                        onClick={() => setNewTextStyle(s.id)}>
                                        <span style={{ ...s.style, fontSize: '0.7rem' }}>Aa</span>
                                        <span>{s.label}</span>
                                    </button>
                                ))}
                            </div>
                            <div className="cc-text-section-label">Animation</div>
                            <div className="cc-anim-row">
                                {TEXT_ANIMS.map(a => (
                                    <button key={a.id} className={`anim-btn ${newTextAnim === a.id ? 'active' : ''}`}
                                        onClick={() => setNewTextAnim(a.id)}>
                                        {a.label}
                                    </button>
                                ))}
                            </div>
                            <button className="cc-add-text-btn" onClick={addText}>
                                <Plus size={14} /> Add Text
                            </button>
                        </div>
                    )}

                    {/* STICKER */}
                    {activeTool === 'sticker' && (
                        <div className="cc-sticker-panel">
                            <div className="cc-sticker-cats">
                                {Object.keys(STICKER_CATS).map(cat => (
                                    <button key={cat} className={`sticker-cat-btn ${stickerCat === cat ? 'active' : ''}`}
                                        onClick={() => setStickerCat(cat)}>{cat}</button>
                                ))}
                            </div>
                            <div className="cc-sticker-grid">
                                {STICKER_CATS[stickerCat].map(emoji => (
                                    <button key={emoji} className="sticker-emoji-btn" onClick={() => addSticker(emoji)}>
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* AUDIO */}
                    {activeTool === 'audio' && (
                        <div className="cc-audio-panel">
                            <input ref={audioInputRef} type="file" accept="audio/*" style={{ display: 'none' }}
                                onChange={e => { const f = e.target.files?.[0]; if (f) setAudioTrack({ name: f.name, file: f }); }} />
                            <button className="cc-import-btn" onClick={() => audioInputRef.current?.click()}>
                                <Music size={14} /> Import Audio Track
                            </button>
                            {audioTrack && <div className="cc-audio-info"><Music size={14} /> {audioTrack.name}</div>}
                            <div className="audio-adj-row">
                                <label className="adj-label">Master Volume</label>
                                <input type="range" min={0} max={1} step={0.01} value={audioVol} onChange={e => setAudioVol(+e.target.value)} className="adj-range" />
                                <span className="adj-val">{Math.round(audioVol * 100)}%</span>
                            </div>
                            <div className="audio-adj-row">
                                <label className="adj-label">Fade In (s)</label>
                                <input type="range" min={0} max={3} step={0.1} value={audioFadeIn} onChange={e => setAudioFadeIn(+e.target.value)} className="adj-range" />
                                <span className="adj-val">{audioFadeIn}s</span>
                            </div>
                            <div className="audio-adj-row">
                                <label className="adj-label">Fade Out (s)</label>
                                <input type="range" min={0} max={3} step={0.1} value={audioFadeOut} onChange={e => setAudioFadeOut(+e.target.value)} className="adj-range" />
                                <span className="adj-val">{audioFadeOut}s</span>
                            </div>
                        </div>
                    )}

                    {/* SPEED */}
                    {activeTool === 'speed' && clip && (
                        <div className="cc-speed-panel">
                            <div className="speed-btn-row">
                                {[0.1, 0.25, 0.5, 1, 1.5, 2, 3, 4].map(s => (
                                    <button key={s} className={`cc-speed-pill ${clip.speed === s ? 'active' : ''}`}
                                        onClick={() => updateClip('speed', s)}>
                                        {s}×
                                    </button>
                                ))}
                            </div>
                            <div className="speed-indicator-bar">
                                <div className="speed-fill" style={{ width: `${Math.min((clip.speed / 4) * 100, 100)}%` }} />
                            </div>
                            <div className="speed-labels">
                                <span>Slow Motion</span><span>Normal</span><span>Timelapse</span>
                            </div>
                        </div>
                    )}

                    {/* CROP / TRANSFORM */}
                    {activeTool === 'crop' && clip && (
                        <div className="cc-crop-panel">
                            <div className="crop-btn-grid">
                                <button className="crop-btn" onClick={() => updateClip('rotate', (clip.rotate - 90 + 360) % 360)}>
                                    <RotateCcw size={18} /><span>Rotate L</span>
                                </button>
                                <button className="crop-btn" onClick={() => updateClip('rotate', (clip.rotate + 90) % 360)}>
                                    <RotateCw size={18} /><span>Rotate R</span>
                                </button>
                                <button className={`crop-btn ${clip.flipH ? 'active' : ''}`} onClick={() => updateClip('flipH', !clip.flipH)}>
                                    <FlipHorizontal size={18} /><span>Flip H</span>
                                </button>
                                <button className={`crop-btn ${clip.flipV ? 'active' : ''}`} onClick={() => updateClip('flipV', !clip.flipV)}>
                                    <FlipVertical size={18} /><span>Flip V</span>
                                </button>
                            </div>
                            <div className="crop-opacity-row">
                                <label className="adj-label">Opacity</label>
                                <input type="range" min={0} max={1} step={0.01} value={clip.opacity}
                                    onChange={e => updateClip('opacity', +e.target.value)} className="adj-range" />
                                <span className="adj-val">{Math.round(clip.opacity * 100)}%</span>
                            </div>
                            <div className="crop-opacity-row">
                                <label className="adj-label">Trim Start</label>
                                <input type="range" min={0} max={Math.max(0, clip.duration - clip.trimEnd - 0.1)} step={0.1}
                                    value={clip.trimStart} onChange={e => updateClip('trimStart', +e.target.value)} className="adj-range" />
                                <span className="adj-val">{clip.trimStart.toFixed(1)}s</span>
                            </div>
                            <div className="crop-opacity-row">
                                <label className="adj-label">Trim End</label>
                                <input type="range" min={0} max={Math.max(0, clip.duration - clip.trimStart - 0.1)} step={0.1}
                                    value={clip.trimEnd} onChange={e => updateClip('trimEnd', +e.target.value)} className="adj-range" />
                                <span className="adj-val">{clip.trimEnd.toFixed(1)}s</span>
                            </div>
                        </div>
                    )}

                    {/* CLIP */}
                    {activeTool === 'clip' && (
                        <div className="cc-clip-panel">
                            <div className="clip-grid">
                                {clips.map((c, i) => (
                                    <div key={c.id} className={`clip-grid-item ${selClip === i ? 'selected' : ''}`}
                                        onClick={() => { setSelClip(i); setCurClipIdx(i); }}>
                                        <video src={c.url} className="clip-grid-thumb" muted playsInline />
                                        <span>{c.name.replace(/\.[^.]+$/, '')}</span>
                                        <button onClick={e => { e.stopPropagation(); removeClip(i); }}><Trash2 size={11} /></button>
                                    </div>
                                ))}
                                <button className="clip-grid-add" onClick={() => fileInputRef.current?.click()}>
                                    <Plus size={24} /><span>Add Clip</span>
                                </button>
                            </div>
                            {clip && (
                                <div className="clip-actions">
                                    <button className="cc-action-btn danger" onClick={() => { removeClip(selClip); setActiveTool(null); }}>
                                        <Trash2 size={14} /> Delete Clip
                                    </button>
                                    <button className="cc-action-btn" onClick={splitClip}>
                                        <Scissors size={14} /> Split at Playhead
                                    </button>
                                    <button className={`cc-action-btn ${clip.reversed ? 'active' : ''}`}
                                        onClick={() => updateClip('reversed', !clip.reversed)}>
                                        <RotateCcw size={14} /> Reverse
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* BG */}
                    {activeTool === 'bg' && (
                        <div className="cc-bg-panel">
                            <div className="bg-grid">
                                {BACKGROUNDS.map(b => (
                                    <button key={b.id} className={`bg-swatch ${bgOption === b.id ? 'active' : ''}`}
                                        onClick={() => setBgOption(b.id)}
                                        style={{ background: b.bg === 'blur' || b.bg === 'transparent' ? '#333' : b.bg }}>
                                        {bgOption === b.id && <Check size={14} />}
                                        <span>{b.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* RATIO */}
                    {activeTool === 'ratio' && (
                        <div className="cc-ratio-panel">
                            {RATIOS.map(r => (
                                <button key={r.id} className={`ratio-btn ${ratio === r.id ? 'active' : ''}`}
                                    onClick={() => setRatio(r.id)}>
                                    <div className="ratio-preview" style={{ aspectRatio: r.css }} />
                                    <span>{r.label}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* SPLIT */}
                    {activeTool === 'split' && clip && (
                        <div className="cc-split-panel">
                            <p className="text-muted">Playhead is at <strong>{currentTime.toFixed(2)}s</strong>. This will split the selected clip at that point.</p>
                            <button className="cc-add-text-btn" onClick={() => { splitClip(); setActiveTool(null); }}>
                                <Scissors size={14} /> Split Here
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* ── Bottom Toolbar ── */}
            <div className="cc-toolbar">
                {TOOLS.filter(t => t.cond).map(t => (
                    <ToolBtn key={t.id} {...t} active={activeTool === t.id}
                        onClick={id => setActiveTool(activeTool === id ? null : id)} />
                ))}
            </div>

            {/* Hidden inputs */}
            <input ref={fileInputRef} type="file" accept="video/*" multiple style={{ display: 'none' }}
                onChange={e => handleImport(e.target.files)} />
        </div>
    );
}
