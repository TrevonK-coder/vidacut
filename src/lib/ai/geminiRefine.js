/**
 * Calls the Pollinations AI text API — 100% free, no API key needed.
 * Docs: https://text.pollinations.ai
 *
 * @param {string} _apiKey  - Ignored (kept for backwards compat, not used)
 * @param {'script'|'treatment'|'shotlist'|'moodboard'|'checklist'} type
 * @param {string} content  - Raw user input to refine
 * @returns {Promise<string>} Refined text
 */

const SYSTEM_PROMPTS = {
    script: `You are a professional screenwriter and creative director. The user has given you rough scene notes for a video production. Rewrite them as a polished, professional script. Keep the same meaning but make it compelling, cinematic, and production-ready. Format: for each scene, write "SCENE [N]", then "V/O:" for voiceover lines, then "ACTION:" for the visual description. Keep it concise.`,
    treatment: `You are a senior creative director. Transform the user's rough notes into a polished creative treatment. Use professional, evocative language that excites a client or production team. Keep each section focused and under 100 words.`,
    shotlist: `You are an experienced film director and director of photography. Refine the user's shot description into a precise, professional shot description a crew member can immediately execute. Include camera movement suggestions, lighting hints, and framing notes. Be concise and technical.`,
    moodboard: `You are a visual creative director. Refine the user's notes into articulate, evocative visual direction. Be specific about color, texture, atmosphere, and emotion. Keep it under 80 words.`,
    checklist: `You are an experienced production manager. Based on the shoot context described, suggest 5-8 additional production checklist items the user may have overlooked. Reply as a plain bullet list, one item per line, no header.`,
};

export async function refineContent(_apiKey, type, content) {
    const systemPrompt = SYSTEM_PROMPTS[type] || SYSTEM_PROMPTS.script;

    const response = await fetch('https://text.pollinations.ai/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: 'openai',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: content },
            ],
            temperature: 0.7,
            max_tokens: 1024,
        }),
    });

    if (!response.ok) {
        throw new Error(`AI service error: ${response.status}. Please try again.`);
    }

    const text = await response.text();
    return text.trim();
}

// Keep old export name for backwards compatibility
export const geminiRefine = refineContent;

/**
 * Generate a storyboard image URL using Pollinations AI (no auth required).
 * @param {string} description  - Shot or scene description
 * @returns {string} Direct image URL
 */
export function generateStoryboardImage(description) {
    const prompt = encodeURIComponent(
        `cinematic film still, storyboard frame, ${description}, professional cinematography, dramatic lighting`
    );
    return `https://image.pollinations.ai/prompt/${prompt}?width=640&height=360&nologo=true`;
}
