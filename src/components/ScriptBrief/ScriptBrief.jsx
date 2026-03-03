import React, { useState, useRef } from 'react';
import {
    FileText, Film, List, ChevronLeft, Plus, Trash2, Download,
    Sparkles, Loader, Lock, Upload, X, Mic, MicOff, Image as ImageIcon
} from 'lucide-react';
import { usePlan } from '../../context/PlanContext';
import { geminiRefine, generateStoryboardImage, fileToBase64, parseAIScript } from '../../lib/ai/geminiRefine';
import './ScriptBrief.css';

// ─── Shared: AI Refine Button ─ ────────────────────────────────────────────────

function AIRefineBtn({ type, content, onResult, imageBase64, imageType, label = '✨ Refine with AI' }) {
    const { plan } = usePlan();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    if (plan !== 'pro') return (
        <span className="pro-lock-badge"><Lock size={12} /> AI — Pro only</span>
    );

    const handleRefine = async () => {
        if (!content?.trim() && !imageBase64) { setError('Add a prompt or image first.'); return; }
        setError(null); setLoading(true);
        try { onResult(await geminiRefine(null, type, content || '', imageBase64, imageType)); }
        catch (e) { setError(e.message); }
        finally { setLoading(false); }
    };

    return (
        <div className="ai-refine-wrap">
            <button className="btn-ai-refine" onClick={handleRefine} disabled={loading}>
                {loading ? <Loader size={14} className="spin-slow" /> : <Sparkles size={14} />}
                {loading ? 'Generating…' : label}
            </button>
            {error && <p className="ai-error">{error}</p>}
        </div>
    );
}

// ─── Starter hints ─────────────────────────────────────────────────────────────

function StarterHints({ questions }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="starter-hints">
            <button className="starter-toggle" onClick={() => setOpen(v => !v)}>
                💡 {open ? 'Hide' : 'Show'} guiding questions
            </button>
            {open && <ul className="starter-list">{questions.map((q, i) => <li key={i}>{q}</li>)}</ul>}
        </div>
    );
}

// ─── JPEG Storyboard Export ────────────────────────────────────────────────────

