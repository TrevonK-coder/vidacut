/**
 * effectsProcessor.js
 * Converts user-chosen editing settings into:
 *   1. A CSS filter string  — for real-time canvas/video preview (zero lag)
 *   2. An FFmpeg -vf string — for final render
 *
 * All filters use FFmpeg built-ins (no external plugins required).
 * Free & open-source: FFmpeg is LGPL/GPL.
 */

// ─── Default settings object ────────────────────────────────────────────────

export const DEFAULT_SETTINGS = {
    // Color
    brightness: 0,      // -100 … +100  (maps to eq= -1 … 1)
    contrast: 0,        // -100 … +100  (maps to eq= 0 … 3 via (val+100)/100*1.5)
    saturation: 0,      // -100 … +100  (0 = greyscale, 100 = normal, 200 = vivid)
    hue: 0,             // -180 … +180  degrees
    temperature: 0,     // -100 … +100  (negative=cool/blue, positive=warm/amber)
    vignette: 0,        // 0 … 100
    highlights: 0,      // -100 … +100
    shadows: 0,         // -100 … +100
    // Effects
    blur: 0,            // 0 … 20
    sharpen: 0,         // 0 … 100
    grain: 0,           // 0 … 100
    grayscale: false,
    // Transition (applied between clips)
    transition: 'none', // none | fade | dissolve | wipe_left | wipe_right | zoom_in | zoom_out | slide_left
    transitionDuration: 0.5, // seconds
    // Speed
    speed: 1.0,         // 0.25 | 0.5 | 1 | 1.5 | 2 | 4
};

// ─── Preset looks ────────────────────────────────────────────────────────────

export const PRESETS = [
    { id: 'natural', label: '🌿 Natural', icon: '🌿', settings: { brightness: 5, contrast: 5, saturation: 10 } },
    { id: 'cinematic', label: '🎬 Cinematic', icon: '🎬', settings: { contrast: 30, saturation: -20, vignette: 40, highlights: -20, shadows: -15 } },
    { id: 'warm_film', label: '🎞 Warm Film', icon: '🎞', settings: { temperature: 30, saturation: 10, contrast: 15, grain: 20, vignette: 25 } },
    { id: 'cool_moody', label: '🌊 Cool Moody', icon: '🌊', settings: { temperature: -40, contrast: 25, saturation: -10, vignette: 30 } },
    { id: 'vintage', label: '📷 Vintage', icon: '📷', settings: { saturation: -30, temperature: 25, contrast: 10, grain: 40, vignette: 35, highlights: -15 } },
    { id: 'dramatic', label: '⚡ Dramatic', icon: '⚡', settings: { contrast: 50, saturation: -15, shadows: -30, highlights: -25, vignette: 60 } },
    { id: 'bw', label: '⬛ B&W', icon: '⬛', settings: { grayscale: true, contrast: 20, vignette: 30 } },
    { id: 'vivid', label: '🌈 Vivid', icon: '🌈', settings: { saturation: 60, contrast: 15, brightness: 5 } },
];

export const TRANSITIONS = [
    { id: 'none', label: 'None', css: '' },
    { id: 'fade', label: 'Fade', css: 'fade' },
    { id: 'dissolve', label: 'Dissolve', css: 'fade' },
    { id: 'wipe_left', label: 'Wipe Left', css: 'wipe_left' },
    { id: 'wipe_right', label: 'Wipe Right', css: 'wipe_right' },
    { id: 'zoom_in', label: 'Zoom In', css: 'zoom_in' },
    { id: 'slide_left', label: 'Slide Left', css: 'slide_left' },
    { id: 'pixelize', label: 'Pixelize', css: 'pixelize' },
    { id: 'radial', label: 'Radial', css: 'radial' },
];

// ─── CSS filter string (for real-time preview) ────────────────────────────────

export function toCSSFilter(s) {
    const filters = [];

    // brightness: -100…+100 → CSS brightness(0…2)
    filters.push(`brightness(${1 + s.brightness / 100})`);

    // contrast: -100…+100 → CSS contrast(0…3)
    filters.push(`contrast(${1 + s.contrast / 100})`);

    // saturation: -100…+100 → CSS saturate(0…3)
    if (s.grayscale) {
        filters.push('saturate(0)');
    } else {
        filters.push(`saturate(${Math.max(0, 1 + s.saturation / 100)})`);
    }

    // hue
    if (s.hue !== 0) filters.push(`hue-rotate(${s.hue}deg)`);

    // temperature: use sepia + hue trick
    if (s.temperature > 0) {
        filters.push(`sepia(${(s.temperature / 100) * 0.4})`);
    } else if (s.temperature < 0) {
        filters.push(`hue-rotate(${s.temperature * 0.2}deg)`);
    }

    // blur
    if (s.blur > 0) filters.push(`blur(${(s.blur / 20) * 6}px)`);

    return filters.join(' ');
}

