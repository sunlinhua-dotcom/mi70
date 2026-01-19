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
        - VESSEL: Abstract geometric ceramics, slate monoliths, or floating glass surfaces. Think "Art Gallery".
        - LIGHTING: Sculptural studio lighting. High-contrast or clean high-key.
        - MOOD: Elite, intellectual, breathtakingly expensive. The vessel should look like a bespoke artistic construction.`,

        'hk-chaachaan': `${masterPhotographerPrompt}
        ESTHETIC FRAMEWORK: **Canton Nostalgia & Urban Order**
        - VESSEL: Weathered metal trays, retro melamine with chipped edges, or parchment-lined wire baskets. 
        - LIGHTING: Warm tungsten, cinematic neon bokeh in background. Distant city life echoes.
        - MOOD: Fast-paced yet soulful. The vessel carries the "sweat and history" of a busy Hong Kong street corner.`,

        'japanese-zen': `${masterPhotographerPrompt}
        ESTHETIC FRAMEWORK: **Natural Symbiosis & Wabi-Sabi**
        - VESSEL: Wet river stones, unpolished cedar wood slices, or large emerald lotus leaves.
        - LIGHTING: Soft, diffused morning light filtered through bamboo screens.
        - MOOD: Meditative, raw, organic. The food should look like it grew out of the vessel itself.`,

        'chinese-street': `${masterPhotographerPrompt}
        ESTHETIC FRAMEWORK: **Dynamic Yanhuo (Street Bustle) & Raw Texture**
        - VESSEL: Old bamboo steamers, charcoal-blacked clay pots, or grease-stained brown paper on a wooden block.
        - LIGHTING: Intense overhead warm light, high shadows, steam/smoke diffusion.
        - MOOD: Bustling, authentic, alive. The vessel should evoke the heat of a high-flame wok.`,

        'french-romantic': `${masterPhotographerPrompt}
        ESTHETIC FRAMEWORK: **Classical Theatre & Timeless Elegance**
        - VESSEL: Filigree silver stands, scalloped vintage glass, or layered lace textiles over dark marble.
        - LIGHTING: Golden-hour soft glow, flickering candlelight bokeh. 
        - MOOD: Opulent, poetic, dreamy. The vessel is a dramatic stage for a romantic culinary performance.`,

        'nordic-morandi': `${masterPhotographerPrompt}
        ESTHETIC FRAMEWORK: **Architectural Geometry & Color Field**
        - VESSEL: Matte concrete blocks, frosted semi-transparent layers, or monochromatic pastel ceramic slabs.
        - LIGHTING: Flat but clean architectural light. Soft shadows.
        - MOOD: Calm, structured, highly curated. The vessel and food form a balanced color field composition.`,

        'macro-detail': `${masterPhotographerPrompt}
        ESTHETIC FRAMEWORK: **Micro Landscape & Sensory Explosion**
        - VESSEL: Deconstructed perspective. The vessel is a landscape of texture—brushed metal mountains or glaze-slick valleys.
        - LIGHTING: Macro-lighting to reveal oil tension, seasoning crystals, and steam droplets.
        - MOOD: Visceral, intimate. The physical identity of the "plate" disappears into a landscape of taste.`,

        'vintage-rustic': `${masterPhotographerPrompt}
        ESTHETIC FRAMEWORK: **Handcrafted Force & Farmstead Heritage**
        - VESSEL: Heavy cast iron pans, thick hand-hewn chopping boards, or coarse linen sacks.
        - LIGHTING: Strong directional window light (Chiaroscuro). Dusty atmosphere.
        - MOOD: Rugged, honest, primal. The vessel feels heavy, handmade, and filled with ancestral warmth.`,
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
