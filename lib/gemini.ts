/**
 * APIYI Gemini Image Generation
 * 使用 APIYI 代理调用 gemini-3-pro-image-preview 模型
 * 企业分组 API Key - 约 30-40 秒生成
 */

const API_KEY = process.env.APIYI_API_KEY
const MODEL = 'gemini-3-pro-image-preview'
const BASE_URL = 'https://api.apiyi.com/v1beta'

export async function generateImage(base64Image: string, style: string, aspectRatio: string = "1:1") {
    console.log('[Gemini] Starting generation with style:', style, 'Ratio:', aspectRatio)
    console.log('[Gemini] API Key exists:', !!API_KEY)
    console.log('[Gemini] API Key prefix:', API_KEY?.substring(0, 10))

    const masterPhotographerPrompt = `
    ROLE: You are a World-Class Commercial Food Photographer (20+ years experience).
    OBJECTIVE: Transform this amateur food photo into a HIGH-END MAGAZINE COVER quality image.
    
    CRITICAL CONSTRAINT: You MUST keep the EXACT same food (ingredients, shape, portion).
    WHAT TO CHANGE: Lighting, Background, Plate/Dishware, Composition, Camera Angle, Atmosphere.
    
    GLOBAL AESTHETICS (Apply to ALL styles):
    - CAMERA: 85mm lens, f/1.8 aperture for beautiful bokeh/depth-of-field.
    - LIGHTING: Professional studio lighting, diffused softbox or dramatic chiaroscuro (depending on style). High dynamic range (HDR).
    - RESOLUTION: 8k, ultra-detailed textures, sharp focus on the main food element.
    - COMPOSITION: Rule of thirds, negative space, balanced visual weight.
    `

    const stylePromptMap: Record<string, string> = {
        'michelin-star': `${masterPhotographerPrompt}
        SPECIFIC STYLE: **Michelin 3-Star Fine Dining**
        - PLATE: Minimalist, pure white or light gray large-diameter fine bone china.
        - LIGHTING: Soft, clean top lighting with subtle shadows. Professional commercial food grade.
        - BACKGROUND: Clean white marble or high-end plain light gray textured surface.
        - MOOD: Sophisticated, clean, expensive, bright, professional.`,

        'hk-chaachaan': `${masterPhotographerPrompt}
        SPECIFIC STYLE: **Hong Kong Cha Chaan Teng (港式茶餐厅)**
        - PLATE: Classic Hong Kong melamine plates (pink/green/cream colored), metal trays, or simple white ceramic bowls.
        - PROPS: Glass of iced lemon tea with condensation, plastic chopsticks, retro checkered tablecloth.
        - LIGHTING: Warm tungsten overhead lighting, slightly dim, nostalgic feel.
        - BACKGROUND: Formica table with vintage Hong Kong cafe tile pattern, neon signs bokeh, metal chairs.
        - MOOD: Nostalgic, busy, authentic, street-level, warm, crowded cafe vibe. Feels like 1980s Hong Kong.`,

        'japanese-zen': `${masterPhotographerPrompt}
        SPECIFIC STYLE: **Japanese Wabi-Sabi / Oriental Zen**
        - PLATE: Traditional Japanese ceramic pottery (unpolished) or bamboo steamer.
        - BACKGROUND: Tatami mats, light pine wood, or sand/stone textures.
        - LIGHTING: Soft, diffused natural morning light (morning sun from screen-right).
        - MOOD: Peaceful, meditative, humble, respectful of raw ingredients.`,

        'chinese-street': `${masterPhotographerPrompt}
        SPECIFIC STYLE: **Chinese Street Food / 烟火气 (Yanhuoqi - Homely Bustle)**
        - PLATE: Simple white porcelain bowls, bamboo baskets, or metal plates typical of Chinese street vendors.
        - PROPS: Wooden chopsticks, red plastic stools blurred in background, steaming wok, chili oil bottles.
        - LIGHTING: Warm orange tungsten from overhead bulbs, mixed with natural daylight. High contrast.
        - BACKGROUND: Busy night market stall, red Chinese lanterns bokeh, street food cart backdrop.
        - MOOD: Bustling, authentic, smoky, vibrant, heartwarming, street-level chaos, feels like walking through a Chinese night market. Raw and real.`,

        'french-romantic': `${masterPhotographerPrompt}
        SPECIFIC STYLE: **French Romantic / Old Cafe**
        - PROPS: Vintage silverware, dried lavender, blurred cafe background with warm yellow lamps.
        - LIGHTING: Warm, dreamy, slightly overexposed film look. Golden-hour warmth.
        - BACKGROUND: Rustic Parisian cafe table or classic floral lace tablecloth.
        - MOOD: Nostalgic, romantic, soft-focus, sentimental.`,

        'nordic-morandi': `${masterPhotographerPrompt}
        SPECIFIC STYLE: **Nordic Morandi / Soft Minimalist**
        - COLOR: Low-saturation Morandi color palette (dusty rose, sage green, cool gray).
        - LIGHTING: Very soft, shadowless, flat but clean lighting. Low contrast.
        - BACKGROUND: Smooth matte surface in pastel tones.
        - MOOD: Calm, minimalist, modern, elegant, artistic.`,

        'macro-detail': `${masterPhotographerPrompt}
        SPECIFIC STYLE: **Macro Texture (Extreme Macro)**
        - CAMERA: Extreme macro lens (1:1 magnification). Shallowest depth of field.
        - FOCUS: Hyper-detailed focus on seasoning, sauce droplets, or grill marks.
        - LIGHTING: Backlit to show translucency and texture.
        - MOOD: Visceral, mouth-watering, hyper-realistic detail.`,

        'vintage-rustic': `${masterPhotographerPrompt}
        SPECIFIC STYLE: **Vintage American Rustic / Farmhouse**
        - PROPS: Reclaimed oak wood boards, cast iron pans, raw ingredients scattered (garlic, herbs).
        - LIGHTING: Strong directional sunlight through a window. Natural shadows.
        - BACKGROUND: Distressed dark wood or exposed brick.
        - MOOD: Hearty, authentic, raw, homemade, warm.`,
    }

    const prompt = stylePromptMap[style] || `${masterPhotographerPrompt} Make it look professional.`
    const url = `${BASE_URL}/models/${MODEL}:generateContent`
    const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, '')

    console.log('[Gemini] Base64 length:', cleanBase64.length)
    console.log('[Gemini] URL:', url)
    console.log('[Gemini] Sending request...')

    const startTime = Date.now()

    try {
        // 使用 AbortController 设置超时
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 120000) // 2 minutes timeout

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: prompt },
                        { inline_data: { mime_type: "image/jpeg", data: cleanBase64 } }
                    ]
                }],
                generationConfig: {
                    responseModalities: ["IMAGE"],
                    imageConfig: {
                        aspectRatio: aspectRatio, // Pass dynamic aspect ratio
                        imageSize: "1K"
                    }
                }
            }),
            signal: controller.signal
        })

        clearTimeout(timeoutId)

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
        console.log(`[Gemini] Response received in ${elapsed}s, status: ${response.status}`)

        if (!response.ok) {
            const errorText = await response.text()
            console.error("[Gemini] Error Response:", errorText)
            throw new Error(`API Error: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()
        const candidates = data.candidates

        if (!candidates || candidates.length === 0) {
            console.error("[Gemini] No candidates, full response:", JSON.stringify(data, null, 2))
            throw new Error("No candidates returned from Gemini")
        }

        const parts = candidates[0].content.parts
        const imagePart = parts.find((p: any) => p.inlineData || p.inline_data)

        if (imagePart) {
            console.log('[Gemini] Success! Image generated.')
            return (imagePart.inlineData?.data || imagePart.inline_data?.data) as string
        }

        const textPart = parts.find((p: any) => p.text)
        if (textPart) {
            throw new Error("Gemini returned text instead of image: " + textPart.text)
        }

        throw new Error("No image data in response")

    } catch (error: any) {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
        console.error(`[Gemini] Error after ${elapsed}s:`, error.message)
        throw new Error(error.message || "Failed to generate image")
    }
}