async function exportAsJPEG(scenes) {
    const W = 1200, CARD_H = 400, PAD = 32, GAP = 24;
    const totalH = PAD + scenes.length * (CARD_H + GAP) + PAD;
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = totalH;
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#080a0c';
    ctx.fillRect(0, 0, W, totalH);

    // Title
    ctx.fillStyle = '#6366f1';
    ctx.font = 'bold 28px Inter, sans-serif';
    ctx.fillText('VIDACUT — SHOOTING SCRIPT', PAD, 48);
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillRect(PAD, 58, W - PAD * 2, 1);

    let y = 76;

    for (let i = 0; i < scenes.length; i++) {
        const s = scenes[i];
        const imgX = PAD, imgY = y, imgW = 320, imgH = CARD_H - 16;

        // Card background
        ctx.fillStyle = 'rgba(26, 29, 36, 0.9)';
        roundRect(ctx, PAD, y, W - PAD * 2, CARD_H, 14);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.07)';
        ctx.lineWidth = 1;
        roundRect(ctx, PAD, y, W - PAD * 2, CARD_H, 14);
        ctx.stroke();

        // Scene badge
        ctx.fillStyle = '#6366f1';
        roundRect(ctx, PAD + 16, y + 16, 80, 32, 8);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px Inter, sans-serif';
        ctx.fillText(`SCENE ${s.scene}`, PAD + 26, y + 37);

        // Sketch image area placeholder (or loaded image)
        ctx.fillStyle = 'rgba(15,17,22,0.8)';
        roundRect(ctx, imgX + 16, imgY + 60, imgW, imgH - 44, 8);
        ctx.fill();
        ctx.strokeStyle = 'rgba(99,102,241,0.25)';
        ctx.lineWidth = 1;
        roundRect(ctx, imgX + 16, imgY + 60, imgW, imgH - 44, 8);
        ctx.stroke();

        // Try to load the sketch image
        if (s.action) {
            try {
                const imgUrl = generateStoryboardImage(s.action);
                const img = await loadImage(imgUrl);
                ctx.drawImage(img, imgX + 16, imgY + 60, imgW, imgH - 44);
            } catch (_) {
                // Draw placeholder label if image fails
                ctx.fillStyle = 'rgba(99,102,241,0.4)';
                ctx.font = '12px Inter, sans-serif';
                ctx.fillText('[ sketch ]', imgX + 16 + imgW / 2 - 24, imgY + 60 + (imgH - 44) / 2);
            }
        }

        // Text area
        const tx = PAD + 16 + imgW + 24;
        const tw = W - PAD * 2 - imgW - 56;

        // V/O label
        ctx.fillStyle = '#22c55e';
        ctx.font = 'bold 11px Inter, sans-serif';
        ctx.fillText('VOICEOVER / NARRATION', tx, y + 36);
        ctx.fillStyle = 'rgba(241,245,249,0.9)';
        ctx.font = '15px Inter, sans-serif';
        wrapText(ctx, s.voiceover || '—', tx, y + 56, tw, 22);

        // Action label
        ctx.fillStyle = '#f43f5e';
        ctx.font = 'bold 11px Inter, sans-serif';
        ctx.fillText('ON-SCREEN ACTION', tx, y + 190);
        ctx.fillStyle = 'rgba(241,245,249,0.9)';
        ctx.font = '15px Inter, sans-serif';
        wrapText(ctx, s.action || '—', tx, y + 210, tw, 22);

        y += CARD_H + GAP;
    }

    // Download
    canvas.toBlob(blob => {
        const url = URL.createObjectURL(blob);
        const a = Object.assign(document.createElement('a'), { href: url, download: 'vidacut_storyboard.jpg' });
        a.click();
        URL.revokeObjectURL(url);
    }, 'image/jpeg', 0.92);
}

function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

function wrapText(ctx, text, x, y, maxW, lineH) {
    const words = text.split(' ');
    let line = '';
    let cy = y;
    for (const word of words) {
        const test = line + word + ' ';
        if (ctx.measureText(test).width > maxW && line) {
            ctx.fillText(line.trim(), x, cy);
            line = word + ' ';
            cy += lineH;
            if (cy > y + lineH * 7) { ctx.fillText('…', x, cy); break; }
        } else { line = test; }
    }
    if (line) ctx.fillText(line.trim(), x, cy);
}

function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new window.Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
        setTimeout(() => reject(new Error('timeout')), 8000);
    });
}

// ─── Script Editor ─────────────────────────────────────────────────────────────

const SCRIPT_HINTS = [
    'What is the opening visual? What does the viewer see first?',
    'Who is speaking — narrator, character, voiceover artist?',
    'What emotion should each scene evoke?',
    'What is the call-to-action or final line?',
];

