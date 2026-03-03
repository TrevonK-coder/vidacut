import React, { useState } from 'react';
import { FileText, Film, List, ChevronLeft, Plus, Trash2, Download, Sparkles, Loader, Lock, Image, Upload, X } from 'lucide-react';
import { usePlan } from '../../context/PlanContext';
import { geminiRefine, generateStoryboardImage } from '../../lib/ai/geminiRefine';
import './ScriptBrief.css';

// ─── Shared AI Refine Button ───────────────────────────────────────────────────

function AIRefineBtn({ type, content, onResult }) {
    const { plan } = usePlan();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    if (plan !== 'pro') {
        return (
            <div className="pro-lock-badge">
                <Lock size={12} /> AI Refinement — Pro only
            </div>
        );
    }

    const handleRefine = async () => {
        if (!content?.trim()) { setError('Add some content first to refine.'); return; }
        setError(null);
        setLoading(true);
        try {
            const result = await geminiRefine(null, type, content);
            onResult(result);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="ai-refine-wrap">
            <button className="btn-ai-refine" onClick={handleRefine} disabled={loading}>
                {loading ? <Loader size={14} className="spin-slow" /> : <Sparkles size={14} />}
                {loading ? 'Refining…' : '✨ Refine with AI'}
            </button>
            {error && <p className="ai-error">{error}</p>}
        </div>
    );
}

// ─── Free Starter Box ─────────────────────────────────────────────────────────

function StarterHints({ questions }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="starter-hints">
            <button className="starter-toggle" onClick={() => setOpen((v) => !v)}>
                💡 {open ? 'Hide' : 'Show'} starter questions to guide you
            </button>
            {open && (
                <ul className="starter-list">
                    {questions.map((q, i) => <li key={i}>{q}</li>)}
                </ul>
            )}
        </div>
    );
}

// ─── Script Editor ────────────────────────────────────────────────────────────

const SCRIPT_HINTS = [
    'What is the opening visual? What does the viewer see first?',
    'Who is speaking — narrator, character, voiceover artist?',
    'What emotion should each scene evoke?',
    'How does the pacing change between scenes?',
    'What is the call-to-action or final message?',
];

function ScriptEditor() {
    const [scenes, setScenes] = useState([{ id: 1, scene: '1', voiceover: '', action: '' }]);
    const [aiRaw, setAiRaw] = useState('');
    const [aiResult, setAiResult] = useState('');
    const { plan } = usePlan();

    const addScene = () => setScenes((p) => [...p, { id: Date.now(), scene: String(p.length + 1), voiceover: '', action: '' }]);
    const removeScene = (id) => setScenes((p) => p.filter((s) => s.id !== id));
    const update = (id, field, val) => setScenes((p) => p.map((s) => s.id === id ? { ...s, [field]: val } : s));

    const exportScript = () => {
        const body = aiResult
            ? `AI-REFINED SCRIPT\n\n${aiResult}`
            : scenes.map((s) => `SCENE ${s.scene}\nV/O: ${s.voiceover || '—'}\nACTION: ${s.action || '—'}`).join('\n\n');
        const a = Object.assign(document.createElement('a'), {
            href: URL.createObjectURL(new Blob([body], { type: 'text/plain' })),
            download: 'vidacut_script.txt',
        });
        a.click();
    };

    return (
        <div className="sb-section">
            <StarterHints questions={SCRIPT_HINTS} />
            <div className="script-table">
                <div className="script-table-header">
                    <span className="col-scene">Scene</span>
                    <span className="col-vo">Voiceover / Narration</span>
                    <span className="col-action">On-Screen Action / Visual</span>
                    <span className="col-del" />
                </div>
                {scenes.map((s) => (
                    <div key={s.id} className="script-row glass-panel">
                        <span className="col-scene scene-num">{s.scene}</span>
                        <textarea className="script-cell col-vo" placeholder="What the narrator says…" value={s.voiceover} onChange={(e) => update(s.id, 'voiceover', e.target.value)} rows={3} />
                        <textarea className="script-cell col-action" placeholder="What happens visually…" value={s.action} onChange={(e) => update(s.id, 'action', e.target.value)} rows={3} />
                        <button className="btn-del" onClick={() => removeScene(s.id)} disabled={scenes.length === 1}><Trash2 size={14} /></button>
                    </div>
                ))}
            </div>

            {/* Pro AI Refinement */}
            {plan === 'pro' && (
                <div className="ai-section glass-panel">
                    <p className="ai-section-label"><Sparkles size={13} /> Paste your rough script notes below for AI to polish:</p>
                    <textarea className="ai-raw-input" placeholder="e.g. open wit hero walking in rain, narrator says something about new beginnings…" value={aiRaw} onChange={(e) => setAiRaw(e.target.value)} rows={4} />
                    <AIRefineBtn type="script" content={aiRaw} onResult={setAiResult} />
                    {aiResult && (
                        <>
                            <p className="ai-result-label">✅ AI-Refined Script — edit freely:</p>
                            <textarea className="ai-result-textarea" value={aiResult} onChange={(e) => setAiResult(e.target.value)} rows={10} />
                        </>
                    )}
                </div>
            )}

            <div className="sb-actions">
                <button className="btn-secondary" onClick={addScene}><Plus size={16} /> Add Scene</button>
                <button className="btn-primary" onClick={exportScript}><Download size={16} /> Export Script</button>
            </div>
        </div>
    );
}

