import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
    Play, Pause, SkipBack, SkipForward, Scissors, Trash2, Type,
    Volume2, VolumeX, ZoomIn, ZoomOut, Plus, Upload, Music,
    Sliders, Layers, AlignLeft, Square, Monitor, Smartphone,
    RotateCcw, RotateCw, Download, ChevronLeft, ChevronRight,
    Film, Image as ImageIcon, Bold, Italic, AlignCenter
} from 'lucide-react';
import EditorPanel from '../EditorPanel/EditorPanel';
import { DEFAULT_SETTINGS } from '../../lib/editing/effectsProcessor';
import './VideoEditor.css';

// ─── Aspect Ratio Presets ────────────────────────────────────────────────────
const ASPECT_RATIOS = [
    { id: '16:9', label: '16:9', icon: Monitor, css: '16/9' },
    { id: '9:16', label: '9:16', icon: Smartphone, css: '9/16' },
    { id: '1:1', label: '1:1', icon: Square, css: '1/1' },
    { id: '4:3', label: '4:3', icon: Film, css: '4/3' },
];

// ─── Text Presets ────────────────────────────────────────────────────────────
const TEXT_PRESETS = [
    { id: 'title', label: 'Title', style: { fontSize: '3rem', fontWeight: 800, color: '#fff', textShadow: '0 2px 8px rgba(0,0,0,0.8)' } },
    { id: 'subtitle', label: 'Subtitle', style: { fontSize: '1.4rem', fontWeight: 500, color: '#e2e8f0', textShadow: '0 1px 4px rgba(0,0,0,0.6)' } },
    { id: 'lower3rd', label: 'Lower 3rd', style: { fontSize: '1.2rem', fontWeight: 700, color: '#22c55e', background: 'rgba(0,0,0,0.6)', padding: '0.4rem 0.8rem', borderRadius: '4px' } },
    { id: 'caption', label: 'Caption', style: { fontSize: '1rem', fontWeight: 400, color: '#f1f5f9', background: 'rgba(0,0,0,0.5)', padding: '0.2rem 0.5rem' } },
];

// ─── Timeline Clip ────────────────────────────────────────────────────────────
function TimelineClip({ clip, index, isSelected, onSelect, onRemove, onTrimStart, onTrimEnd, pxPerSec, tl }) {
    const width = Math.max(60, ((clip.duration - clip.trimStart - clip.trimEnd) * pxPerSec));
    return (
        <div
            className={`tl-clip ${isSelected ? 'selected' : ''} ${tl}`}
            style={{ width }}
            onClick={() => onSelect(index)}
            title={clip.name}
        >
            <div className="tl-clip-trim-left" onMouseDown={e => onTrimStart(e, index)} />
            <span className="tl-clip-name">{clip.name}</span>
            <button className="tl-clip-del" onClick={e => { e.stopPropagation(); onRemove(index); }}>
                <Trash2 size={10} />
            </button>
            <div className="tl-clip-trim-right" onMouseDown={e => onTrimEnd(e, index)} />
        </div>
    );
}

// ─── Main VideoEditor ─────────────────────────────────────────────────────────

