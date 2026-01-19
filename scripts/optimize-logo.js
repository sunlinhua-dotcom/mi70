
const sharp = require('sharp');
const path = require('path');

async function optimizeLogo() {
    const inputPath = path.join(__dirname, '../public/assets/styles/logo_mi70.png');
    const outputPath = path.join(__dirname, '../public/assets/styles/logo_mi70.webp');
    const smallOutputPath = path.join(__dirname, '../public/assets/styles/logo_mi70_small.webp');

    try {
        console.log('Optimizing logo...');

        // Main optimized logo
        await sharp(inputPath)
            .resize(400, 400, { fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 85 })
            .toFile(outputPath);

        console.log('Created logo_mi70.webp');

        // Small version for login page (80x80)
        await sharp(inputPath)
            .resize(160, 160) // 2x for retina
            .webp({ quality: 80 })
            .toFile(smallOutputPath);

        console.log('Created logo_mi70_small.webp');

    } catch (err) {
        console.error('Error optimizing logo:', err);
    }
}

optimizeLogo();