// ─── Creative Treatment ───────────────────────────────────────────────────────

const TREATMENT_HINTS = [
    'What is the single most important emotion you want the audience to feel?',
    'Name 3 films or ads that share the visual feel you are going for.',
    'Describe your color palette in one sentence.',
    'What makes this project unique from similar content?',
    'Who is your audience and what do they care most about?',
];

const TREATMENT_FIELDS = [

    { key: 'vision', label: 'Creative Vision', placeholder: 'What is the big idea?', rows: 4 },
    { key: 'tone', label: 'Tone & Voice', placeholder: 'e.g. Cinematic and aspirational…', rows: 3 },
    { key: 'references', label: 'Visual References', placeholder: 'Films, ads, directors, URLs…', rows: 3 },
    { key: 'palette', label: 'Color Palette & Look', placeholder: 'Desaturated teal tones, golden hour warmth…', rows: 3 },
    { key: 'music', label: 'Music & Sound', placeholder: 'Genre, tempo, reference track…', rows: 2 },
    { key: 'audience', label: 'Target Audience', placeholder: 'Who is this for?', rows: 2 },
];

function CreativeTreatment() {
    const [values, setValues] = useState(() => Object.fromEntries(TREATMENT_FIELDS.map((f) => [f.key, ''])));
    const [aiRaw, setAiRaw] = useState('');
    const [aiResult, setAiResult] = useState('');
    const { plan } = usePlan();

    const update = (key, val) => setValues((p) => ({ ...p, [key]: val }));

    const exportTreatment = () => {
        const body = aiResult
            ? `AI-REFINED CREATIVE TREATMENT\n\n${aiResult}`
            : TREATMENT_FIELDS.map((f) => `${f.label.toUpperCase()}\n${values[f.key] || '—'}`).join('\n\n');
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
                {TREATMENT_FIELDS.map((f) => (
                    <div key={f.key} className="treatment-field glass-panel">
                        <label className="field-label">{f.label}</label>
                        <textarea className="field-textarea" placeholder={f.placeholder} value={values[f.key]} onChange={(e) => update(f.key, e.target.value)} rows={f.rows} />
                    </div>
                ))}
            </div>

            {plan === 'pro' && (
                <div className="ai-section glass-panel">
                    <p className="ai-section-label"><Sparkles size={13} /> Drop your rough treatment ideas here for AI to elevate:</p>
                    <textarea className="ai-raw-input" placeholder="e.g. dark moody feel, like Fincher. target young professionals. focus on authenticity…" value={aiRaw} onChange={(e) => setAiRaw(e.target.value)} rows={4} />
                    <AIRefineBtn type="treatment" content={aiRaw} onResult={setAiResult} />
                    {aiResult && (
                        <>
                            <p className="ai-result-label">✅ AI-Refined Treatment — edit freely:</p>
                            <textarea className="ai-result-textarea" value={aiResult} onChange={(e) => setAiResult(e.target.value)} rows={8} />
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

// ─── Shot List ────────────────────────────────────────────────────────────────

const SHOT_HINTS = [
    'For each scene, what is the first shot that establishes where we are?',
    'Which shots show emotion vs. which show action?',
    'Do you need any drone or movement shots? Where?',
    'What is the most important close-up in this piece?',
    'How long should each shot hold before cutting?',
];

const ANGLES = ['Wide', 'Medium', 'Close-Up', 'Extreme Close-Up', 'Over-The-Shoulder', 'POV', 'Low Angle', 'High Angle', 'Drone / Aerial'];

function ShotList() {
    const [shots, setShots] = useState([{ id: 1, scene: '1', description: '', angle: 'Wide', duration: '', notes: '', image: null, imageLoading: false }]);
    const { plan } = usePlan();

    const addShot = () => setShots((p) => [...p, { id: Date.now(), scene: '', description: '', angle: 'Wide', duration: '', notes: '', image: null, imageLoading: false }]);
    const removeShot = (id) => setShots((p) => p.filter((s) => s.id !== id));
    const update = (id, field, val) => setShots((p) => p.map((s) => s.id === id ? { ...s, [field]: val } : s));

    const handleImageUpload = (id, e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        update(id, 'image', URL.createObjectURL(file));
    };

    const handleGenerateImage = (id, description) => {
        if (!description.trim()) return;
        update(id, 'imageLoading', true);
        const url = generateStoryboardImage(description);
        // Image URL is synchronous with Pollinations; set it immediately
        // imageLoading will be cleared by onLoad/onError
        update(id, 'image', url);
    };

    const exportShots = () => {
        const header = 'Scene\tShot Description\tAngle\tDuration (s)\tNotes\n';
        const rows = shots.map((s) => `${s.scene}\t${s.description}\t${s.angle}\t${s.duration}\t${s.notes}`).join('\n');
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
                {shots.map((s) => (
                    <div key={s.id} className="shot-card glass-panel">
                        {/* Top row: scene/angle/duration/notes */}
                        <div className="shot-card-meta">
                            <div className="shot-meta-field">
                                <label className="shot-meta-label">Scene</label>
                                <input className="shot-cell" placeholder="1A" value={s.scene} onChange={(e) => update(s.id, 'scene', e.target.value)} />
                            </div>
                            <div className="shot-meta-field" style={{ flex: 3 }}>
                                <label className="shot-meta-label">Shot Description</label>
                                <input className="shot-cell" placeholder="Hero walks into frame through fog…" value={s.description} onChange={(e) => update(s.id, 'description', e.target.value)} />
                            </div>
                            <div className="shot-meta-field">
                                <label className="shot-meta-label">Angle</label>
                                <select className="shot-cell shot-select" value={s.angle} onChange={(e) => update(s.id, 'angle', e.target.value)}>
                                    {ANGLES.map((a) => <option key={a} value={a}>{a}</option>)}
                                </select>
                            </div>
                            <div className="shot-meta-field">
                                <label className="shot-meta-label">Duration (s)</label>
                                <input className="shot-cell" type="number" placeholder="5" value={s.duration} onChange={(e) => update(s.id, 'duration', e.target.value)} />
                            </div>
                            <div className="shot-meta-field" style={{ flex: 2 }}>
                                <label className="shot-meta-label">Notes</label>
                                <input className="shot-cell" placeholder="Handheld, magic hour…" value={s.notes} onChange={(e) => update(s.id, 'notes', e.target.value)} />
                            </div>
                            <button className="btn-del" onClick={() => removeShot(s.id)} disabled={shots.length === 1} style={{ alignSelf: 'flex-end', marginBottom: '2px' }}><Trash2 size={14} /></button>
                        </div>

                        {/* Image area */}
                        <div className="shot-image-row">
                            {s.image ? (
                                <div className="shot-img-wrap">
                                    <img
                                        src={s.image}
                                        alt="Shot reference"
                                        className="shot-img"
                                        onLoad={() => update(s.id, 'imageLoading', false)}
                                        onError={() => update(s.id, 'imageLoading', false)}
                                    />
                                    {s.imageLoading && <div className="shot-img-loading"><Loader size={20} className="spin-slow" /></div>}
                                    <button className="shot-img-remove" onClick={() => update(s.id, 'image', null)}><X size={13} /> Remove</button>
                                </div>
                            ) : (
                                <div className="shot-image-actions">
                                    <label className="shot-img-btn">
                                        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleImageUpload(s.id, e)} />
                                        <Upload size={13} /> Upload Reference
                                    </label>
                                    {plan === 'pro' ? (
                                        <button
                                            className="shot-img-btn pro"
                                            onClick={() => handleGenerateImage(s.id, s.description)}
                                            disabled={!s.description.trim()}
                                            title={!s.description.trim() ? 'Add a description first' : 'Generate AI storyboard frame'}
                                        >
                                            <Sparkles size={13} /> Generate AI Frame
                                        </button>
                                    ) : (
                                        <span className="pro-lock-badge"><Lock size={11} /> AI Frame — Pro</span>
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
    { id: 'treatment', label: 'Creative Treatment', icon: Film },
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
                <p className="text-muted">Your storytelling foundation — from the first line of script to the final frame.</p>
            </div>
            <div className="sb-tabs">
                {TABS.map((t) => {
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
