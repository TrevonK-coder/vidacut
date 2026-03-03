import React, { useState, useRef } from 'react';
import { ChevronLeft, Plus, Trash2, Download, Check, CheckSquare, Square, Image, Link } from 'lucide-react';
import './VisualLogistics.css';

// ─── Mood Board ───────────────────────────────────────────────────────────────

const MOOD_SECTIONS = [
    { id: 'color', label: '🎨 Color Palette' },
    { id: 'typography', label: '🔡 Typography' },
    { id: 'inspiration', label: '✨ Inspiration & References' },
    { id: 'wardrobe', label: '👔 Wardrobe & Styling' },
    { id: 'locations', label: '📍 Locations & Sets' },
];

function MoodBoard() {
    const [items, setItems] = useState(() =>
        Object.fromEntries(MOOD_SECTIONS.map((s) => [s.id, []]))
    );

    const fileRefs = useRef({});

    const addNote = (sectionId) => {
        setItems((prev) => ({
            ...prev,
            [sectionId]: [...prev[sectionId], { id: Date.now(), type: 'note', text: '' }],
        }));
    };

    const addUrl = (sectionId) => {
        setItems((prev) => ({
            ...prev,
            [sectionId]: [...prev[sectionId], { id: Date.now(), type: 'url', text: '' }],
        }));
    };

    const handleImageUpload = (sectionId, e) => {
        const files = Array.from(e.target.files || []);
        const newItems = files.map((f) => ({
            id: Date.now() + Math.random(),
            type: 'image',
            src: URL.createObjectURL(f),
            name: f.name,
        }));
        setItems((prev) => ({
            ...prev,
            [sectionId]: [...prev[sectionId], ...newItems],
        }));
    };

    const updateItem = (sectionId, id, text) => {
        setItems((prev) => ({
            ...prev,
            [sectionId]: prev[sectionId].map((item) =>
                item.id === id ? { ...item, text } : item
            ),
        }));
    };

    const removeItem = (sectionId, id) => {
        setItems((prev) => ({
            ...prev,
            [sectionId]: prev[sectionId].filter((item) => item.id !== id),
        }));
    };

    return (
        <div className="vl-section">
            <div className="sb-intro">
                <p className="text-muted">Build your visual reference board. Add images, color swatches, links, and notes under each category.</p>
            </div>
            <div className="moodboard-sections">
                {MOOD_SECTIONS.map((sec) => (
                    <div key={sec.id} className="mood-section glass-panel">
                        <div className="mood-section-header">
                            <span className="mood-section-label">{sec.label}</span>
                            <div className="mood-actions">
                                <button className="mood-action-btn" title="Add note" onClick={() => addNote(sec.id)}>
                                    <Plus size={13} /> Note
                                </button>
                                <button className="mood-action-btn" title="Add URL" onClick={() => addUrl(sec.id)}>
                                    <Link size={13} /> URL
                                </button>
                                <label className="mood-action-btn" title="Upload image">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        style={{ display: 'none' }}
                                        onChange={(e) => handleImageUpload(sec.id, e)}
                                    />
                                    <Image size={13} /> Image
                                </label>
                            </div>
                        </div>
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
                                            <button className="mood-item-del" onClick={() => removeItem(sec.id, item.id)}><Trash2 size={12} /></button>
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
        'Lock all filming locations / secure permits if needed',
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

    const toggle = (cat, id) => {
        setChecks((prev) => ({
            ...prev,
            [cat]: prev[cat].map((item) =>
                item.id === id ? { ...item, checked: !item.checked } : item
            ),
        }));
    };

    const exportChecklist = () => {
        const lines = Object.entries(checks).map(([cat, items]) => {
            const rows = items.map((i) => `  [${i.checked ? 'x' : ' '}] ${i.label}`).join('\n');
            return `${cat.toUpperCase()}\n${rows}`;
        });
        const blob = new Blob([lines.join('\n\n')], { type: 'text/plain' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'vidacut_production_checklist.txt';
        a.click();
    };

    const totalItems = Object.values(checks).flat().length;
    const doneItems = Object.values(checks).flat().filter((i) => i.checked).length;
    const progress = Math.round((doneItems / totalItems) * 100);

    return (
        <div className="vl-section">
            <div className="sb-intro">
                <p className="text-muted">Track every production task from pre-shoot to delivery. Check items off as you go.</p>
            </div>

            {/* Progress bar */}
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

            {/* Category groups */}
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
                                <button
                                    key={item.id}
                                    className={`cc-item ${item.checked ? 'checked' : ''}`}
                                    onClick={() => toggle(cat, item.id)}
                                >
                                    <span className="cc-checkbox">
                                        {item.checked ? <CheckSquare size={16} /> : <Square size={16} />}
                                    </span>
                                    <span className="cc-label">{item.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                );
            })}

            <div className="sb-actions">
                <button className="btn-primary" onClick={exportChecklist}>
                    <Download size={16} /> Export Checklist
                </button>
            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const TABS = [
    { id: 'moodboard', label: 'Mood Board', icon: Image },
    { id: 'checklist', label: 'Production Checklist', icon: Check },
];

export default function VisualLogistics({ onBack }) {
    const [activeTab, setActiveTab] = useState('moodboard');

    return (
        <div className="sb-container">
            <div className="sb-topbar">
                <button className="btn-back" onClick={onBack}>
                    <ChevronLeft size={18} /> Pre-Production
                </button>
            </div>

            <div className="sb-head">
                <h2>Visual <span className="gradient-text">&</span> Logistics</h2>
                <p className="text-muted">Reference boards and production checklists to keep every shoot on track.</p>
            </div>

            <div className="sb-tabs">
                {TABS.map((t) => {
                    const Icon = t.icon;
                    return (
                        <button
                            key={t.id}
                            className={`sb-tab ${activeTab === t.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(t.id)}
                        >
                            <Icon size={15} />
                            {t.label}
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
