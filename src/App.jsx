import React, { useState } from 'react';
import { Settings, Sparkles, Scissors, ChevronRight } from 'lucide-react';
import MediaSelector from './components/MediaSelector/MediaSelector';
import PromptBox from './components/PromptBox/PromptBox';
import AILoading from './components/AILoading/AILoading';
import EditorPanel from './components/EditorPanel/EditorPanel';
import VideoEditor from './components/VideoEditor/VideoEditor';
import PreProdHub from './components/PreProdHub/PreProdHub';
import ScriptBrief from './components/ScriptBrief/ScriptBrief';
import VisualLogistics from './components/VisualLogistics/VisualLogistics';
import SettingsPanel from './components/SettingsPanel/SettingsPanel';
import { PlanProvider } from './context/PlanContext';
import { processVideos } from './lib/ffmpeg/videoProcessor';
import { detectBeats } from './lib/audio/beatDetector';
import './index.css';
import './App.css';

// ─── Start Mode Modal ─────────────────────────────────────────────────────────
function StartModal({ onChoose }) {
  return (
    <div className="start-modal-overlay">
      <div className="start-modal glass-panel">
        <div className="start-modal-header">
          <h2 className="gradient-text">How would you like to start?</h2>
          <p className="text-muted">Choose your editing experience below</p>
        </div>
        <div className="start-modal-cards">
          {/* AI Assisted */}
          <button className="start-card start-card-ai" onClick={() => onChoose('ai')}>
            <div className="start-card-icon"><Sparkles size={32} /></div>
            <div>
              <h3>✨ AI Assisted</h3>
              <p>Upload clips, write a prompt — AI edits, arranges, and syncs your video automatically.</p>
              <ul>
                <li>🎵 Beat-synced cuts</li>
                <li>🎨 Smart color grading</li>
                <li>⚡ One-click generation</li>
              </ul>
            </div>
            <span className="start-card-cta">Start with AI <ChevronRight size={16} /></span>
          </button>

          {/* Manual Edit */}
          <button className="start-card start-card-manual" onClick={() => onChoose('manual')}>
            <div className="start-card-icon"><Scissors size={32} /></div>
            <div>
              <h3>✂️ Manual Edit</h3>
              <p>Open the professional editor — full control with timeline, transitions, color grading, text overlays and more.</p>
              <ul>
                <li>🎞 Timeline-based editing</li>
                <li>🎨 Color grading tools</li>
                <li>💬 Text & title overlays</li>
              </ul>
            </div>
            <span className="start-card-cta">Open Editor <ChevronRight size={16} /></span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
function AppInner() {
  const [activeMode, setActiveMode] = useState('editor');
  const [preProdSection, setPreProdSection] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Start choice: null = show modal; 'ai' = AI wizard; 'manual' = pro editor
  const [editorMode, setEditorMode] = useState(null);

  // AI wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const [videos, setVideos] = useState([]);
  const [audio, setAudio] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [loadingStatus, setLoadingStatus] = useState('Initializing...');
  const [outputVideoUrl, setOutputVideoUrl] = useState(null);
  const [error, setError] = useState(null);
  const [editorSettings, setEditorSettings] = useState(null);

  const handleModeSwitch = (mode) => {
    setActiveMode(mode);
    if (mode === 'preproduction') setPreProdSection(null);
    if (mode === 'editor') setEditorMode(null); // re-show choice modal
  };

  const handleGenerate = async () => {
    setCurrentStep(3);
    setIsGenerating(true);
    setRenderProgress(0);
    setOutputVideoUrl(null);
    setError(null);
    try {
      let beatDurations = null;
      if (audio) {
        setLoadingStatus('Analyzing audio beats...');
        beatDurations = await detectBeats(audio);
      }
      setLoadingStatus('Initializing video processor...');
      const url = await processVideos(
        videos, audio, beatDurations,
        (p) => setRenderProgress(p),
        (m) => setLoadingStatus(m),
        editorSettings,
      );
      setOutputVideoUrl(url);
    } catch (err) {
      setError(err.message || 'An unknown error occurred during rendering.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!outputVideoUrl) return;
    const a = document.createElement('a');
    a.href = outputVideoUrl;
    a.download = 'vidacut_output.mp4';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleStartOver = () => {
    if (outputVideoUrl) URL.revokeObjectURL(outputVideoUrl);
    setOutputVideoUrl(null);
    setRenderProgress(0);
    setError(null);
    setCurrentStep(1);
    setEditorMode(null); // back to start modal
  };

  // Manual editor: full-screen
  if (activeMode === 'editor' && editorMode === 'manual') {
    return (
      <VideoEditor
        onBack={() => setEditorMode(null)}
        initialFiles={videos}
      />
    );
  }

  return (
    <div className="app-container">
      {settingsOpen && <SettingsPanel onClose={() => setSettingsOpen(false)} />}

      <header className="app-header">
        <div className="header-top">
          <div className="logo">
            <span className="gradient-text">Vidacut</span> AI
          </div>
          <div className="header-controls">
            <div className="mode-toggle">
              <button
                className={`mode-btn ${activeMode === 'editor' ? 'active' : ''}`}
                onClick={() => handleModeSwitch('editor')}
              >🎬 Video Editor</button>
              <button
                className={`mode-btn ${activeMode === 'preproduction' ? 'active' : ''}`}
                onClick={() => handleModeSwitch('preproduction')}
              >🎭 Pre-Production</button>
            </div>
            <button className="settings-gear" onClick={() => setSettingsOpen(true)} title="Settings">
              <Settings size={18} />
            </button>
          </div>
        </div>

        {activeMode === 'editor' && editorMode === 'ai' && (
          <div className="step-indicator">
            <div className={`step ${currentStep >= 1 ? 'active' : ''}`}>1. Media</div>
            <div className="step-divider" />
            <div className={`step ${currentStep >= 2 ? 'active' : ''}`}>2. Prompt</div>
            <div className="step-divider" />
            <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>3. Render</div>
          </div>
        )}
      </header>

      <main className="wizard-content">
        {/* ─── Editor Mode ─── */}
        {activeMode === 'editor' && (
          <>
            {/* Start Modal */}
            {!editorMode && (
              <StartModal onChoose={(choice) => {
                setEditorMode(choice);
                if (choice === 'ai') setCurrentStep(1);
              }} />
            )}

            {/* AI Wizard */}
            {editorMode === 'ai' && (
              <>
                {currentStep === 1 && (
                  <div className="wizard-step glass-panel">
                    <h2>Select Your Media</h2>
                    <p className="text-muted mb-md">Upload video clips and an optional audio track for the AI to use.</p>
                    <MediaSelector videos={videos} setVideos={setVideos} audio={audio} setAudio={setAudio} />
                    <div className="btn-group mt-l">
                      <button className="btn-secondary" onClick={() => setEditorMode(null)}>← Back</button>
                      <button className="btn-primary" onClick={() => setCurrentStep(2)} disabled={videos.length === 0}>
                        Continue to Prompt
                      </button>
                    </div>
                  </div>
                )}
                {currentStep === 2 && (
                  <div className="wizard-step glass-panel">
                    <PromptBox prompt={prompt} setPrompt={setPrompt} />
                    <div className="btn-group mt-l">
                      <button className="btn-secondary" onClick={() => setCurrentStep(1)}>Back</button>
                      <button className="btn-primary" onClick={handleGenerate} disabled={!prompt.trim()}>✨ Generate Video</button>
                    </div>
                  </div>
                )}
                {currentStep === 3 && (
                  <div className="wizard-step glass-panel">
                    {isGenerating && <AILoading isGenerating={isGenerating} renderProgress={renderProgress} statusText={loadingStatus} />}
                    {!isGenerating && error && (
                      <div className="render-error text-center">
                        <h2 className="error-title">Render Failed</h2>
                        <p className="text-muted mt-md mb-l error-detail">{error}</p>
                        <div className="btn-group justify-center">
                          <button className="btn-secondary" onClick={handleStartOver}>Start Over</button>
                        </div>
                      </div>
                    )}
                    {!isGenerating && !error && outputVideoUrl && (
                      <div className="render-complete text-center">
                        <h2 className="gradient-text">Video Complete! 🎬</h2>
                        <p className="text-muted mt-md mb-l">Preview your edit below. Use the editor panel to adjust color, effects, and transitions — then re-render.</p>
                        <video className="output-video" src={outputVideoUrl} controls autoPlay />
                        <EditorPanel videoUrl={outputVideoUrl} onSettingsChange={setEditorSettings} />
                        <div className="btn-group justify-center mt-l">
                          <button className="btn-secondary" onClick={handleStartOver}>Start Over</button>
                          <button className="btn-secondary" onClick={handleGenerate}>🔄 Re-Render with Effects</button>
                          <button className="btn-primary" onClick={handleDownload}>⬇ Download MP4</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ─── Pre-Production ─── */}
        {activeMode === 'preproduction' && (
          <>
            {!preProdSection && <PreProdHub onSelect={setPreProdSection} />}
            {preProdSection === 'script-brief' && <ScriptBrief onBack={() => setPreProdSection(null)} />}
            {preProdSection === 'visual-logistics' && <VisualLogistics onBack={() => setPreProdSection(null)} />}
          </>
        )}
      </main>

      {/* ─── Partner Footer ─── */}
      <footer className="partner-footer">
        <div className="partner-footer-inner">
          <span className="partner-label">Partner in Development</span>
          <div className="partner-logo-wrap">
            <img
              src="/vidacut/partner-logo.png"
              alt="Partner Logo"
              className="partner-logo-img"
              onError={e => { e.currentTarget.style.display = 'none'; }}
            />
          </div>
        </div>
      </footer>

      {/* ─── Floating Watermark ─── */}
      <div className="watermark-wrap" aria-hidden="true">
        <img
          src="/vidacut/partner-logo.png"
          alt=""
          className="watermark-img"
          onError={e => { e.currentTarget.style.display = 'none'; }}
        />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <PlanProvider>
      <AppInner />
    </PlanProvider>
  );
}
