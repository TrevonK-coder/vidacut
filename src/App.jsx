import React, { useState, useRef } from 'react';
import MediaSelector from './components/MediaSelector/MediaSelector';
import PromptBox from './components/PromptBox/PromptBox';
import AILoading from './components/AILoading/AILoading';
import { processVideos } from './lib/ffmpeg/videoProcessor';
import { detectBeats } from './lib/audio/beatDetector';
import './index.css';
import './App.css';

function App() {
  const [currentStep, setCurrentStep] = useState(1);
  const [videos, setVideos] = useState([]);
  const [audio, setAudio] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [loadingStatus, setLoadingStatus] = useState('Initializing...');
  const [outputVideoUrl, setOutputVideoUrl] = useState(null);
  const [error, setError] = useState(null);
  const downloadAnchorRef = useRef(null);

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
        videos,
        audio,
        beatDurations,
        (progress) => setRenderProgress(progress),
        (msg) => setLoadingStatus(msg)
      );
      setOutputVideoUrl(url);
    } catch (err) {
      console.error('FFmpeg error:', err);
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
    // Revoke object URL to free memory
    if (outputVideoUrl) URL.revokeObjectURL(outputVideoUrl);
    setOutputVideoUrl(null);
    setRenderProgress(0);
    setError(null);
    setCurrentStep(1);
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="logo">
          <span className="gradient-text">Vidacut</span> AI
        </div>
        <div className="step-indicator">
          <div className={`step ${currentStep >= 1 ? 'active' : ''}`}>1. Media</div>
          <div className="step-divider" />
          <div className={`step ${currentStep >= 2 ? 'active' : ''}`}>2. Prompt</div>
          <div className="step-divider" />
          <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>3. Render</div>
        </div>
      </header>

      <main className="wizard-content">
        {/* ─── Step 1: Media ─── */}
        {currentStep === 1 && (
          <div className="wizard-step glass-panel">
            <h2>Select Your Media</h2>
            <p className="text-muted mb-md">
              Upload the video clips and (optional) audio track you want the AI to use.
            </p>
            <MediaSelector
              videos={videos}
              setVideos={setVideos}
              audio={audio}
              setAudio={setAudio}
            />
            <button
              className="btn-primary mt-l"
              onClick={() => setCurrentStep(2)}
              disabled={videos.length === 0}
            >
              Continue to Prompt
            </button>
          </div>
        )}

        {/* ─── Step 2: Prompt ─── */}
        {currentStep === 2 && (
          <div className="wizard-step glass-panel">
            <PromptBox prompt={prompt} setPrompt={setPrompt} />
            <div className="btn-group mt-l">
              <button className="btn-secondary" onClick={() => setCurrentStep(1)}>
                Back
              </button>
              <button
                className="btn-primary"
                onClick={handleGenerate}
                disabled={!prompt.trim()}
              >
                ✨ Generate Video
              </button>
            </div>
          </div>
        )}

        {/* ─── Step 3: Render ─── */}
        {currentStep === 3 && (
          <div className="wizard-step glass-panel">
            {isGenerating && (
              <AILoading
                isGenerating={isGenerating}
                renderProgress={renderProgress}
                statusText={loadingStatus}
              />
            )}

            {!isGenerating && error && (
              <div className="render-error text-center">
                <h2 className="error-title">Render Failed</h2>
                <p className="text-muted mt-md mb-l error-detail">{error}</p>
                <div className="btn-group justify-center">
                  <button className="btn-secondary" onClick={handleStartOver}>
                    Start Over
                  </button>
                </div>
              </div>
            )}

            {!isGenerating && !error && outputVideoUrl && (
              <div className="render-complete text-center">
                <h2 className="gradient-text">Video Complete! 🎬</h2>
                <p className="text-muted mt-md mb-l">
                  Your AI-edited video is ready to preview and download.
                </p>

                {/* Real video player */}
                <video
                  className="output-video"
                  src={outputVideoUrl}
                  controls
                  autoPlay
                />

                <div className="btn-group justify-center mt-l">
                  <button className="btn-secondary" onClick={handleStartOver}>
                    Start Over
                  </button>
                  <button className="btn-primary" onClick={handleDownload}>
                    ⬇ Download MP4
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
