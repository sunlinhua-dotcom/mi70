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
        - PLATE: Hand-crafted wide-rim ceramic plate (matte white or charcoal).
        - LIGHTING: Spot-lit pinpoint lighting on the food, dark moody background to make food pop. 
        - BACKGROUND: Dark marble or slate surface, minimal distractions. 
        - GARNISH: Add micro-greens, edible flowers, or sauce drizzles with surgical precision (if appropriate).
        - MOOD: Sophisticated, expensive, exclusive, culinary perfection.`,

        'nordic-minimalist': `${masterPhotographerPrompt}
        SPECIFIC STYLE: **Nordic Minimalism (New Nordic Cuisine)**
        - PLATE: Organic shape, rough-hewn stoneware or pottery in earth tones.
        - LIGHTING: Soft, cold, diffused "window light" from the side. Low contrast.
        - BACKGROUND: Weathered light wood, gray linen, or raw stone.
        - MOOD: Hygge, organic, natural, quiet, desaturated earthy colors.`,

        'moody-cinematic': `${masterPhotographerPrompt}
        SPECIFIC STYLE: **Moody Cinematic**
        - LIGHTING: Low-key lighting, deep shadows (chiaroscuro), rim lighting to separate food from background.
        - COLOR: Rich, warm, deep saturated tones (ambers, browns, deep reds).
        - BACKGROUND: Dark wood, old leather, or textured dark fabric.
        - MOOD: Dramatic, emotional, storytelling, "Netflix Chef's Table" vibe.`,

        'japanese-zen': `${masterPhotographerPrompt}
        SPECIFIC STYLE: **Japanese Wabi-Sabi / Kaiseki**
        - PLATE: Traditional Japanese lacquerware or irregular ceramic pottery (Kintsugi hints).
        - COMPOSITION: Asymmetrical balance, breathing room (Ma).
        - LIGHTING: Soft, shadowless natural light, very clean.
        - BACKGROUND: Bamboo mat (tatami), light wood, or rice paper texture.
        - MOOD: Peaceful, meditative, respectful of the ingredient.`,

        'commercial-editorial': `${masterPhotographerPrompt}
        SPECIFIC STYLE: **Commercial Advertising / Editorial**
        - LIGHTING: Bright, punchy, high-key lighting. Multiple light sources to eliminate unwanted shadows.
        - COLOR: Vibrant, poppy, hyper-realistic, appetizing colors.
        - BACKGROUND: Clean solid color (white/pastel) or gradient to focus purely on the food.
        - MOOD: Energetic, fresh, "Uber Eats" premium listing style.`,

        'rustic-farmhouse': `${masterPhotographerPrompt}
        SPECIFIC STYLE: **Rustic Farmhouse Table**
        - PROPS: Vintage silverware, crumpled linen napkin, scattered raw ingredients (flour, herbs, spices).
        - LIGHTING: Warm "Golden Hour" sunlight streaming through a window with shadows of leaves.
        - BACKGROUND: Old reclaimed oak table.
        - MOOD: Homemade, comforting, nostalgic, grandma's kitchen, hearty.`,

        'french-patisserie': `${masterPhotographerPrompt}
        SPECIFIC STYLE: **French Patisserie / High Tea**
        - PLATE: Fine bone china with gold rim or silver platter.
        - PROPS: Crystal glass, silver fork, fresh berries.
        - LIGHTING: Soft, romantic, dreamy, pastel-toned lighting.
        - BACKGROUND: White marble counter or silk tablecloth.
        - MOOD: Elegant, delicate, sweet, Parisian luxury.`,

        'macro-detail': `${masterPhotographerPrompt}
        SPECIFIC STYLE: **Macro Texture (Food Porn)**
        - CAMERA: Macro lens, extreme close-up.
        - FOCUS: Razor-sharp focus on the most appetizing detail (texture, sauce gloss, steam).
        - LIGHTING: Backlighting to emphasize steam or translucency.
        - MOOD: Intense, mouth-watering, sensory overload.`,

        'airy-bright': `${masterPhotographerPrompt}
        SPECIFIC STYLE: **Modern Airy / Lifestyle Blog**
        - LIGHTING: Overexposed high-key lighting, very few shadows.
        - BACKGROUND: White marble, light granite, or white wood.
        - PROPS: Modern magazines, laptop edge, latte art (lifestyle context).
        - MOOD: Fresh, morning vibes, clean, healthy, "Instagram Influencer" style.`,

        'dark-luxury': `${masterPhotographerPrompt}
        SPECIFIC STYLE: **Midnight Luxury**
        - PLATE: Black matte plate or slate board.
        - DECOR: Gold cutlery, cut crystal glass.
        - LIGHTING: Dramatic spot lighting, high contrast, reflections on glossy surfaces.
        - BACKGROUND: Black velvet or polished obsidian.
        - MOOD: Sexy, mysterious, premium nightlife dining.`,
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