export default function VideoEditor({ onBack, initialFiles = [] }) {
    // Media state
    const [videoClips, setVideoClips] = useState(() =>
        initialFiles.map((f, i) => ({
            id: i,
            name: f.name,
            file: f,
            url: URL.createObjectURL(f),
            duration: 5,      // will be updated on load
            trimStart: 0,
            trimEnd: 0,
            volume: 1,
            speed: 1,
        }))
    );
    const [audioTrack, setAudioTrack] = useState(null);
    const [audioVolume, setAudioVolume] = useState(1);
    const [audioMuted, setAudioMuted] = useState(false);

    // Timeline state
    const [selectedClip, setSelectedClip] = useState(null);
    const [pxPerSec, setPxPerSec] = useState(40);
    const [playhead, setPlayhead] = useState(0);
    const [playing, setPlaying] = useState(false);
    const [currentClipIdx, setCurrentClipIdx] = useState(0);

    // Preview state
    const [aspectRatio, setAspectRatio] = useState('16:9');
    const [textOverlays, setTextOverlays] = useState([]);
    const [selectedText, setSelectedText] = useState(null);

    // Editor settings (color/effects)
    const [editorSettings, setEditorSettings] = useState({ settings: DEFAULT_SETTINGS, cssFilter: '', ffmpegVF: '' });

    // Left panel tab
    const [libTab, setLibTab] = useState('media');

    // Properties tab
    const [propTab, setPropTab] = useState('clip');

    // Undo history
    const [history, setHistory] = useState([]);
    const videoRef = useRef(null);
    const fileInputRef = useRef(null);
    const audioInputRef = useRef(null);
    const timelineRef = useRef(null);

    // Play/pause
    const togglePlay = () => {
        const v = videoRef.current;
        if (!v) return;
        if (playing) { v.pause(); setPlaying(false); }
        else { v.play().catch(() => { }); setPlaying(true); }
    };

    // Current preview video
    const previewUrl = videoClips[currentClipIdx]?.url || null;

    // Load media files
    const handleMediaDrop = useCallback((files) => {
        const newClips = Array.from(files).filter(f => f.type.startsWith('video/')).map((f, i) => ({
            id: Date.now() + i,
            name: f.name,
            file: f,
            url: URL.createObjectURL(f),
            duration: 5,
            trimStart: 0,
            trimEnd: 0,
            volume: 1,
            speed: 1,
        }));
        setVideoClips(p => [...p, ...newClips]);
    }, []);

    const handleAudioDrop = useCallback((file) => {
        if (!file || !file.type.startsWith('audio/')) return;
        setAudioTrack({ name: file.name, file, url: URL.createObjectURL(file), volume: 1 });
    }, []);

    // Update clip duration from video metadata
    const handleVideoMeta = (idx) => (e) => {
        const dur = e.target.duration;
        if (!isNaN(dur)) {
            setVideoClips(p => p.map((c, i) => i === idx ? { ...c, duration: dur } : c));
        }
    };

    // Remove clip
    const removeClip = (idx) => {
        setVideoClips(p => p.filter((_, i) => i !== idx));
        setSelectedClip(null);
    };

    // Add text overlay
    const addText = (preset) => {
        setTextOverlays(p => [...p, {
            id: Date.now(),
            text: preset.label,
            preset: preset.id,
            style: preset.style,
            x: 10, y: 80,    // % based position
            startTime: 0,
            endTime: 3,
        }]);
    };

    // Update selected clip property
    const updateClipProp = (field, val) => {
        if (selectedClip === null) return;
        setVideoClips(p => p.map((c, i) => i === selectedClip ? { ...c, [field]: val } : c));
    };

    // Zoom timeline
    const zoomIn = () => setPxPerSec(p => Math.min(p + 10, 100));
    const zoomOut = () => setPxPerSec(p => Math.max(p - 10, 10));

    // Split at playhead
    const splitAtPlayhead = () => {
        if (selectedClip === null) return;
        const clip = videoClips[selectedClip];
        const splitPoint = playhead - clip.trimStart;
        if (splitPoint <= 0 || splitPoint >= clip.duration - clip.trimEnd - clip.trimStart) return;
        const part1 = { ...clip, id: Date.now(), trimEnd: clip.duration - clip.trimStart - splitPoint };
        const part2 = { ...clip, id: Date.now() + 1, trimStart: clip.trimStart + splitPoint };
        const newClips = [...videoClips];
        newClips.splice(selectedClip, 1, part1, part2);
        setVideoClips(newClips);
    };

    // Drag to reorder clips (simple swap)
    const dragClipIdx = useRef(null);
    const onDragStart = (idx) => { dragClipIdx.current = idx; };
    const onDragOver = (e, idx) => {
        e.preventDefault();
        if (dragClipIdx.current === null || dragClipIdx.current === idx) return;
        const newClips = [...videoClips];
        const [moved] = newClips.splice(dragClipIdx.current, 1);
        newClips.splice(idx, 0, moved);
        dragClipIdx.current = idx;
        setVideoClips(newClips);
    };

    // Export (triggers FFmpeg render via parent or in-component)
    const [exporting, setExporting] = useState(false);
    const [exportProgress, setExportProgress] = useState(0);

    const handleExport = async () => {
        if (videoClips.length === 0) return;
        setExporting(true); setExportProgress(0);
        try {
            const { processVideos } = await import('../../lib/ffmpeg/videoProcessor');
            const url = await processVideos(
                videoClips.map(c => c.file),
                audioTrack?.file || null,
                null,
                setExportProgress,
                () => { },
                editorSettings,
            );
            const a = Object.assign(document.createElement('a'), { href: url, download: 'vidacut_edit.mp4' });
            a.click();
        } catch (e) { alert('Export failed: ' + e.message); }
        finally { setExporting(false); }
    };

    const clip = videoClips[selectedClip] || null;
    const AR = ASPECT_RATIOS.find(a => a.id === aspectRatio) || ASPECT_RATIOS[0];

    return (
        <div className="veditor-root">
            {/* ── Top Toolbar ── */}
            <div className="veditor-toolbar glass-panel">
                <div className="vtb-left">
                    <button className="vtb-btn" onClick={onBack} title="Back"><ChevronLeft size={16} /> Back</button>
                    <span className="vtb-sep" />
                    <button className="vtb-btn" title="Undo"><RotateCcw size={15} /></button>
                    <button className="vtb-btn" title="Redo"><RotateCw size={15} /></button>
                    <span className="vtb-sep" />
                    <button className="vtb-btn" onClick={splitAtPlayhead} title="Split at Playhead" disabled={selectedClip === null}>
                        <Scissors size={15} /> Split
                    </button>
                </div>

                {/* Aspect Ratio */}
                <div className="vtb-center">
                    {ASPECT_RATIOS.map(ar => {
                        const Icon = ar.icon;
                        return (
                            <button
                                key={ar.id}
                                className={`vtb-ar-btn ${aspectRatio === ar.id ? 'active' : ''}`}
                                onClick={() => setAspectRatio(ar.id)}
                                title={ar.label}
                            >
                                <Icon size={13} /> {ar.label}
                            </button>
                        );
                    })}
                </div>

                <div className="vtb-right">
                    <button
                        className={`vtb-export-btn ${exporting ? 'loading' : ''}`}
                        onClick={handleExport}
                        disabled={exporting || videoClips.length === 0}
                    >
                        {exporting ? `Exporting… ${exportProgress}%` : <><Download size={15} /> Export MP4</>}
                    </button>
                </div>
            </div>

            {/* ── Main Layout ── */}
            <div className="veditor-body">
                {/* ─── LEFT: Media Library ─── */}
                <aside className="veditor-library glass-panel">
                    <div className="lib-tabs">
                        {[
                            { id: 'media', label: 'Media', icon: Film },
                            { id: 'audio', label: 'Audio', icon: Music },
                            { id: 'text', label: 'Text', icon: Type },
                            { id: 'effects', label: 'Effects', icon: Sliders },
                        ].map(t => {
                            const Icon = t.icon;
                            return (
                                <button key={t.id} className={`lib-tab ${libTab === t.id ? 'active' : ''}`} onClick={() => setLibTab(t.id)}>
                                    <Icon size={13} /> {t.label}
                                </button>
                            );
                        })}
                    </div>

                    <div className="lib-body">
                        {/* ── MEDIA ── */}
                        {libTab === 'media' && (
                            <>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="video/*"
                                    multiple
                                    style={{ display: 'none' }}
                                    onChange={e => handleMediaDrop(e.target.files)}
                                />
                                <button className="lib-upload-btn" onClick={() => fileInputRef.current.click()}>
                                    <Upload size={14} /> Import Video
                                </button>
                                <div className="lib-grid">
                                    {videoClips.map((c, i) => (
                                        <div
                                            key={c.id}
                                            className={`lib-item ${selectedClip === i ? 'selected' : ''}`}
                                            onClick={() => { setSelectedClip(i); setCurrentClipIdx(i); }}
                                            draggable
                                            onDragStart={() => onDragStart(i)}
                                            onDragOver={e => onDragOver(e, i)}
                                        >
                                            <video
                                                src={c.url}
                                                className="lib-item-thumb"
                                                onLoadedMetadata={handleVideoMeta(i)}
                                                muted playsInline
                                            />
                                            <span className="lib-item-name">{c.name}</span>
                                        </div>
                                    ))}
                                    {videoClips.length === 0 && (
                                        <div className="lib-empty">Drop videos here or click Import</div>
                                    )}
                                </div>
                            </>
                        )}

                        {/* ── AUDIO ── */}
                        {libTab === 'audio' && (
                            <>
                                <input
                                    ref={audioInputRef}
                                    type="file"
                                    accept="audio/*"
                                    style={{ display: 'none' }}
                                    onChange={e => handleAudioDrop(e.target.files?.[0])}
                                />
                                <button className="lib-upload-btn" onClick={() => audioInputRef.current.click()}>
                                    <Music size={14} /> Import Audio
                                </button>
                                {audioTrack ? (
                                    <div className="audio-track-item">
                                        <Music size={16} className="text-success" />
                                        <span>{audioTrack.name}</span>
                                        <button onClick={() => setAudioTrack(null)}><Trash2 size={12} /></button>
                                    </div>
                                ) : (
                                    <div className="lib-empty">No audio track yet.</div>
                                )}
                                <div className="audio-controls">
                                    <label className="lib-label">Master Volume</label>
                                    <input type="range" min={0} max={1} step={0.01} value={audioVolume} onChange={e => setAudioVolume(+e.target.value)} className="audio-fader" />
                                    <button className="vtb-btn" onClick={() => setAudioMuted(m => !m)}>
                                        {audioMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                                    </button>
                                </div>
                            </>
                        )}

                        {/* ── TEXT ── */}
                        {libTab === 'text' && (
                            <>
                                <p className="lib-label">Click to add to canvas:</p>
                                {TEXT_PRESETS.map(tp => (
                                    <button key={tp.id} className="text-preset-btn" onClick={() => addText(tp)}>
                                        <span style={tp.style}>{tp.label}</span>
                                    </button>
                                ))}
                            </>
                        )}

                        {/* ── EFFECTS (presets) ── */}
                        {libTab === 'effects' && (
                            <div className="lib-effects-hint">
                                <Sliders size={20} className="text-muted" />
                                <p className="lib-label">Adjust Color, Effects, Transitions and Speed in the <strong>Properties</strong> panel on the right.</p>
                            </div>
                        )}
                    </div>
                </aside>

                {/* ─── CENTER: Preview + Timeline ─── */}
                <div className="veditor-center">
                    {/* Preview */}
                    <div className="veditor-preview-wrap">
                        <div
                            className="veditor-preview-canvas"
                            style={{ aspectRatio: AR.css }}
                        >
                            {previewUrl ? (
                                <video
                                    ref={videoRef}
                                    src={previewUrl}
                                    className="veditor-video"
                                    style={{ filter: editorSettings?.cssFilter || '' }}
                                    onTimeUpdate={e => setPlayhead(e.target.currentTime)}
                                    onEnded={() => setPlaying(false)}
                                    playsInline
                                />
                            ) : (
                                <div className="preview-placeholder">
                                    <Film size={40} className="text-muted" />
                                    <p className="text-muted">Import video clips to begin</p>
                                </div>
                            )}
                            {/* Text overlays */}
                            {textOverlays.map((t, i) => (
                                <div
                                    key={t.id}
                                    className={`canvas-text-overlay ${selectedText === i ? 'selected-overlay' : ''}`}
                                    style={{ top: `${t.y}%`, left: `${t.x}%`, ...t.style, cursor: 'move' }}
                                    onClick={() => setSelectedText(i)}
                                >
                                    {t.text}
                                </div>
                            ))}
                        </div>

                        {/* Playback controls */}
                        <div className="veditor-playback">
                            <button className="pb-btn" onClick={() => { if (videoRef.current) videoRef.current.currentTime = 0; }}>
                                <SkipBack size={16} />
                            </button>
                            <button className="pb-play" onClick={togglePlay}>
                                {playing ? <Pause size={20} /> : <Play size={20} />}
                            </button>
                            <button className="pb-btn" onClick={() => { if (videoRef.current) videoRef.current.currentTime = videoRef.current.duration; }}>
                                <SkipForward size={16} />
                            </button>
                            <span className="pb-time">
                                {String(Math.floor(playhead / 60)).padStart(2, '0')}:{String(Math.floor(playhead % 60)).padStart(2, '0')}
                            </span>
                            <div className="pb-zoom">
                                <button className="vtb-btn" onClick={zoomOut}><ZoomOut size={14} /></button>
                                <span className="pb-zoom-label">{pxPerSec}px/s</span>
                                <button className="vtb-btn" onClick={zoomIn}><ZoomIn size={14} /></button>
                            </div>
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className="veditor-timeline glass-panel" ref={timelineRef}>
                        <div className="tl-header">
                            <div className="tl-label">🎬 Video</div>
                        </div>
                        <div className="tl-track video-track">
                            {videoClips.length === 0 && (
                                <div className="tl-empty-hint">Drag clips here or import media →</div>
                            )}
                            {videoClips.map((c, i) => (
                                <div
                                    key={c.id}
                                    className={`tl-clip ${selectedClip === i ? 'selected' : ''}`}
                                    style={{ width: Math.max(60, ((c.duration - c.trimStart - c.trimEnd) * pxPerSec)) }}
                                    onClick={() => { setSelectedClip(i); setCurrentClipIdx(i); }}
                                    draggable
                                    onDragStart={() => onDragStart(i)}
                                    onDragOver={e => onDragOver(e, i)}
                                >
                                    <span className="tl-clip-name">{c.name}</span>
                                    <button className="tl-clip-del" onClick={e => { e.stopPropagation(); removeClip(i); }}>
                                        <Trash2 size={10} />
                                    </button>
                                </div>
                            ))}
                        </div>

                        {audioTrack && (
                            <>
                                <div className="tl-header">
                                    <div className="tl-label">🎵 Audio</div>
                                </div>
                                <div className="tl-track audio-track">
                                    <div className="tl-audio-bar">
                                        <Music size={12} /> {audioTrack.name}
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Text overlay track */}
                        {textOverlays.length > 0 && (
                            <>
                                <div className="tl-header"><div className="tl-label">💬 Text</div></div>
                                <div className="tl-track text-track">
                                    {textOverlays.map((t, i) => (
                                        <div
                                            key={t.id}
                                            className={`tl-clip text-clip ${selectedText === i ? 'selected' : ''}`}
                                            style={{ width: Math.max(60, t.endTime * pxPerSec), marginLeft: t.startTime * pxPerSec }}
                                            onClick={() => setSelectedText(i)}
                                        >
                                            <Type size={10} /> {t.text}
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* ─── RIGHT: Properties ─── */}
                <aside className="veditor-props glass-panel">
                    <div className="props-tabs">
                        <button className={`props-tab ${propTab === 'clip' ? 'active' : ''}`} onClick={() => setPropTab('clip')}>
                            <Film size={13} /> Clip
                        </button>
                        <button className={`props-tab ${propTab === 'color' ? 'active' : ''}`} onClick={() => setPropTab('color')}>
                            <Sliders size={13} /> Color & FX
                        </button>
                        {selectedText !== null && (
                            <button className={`props-tab ${propTab === 'text' ? 'active' : ''}`} onClick={() => setPropTab('text')}>
                                <Type size={13} /> Text
                            </button>
                        )}
                    </div>

                    <div className="props-body">
                        {/* ── Clip Properties ── */}
                        {propTab === 'clip' && (
                            <div className="clip-props">
                                {clip ? (
                                    <>
                                        <div className="prop-row">
                                            <label className="prop-label">Clip Speed</label>
                                            <div className="speed-pills">
                                                {[0.25, 0.5, 1, 1.5, 2].map(s => (
                                                    <button
                                                        key={s}
                                                        className={`speed-pill ${clip.speed === s ? 'active' : ''}`}
                                                        onClick={() => updateClipProp('speed', s)}
                                                    >{s}×</button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="prop-row">
                                            <label className="prop-label">Volume</label>
                                            <div className="prop-inline">
                                                <input
                                                    type="range" min={0} max={1} step={0.01}
                                                    value={clip.volume}
                                                    onChange={e => updateClipProp('volume', +e.target.value)}
                                                    className="prop-range"
                                                />
                                                <span className="prop-val">{Math.round(clip.volume * 100)}%</span>
                                            </div>
                                        </div>
                                        <div className="prop-row">
                                            <label className="prop-label">Trim Start (s)</label>
                                            <div className="prop-inline">
                                                <input
                                                    type="range" min={0} max={Math.max(0, clip.duration - clip.trimEnd - 0.1)} step={0.1}
                                                    value={clip.trimStart}
                                                    onChange={e => updateClipProp('trimStart', +e.target.value)}
                                                    className="prop-range"
                                                />
                                                <span className="prop-val">{clip.trimStart.toFixed(1)}s</span>
                                            </div>
                                        </div>
                                        <div className="prop-row">
                                            <label className="prop-label">Trim End (s)</label>
                                            <div className="prop-inline">
                                                <input
                                                    type="range" min={0} max={Math.max(0, clip.duration - clip.trimStart - 0.1)} step={0.1}
                                                    value={clip.trimEnd}
                                                    onChange={e => updateClipProp('trimEnd', +e.target.value)}
                                                    className="prop-range"
                                                />
                                                <span className="prop-val">{clip.trimEnd.toFixed(1)}s</span>
                                            </div>
                                        </div>
                                        <div className="prop-row">
                                            <label className="prop-label">Duration</label>
                                            <span className="prop-val">{(clip.duration - clip.trimStart - clip.trimEnd).toFixed(1)}s</span>
                                        </div>
                                        <button className="prop-remove-btn" onClick={() => removeClip(selectedClip)}>
                                            <Trash2 size={13} /> Remove Clip
                                        </button>
                                    </>
                                ) : (
                                    <div className="props-empty">
                                        <Film size={24} className="text-muted" />
                                        <p className="text-muted">Select a clip to edit its properties.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── Color & FX ── */}
                        {propTab === 'color' && (
                            <div className="props-color-scroll">
                                <EditorPanel
                                    videoUrl={previewUrl}
                                    onSettingsChange={setEditorSettings}
                                    compact
                                />
                            </div>
                        )}

                        {/* ── Text Properties ── */}
                        {propTab === 'text' && selectedText !== null && textOverlays[selectedText] && (
                            <div className="text-props">
                                <div className="prop-row">
                                    <label className="prop-label">Text Content</label>
                                    <input
                                        className="prop-input"
                                        value={textOverlays[selectedText].text}
                                        onChange={e => setTextOverlays(p => p.map((t, i) => i === selectedText ? { ...t, text: e.target.value } : t))}
                                    />
                                </div>
                                <div className="prop-row">
                                    <label className="prop-label">Start (s)</label>
                                    <input type="number" className="prop-input-sm" min={0} step={0.1}
                                        value={textOverlays[selectedText].startTime}
                                        onChange={e => setTextOverlays(p => p.map((t, i) => i === selectedText ? { ...t, startTime: +e.target.value } : t))}
                                    />
                                </div>
                                <div className="prop-row">
                                    <label className="prop-label">End (s)</label>
                                    <input type="number" className="prop-input-sm" min={0} step={0.1}
                                        value={textOverlays[selectedText].endTime}
                                        onChange={e => setTextOverlays(p => p.map((t, i) => i === selectedText ? { ...t, endTime: +e.target.value } : t))}
                                    />
                                </div>
                                <button className="prop-remove-btn" onClick={() => { setTextOverlays(p => p.filter((_, i) => i !== selectedText)); setSelectedText(null); }}>
                                    <Trash2 size={13} /> Remove Text
                                </button>
                            </div>
                        )}
                    </div>
                </aside>
            </div>
        </div>
    );
}
