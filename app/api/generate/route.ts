import { GoogleGenAI } from '@google/genai';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        // 1. Authenticate user
        const supabase = await createClient();
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Validate request
        const body = await request.json();
        const imageUrl = body?.imageUrl;

        if (typeof imageUrl !== 'string' || !imageUrl.trim()) {
            return NextResponse.json({ error: 'Image URL is required' }, { status: 400 });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'GEMINI_API_KEY is missing' }, { status: 500 });
        }

        // 3. Download image
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) {
            return NextResponse.json({ error: 'Could not download image' }, { status: 400 });
        }

        const mimeType = imageResponse.headers.get('content-type')?.split(';')[0].trim() || 'image/jpeg';
        const arrayBuffer = await imageResponse.arrayBuffer();
        const base64Data = Buffer.from(arrayBuffer).toString('base64');

        const promptText = `
You are generating a caption for a college humor web app.
Analyze this image and return ONLY a valid JSON object matching this exact schema:
{
  "description": "2 objective sentences describing what is in the picture",
  "caption": "A witty, dry, sarcastic caption under 20 words for an exhausted, chronically online college student navigating campus life and dorms"
}
Do not include any Markdown ticks or preamble. Return ONLY the raw JSON object.
`;

        const ai = new GoogleGenAI({ apiKey });

        // Try 3.5 Flash-Lite first, then fall back to 3.8 Flash
        const candidateModels = ['gemini-3.5-flash-lite', 'gemini-3.8-flash'];
        let rawOutput = '';
        let lastError: any = null;

        for (const model of candidateModels) {
            try {
                console.log(`Attempting generation with model: ${model}`);
                const response = await ai.models.generateContent({
                    model,
                    contents: [
                        {
                            inlineData: {
                                mimeType,
                                data: base64Data,
                            },
                        },
                        promptText,
                    ],
                });

                if (response.text) {
                    rawOutput = response.text;
                    console.log(`Success with model ${model}! Output:`, rawOutput);
                    break;
                }
            } catch (err: any) {
                lastError = err;
                console.warn(`Model ${model} failed:`, err?.message || err);
            }
        }

        if (!rawOutput) {
            throw lastError || new Error('All candidate models failed to generate content.');
        }

        // Extract JSON cleanly
        const jsonMatch = rawOutput.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error(`Model returned non-JSON text: ${rawOutput}`);
        }

        const parsed = JSON.parse(jsonMatch[0]);
        const description = parsed.description || 'An uploaded campus scene';
        const captionText = parsed.caption || 'When midterms hit before your morning coffee.';

        // 4. Save image and description to public.images
        const { data: imageRow, error: imageError } = await supabase
            .from('images')
            .insert({
                user_id: user.id,
                image_url: imageUrl,
                image_description: description,
            })
            .select()
            .single();

        if (imageError) throw imageError;

        // 5. Save caption to public.captions
        const { data: captionRow, error: captionError } = await supabase
            .from('captions')
            .insert({
                image_id: imageRow.id,
                user_id: user.id,
                caption_text: captionText,
                prompt: promptText.trim(),
            })
            .select()
            .single();

        if (captionError) throw captionError;

        return NextResponse.json({
            success: true,
            image: imageRow,
            caption: captionRow,
        });
    } catch (error: any) {
        console.error('API Route Error Detailed:', error);
        return NextResponse.json(
            { error: error?.message || 'Generation failed' },
            { status: 500 }
        );
    }
}