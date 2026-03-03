import React, { useState, useRef } from 'react';
import { ChevronLeft, Plus, Trash2, Download, CheckSquare, Square, Image, Link, Sparkles, Lock, Loader } from 'lucide-react';
import { usePlan } from '../../context/PlanContext';
import { geminiRefine } from '../../lib/ai/geminiRefine';
import './VisualLogistics.css';

// ─── Shared: AI Refine inline ─────────────────────────────────────────────────

function AIRefineInline({ type, content, onResult }) {
    const { plan } = usePlan();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    if (plan !== 'pro') {
        return <span className="pro-lock-badge"><Lock size={11} /> AI Refine — Pro</span>;
    }

    const handleRefine = async () => {
        if (!content?.trim()) { setError('Add content first.'); return; }
        setError(null);
        setLoading(true);
        try { onResult(await geminiRefine(null, type, content)); }
        catch (e) { setError(e.message); }
        finally { setLoading(false); }
    };

    return (
        <div className="ai-refine-wrap">
            <button className="btn-ai-refine small" onClick={handleRefine} disabled={loading}>
                {loading ? <Loader size={12} className="spin-slow" /> : <Sparkles size={12} />}
                {loading ? 'Refining…' : '✨ Refine'}
            </button>
            {error && <p className="ai-error">{error}</p>}
        </div>
    );
}

// ─── Mood Board ───────────────────────────────────────────────────────────────

const MOOD_SECTIONS = [
    { id: 'color', label: '🎨 Color Palette' },
    { id: 'typography', label: '🔡 Typography' },
    { id: 'inspiration', label: '✨ Inspiration & References' },
    { id: 'wardrobe', label: '👔 Wardrobe & Styling' },
    { id: 'locations', label: '📍 Locations & Sets' },
];

const MOOD_HINTS = {
    color: 'What 3–5 colors define the visual identity? Warm or cool? High or low contrast?',
    typography: 'What font personality fits? Serif (classic), sans-serif (clean), display (dramatic)?',
    inspiration: 'Name 3 films, ads, or photographers whose visual style inspires this project.',
    wardrobe: 'What do the key people in this video wear? Formal, casual, uniform, streetwear?',
    locations: 'Describe the ideal look and feel of the spaces. Urban, natural, studio, industrial?',
};