// ─── FFmpeg -vf filter chain ─────────────────────────────────────────────────

export function toFFmpegVF(s) {
    const parts = [];

    // Scale (always normalize)
    parts.push('scale=trunc(iw/2)*2:trunc(ih/2)*2');

    // eq filter (brightness, contrast, saturation, gamma)
    const br = (s.brightness / 100).toFixed(3);            // -1 … 1
    const ct = (1 + (s.contrast / 100) * 1.5).toFixed(3); // 0.5 … 2.5
    const sat = s.grayscale ? '0' : Math.max(0, (1 + s.saturation / 100)).toFixed(3);
    parts.push(`eq=brightness=${br}:contrast=${ct}:saturation=${sat}`);

    // hue
    if (s.hue !== 0) parts.push(`hue=h=${s.hue}`);

    // temperature via colorchannelmixer
    if (s.temperature !== 0) {
        const warmth = (s.temperature / 100) * 0.12;
        const rr = (1 + warmth).toFixed(3);
        const bb = (1 - warmth).toFixed(3);
        parts.push(`colorchannelmixer=rr=${rr}:bb=${bb}`);
    }

    // highlights / shadows via levels approximation
    if (s.highlights !== 0 || s.shadows !== 0) {
        const hi = (1 + s.highlights / 200).toFixed(3);
        const sh = (s.shadows / 400).toFixed(3);
        parts.push(`curves=all='0/0 0.5/${(0.5 + parseFloat(sh)).toFixed(3)} 1/${hi}'`);
    }

    // blur
    if (s.blur > 0) {
        const r = Math.round((s.blur / 20) * 5);
        parts.push(`boxblur=${r}:${r}`);
    }

    // sharpen
    if (s.sharpen > 0) {
        const amount = ((s.sharpen / 100) * 1.5).toFixed(2);
        parts.push(`unsharp=5:5:${amount}:5:5:0`);
    }

    // grain / noise
    if (s.grain > 0) {
        const str = Math.round((s.grain / 100) * 40);
        parts.push(`noise=alls=${str}:allf=t`);
    }

    // vignette
    if (s.vignette > 0) {
        const angle = ((s.vignette / 100) * Math.PI * 0.5).toFixed(3);
        parts.push(`vignette=angle=${angle}`);
    }

    return parts.join(',');
}

/**
 * Build the FFmpeg xfade transition filter between two clips.
 * Returns the complex filter string fragment for a single transition.
 *
 * @param {string} transition  Transition id (from TRANSITIONS)
 * @param {number} duration    Duration in seconds
 * @param {number} offset      Time offset in the concat where transition starts
 */
export function buildXfadeFilter(transition, duration, offset) {
    if (transition === 'none' || !transition) return null;

    // Map our transition IDs to FFmpeg xfade transition names
    const map = {
        fade: 'fade',
        dissolve: 'dissolve',
        wipe_left: 'wipeleft',
        wipe_right: 'wiperight',
        zoom_in: 'zoomin',
        slide_left: 'slideleft',
        pixelize: 'pixelize',
        radial: 'radial',
    };

    const xfadeType = map[transition] || 'fade';
    return `xfade=transition=${xfadeType}:duration=${duration}:offset=${offset.toFixed(3)}`;
}

/**
 * Build the full ffmpeg speed filter args.
 * Returns ['-vf', filterStr, '-filter:a', atempo] or just ['-vf', filterStr]
 */
export function buildSpeedFilters(speed) {
    if (speed === 1.0) return [];
    const pts = (1 / speed).toFixed(4);
    const vf = `setpts=${pts}*PTS`;

    // atempo only supports 0.5–2.0; stack for wider range
    let atempo = '';
    if (speed >= 0.5 && speed <= 2.0) {
        atempo = `atempo=${speed.toFixed(2)}`;
    } else if (speed > 2.0) {
        atempo = `atempo=2.0,atempo=${(speed / 2).toFixed(2)}`;
    } else {
        atempo = `atempo=0.5,atempo=${(speed / 0.5).toFixed(2)}`;
    }

    return { vf, atempo };
}
