/**
 * AI text generation using Pollinations AI — 100% free, no API key.
 * Vision support: pass imageBase64 (without data URI prefix) to describe an image.
 * Docs: https://text.pollinations.ai
 */

const SYSTEM_PROMPTS = {
    script: `You are a professional TV/film scriptwriter. The user will give you a brief, an image description, or a voice note transcription. Create a clear, industry-standard shooting script with EXACTLY this format for each scene:

SCENE [N] — [ONE LINE LOCATION / MOOD]
V/O: [Voiceover or dialogue — punchy, purposeful]
ACTION: [What the camera sees — specific, visual, cinematic]

Keep it concise: 3-6 scenes max unless the brief asks for more. No preamble. Start immediately with SCENE 1.`,

    treatment: `You are a senior creative director. Transform the user's rough notes into a polished creative treatment. Use professional, evocative language that excites a client or production team. Keep each section focused and under 100 words.`,
    shotlist: `You are an experienced film director and director of photography. Refine the user's shot description into a precise, professional shot description a crew member can immediately execute. Include camera movement suggestions, lighting hints, and framing notes. Be concise and technical.`,
    moodboard: `You are a visual creative director. Refine the user's notes into articulate, evocative visual direction. Be specific about color, texture, atmosphere, and emotion. Keep it under 80 words.`,
    checklist: `You are an experienced production manager. Based on the shoot context described, suggest 5-8 additional production checklist items the user may have overlooked. Reply as a plain bullet list, one item per line, no header.`,
};

/**
 * @param {string|null} _apiKey  - Ignored, kept for backward compat
 * @param {'script'|'treatment'|'shotlist'|'moodboard'|'checklist'} type
 * @param {string} content  - Text prompt/content to refine
 * @param {string|null} [imageBase64]  - Optional base64 image (no data URI prefix)
 * @param {string|null} [imageType]    - e.g. 'image/jpeg'
 */
export async function geminiRefine(_apiKey, type, content, imageBase64 = null, imageType = 'image/jpeg') {
    const systemPrompt = SYSTEM_PROMPTS[type] || SYSTEM_PROMPTS.script;

    // Build the user message — include image if provided
    const userContent = imageBase64
        ? [
            { type: 'text', text: content || 'Generate a script based on this image.' },
            { type: 'image_url', image_url: { url: `data:${imageType};base64,${imageBase64}` } },
        ]
        : content;

    const response = await fetch('https://text.pollinations.ai/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: 'openai',          // GPT-4o — supports vision
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userContent },
            ],
            temperature: 0.7,
            max_tokens: 1500,
        }),
    });

    if (!response.ok) {
        throw new Error(`AI service error: ${response.status}. Please try again.`);
    }

    return (await response.text()).trim();
}

// Alias
export const refineContent = geminiRefine;

/**
 * Generate a sketch-style storyboard image URL via Pollinations.
 * @param {string} description
 * @returns {string}
 */
export function generateStoryboardImage(description) {
    const prompt = encodeURIComponent(
        `rough pencil sketch storyboard frame, ${description}, film production sketch, simple line drawing, black and white`
    );
    return `https://image.pollinations.ai/prompt/${prompt}?width=512&height=288&nologo=true&model=flux`;
}

/**
 * Read a File as base64 string (without the data URI prefix).
 * @param {File} file
 * @returns {Promise<{base64: string, type: string}>}
 */
export function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const dataUrl = reader.result;
            const base64 = dataUrl.split(',')[1];
            resolve({ base64, type: file.type });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * Parse the AI script text into structured scene objects.
 * Expects the format: SCENE N — TITLE\nV/O: ...\nACTION: ...
 */
export function parseAIScript(text) {
    const sceneBlocks = text.split(/\n(?=SCENE\s+\d)/i).filter(Boolean);
    return sceneBlocks.map((block, i) => {
        const lines = block.trim().split('\n').map(l => l.trim()).filter(Boolean);
        const voLine = lines.find(l => /^V\/O:/i.test(l))?.replace(/^V\/O:\s*/i, '') || '';
        const actLine = lines.find(l => /^ACTION:/i.test(l))?.replace(/^ACTION:\s*/i, '') || '';
        return {
            id: Date.now() + i,
            scene: String(i + 1),
            voiceover: voLine,
            action: actLine,
        };
    });
}