function ScriptEditor() {
    const [scenes, setScenes] = useState([{ id: 1, scene: '1', voiceover: '', action: '' }]);
    const { plan } = usePlan();

    // Generate-from-brief state
    const [brief, setBrief] = useState('');
    const [briefImage, setBriefImage] = useState(null);  // { base64, type, preview }
    const [listening, setListening] = useState(false);
    const recognitionRef = useRef(null);
    const [generating, setGenerating] = useState(false);
    const [genError, setGenError] = useState(null);

    const addScene = () => setScenes(p => [...p, { id: Date.now(), scene: String(p.length + 1), voiceover: '', action: '' }]);
    const removeScene = id => setScenes(p => p.filter(s => s.id !== id));
    const update = (id, field, val) => setScenes(p => p.map(s => s.id === id ? { ...s, [field]: val } : s));

    const handleBriefImage = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const { base64, type } = await fileToBase64(file);
        setBriefImage({ base64, type, preview: URL.createObjectURL(file) });
    };

    const toggleVoice = () => {
        if (!('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
            alert('Voice input is not supported in this browser. Try Chrome.');
            return;
        }
        if (listening) {
            recognitionRef.current?.stop();
            setListening(false);
            return;
        }
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        const rec = new SR();
        rec.continuous = true;
        rec.interimResults = false;
        rec.onresult = e => {
            const transcript = Array.from(e.results).map(r => r[0].transcript).join(' ');
            setBrief(prev => (prev ? prev + ' ' : '') + transcript);
        };
        rec.onend = () => setListening(false);
        rec.start();
        recognitionRef.current = rec;
        setListening(true);
    };

    const generateFromBrief = async () => {
        if (!brief.trim() && !briefImage) { setGenError('Enter a brief or upload an image.'); return; }
        setGenError(null); setGenerating(true);
        try {
            const raw = await geminiRefine(null, 'script', brief, briefImage?.base64, briefImage?.type);
            const parsed = parseAIScript(raw);
            if (parsed.length) setScenes(parsed);
            else setGenError('Could not parse AI output — try a clearer brief.');
        } catch (e) { setGenError(e.message); }
        finally { setGenerating(false); }
    };

    const exportText = () => {
        const body = scenes.map(s => `SCENE ${s.scene}\nV/O: ${s.voiceover || '—'}\nACTION: ${s.action || '—'}`).join('\n\n');
        const a = Object.assign(document.createElement('a'), {
            href: URL.createObjectURL(new Blob([body], { type: 'text/plain' })),
            download: 'vidacut_script.txt',
        });
        a.click();
    };

    return (
        <div className="sb-section">
            {/* ─── Generate from Brief panel ─── */}
            <div className={`generate-brief-panel glass-panel ${plan !== 'pro' ? 'locked' : ''}`}>
                <div className="gbp-header">
                    <div>
                        <p className="gbp-title"><Sparkles size={15} /> Generate from Brief</p>
                        <p className="gbp-sub text-muted">Describe your idea — add an image or voice note for richer context.</p>
                    </div>
                    {plan !== 'pro' && <span className="badge-danger"><Lock size={11} /> Pro</span>}
                </div>

                <textarea
                    className="ai-raw-input"
                    placeholder="e.g. A 30-second promo for a new running shoe. Energetic, urban, shot at golden hour…"
                    value={brief}
                    onChange={e => setBrief(e.target.value)}
                    rows={3}
                    disabled={plan !== 'pro'}
                />

                <div className="gbp-inputs">
                    {/* Image upload */}
                    <label className={`gbp-attach-btn ${plan !== 'pro' ? 'disabled' : ''}`}>
                        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleBriefImage} disabled={plan !== 'pro'} />
                        <ImageIcon size={14} /> {briefImage ? 'Change Image' : 'Attach Image'}
                    </label>
                    {briefImage && (
                        <div className="gbp-img-preview">
                            <img src={briefImage.preview} alt="brief" />
                            <button onClick={() => setBriefImage(null)}><X size={12} /></button>
                        </div>
                    )}

                    {/* Voice input */}
                    <button
                        className={`gbp-attach-btn ${listening ? 'recording' : ''} ${plan !== 'pro' ? 'disabled' : ''}`}
                        onClick={toggleVoice}
                        disabled={plan !== 'pro'}
                    >
                        {listening ? <MicOff size={14} /> : <Mic size={14} />}
                        {listening ? 'Stop' : 'Voice Note'}
                    </button>
                    {listening && <span className="recording-dot" />}
                </div>

                {genError && <p className="ai-error">{genError}</p>}

                {plan === 'pro' ? (
                    <button className="btn-ai-refine" onClick={generateFromBrief} disabled={generating}>
                        {generating ? <Loader size={14} className="spin-slow" /> : <Sparkles size={14} />}
                        {generating ? 'Writing Script…' : '✨ Generate Industry Script'}
                    </button>
                ) : (
                    <p className="text-muted" style={{ fontSize: '0.8rem' }}>Switch to Pro in ⚙️ Settings to enable AI script generation.</p>
                )}
            </div>

            <StarterHints questions={SCRIPT_HINTS} />

            {/* ─── Scene table ─── */}
            <div className="script-table">
                <div className="script-table-header">
                    <span className="col-scene">Scene</span>
                    <span className="col-vo">Voiceover / Narration</span>
                    <span className="col-action">On-Screen Action</span>
                    <span className="col-del" />
                </div>
                {scenes.map(s => (
                    <div key={s.id} className="script-row glass-panel">
                        <span className="col-scene scene-num">{s.scene}</span>
                        <textarea className="script-cell col-vo" placeholder="What the narrator says…" value={s.voiceover} onChange={e => update(s.id, 'voiceover', e.target.value)} rows={3} />
                        <textarea className="script-cell col-action" placeholder="What happens visually…" value={s.action} onChange={e => update(s.id, 'action', e.target.value)} rows={3} />
                        <button className="btn-del" onClick={() => removeScene(s.id)} disabled={scenes.length === 1}><Trash2 size={14} /></button>
                    </div>
                ))}
            </div>

            <div className="sb-actions">
                <button className="btn-secondary" onClick={addScene}><Plus size={16} /> Add Scene</button>
                <button className="btn-secondary" onClick={exportText}><Download size={16} /> Export TXT</button>
                <button
                    className="btn-primary export-jpg-btn"
                    onClick={() => exportAsJPEG(scenes)}
                    title="Export as JPEG storyboard with AI sketches"
                >
                    <ImageIcon size={16} /> Export Storyboard JPG
                </button>
            </div>
        </div>
    );
}

