/**
 * Calls the Gemini API to refine/improve the given content.
 * @param {string} apiKey   - Gemini API key
 * @param {'script'|'treatment'|'shotlist'|'moodboard'|'checklist'} type
 * @param {string} content  - Raw user input to refine
 * @returns {Promise<string>} Refined text
 */
export async function geminiRefine(apiKey, type, content) {
    const systemPrompts = {
        script: `You are a professional screenwriter and creative director. The user has given you rough scene notes for a video production. Rewrite them as a polished, professional script. Keep the same meaning but make it compelling, cinematic, and production-ready. Format: for each scene, write "SCENE [N]", then "V/O:" for voiceover lines, then "ACTION:" for the visual description. Keep it concise.`,
        treatment: `You are a senior creative director. The user has given you rough ideas for a creative treatment. Transform these notes into a polished, compelling creative treatment document. Use professional, evocative language that would excite a client or production team. Keep each section focused and under 100 words.`,
        shotlist: `You are an experienced film director and director of photography. The user has described a shot. Refine this into a precise, professional shot description that a crew member could immediately execute. Include camera movement suggestions, lighting hints, and framing notes. Be concise and technical.`,
        moodboard: `You are a visual creative director. The user has given you rough notes for a section of their mood board. Refine these into articulate, evocative visual direction notes. Be specific about color, texture, atmosphere, and emotion. Keep it under 80 words.`,
        checklist: `You are an experienced production manager. Based on the shoot context the user describes, suggest 5-8 additional production checklist items they may have overlooked. Format as a plain bullet list with no header, one item per line.`,
    };

    const prompt = systemPrompts[type] || systemPrompts.script;

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [
                    {
                        role: 'user',
                        parts: [{ text: `${prompt}\n\n---\nHere are my rough notes:\n${content}` }],
                    },
                ],
                generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
            }),
        }
    );

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.error?.message || `Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

/**
 * Generate a storyboard image URL using Pollinations AI (no API key needed).
 * @param {string} description  - Shot or scene description
 * @returns {string} URL of the generated image
 */
export function generateStoryboardImage(description) {
    // Enhance the prompt to be more cinematic
    const prompt = encodeURIComponent(
        `cinematic film still, storyboard frame, ${description}, professional cinematography, dramatic lighting, wide aspect ratio`
    );
    // Pollinations returns a stable image for a given prompt — no auth required
    return `https://image.pollinations.ai/prompt/${prompt}?width=640&height=360&nologo=true`;
}