function MoodBoard() {
    const [items, setItems] = useState(() => Object.fromEntries(MOOD_SECTIONS.map((s) => [s.id, []])));
    const { plan } = usePlan();

    const addNote = (id) => setItems((p) => ({ ...p, [id]: [...p[id], { id: Date.now(), type: 'note', text: '' }] }));
    const addUrl = (id) => setItems((p) => ({ ...p, [id]: [...p[id], { id: Date.now(), type: 'url', text: '' }] }));

    const handleImageUpload = (sId, e) => {
        const newItems = Array.from(e.target.files || []).map((f) => ({
            id: Date.now() + Math.random(), type: 'image', src: URL.createObjectURL(f), name: f.name,
        }));
        setItems((p) => ({ ...p, [sId]: [...p[sId], ...newItems] }));
    };

    const updateItem = (sId, id, text) =>
        setItems((p) => ({ ...p, [sId]: p[sId].map((item) => item.id === id ? { ...item, text } : item) }));

    const refineItem = (sId, id, refined) =>
        setItems((p) => ({ ...p, [sId]: p[sId].map((item) => item.id === id ? { ...item, text: refined } : item) }));

    const removeItem = (sId, id) =>
        setItems((p) => ({ ...p, [sId]: p[sId].filter((item) => item.id !== id) }));

    return (
        <div className="vl-section">
            <div className="sb-intro">
                <p className="text-muted">Build your visual reference board. Add images, color references, links, and notes under each category.</p>
            </div>
            <div className="moodboard-sections">
                {MOOD_SECTIONS.map((sec) => (
                    <div key={sec.id} className="mood-section glass-panel">
                        <div className="mood-section-header">
                            <span className="mood-section-label">{sec.label}</span>
                            <div className="mood-actions">
                                <button className="mood-action-btn" onClick={() => addNote(sec.id)}><Plus size={13} /> Note</button>
                                <button className="mood-action-btn" onClick={() => addUrl(sec.id)}><Link size={13} /> URL</button>
                                <label className="mood-action-btn">
                                    <input type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={(e) => handleImageUpload(sec.id, e)} />
                                    <Image size={13} /> Image
                                </label>
                            </div>
                        </div>

                        {/* Free starter hint */}
                        <p className="mood-starter-hint">💡 {MOOD_HINTS[sec.id]}</p>

                        {items[sec.id].length === 0 && (
                            <p className="mood-empty text-muted">No items yet — use the buttons above to add references.</p>
                        )}
                        <div className="mood-items">
                            {items[sec.id].map((item) => (
                                <div key={item.id} className="mood-item">
                                    {item.type === 'image' ? (
                                        <div className="mood-img-wrap">
                                            <img src={item.src} alt={item.name} className="mood-img" />
                                            <button className="mood-item-del" onClick={() => removeItem(sec.id, item.id)}><Trash2 size={12} /></button>
                                        </div>
                                    ) : (
                                        <div className="mood-text-wrap">
                                            <span className="mood-type-badge">{item.type === 'url' ? '🔗' : '📝'}</span>
                                            <input
                                                className="mood-text-input"
                                                placeholder={item.type === 'url' ? 'https://…' : 'Add a note…'}
                                                value={item.text}
                                                onChange={(e) => updateItem(sec.id, item.id, e.target.value)}
                                            />
                                            <AIRefineInline type="moodboard" content={item.text} onResult={(r) => refineItem(sec.id, item.id, r)} />
                                            <button className="mood-item-del static" onClick={() => removeItem(sec.id, item.id)}><Trash2 size={12} /></button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Production Checklist ─────────────────────────────────────────────────────

const DEFAULT_CHECKLIST = {
    'Pre-Shoot': [
        'Confirm shoot dates and call times with entire crew',
        'Lock all filming locations / secure permits',
        'Finalize and distribute the shot list',
        'Cast confirmed and contracts signed',
        'Wardrobe approved and sourced',
        'Equipment list finalized and rented/packed',
        'Battery banks, memory cards, and backup drives packed',
        'Props sourced and ready',
        'Catering / craft services arranged',
        'Travel and parking logistics confirmed',
        'Weather check for outdoor scenes',
        'Script and call sheets distributed',
    ],
    'On Set': [
        'Director briefing done before roll',
        'Sound check and levels verified',
        'Color chart / white balance captured',
        'All shots from shot list captured',
        'B-roll and cutaway coverage captured',
        'Audio backup recorded separately',
        'Rolling backups to second media',
        'Wrap confirmed with director sign-off',
        'Equipment checked back in',
        'Location left clean and restored',
    ],
    'Post-Production': [
        'All footage safely backed up (3-2-1 rule)',
        'Footage catalogued and colour-coded in library',
        'First rough cut assembled',
        'Client / stakeholder rough cut review',
        'Music licensing confirmed',
        'Colour grade and LUT applied',
        'Sound mix and mastering done',
        'Titles, motion graphics, and lower thirds finalized',
        'Final cut client approval obtained',
        'Export in all required formats and resolutions',
        'Delivered to client',
    ],
};

function ProductionChecklist() {
    const [checks, setChecks] = useState(() => {
        const state = {};
        Object.entries(DEFAULT_CHECKLIST).forEach(([cat, items]) => {
            state[cat] = items.map((label) => ({ id: `${cat}-${label}`, label, checked: false }));
        });
        return state;
    });
    const [aiContext, setAiContext] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    const [aiError, setAiError] = useState(null);
    const { plan } = usePlan();

    const toggle = (cat, id) =>
        setChecks((p) => ({ ...p, [cat]: p[cat].map((item) => item.id === id ? { ...item, checked: !item.checked } : item) }));

    const addAIItems = async () => {

        if (!aiContext.trim()) { setAiError('Describe your shoot first.'); return; }
        setAiError(null);
        setAiLoading(true);
        try {
            const result = await geminiRefine(null, 'checklist', aiContext);
            const newItems = result.split('\n')
                .map((l) => l.replace(/^[-•*]\s*/, '').trim())
                .filter((l) => l.length > 3)
                .map((label) => ({ id: `ai-${Date.now()}-${Math.random()}`, label, checked: false }));
            setChecks((p) => ({
                ...p,
                'Pre-Shoot': [...p['Pre-Shoot'], ...newItems],
            }));
        } catch (e) {
            setAiError(e.message);
        } finally {
            setAiLoading(false);
        }
    };

    const exportChecklist = () => {
        const lines = Object.entries(checks).map(([cat, items]) => {
            const rows = items.map((i) => `  [${i.checked ? 'x' : ' '}] ${i.label}`).join('\n');
            return `${cat.toUpperCase()}\n${rows}`;
        });
        const a = Object.assign(document.createElement('a'), {
            href: URL.createObjectURL(new Blob([lines.join('\n\n')], { type: 'text/plain' })),
            download: 'vidacut_production_checklist.txt',
        });
        a.click();
    };

    const totalItems = Object.values(checks).flat().length;
    const doneItems = Object.values(checks).flat().filter((i) => i.checked).length;
    const progress = totalItems ? Math.round((doneItems / totalItems) * 100) : 0;

    return (
        <div className="vl-section">
            <div className="sb-intro">
                <p className="text-muted">Track every task from pre-shoot to delivery. Check items off as your production progresses.</p>
            </div>

            <div className="checklist-progress glass-panel">
                <div className="cp-label">
                    <span className="text-muted">Overall Progress</span>
                    <span className="cp-count"><b>{doneItems}</b> / {totalItems} tasks</span>
                </div>
                <div className="progress-bar-bg">
                    <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
                </div>
                <span className="cp-pct gradient-text">{progress}%</span>
            </div>

            {Object.entries(checks).map(([cat, items]) => {
                const catDone = items.filter((i) => i.checked).length;
                return (
                    <div key={cat} className="checklist-category glass-panel">
                        <div className="cc-header">
                            <span className="cc-title">{cat}</span>
                            <span className="cc-badge">{catDone}/{items.length}</span>
                        </div>
                        <div className="cc-items">
                            {items.map((item) => (
                                <button key={item.id} className={`cc-item ${item.checked ? 'checked' : ''}`} onClick={() => toggle(cat, item.id)}>
                                    <span className="cc-checkbox">{item.checked ? <CheckSquare size={16} /> : <Square size={16} />}</span>
                                    <span className="cc-label">{item.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                );
            })}

            {/* Pro: AI suggested items */}
            {plan === 'pro' && (
                <div className="ai-section glass-panel">
                    <p className="ai-section-label"><Sparkles size={13} /> Describe your shoot and AI will suggest additional checklist items:</p>
                    <textarea className="ai-raw-input" placeholder="e.g. Outdoor documentary shoot, 2-person crew, talent is a chef, filming in a busy kitchen…" value={aiContext} onChange={(e) => setAiContext(e.target.value)} rows={3} />
                    <div className="ai-refine-wrap">
                        <button className="btn-ai-refine" onClick={addAIItems} disabled={aiLoading}>
                            {aiLoading ? <Loader size={14} className="spin-slow" /> : <Sparkles size={14} />}
                            {aiLoading ? 'Thinking…' : '✨ Suggest Additional Tasks'}
                        </button>
                        {aiError && <p className="ai-error">{aiError}</p>}
                    </div>
                </div>
            )}
            {plan === 'free' && (
                <div className="pro-lock-banner">
                    <Lock size={14} /> <b>Pro:</b> AI suggests additional shoot-specific checklist tasks based on your production details.
                </div>
            )}

            <div className="sb-actions">
                <button className="btn-primary" onClick={exportChecklist}><Download size={16} /> Export Checklist</button>
            </div>
        </div>
    );
}

// ─── Main ──────────────────────────────────────────────────────────────────────

const TABS = [
    { id: 'moodboard', label: 'Mood Board', icon: Image },
    { id: 'checklist', label: 'Production Checklist', icon: CheckSquare },
];

export default function VisualLogistics({ onBack }) {
    const [activeTab, setActiveTab] = useState('moodboard');
    const { plan } = usePlan();

    return (
        <div className="sb-container">
            <div className="sb-topbar">
                <button className="btn-back" onClick={onBack}><ChevronLeft size={18} /> Pre-Production</button>
                <span className={`plan-badge ${plan}`}>{plan === 'pro' ? '✨ Pro' : 'Free'}</span>
            </div>
            <div className="sb-head">
                <h2>Visual <span className="gradient-text">&</span> Logistics</h2>
                <p className="text-muted">Reference boards and production checklists to keep every shoot on track.</p>
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
                {activeTab === 'moodboard' && <MoodBoard />}
                {activeTab === 'checklist' && <ProductionChecklist />}
            </div>
        </div>
    );
}
