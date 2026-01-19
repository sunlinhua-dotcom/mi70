import { NextResponse } from 'next/server'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"


const API_KEY = process.env.APIYI_API_KEY
const MODEL = 'gemini-3-pro-image-preview'  // 多模态模型，支持图片分析
const BASE_URL = 'https://api.apiyi.com/v1beta'

// 分析商家截图，提取店铺信息
async function analyzeShopScreenshot(base64Image: string): Promise<{ shopType: string, keywords: string, priceRange: string }> {
    const response = await fetch(`${BASE_URL}/models/${MODEL}:generateContent`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            contents: [{
                parts: [
                    {
                        text: `分析这张大众点评商家详情页截图，提取以下信息，用JSON格式返回：
{
  "shopType": "店铺类型（如：日料、火锅、SPA、咖啡厅等）",
  "keywords": "特色关键词，用逗号分隔（如：招牌牛舌、深夜食堂、网红打卡）",
  "priceRange": "人均消费区间（如：150-200）"
}
只返回JSON，不要其他文字。`
                    },
                    {
                        inline_data: {
                            mime_type: "image/jpeg",
                            data: base64Image
                        }
                    }
                ]
            }],
            generationConfig: {
                temperature: 0.3
            }
        })
    })

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}'

    // 提取 JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
        try {
            return JSON.parse(jsonMatch[0])
        } catch (e) {
            console.error('JSON parse error:', e)
        }
    }

    return { shopType: '餐厅', keywords: '美食', priceRange: '100-200' }
}

// 生成点评文案
async function generateReviews(shopInfo: { shopType: string, keywords: string, priceRange: string }, foodImages: string[]): Promise<string[]> {
    const imageParts = foodImages.slice(0, 3).map(img => ({
        inline_data: {
            mime_type: "image/jpeg",
            data: img
        }
    }))

    const response = await fetch(`${BASE_URL}/models/${MODEL}:generateContent`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            contents: [{
                parts: [
                    {
                        text: `#角色
你是大众点评算法工程师训练的专业写手，掌握2025年TOP100热门店铺的爆款文案规律。

#店铺信息
- 店铺类型：${shopInfo.shopType}
- 特色关键词：${shopInfo.keywords}
- 人均消费：¥${shopInfo.priceRange}

#核心任务
根据以上店铺信息和看到的菜品图片，生成3条差异化点评。

#硬性要求
1. 埋入2-3个长尾关键词（如"肩颈按摩+办公室久坐族"）
2. 包含具体场景（"带爸妈/约会/加班后"）
3. 制造记忆点（"堪比手法最贵的VIP包厢体验"）
4. 规避敏感词（"最""第一"等绝对化表述）
5. 每条点评约300字

#风格参数
- 口语化指数：88%
- 细节密度：每50字含1个具体描述
- 情绪曲线：惊喜发现 → 对比体验 → 强烈安利

#输出格式
用JSON数组返回3条点评，格式如下：
["点评1内容", "点评2内容", "点评3内容"]

只返回JSON数组，不要其他文字。`
                    },
                    ...imageParts
                ]
            }],
            generationConfig: {
                temperature: 0.8
            }
        })
    })

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]'

    // 提取 JSON 数组
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
        try {
            return JSON.parse(jsonMatch[0])
        } catch (e) {
            console.error('JSON parse error:', e)
        }
    }

    return ['生成失败，请重试']
}

// 分析商家截图
export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.name) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const body = await req.json()
        const { action, shopScreenshot, foodImages, shopInfo } = body

        if (action === 'analyze') {
            // 分析商家截图
            if (!shopScreenshot) {
                return NextResponse.json({ error: "Missing shop screenshot" }, { status: 400 })
            }
            const info = await analyzeShopScreenshot(shopScreenshot)
            return NextResponse.json({ success: true, shopInfo: info })
        }

        if (action === 'generate') {
            // 生成点评
            if (!shopInfo || !foodImages || foodImages.length === 0) {
                return NextResponse.json({ error: "Missing shop info or food images" }, { status: 400 })
            }
            const reviews = await generateReviews(shopInfo, foodImages)
            return NextResponse.json({ success: true, reviews })
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 })

    } catch (error: any) {
        console.error("Review API error:", error)
        return NextResponse.json({ error: error.message || "Internal Error" }, { status: 500 })
    }
}
