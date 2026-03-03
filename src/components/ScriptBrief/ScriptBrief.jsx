import React, { useState } from 'react';
import { FileText, Film, List, ChevronLeft, Plus, Trash2, Download } from 'lucide-react';
import './ScriptBrief.css';

// ─── Sub-Components ───────────────────────────────────────────────────────────

function ScriptEditor() {
    const [scenes, setScenes] = useState([
        { id: 1, scene: '1', voiceover: '', action: '' },
    ]);

    const addScene = () => {
        setScenes((prev) => [
            ...prev,
            { id: Date.now(), scene: String(prev.length + 1), voiceover: '', action: '' },
        ]);
    };

    const removeScene = (id) => setScenes((prev) => prev.filter((s) => s.id !== id));

    const update = (id, field, value) =>
        setScenes((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));

    const exportScript = () => {
        const lines = scenes.map(
            (s) =>
                `SCENE ${s.scene}\n` +
                `V/O: ${s.voiceover || '—'}\n` +
                `ACTION: ${s.action || '—'}\n`
        );
        const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'vidacut_script.txt';
        a.click();
    };

    return (
        <div className="sb-section">
            <div className="sb-intro">
                <p className="text-muted">Write your script scene-by-scene. Fill in the voiceover and on-screen action for each segment.</p>
            </div>
            <div className="script-table">
                <div className="script-table-header">
                    <span className="col-scene">Scene</span>
                    <span className="col-vo">Voiceover / Narration</span>
                    <span className="col-action">On-Screen Action / Visual</span>
                    <span className="col-del" />
                </div>
                {scenes.map((s, idx) => (
                    <div key={s.id} className="script-row glass-panel">
                        <span className="col-scene scene-num">{s.scene}</span>
                        <textarea
                            className="script-cell col-vo"
                            placeholder="What the narrator or character says…"
                            value={s.voiceover}
                            onChange={(e) => update(s.id, 'voiceover', e.target.value)}
                            rows={3}
                        />
                        <textarea
                            className="script-cell col-action"
                            placeholder="What happens visually on screen…"
                            value={s.action}
                            onChange={(e) => update(s.id, 'action', e.target.value)}
                            rows={3}
                        />
                        <button className="btn-del" onClick={() => removeScene(s.id)} title="Remove scene" disabled={scenes.length === 1}>
                            <Trash2 size={14} />
                        </button>
                    </div>
                ))}
            </div>
            <div className="sb-actions">
                <button className="btn-secondary" onClick={addScene}>
                    <Plus size={16} /> Add Scene
                </button>
                <button className="btn-primary" onClick={exportScript}>
                    <Download size={16} /> Export Script
                </button>
            </div>
        </div>
    );
}

function CreativeTreatment() {
    const fields = [
        { key: 'vision', label: 'Creative Vision', placeholder: 'What is the big idea? What feeling should the audience walk away with?', rows: 4 },
        { key: 'tone', label: 'Tone & Voice', placeholder: 'e.g. Cinematic and aspirational, warm and human, bold and provocative…', rows: 3 },
        { key: 'references', label: 'Visual References', placeholder: 'List films, ads, directors, or videos that inspire this project (URLs or titles)…', rows: 3 },
        { key: 'palette', label: 'Color Palette & Look', placeholder: 'Describe colors, grading style, contrast, etc. e.g. Desaturated teal tones, golden hour warmth…', rows: 3 },
        { key: 'music', label: 'Music & Sound Direction', placeholder: 'Genre, tempo, energy level — or a reference artist / track…', rows: 2 },
        { key: 'audience', label: 'Target Audience', placeholder: 'Who is this for? Age, sensibility, what do they care about?', rows: 2 },
    ];

    const [values, setValues] = useState(() =>
        Object.fromEntries(fields.map((f) => [f.key, '']))
    );

    const update = (key, val) => setValues((prev) => ({ ...prev, [key]: val }));

    const exportTreatment = () => {
        const lines = fields.map((f) => `${f.label.toUpperCase()}\n${values[f.key] || '—'}\n`);
        const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'vidacut_creative_treatment.txt';
        a.click();
    };

    return (
        <div className="sb-section">
            <div className="sb-intro">
                <p className="text-muted">Define the soul of this production. A strong creative treatment aligns your entire team around the same vision.</p>
            </div>
            <div className="treatment-grid">
                {fields.map((f) => (
                    <div key={f.key} className="treatment-field glass-panel">
                        <label className="field-label">{f.label}</label>
                        <textarea
                            className="field-textarea"
                            placeholder={f.placeholder}
                            value={values[f.key]}
                            onChange={(e) => update(f.key, e.target.value)}
                            rows={f.rows}
                        />
                    </div>
                ))}
            </div>
            <div className="sb-actions">
                <button className="btn-primary" onClick={exportTreatment}>
                    <Download size={16} /> Export Treatment
                </button>
            </div>
        </div>
    );
}

