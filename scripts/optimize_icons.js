const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SOURCE_DIR = path.join(process.cwd(), 'public/assets/styles');
const TARGET_DIR = path.join(process.cwd(), 'public/assets/styles');

const MAPPING = {
    'style_michelin_1768654850793.png': 'style_icon_michelin_v3.webp',
    'style_dark_luxury_1768655051914.png': 'style_icon_hk_v3.webp',
    'style_zen_1768654891745.png': 'style_icon_zen_v3.webp',
    'style_commercial_1768655424752.png': 'style_icon_street_v3.webp',
    'style_patisserie_1768655437857.png': 'style_icon_romantic_v3.webp',
    'style_nordic_1768654864840.png': 'style_icon_morandi_v3.webp',
    'style_macro_1768655015215.png': 'style_icon_macro_v3.webp',
    'style_rustic_1768654953559.png': 'style_icon_rustic_v3.webp',
    'style_moody_1768654878267.png': 'style_icon_story_v1.webp',
    'style_airy_1768655033506.png': 'style_icon_shanghai_v1.webp'
};

async function optimize() {
    console.log('Starting icon optimization...');

    for (const [src, dest] of Object.entries(MAPPING)) {
        const srcPath = path.join(SOURCE_DIR, src);
        const destPath = path.join(TARGET_DIR, dest);

        if (!fs.existsSync(srcPath)) {
            console.error(`Source file not found: ${src}`);
            continue;
        }

        try {
            await sharp(srcPath)
                .resize(256, 256, { fit: 'cover' })
                .webp({ quality: 80 })
                .toFile(destPath);

            console.log(`✅ Optimized: ${dest}`);
        } catch (error) {
            console.error(`❌ Failed to process ${src}:`, error);
        }
    }
    console.log('Optimization complete.');
}

optimize();
