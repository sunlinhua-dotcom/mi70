---
name: Gemini Image Fusion
description: 模块化的 AI 图片融合技术栈 - 适用于产品摄影、美食拍摄、美妆种草等场景
---

# 🎨 Gemini Image Fusion SKILL

这是从「米70」和「佰草集」项目中提炼的**产品级 AI 图片融合技术栈**。核心能力：将产品图智能融合进真实环境，生成专业级商业摄影效果。

---

## 📦 模块架构

### ✅ **核心模块（必选）**

1. **Gemini API 调用封装** - 处理图片生成请求
2. **客户端图片压缩** - 减少上传时间和服务器负载
3. **提示词工程模板** - 三大黄金法则（Best Angle Discovery / Re-compose / Soul Extraction）

### 🔧 **存储方案（三选一）**

- **方案 A - Cloudflare R2**：适合大流量、需要 CDN、生产环境
- **方案 B - 本地文件系统**：适合内网部署、无公网暴露需求
- **方案 C - Base64 数据库**：适合小型项目、快速原型（注意数据库容量）

### ⚡ **处理模式（二选一）**

- **同步模式**：用户等待（20-40秒），适合低并发、简单场景
- **异步队列**：后台处理，适合长任务、高并发（需要 Job Queue + 轮询）

### 🎯 **前端组件（可选）**

- 进度条显示
- 下载进度 UI
- 历史记录页面

---

## 🚀 快速开始

### 第一步：选择您的技术栈

**示例 1 - 单页应用（如佰草集）**

```
✅ 核心模块
✅ Base64 数据库存储
✅ 同步处理模式
❌ 不需要异步队列
```

**示例 2 - 生产级系统（如米70）**

```
✅ 核心模块
✅ Cloudflare R2 存储
✅ 异步队列处理
✅ 完整前端组件
```

---

## 📂 文件结构

安装本 SKILL 后，您的项目将增加以下文件：

```
your-project/
├── lib/
│   ├── gemini.ts              # Gemini API 调用核心
│   ├── client-compression.ts  # 客户端图片压缩
│   └── [可选] job-processor.ts    # 异步任务处理器
├── app/api/
│   └── generate/route.ts      # 生成 API 端点
└── [可选] scripts/
    └── optimize_icons.js      # 图标优化脚本
```

---

## 💻 代码示例

### 1️⃣ 安装依赖（共通）

```bash
npm install sharp
# 如果使用 R2
npm install @aws-sdk/client-s3
# 如果使用异步队列
npm install @prisma/client
```

### 2️⃣ 核心模块 - Gemini API 调用

创建 `lib/gemini.ts`：

```typescript
const API_KEY = process.env.APIYI_API_KEY
const MODEL = 'gemini-3-pro-image-preview'
const BASE_URL = 'https://api.apiyi.com/v1beta'

export async function generateProductImage(
    productBase64: string,
    envBase64: string,
    productName: string
): Promise<string> {
    const prompt = `
    ROLE: World-Class Commercial Product Photographer.
    
    ━━━━━ THREE CORE PRINCIPLES ━━━━━
    
    1. BEST ANGLE DISCOVERY (寻找黄金位)
       - Analyze "IMAGE 2" (Environment) to find the SINGLE MOST PHOTOGENIC SPOT.
       - Look for: textured surfaces, natural light, elegant corners.
    
    2. RE-COMPOSE (重构镜头)
       - Push camera closer. PRODUCT is the hero.
       - Use tight framing (f/1.8-f/2.8).
    
    3. SOUL EXTRACTION (提取光影之魂)
       - Extract the exact lighting mood from environment.
       - RE-PAINT product reflections to match perfectly.
    
    OUTPUT: Premium campaign-quality shot. NO watermarks.
    `

    const maxRetries = 3
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const response = await fetch(`${BASE_URL}/models/${MODEL}:generateContent`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            { text: prompt },
                            { inline_data: { mime_type: "image/jpeg", data: productBase64 } },
                            { inline_data: { mime_type: "image/jpeg", data: envBase64 } }
                        ]
                    }],
                    generationConfig: {
                        responseModalities: ["IMAGE"],
                        imageConfig: { aspectRatio: "1:1", imageSize: "1K" }
                    }
                })
            })

            if (response.status === 503 && attempt < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, 2000))
                continue
            }

            if (!response.ok) throw new Error(`API Error: ${response.status}`)

            const data = await response.json()
            const imagePart = data.candidates[0].content.parts.find((p: any) => p.inline_data)
            return imagePart.inline_data.data

        } catch (error) {
            lastError = error as Error
            if (!lastError.message.includes('503')) break
        }
    }

    throw lastError || new Error("Failed after retries")
}
```

### 3️⃣ 客户端图片压缩

创建 `lib/client-compression.ts`：