// ─── Creative Treatment ────────────────────────────────────────────────────────

const TREATMENT_HINTS = [
    'What is the single most important emotion you want the audience to feel?',
    'Name 3 films or ads that share the visual feel you are going for.',
    'Describe your color palette in one sentence.',
    'Who is your audience and what do they care most about?',
];

const TREATMENT_FIELDS = [
    { key: 'vision', label: 'Creative Vision', placeholder: 'What is the big idea?', rows: 4 },
    { key: 'tone', label: 'Tone & Voice', placeholder: 'e.g. Cinematic and aspirational…', rows: 3 },
    { key: 'references', label: 'Visual References', placeholder: 'Films, ads, directors, URLs…', rows: 3 },
    { key: 'palette', label: 'Color Palette & Look', placeholder: 'Desaturated teal tones…', rows: 3 },
    { key: 'music', label: 'Music & Sound', placeholder: 'Genre, tempo, reference track…', rows: 2 },
    { key: 'audience', label: 'Target Audience', placeholder: 'Who is this for?', rows: 2 },
];

function CreativeTreatment() {
    const [values, setValues] = useState(() => Object.fromEntries(TREATMENT_FIELDS.map(f => [f.key, ''])));
    const [aiRaw, setAiRaw] = useState('');
    const [aiResult, setAiResult] = useState('');
    const { plan } = usePlan();
    const update = (key, val) => setValues(p => ({ ...p, [key]: val }));

    const exportTreatment = () => {
        const body = aiResult
            ? `AI-REFINED CREATIVE TREATMENT\n\n${aiResult}`
            : TREATMENT_FIELDS.map(f => `${f.label.toUpperCase()}\n${values[f.key] || '—'}`).join('\n\n');
        const a = Object.assign(document.createElement('a'), {
            href: URL.createObjectURL(new Blob([body], { type: 'text/plain' })),
            download: 'vidacut_creative_treatment.txt',
        });
        a.click();
    };

    return (
        <div className="sb-section">
            <StarterHints questions={TREATMENT_HINTS} />
            <div className="treatment-grid">
                {TREATMENT_FIELDS.map(f => (
                    <div key={f.key} className="treatment-field glass-panel">
                        <label className="field-label">{f.label}</label>
                        <textarea className="field-textarea" placeholder={f.placeholder} value={values[f.key]} onChange={e => update(f.key, e.target.value)} rows={f.rows} />
                    </div>
                ))}
            </div>
            {plan === 'pro' && (
                <div className="ai-section glass-panel">
                    <p className="ai-section-label"><Sparkles size={13} /> Drop your rough ideas for AI to elevate:</p>
                    <textarea className="ai-raw-input" placeholder="e.g. dark moody feel, like Fincher. target young professionals…" value={aiRaw} onChange={e => setAiRaw(e.target.value)} rows={3} />
                    <AIRefineBtn type="treatment" content={aiRaw} onResult={setAiResult} />
                    {aiResult && (
                        <>
                            <p className="ai-result-label">✅ AI-Refined — edit freely:</p>
                            <textarea className="ai-result-textarea" value={aiResult} onChange={e => setAiResult(e.target.value)} rows={8} />
                        </>
                    )}
                </div>
            )}
            <div className="sb-actions">
                <button className="btn-primary" onClick={exportTreatment}><Download size={16} /> Export Treatment</button>
            </div>
        </div>
    );
}

