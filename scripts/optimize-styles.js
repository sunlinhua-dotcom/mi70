
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function optimizeStyles() {
    const stylesDir = path.join(__dirname, '../public/assets/styles');
    const files = fs.readdirSync(stylesDir);

    console.log('Optimizing style icons...');

    for (const file of files) {
        if (file.startsWith('style_') && file.endsWith('.png')) {
            const inputPath = path.join(stylesDir, file);
            const webpName = file.replace('.png', '.webp');
            const outputPath = path.join(stylesDir, webpName);

            try {
                // Resize to 160x160 (2x for retina) and convert to WebP
                await sharp(inputPath)
                    .resize(160, 160)
                    .webp({ quality: 80 })
                    .toFile(outputPath);

                const statsOriginal = fs.statSync(inputPath);
                const statsNew = fs.statSync(outputPath);

                console.log(`Optimized ${file}: ${(statsOriginal.size / 1024).toFixed(1)}KB -> ${(statsNew.size / 1024).toFixed(1)}KB`);
            } catch (err) {
                console.error(`Error optimizing ${file}:`, err);
            }
        }
    }
}

optimizeStyles();
