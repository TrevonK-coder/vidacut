export async function detectBeats(audioFile) {
    if (!audioFile) return [];

    const arrayBuffer = await audioFile.arrayBuffer();
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();

    let audioBuffer;
    try {
        audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    } catch (err) {
        console.error("Error decoding audio data for beat detection:", err);
        await audioContext.close();
        // Fallback: return default 2s durations if we can't decode it
        return [];
    }

    // Analyze first channel
    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    const duration = audioBuffer.duration;

    // Minimum video clip length between beats to avoid flashing
    const minDistanceInSeconds = 1.2;
    const minDistanceInSamples = sampleRate * minDistanceInSeconds;

    // Calculate average amplitude to dynamically set a peak threshold
    let totalAmp = 0;
    const sampleStep = 100;
    for (let i = 0; i < channelData.length; i += sampleStep) {
        totalAmp += Math.abs(channelData[i]);
    }
    const avgAmp = totalAmp / (channelData.length / sampleStep);

    // Set threshold: higher multiplier = fewer cuts
    // We cap it so it's not impossibly high on very dynamic tracks
    const threshold = Math.min(avgAmp * 3.5, 0.8);

    const beats = [0]; // First cut always starts at 0
    let lastBeatSample = 0;

    // Find peaks
    for (let i = 0; i < channelData.length; i += 10) { // Step by 10 to speed up loop slightly
        const amplitude = Math.abs(channelData[i]);
        if (amplitude > threshold) {
            if (i - lastBeatSample > minDistanceInSamples) {
                beats.push(i / sampleRate);
                lastBeatSample = i;
            }
        }
    }

    // Ensure the last cut goes all the way to the end of the audio
    if (beats[beats.length - 1] < duration - 0.5) {
        beats.push(duration);
    } else {
        beats[beats.length - 1] = duration;
    }

    // Calculate durations between the beat timestamps
    const durations = [];
    for (let i = 1; i < beats.length; i++) {
        durations.push(beats[i] - beats[i - 1]);
    }

    await audioContext.close();

    // If track is very flat, just return 2 second chunks as a fallback
    if (durations.length === 0 || (durations.length === 1 && durations[0] === duration)) {
        const fallbackDurations = [];
        let current = 0;
        while (current < duration) {
            let chunk = Math.min(2.0, duration - current);
            fallbackDurations.push(chunk);
            current += chunk;
        }
        return fallbackDurations;
    }

    return durations;
}
