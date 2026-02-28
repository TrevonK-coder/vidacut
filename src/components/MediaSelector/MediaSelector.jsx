import React from 'react';
import { UploadCloud, FileVideo, Music, X } from 'lucide-react';
import './MediaSelector.css';

export default function MediaSelector({
    videos,
    setVideos,
    audio,
    setAudio
}) {

    const handleVideoUpload = (e) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            setVideos((prev) => [...prev, ...newFiles]);
        }
    };

    const handleAudioUpload = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            setAudio(e.target.files[0]);
        }
    };

    const removeVideo = (index) => {
        setVideos((prev) => prev.filter((_, i) => i !== index));
    };

    return (
        <div className="media-selector-container">
            {/* Video Upload Section */}
            <div className="upload-section glass-panel">
                <div className="section-header">
                    <FileVideo className="icon-gradient" />
                    <h3>Video Clips</h3>
                </div>
                <p className="text-muted text-sm mb-md">Select the raw footage you want the AI to cut.</p>

                <div className="media-grid">
                    {videos.map((vid, idx) => (
                        <div key={idx} className="media-item">
                            <div className="media-thumbnail video-placeholder">
                                <FileVideo size={32} color="var(--text-muted)" />
                            </div>
                            <span className="media-name">{vid.name}</span>
                            <button
                                className="btn-remove"
                                onClick={() => removeVideo(idx)}
                                title="Remove video"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    ))}

                    <label className="upload-dropzone video-dropzone">
                        <input
                            type="file"
                            accept="video/mp4,video/quicktime"
                            multiple
                            onChange={handleVideoUpload}
                            style={{ display: 'none' }}
                        />
                        <UploadCloud size={32} color="var(--accent-primary)" />
                        <span>Add Videos</span>
                    </label>
                </div>
            </div>

            {/* Audio Upload Section */}
            <div className="upload-section glass-panel mt-l">
                <div className="section-header">
                    <Music className="icon-gradient" />
                    <h3>Background Track</h3>
                </div>
                <p className="text-muted text-sm mb-md">Optional: Add an audio track to drive the edit's pacing.</p>

                {audio ? (
                    <div className="audio-item">
                        <Music size={24} color="var(--accent-secondary)" />
                        <span className="media-name flex-1">{audio.name}</span>
                        <button
                            className="btn-remove position-static"
                            onClick={() => setAudio(null)}
                            title="Remove audio"
                        >
                            <X size={14} />
                        </button>
                    </div>
                ) : (
                    <label className="upload-dropzone audio-dropzone">
                        <input
                            type="file"
                            accept="audio/mpeg,audio/wav"
                            onChange={handleAudioUpload}
                            style={{ display: 'none' }}
                        />
                        <UploadCloud size={24} color="var(--accent-secondary)" />
                        <span>Upload Audio Track</span>
                    </label>
                )}
            </div>
        </div>
    );
}
