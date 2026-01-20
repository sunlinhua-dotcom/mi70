
/**
 * Compresses an image file directly in the browser using Canvas.
 * 
 * @param file - The original File object
 * @param maxWidth - Maximum width (default 1920)
 * @param quality - JPEG quality (0 to 1, default 0.8)
 * @returns Promise<File> - The compressed file
 */
export async function compressImage(file: File, maxWidth = 1920, quality = 0.8): Promise<File> {
    // If it's not an image, return original
    if (!file.type.startsWith('image/')) return file

    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = (event) => {
            const img = new Image()
            img.src = event.target?.result as string
            img.onload = () => {
                // Calculate new dimensions
                let width = img.width
                let height = img.height

                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width)
                    width = maxWidth
                }

                // If height is still too big (e.g. extremely tall panorama), constrain it too
                if (height > maxWidth) {
                    width = Math.round((width * maxWidth) / height)
                    height = maxWidth
                }

                const canvas = document.createElement('canvas')
                canvas.width = width
                canvas.height = height

                const ctx = canvas.getContext('2d')
                if (!ctx) {
                    resolve(file) // Fallback to original if canvas fails
                    return
                }

                ctx.drawImage(img, 0, 0, width, height)

                canvas.toBlob((blob) => {
                    if (!blob) {
                        resolve(file)
                        return
                    }
                    // Create new File from blob
                    const compressedFile = new File([blob], file.name, {
                        type: 'image/jpeg',
                        lastModified: Date.now(),
                    })

                    console.log(`[Compression] ${file.name}: ${(file.size / 1024).toFixed(0)}KB -> ${(compressedFile.size / 1024).toFixed(0)}KB`)
                    resolve(compressedFile)
                }, 'image/jpeg', quality)
            }
            img.onerror = (err) => reject(err)
        }
        reader.onerror = (err) => reject(err)
    })
}
