/**
 * APIYI Gemini Image Generation
 * 使用 APIYI 代理调用 gemini-3-pro-image-preview 模型
 * 企业分组 API Key - 约 30-40 秒生成
 */

const API_KEY = process.env.APIYI_API_KEY
const MODEL = 'gemini-3-pro-image-preview'
const BASE_URL = 'https://api.apiyi.com/v1beta'

export async function generateImage(base64Image: string, style: string, aspectRatio: string = "1:1", envBase64Image?: string) {
    console.log('[Gemini] Starting generation with style:', style, 'Ratio:', aspectRatio)
    console.log('[Gemini] API Key exists:', !!API_KEY)
    console.log('[Gemini] API Key prefix:', API_KEY?.substring(0, 10))


    const masterPhotographerPrompt = `
    ROLE: World-Class Commercial Food Photographer & Food Stylist.
    CORE PHILOSOPHY: The vessel is the stage for the food. The food is the absolute protagonist.
    
    VISUAL STRATEGY: 
    - Adaptive Vessels: Do not use standard plates unless essential. Match the vessel to the food's texture/form.
    - Material Diversity: Explore stone, raw wood, metal, organic leaves, salt blocks, or architectural surfaces.
    - Heroism: Use selective focus (f/1.8), dramatic lighting, and composition to ensure the food remains the visual anchor.
    - Contextual Narrative: The vessel and background should tell a story of origin, temperature, and craftsmanship.
    `

    const stylePromptMap: Record<string, string> = {
        'michelin-star': `${masterPhotographerPrompt}
        ESTHETIC FRAMEWORK: **Space Sculpture & Minimalist Avant-Garde**
        - VESSEL INNOVATION: Not just a plate. A slab of polished black basalt, a piece of streamline driftwood, or abstract geometric custom ceramics.
        - CREATIVE POINT: Use liquid nitrogen smoke, edible flower fragments, or minimalist sauce dots to make the vessel look like a micro art museum.
        - LIGHTING: Sculptural studio lighting. High-contrast or clean high-key.
        - MOOD: Elite, intellectual, breathtakingly expensive.`,

        'hk-chaachaan': `${masterPhotographerPrompt}
        ESTHETIC FRAMEWORK: **Canton Nostalgia & Urban Order**
        - VESSEL INNOVATION: Folded nostalgic newspaper (as lining), vintage rusted but clean metal boxes, or a stack of enamel cups.
        - CREATIVE POINT: Food served on grease-proof paper inside a plastic takeout basket. Blurry neon signs in the background for street vibes.
        - LIGHTING: Warm tungsten, cinematic neon bokeh.
        - MOOD: Fast-paced yet soulful. The vessel carries the city's pulse.`,

        'japanese-zen': `${masterPhotographerPrompt}
        ESTHETIC FRAMEWORK: **Natural Symbiosis & Wabi-Sabi**
        - VESSEL INNOVATION: Large fresh lotus leaves, a thick block of Himalayan pink salt, or a hollow segment of bamboo.
        - CREATIVE POINT: Use fine sand/gravel to recreate a dry landscape (Karesansui). The food is the center "jewel" of nature.
        - LIGHTING: Soft, diffused morning light.
        - MOOD: Meditative, raw, organic.`,

        'chinese-street': `${masterPhotographerPrompt}
        ESTHETIC FRAMEWORK: **Dynamic Yanhuo (Street Bustle) & Raw Texture**
        - VESSEL INNOVATION: Directly on the edge of a traditional clay stove, oil-paper-lined woven bamboo baskets, or rough brown kraft paper bags.
        - CREATIVE POINT: Emphasize steam/smoke and the "splash moment" of spices. Food looks like it just leaped from the wok.
        - LIGHTING: Intense overhead warm light, high shadows.
        - MOOD: Bustling, authentic, alive.`,

        'french-romantic': `${masterPhotographerPrompt}
        ESTHETIC FRAMEWORK: **Classical Theatre & Timeless Elegance**
        - VESSEL INNOVATION: Exquisite glass cloche (dome), vintage brass trays, or deep velvet fabric folds as boundaries.
        - CREATIVE POINT: Include old perfume bottles, dried long-stem roses. Food is the "crown jewel" on a dramatic stage.
        - LIGHTING: Golden-hour soft glow, flickering candlelight.
        - MOOD: Opulent, poetic, dreamy.`,

        'nordic-morandi': `${masterPhotographerPrompt}
        ESTHETIC FRAMEWORK: **Architectural Geometry & Color Field**
        - VESSEL INNOVATION: Polished concrete blocks, frosted semi-transparent glass layers, or geometrically cut light marble slabs.
        - CREATIVE POINT: Use geometric shadows to create balance between the food and color blocks.
        - LIGHTING: Flat but clean architectural light.
        - MOOD: Calm, structured, highly curated.`,

        'macro-detail': `${masterPhotographerPrompt}
        ESTHETIC FRAMEWORK: **Micro Landscape & Sensory Explosion**
        - VESSEL INNOVATION: Deconstructed perspective. Vessel is a landscape of texture—brushed metal mountains or glaze-slick valleys.
        - CREATIVE POINT: Reveal oil tension on metal, seasoning crystals on matte ceramics. Extremes of texture over traditional plating.
        - LIGHTING: Macro-lighting for specular highlights and depth.
        - MOOD: Visceral, intimate.`,

        'vintage-rustic': `${masterPhotographerPrompt}
        ESTHETIC FRAMEWORK: **Handcrafted Force & Farmstead Heritage**
        - VESSEL INNOVATION: Chopping boards with hacking marks, burlap-covered old crate lids, or cast iron pans with wooden handles.
        - CREATIVE POINT: Scattered raw ingredients (garlic with dirt, herbs). Primal farm-to-table energy.
        - LIGHTING: Strong directional window light (Chiaroscuro).
        - MOOD: Rugged, honest, primal warmth.`,

        'food-story': `${masterPhotographerPrompt}
    ESTHETIC FRAMEWORK: **Dynamic Visual Storytelling (AI Director Mode)**
    - **INSTRUCTION**: Do NOT use a fixed template. Look at the input food first.
    - **STEP 1 ANALYZE**: What is this food? What is the likely occasion?
    - **STEP 2 NARRATE**: Invent a one-sentence backstory. (e.g. "A rainy night survival meal", "A sunny garden breakfast").
    - **STEP 3 VISUALIZE**: Build the scene around YOUR invented backstory.
      - If it looks home-cooked -> Show a messy family table.
      - If it looks fancy -> Show a romantic candlelit blur.
      - If it looks traditional -> Show historical artifacts.
    - **LIGHTING**: Match the emotion of your story.
    - **MOOD**: Deeply specific and narrative-driven.`,

        'shanghai-style': `${masterPhotographerPrompt}
        ESTHETIC FRAMEWORK: **Haipai Elegance & Shikumen Soul**
        - VESSEL INNOVATION: Art Deco patterned high-end ceramics, vintage silverware from old Shanghai, or lacquerware on a silk runner.
        - CREATIVE POINT: Background shows Shikumen architectural details or a vintage lounge vibe. Capturing the refined "Middle Way" of Shanghai taste.
        - LIGHTING: Subtle, elegant shadows. A hint of "In the Mood for Love" cinematic lighting.
        - MOOD: Classy, sophisticated, local flavor with an international twist.`,

        'custom-shop': `${masterPhotographerPrompt}
    ESTHETIC FRAMEWORK: **Commercial Realism & Environmental Integration (Virtual Photography)**
    - **CRITICAL INSTRUCTION**: You MUST use the provided "IMAGE 2" (Environment) as the ACTUAL background. Do not hallucinatie a new room.
    - **TASK**: Composite the food from "IMAGE 1" into the scene of "IMAGE 2".
    - **BACKGROUND PRESERVATION**: The background details (tables, chairs, decor, lighting) MUST match the uploaded environment image exactly.
    - **PERSPECTIVE**: If Image 2 is a table, place the food ON that table. If it's a bar, place it ON the bar. Match the camera angle.
    - **LIGHTING**: If Image 2 is dark/moody, the food must be lit to match. Shadows must fall consistently with the room's light sources.
    - **STYLE**: High-end menu photography. Seamless integration. verified commercial realism.`
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

        // Construct parts array
        const parts: any[] = [
            { text: prompt },
            { inline_data: { mime_type: "image/jpeg", data: cleanBase64 } }
        ]

        // Add environment image if exists
        if (envBase64Image) {
            const cleanEnvBase64 = envBase64Image.replace(/^data:image\/\w+;base64,/, '')
            parts.push({ inline_data: { mime_type: "image/jpeg", data: cleanEnvBase64 } })
            console.log('[Gemini] Added environment image to request')
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: parts
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

        const responseParts = candidates[0].content.parts
        const imagePart = responseParts.find((p: any) => p.inlineData || p.inline_data)

        if (imagePart) {
            console.log('[Gemini] Success! Image generated.')
            return (imagePart.inlineData?.data || imagePart.inline_data?.data) as string
        }

        const textPart = responseParts.find((p: any) => p.text)
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