function ShotList() {
    const ANGLES = ['Wide', 'Medium', 'Close-Up', 'Extreme Close-Up', 'Over-The-Shoulder', 'POV', 'Low Angle', 'High Angle', 'Drone'];

    const [shots, setShots] = useState([
        { id: 1, scene: '1', description: '', angle: 'Wide', duration: '', notes: '' },
    ]);

    const addShot = () =>
        setShots((prev) => [
            ...prev,
            { id: Date.now(), scene: '', description: '', angle: 'Wide', duration: '', notes: '' },
        ]);

    const removeShot = (id) => setShots((prev) => prev.filter((s) => s.id !== id));

    const update = (id, field, value) =>
        setShots((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));

    const exportShots = () => {
        const header = 'Scene\tShot Description\tAngle\tDuration (s)\tNotes\n';
        const rows = shots.map((s) => `${s.scene}\t${s.description}\t${s.angle}\t${s.duration}\t${s.notes}`).join('\n');
        const blob = new Blob([header + rows], { type: 'text/tab-separated-values' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'vidacut_shot_list.tsv';
        a.click();
    };

    return (
        <div className="sb-section">
            <div className="sb-intro">
                <p className="text-muted">Plan every shot. This list is your crew's bible on set — the more detail, the smoother the shoot.</p>
            </div>
            <div className="shot-grid">
                <div className="shot-header">
                    <span>Scene</span>
                    <span>Shot Description</span>
                    <span>Angle</span>
                    <span>Duration (s)</span>
                    <span>Notes</span>
                    <span />
                </div>
                {shots.map((s) => (
                    <div key={s.id} className="shot-row glass-panel">
                        <input
                            className="shot-cell"
                            placeholder="1A"
                            value={s.scene}
                            onChange={(e) => update(s.id, 'scene', e.target.value)}
                        />
                        <input
                            className="shot-cell"
                            placeholder="Hero walks into frame carrying gear bag…"
                            value={s.description}
                            onChange={(e) => update(s.id, 'description', e.target.value)}
                        />
                        <select
                            className="shot-cell shot-select"
                            value={s.angle}
                            onChange={(e) => update(s.id, 'angle', e.target.value)}
                        >
                            {ANGLES.map((a) => <option key={a} value={a}>{a}</option>)}
                        </select>
                        <input
                            className="shot-cell"
                            type="number"
                            placeholder="5"
                            value={s.duration}
                            onChange={(e) => update(s.id, 'duration', e.target.value)}
                        />
                        <input
                            className="shot-cell"
                            placeholder="Handheld, magic hour…"
                            value={s.notes}
                            onChange={(e) => update(s.id, 'notes', e.target.value)}
                        />
                        <button className="btn-del" onClick={() => removeShot(s.id)} disabled={shots.length === 1}>
                            <Trash2 size={14} />
                        </button>
                    </div>
                ))}
            </div>
            <div className="sb-actions">
                <button className="btn-secondary" onClick={addShot}>
                    <Plus size={16} /> Add Shot
                </button>
                <button className="btn-primary" onClick={exportShots}>
                    <Download size={16} /> Export Shot List
                </button>
            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const TABS = [
    { id: 'script', label: 'Script', icon: FileText },
    { id: 'treatment', label: 'Creative Treatment', icon: Film },
    { id: 'shotlist', label: 'Shot List', icon: List },
];

export default function ScriptBrief({ onBack }) {
    const [activeTab, setActiveTab] = useState('script');

    return (
        <div className="sb-container">
            <div className="sb-topbar">
                <button className="btn-back" onClick={onBack}>
                    <ChevronLeft size={18} /> Pre-Production
                </button>
            </div>

            <div className="sb-head">
                <h2>Script <span className="gradient-text">&</span> Brief</h2>
                <p className="text-muted">Your storytelling foundation — from the first line of script to the final shot on the list.</p>
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
                {activeTab === 'script' && <ScriptEditor />}
                {activeTab === 'treatment' && <CreativeTreatment />}
                {activeTab === 'shotlist' && <ShotList />}
            </div>
        </div>
    );
}
