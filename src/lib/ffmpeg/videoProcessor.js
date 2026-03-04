import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

let ffmpeg = null;

/**
 * Load FFmpeg WASM core lazily (singleton).
 */
async function loadFFmpeg(onLog) {
    if (ffmpeg && ffmpeg.loaded) return ffmpeg;

    ffmpeg = new FFmpeg();

    if (onLog) {
        ffmpeg.on('log', ({ message }) => onLog(message));
    }

    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';

    await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });

    return ffmpeg;
}

/**
 * Main processor:
 * 1. Loads all video files into the FFmpeg virtual FS.
 * 2. Re-encodes all clips to H.264/AAC at a standard resolution for browser compat.
 * 3. Concatenates the re-encoded clips.
 * 4. Optionally mixes in an audio track.
 * 5. Returns an Object URL pointing to the final web-compatible MP4.
 *
 * Key flags for browser playback:
 *  - libx264: H.264 video — supported by all modern browsers
 *  - aac: audio — supported by all modern browsers
 *  - -movflags +faststart: moves moov atom to front so it can stream in-browser
 *  - -vf scale: normalises resolution to even numbers (H.264 requirement)
 *
 * @param {File[]} videoFiles
 * @param {File|null} audioFile
 * @param {Function} onProgress  (number 0–100) => void
 * @param {Function} onLog       (string) => void
 * @returns {Promise<string>} Object URL of the final MP4
 */
export async function processVideos(videoFiles, audioFile, beatDurations, onProgress, onLog, editorSettings) {
    const ff = await loadFFmpeg(onLog);

    ff.on('progress', ({ progress }) => {
        if (onProgress) onProgress(Math.min(Math.round(progress * 100), 95));
    });

    const rawNames = [];
    for (let i = 0; i < videoFiles.length; i++) {
        const rawName = `raw_${i}.mp4`;
        if (onLog) onLog(`Loading ${videoFiles[i].name}…`);
        await ff.writeFile(rawName, await fetchFile(videoFiles[i]));
        rawNames.push(rawName);
    }

    if (audioFile) {
        if (onLog) onLog(`Loading audio track: ${audioFile.name}…`);
        await ff.writeFile('audio_in.mp3', await fetchFile(audioFile));
    }

    // ── Step 2: Re-encode each clip with optional effects filter chain ──
    const encodedNames = [];
    for (let i = 0; i < rawNames.length; i++) {
        const outName = `enc_${i}.mp4`;
        if (onLog) onLog(`Re-encoding clip ${i + 1} of ${rawNames.length}${editorSettings ? ' + applying effects' : ''}…`);

        // Build video filter — always scale; append editor VF if provided
        const baseVF = 'scale=trunc(iw/2)*2:trunc(ih/2)*2';
        const vfFilter = editorSettings?.ffmpegVF
            ? editorSettings.ffmpegVF  // effectsProcessor already includes scale
            : baseVF;

        await ff.exec([
            '-i', rawNames[i],
            '-c:v', 'libx264',
            '-preset', 'ultrafast',
            '-crf', '23',
            '-pix_fmt', 'yuv420p',
            '-vf', vfFilter,
            '-r', '30',
            '-an',
            '-movflags', '+faststart',
            outName,
        ]);
        encodedNames.push(outName);
    }


    // ── Step 3: Concat all re-encoded clips according to beats ──
    const concatList = [];
    if (beatDurations && beatDurations.length > 0) {
        let videoIdx = 0;
        for (let i = 0; i < beatDurations.length; i++) {
            const duration = beatDurations[i];
            const vName = encodedNames[videoIdx];

            concatList.push(`file '${vName}'`);
            concatList.push(`inpoint 0`);
            concatList.push(`outpoint ${duration.toFixed(3)}`);

            // Loop through the uploaded videos
            videoIdx = (videoIdx + 1) % encodedNames.length;
        }
    } else {
        // Normal concat if no beats
        for (const n of encodedNames) {
            concatList.push(`file '${n}'`);
        }
    }

    await ff.writeFile('concat.txt', concatList.join('\n'));

    if (onLog) onLog('Concatenating clips…');
    await ff.exec([
        '-f', 'concat',
        '-safe', '0',
        '-i', 'concat.txt',
        '-c', 'copy',
        'concat_out.mp4',
    ]);

    // ── Step 4: Mix audio track (if provided) ──
    let finalFile;
    if (audioFile) {
        if (onLog) onLog('Adding audio track…');
        await ff.exec([
            '-i', 'concat_out.mp4',
            '-i', 'audio_in.mp3',
            '-map', '0:v',            // use video from the first input
            '-map', '1:a',            // use audio from the second input
            '-c:v', 'copy',           // video already encoded — just copy
            '-c:a', 'aac',            // encode the new audio to aac
            '-b:a', '128k',
            '-shortest',              // end when the shortest stream ends
            '-movflags', '+faststart',
            'output.mp4',
        ]);
        finalFile = 'output.mp4';
    } else {
        // No audio track; just re-apply faststart to concat result
        if (onLog) onLog('Finalizing video for browser playback…');
        await ff.exec([
            '-i', 'concat_out.mp4',
            '-c', 'copy',
            '-movflags', '+faststart',
            'output.mp4',
        ]);
        finalFile = 'output.mp4';
    }

    // ── Step 5: Read output and return an Object URL ──
    if (onLog) onLog('Packaging output…');
    const data = await ff.readFile(finalFile);
    const blob = new Blob([data.buffer], { type: 'video/mp4' });
    const url = URL.createObjectURL(blob);

    if (onProgress) onProgress(100);

    return url;
}
