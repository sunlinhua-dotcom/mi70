const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SOURCE_DIR = process.cwd(); // Read from root
const TARGET_DIR = path.join(process.cwd(), 'public/assets/styles');

const MAPPING = {
    '米其林.png': 'style_icon_michelin_v3.webp',
    '港式茶餐厅.png': 'style_icon_hk_v3.webp',
    '禅意和风.png': 'style_icon_zen_v3.webp',
    '中式烟火气.png': 'style_icon_street_v3.webp',
    '法式浪漫.png': 'style_icon_romantic_v3.webp',
    '清新莫兰迪.png': 'style_icon_morandi_v3.webp',
    '微距质感.png': 'style_icon_macro_v3.webp',
    '美食故事.png': 'style_icon_story_v1.webp',
    '上海菜.png': 'style_icon_shanghai_v1.webp'
};

if (!fs.existsSync(TARGET_DIR)) {
    fs.mkdirSync(TARGET_DIR, { recursive: true });
}

async function optimize() {
    console.log('Starting icon optimization (User Provided)...');

    for (const [src, dest] of Object.entries(MAPPING)) {
        const srcPath = path.join(SOURCE_DIR, src);
        const destPath = path.join(TARGET_DIR, dest);

        if (!fs.existsSync(srcPath)) {
            console.error(`⚠️  Source file not found: ${src}`);
            continue;
        }

        try {
            await sharp(srcPath)
                .resize(256, 256, { fit: 'cover' })
                .webp({ quality: 85 }) // Slightly higher quality for manual assets
                .toFile(destPath);

            console.log(`✅ Optimized: ${src} -> ${dest}`);
        } catch (error) {
            console.error(`❌ Failed to process ${src}:`, error);
        }
    }
    console.log('Optimization complete.');
}

optimize();