```typescript
export async function compressImage(
    file: File,
    maxWidth: number = 1200,
    quality: number = 0.85
): Promise<File> {
    return new Promise((resolve, reject) => {
        const img = new Image()
        const reader = new FileReader()

        reader.onload = (e) => {
            img.src = e.target?.result as string
        }

        img.onload = () => {
            const canvas = document.createElement('canvas')
            let { width, height } = img

            if (width > maxWidth) {
                height = (height * maxWidth) / width
                width = maxWidth
            }

            canvas.width = width
            canvas.height = height
            const ctx = canvas.getContext('2d')!
            ctx.drawImage(img, 0, 0, width, height)

            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        resolve(new File([blob], file.name, { type: 'image/jpeg' }))
                    } else {
                        reject(new Error('Canvas conversion failed'))
                    }
                },
                'image/jpeg',
                quality
            )
        }

        img.onerror = reject
        reader.readAsDataURL(file)
    })
}
```

### 4️⃣ API 路由（同步模式 - 适合佰草集）

创建 `app/api/generate/route.ts`：

```typescript
import { NextResponse } from 'next/server'
import { generateProductImage } from '@/lib/gemini'

export async function POST(req: Request) {
    try {
        const formData = await req.formData()
        const productFile = formData.get('productFile') as File
        const envFile = formData.get('envFile') as File

        // 读取并转 Base64
        const productBuffer = Buffer.from(await productFile.arrayBuffer())
        const envBuffer = Buffer.from(await envFile.arrayBuffer())
        
        const productBase64 = productBuffer.toString('base64')
        const envBase64 = envBuffer.toString('base64')

        // 调用 Gemini
        const resultBase64 = await generateProductImage(productBase64, envBase64, "Product")

        return NextResponse.json({
            success: true,
            imageData: resultBase64
        })

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
```

### 5️⃣ 前端调用示例

```typescript
'use client'
import { compressImage } from '@/lib/client-compression'

async function handleGenerate() {
    const productFile = /* 用户选择的产品图 */
    const envFile = /* 用户选择的环境图 */

    // 1. 压缩图片
    const compressedProduct = await compressImage(productFile, 1200, 0.85)
    const compressedEnv = await compressImage(envFile, 1200, 0.80)

    // 2. 上传并生成
    const formData = new FormData()
    formData.append('productFile', compressedProduct)
    formData.append('envFile', compressedEnv)

    const response = await fetch('/api/generate', {
        method: 'POST',
        body: formData
    })

    const data = await response.json()
    if (data.success) {
        const imageUrl = `data:image/jpeg;base64,${data.imageData}`
        // 显示结果
    }
}
```

---

## 🔐 环境变量配置

在 `.env.local` 中添加：

```bash
# Gemini API (必需)
APIYI_API_KEY=sk-YOUR-KEY-HERE

# Cloudflare R2 (仅方案 A 需要)
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=your-bucket-name
R2_PUBLIC_DOMAIN=https://your-r2-domain.com

# 数据库 (仅异步模式需要)
DATABASE_URL=postgresql://...
```

---

## 📊 性能优化建议

### 客户端优化

- ✅ 压缩后再上传（减少 70% 传输时间）
- ✅ 使用 `axios` 显示上传/下载进度
- ✅ 添加重试机制应对 503 错误

### 服务端优化

- ✅ 使用 Sharp 压缩服务端图片
- ✅ R2 启用 CDN-Cache-Control
- ✅ 生成缩略图 (`_thumb.jpg`) 用于列表展示

### 数据库优化（异步模式）

- ✅ 存储 R2 URL 而非 Base64（减少 90% 空间）
- ✅ 为 `status` 字段添加索引
- ✅ 定期清理旧任务

---

## 🎯 使用场景

| 项目 | 存储方案 | 处理模式 | 适用场景 |
|---|---|---|---|
| 佰草集种草 | Base64 数据库 | 同步 | 单页应用，低流量 |
| 米70美食绘图 | Cloudflare R2 | 异步队列 | 高并发，生产环境 |
| 内网商品拍摄 | 本地文件系统 | 同步 | 企业内网，无外网 |

---

## 📞 故障排查

### Q1: 503 错误频繁

**原因**：API 服务过载  
**解决**：已内置自动重试（3次），如持续失败请联系 APIYI 客服

### Q2: 图片模糊

**原因**：压缩质量过低  
**解决**：调高 `quality` 参数（建议 0.80-0.90）

### Q3: 生成时间过长

**原因**：Gemini API 平均 30-40 秒  
**解决**：使用异步模式 + 前端轮询

---

## 📝 更新日志

- **v1.0.0** (2026-01-22): 初版发布，支持同步/异步双模式

---

## 💡 下一步

1. 复制所需的代码片段到您的项目
2. 配置环境变量
3. 根据场景选择存储方案
4. 测试生成流程

需要完整代码示例请查看：

- 米70项目（异步 + R2）：`/Users/linhuasun/Desktop/MI70/culinary-artificer`
- 佰草集项目（同步 + Base64）：`/Users/linhuasun/Desktop/BCJ_BAGC/herborist-app`
