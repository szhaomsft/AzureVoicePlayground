/**
 * Utility to fetch background images for video generation
 */

export interface BingImageData {
  url: string;
  copyright: string;
  title: string;
}

/**
 * Fetch beautiful background images from Unsplash
 * Unsplash provides free, high-quality images with proper CORS headers
 */
export async function fetchBingDailyImage(): Promise<BingImageData> {
  try {
    // Use Unsplash's random photo API with landscape orientation
    // Collections: Nature (1065976), Wallpapers (1065396), Landscapes (3330448)
    const collections = '1065976,1065396,3330448';
    const imageUrl = `https://source.unsplash.com/1920x1080/?nature,landscape,wallpaper&collections=${collections}`;

    return {
      url: imageUrl,
      copyright: 'Photo from Unsplash',
      title: 'Beautiful Landscape',
    };
  } catch (error) {
    console.error('Error fetching background image:', error);
    throw error;
  }
}

/**
 * Alternative: Use Picsum Photos (Lorem Picsum)
 * Provides random images with no rate limits and proper CORS
 */
export function getPicsumImage(): BingImageData {
  // Use random seed for unique image each generation
  const seed = Math.random().toString(36).substring(7) + Date.now();
  const imageUrl = `https://picsum.photos/seed/${seed}/1920/1080`;

  return {
    url: imageUrl,
    copyright: 'Photo from Lorem Picsum',
    title: 'Random Landscape',
  };
}

/**
 * Alternative: Use beautiful gradient backgrounds
 * These are generated client-side, so no CORS or network issues
 */
export function getGradientBackground(): BingImageData {
  const gradients = [
    {
      url: 'gradient-sunset',
      title: 'Sunset Gradient',
      copyright: 'Generated Gradient',
      colors: ['#FF6B6B', '#4ECDC4', '#45B7D1'],
    },
    {
      url: 'gradient-ocean',
      title: 'Ocean Gradient',
      copyright: 'Generated Gradient',
      colors: ['#667eea', '#764ba2', '#f093fb'],
    },
    {
      url: 'gradient-forest',
      title: 'Forest Gradient',
      copyright: 'Generated Gradient',
      colors: ['#134E5E', '#71B280'],
    },
    {
      url: 'gradient-aurora',
      title: 'Aurora Gradient',
      copyright: 'Generated Gradient',
      colors: ['#00c6ff', '#0072ff', '#9d50bb'],
    },
    {
      url: 'gradient-fire',
      title: 'Fire Gradient',
      copyright: 'Generated Gradient',
      colors: ['#f12711', '#f5af19'],
    },
  ];

  const randomGradient = gradients[Math.floor(Math.random() * gradients.length)];
  return randomGradient as BingImageData;
}

/**
 * Load image from URL and return as HTMLImageElement
 */
export async function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // Enable CORS

    img.onload = () => resolve(img);
    img.onerror = (error) => reject(new Error(`Failed to load image: ${error}`));

    img.src = url;
  });
}

/**
 * Create a beautiful gradient background on canvas
 */
export function createGradientBackground(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  colors?: string[]
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Default colors if not provided
  const gradientColors = colors || ['#667eea', '#764ba2', '#f093fb'];

  // Create multi-stop gradient
  const gradient = ctx.createLinearGradient(0, 0, width, height);

  if (gradientColors.length === 2) {
    gradient.addColorStop(0, gradientColors[0]);
    gradient.addColorStop(1, gradientColors[1]);
  } else if (gradientColors.length === 3) {
    gradient.addColorStop(0, gradientColors[0]);
    gradient.addColorStop(0.5, gradientColors[1]);
    gradient.addColorStop(1, gradientColors[2]);
  } else {
    // Multiple colors - distribute evenly
    gradientColors.forEach((color, index) => {
      gradient.addColorStop(index / (gradientColors.length - 1), color);
    });
  }

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Add subtle noise/texture overlay
  ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
  for (let i = 0; i < 1000; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const size = Math.random() * 2;
    ctx.fillRect(x, y, size, size);
  }
}

/**
 * Fallback: Generate a default gradient background
 */
export function createFallbackGradient(
  canvas: HTMLCanvasElement,
  width: number,
  height: number
): void {
  createGradientBackground(canvas, width, height, ['#667eea', '#764ba2', '#f093fb']);
}
