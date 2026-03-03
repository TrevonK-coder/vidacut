import React from 'react';
import { FileText, Layout } from 'lucide-react';
import './PreProdHub.css';

const sections = [
    {
        id: 'script-brief',
        icon: FileText,
        title: 'Script & Brief',
        subtitle: 'Story Docs',
        description: 'Build out your full production script, define the creative vision with a treatment, and map every shot in detail.',
        tags: ['Script', 'Creative Treatment', 'Shot List'],
        gradient: 'gradient-purple',
    },
    {
        id: 'visual-logistics',
        icon: Layout,
        title: 'Visual & Logistics',
        subtitle: 'Planning Docs',
        description: 'Curate your mood board with references and manage every production detail with an interactive shoot checklist.',
        tags: ['Mood Board', 'Production Checklist'],
        gradient: 'gradient-pink',
    },
];

export default function PreProdHub({ onSelect }) {
    return (
        <div className="preprod-hub">
            <div className="hub-header">
                <h2 className="gradient-text">Pre-Production</h2>
                <p className="text-muted">
                    Build your complete creative package before a single frame is shot.
                </p>
            </div>
            <div className="hub-cards">
                {sections.map((sec) => {
                    const Icon = sec.icon;
                    return (
                        <button
                            key={sec.id}
                            className={`hub-card glass-panel ${sec.gradient}`}
                            onClick={() => onSelect(sec.id)}
                        >
                            <div className="hub-card-glow" />
                            <div className="hub-card-icon-wrap">
                                <Icon size={28} />
                            </div>
                            <div className="hub-card-content">
                                <span className="hub-card-subtitle">{sec.subtitle}</span>
                                <h3 className="hub-card-title">{sec.title}</h3>
                                <p className="hub-card-desc text-muted">{sec.description}</p>
                                <div className="hub-card-tags">
                                    {sec.tags.map((t) => (
                                        <span key={t} className="hub-tag">{t}</span>
                                    ))}
                                </div>
                            </div>
                            <span className="hub-card-arrow">→</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