// ─── Shot List ─────────────────────────────────────────────────────────────────

const SHOT_HINTS = [
    'For each scene, what is the first shot that establishes the location?',
    'Which shots show emotion vs. action?',
    'Do you need drone or movement shots?',
    'How long should each shot hold?',
];

const ANGLES = ['Wide', 'Medium', 'Close-Up', 'Extreme Close-Up', 'Over-the-Shoulder', 'POV', 'Low Angle', 'High Angle', 'Drone / Aerial'];

function ShotList() {
    const [shots, setShots] = useState([{ id: 1, scene: '1', description: '', angle: 'Wide', duration: '', notes: '', image: null, imageLoading: false }]);
    const { plan } = usePlan();

    const addShot = () => setShots(p => [...p, { id: Date.now(), scene: '', description: '', angle: 'Wide', duration: '', notes: '', image: null, imageLoading: false }]);
    const removeShot = id => setShots(p => p.filter(s => s.id !== id));
    const update = (id, field, val) => setShots(p => p.map(s => s.id === id ? { ...s, [field]: val } : s));

    const handleImageUpload = (id, e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        update(id, 'image', URL.createObjectURL(file));
    };

    const handleGenerateImage = (id, description) => {
        if (!description.trim()) return;
        update(id, 'imageLoading', true);
        update(id, 'image', generateStoryboardImage(description));
    };

    const exportShots = () => {
        const header = 'Scene\tShot Description\tAngle\tDuration (s)\tNotes\n';
        const rows = shots.map(s => `${s.scene}\t${s.description}\t${s.angle}\t${s.duration}\t${s.notes}`).join('\n');
        const a = Object.assign(document.createElement('a'), {
            href: URL.createObjectURL(new Blob([header + rows], { type: 'text/tab-separated-values' })),
            download: 'vidacut_shot_list.tsv',
        });
        a.click();
    };

    return (
        <div className="sb-section">
            <StarterHints questions={SHOT_HINTS} />
            <div className="shot-list-rows">
                {shots.map(s => (
                    <div key={s.id} className="shot-card glass-panel">
                        <div className="shot-card-meta">
                            <div className="shot-meta-field">
                                <label className="shot-meta-label">Scene</label>
                                <input className="shot-cell" placeholder="1A" value={s.scene} onChange={e => update(s.id, 'scene', e.target.value)} />
                            </div>
                            <div className="shot-meta-field" style={{ flex: 3 }}>
                                <label className="shot-meta-label">Shot Description</label>
                                <input className="shot-cell" placeholder="Hero walks through fog…" value={s.description} onChange={e => update(s.id, 'description', e.target.value)} />
                            </div>
                            <div className="shot-meta-field">
                                <label className="shot-meta-label">Angle</label>
                                <select className="shot-cell shot-select" value={s.angle} onChange={e => update(s.id, 'angle', e.target.value)}>
                                    {ANGLES.map(a => <option key={a} value={a}>{a}</option>)}
                                </select>
                            </div>
                            <div className="shot-meta-field">
                                <label className="shot-meta-label">Duration (s)</label>
                                <input className="shot-cell" type="number" placeholder="5" value={s.duration} onChange={e => update(s.id, 'duration', e.target.value)} />
                            </div>
                            <div className="shot-meta-field" style={{ flex: 2 }}>
                                <label className="shot-meta-label">Notes</label>
                                <input className="shot-cell" placeholder="Handheld, golden hour…" value={s.notes} onChange={e => update(s.id, 'notes', e.target.value)} />
                            </div>
                            <button className="btn-del" onClick={() => removeShot(s.id)} disabled={shots.length === 1} style={{ alignSelf: 'flex-end', marginBottom: '2px' }}><Trash2 size={14} /></button>
                        </div>
                        <div className="shot-image-row">
                            {s.image ? (
                                <div className="shot-img-wrap">
                                    <img src={s.image} alt="Shot" className="shot-img" onLoad={() => update(s.id, 'imageLoading', false)} onError={() => update(s.id, 'imageLoading', false)} />
                                    {s.imageLoading && <div className="shot-img-loading"><Loader size={20} className="spin-slow" /></div>}
                                    <button className="shot-img-remove" onClick={() => update(s.id, 'image', null)}><X size={13} /> Remove</button>
                                </div>
                            ) : (
                                <div className="shot-image-actions">
                                    <label className="shot-img-btn">
                                        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleImageUpload(s.id, e)} />
                                        <Upload size={13} /> Upload Reference
                                    </label>
                                    {plan === 'pro' ? (
                                        <button className="shot-img-btn pro" onClick={() => handleGenerateImage(s.id, s.description)} disabled={!s.description.trim()}>
                                            <Sparkles size={13} /> Generate AI Sketch
                                        </button>
                                    ) : (
                                        <span className="pro-lock-badge"><Lock size={11} /> AI Sketch — Pro</span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            <div className="sb-actions">
                <button className="btn-secondary" onClick={addShot}><Plus size={16} /> Add Shot</button>
                <button className="btn-primary" onClick={exportShots}><Download size={16} /> Export Shot List</button>
            </div>
        </div>
    );
}

// ─── Main ──────────────────────────────────────────────────────────────────────

const TABS = [
    { id: 'script', label: 'Script', icon: FileText },
    { id: 'treatment', label: 'Treatment', icon: Film },
    { id: 'shotlist', label: 'Shot List', icon: List },
];

export default function ScriptBrief({ onBack }) {
    const [activeTab, setActiveTab] = useState('script');
    const { plan } = usePlan();

    return (
        <div className="sb-container">
            <div className="sb-topbar">
                <button className="btn-back" onClick={onBack}><ChevronLeft size={18} /> Pre-Production</button>
                <span className={`plan-badge ${plan}`}>{plan === 'pro' ? '✨ Pro' : 'Free'}</span>
            </div>
            <div className="sb-head">
                <h2>Script <span className="gradient-text">&</span> Brief</h2>
                <p className="text-muted">From rough idea to industry-standard script — with AI storyboard export.</p>
            </div>
            <div className="sb-tabs">
                {TABS.map(t => {
                    const Icon = t.icon;
                    return (
                        <button key={t.id} className={`sb-tab ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)}>
                            <Icon size={15} />{t.label}
                        </button>
                    );
                })}
            </div>
            <div className="sb-panel glass-panel">
                {activeTab === 'script' && <ScriptEditor />}
                {activeTab === 'treatment' && <CreativeTreatment />}
                {activeTab === 'shotlist' && <ShotList />}
            </div>
        </div>
    );
}
