import { type CardTemplate } from '@/components/social-media-card';

export interface CardRenderData {
  username: string;
  imageUrl: string;
  score: string;
  subtitleHeader: string;
  description: string;
}

interface TextElement {
  text: string;
  x: number;
  y: number;
  fontFamily: string;
  fontSize: number;
  fontWeight: string | number;
  color: string;
  textShadow?: string;
  textTransform?: 'uppercase' | 'lowercase' | 'capitalize';
  letterSpacing?: number;
  lineHeight?: number;
  maxWidth?: number;
}

interface ImageElement {
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
  borderRadius?: number;
}

interface CardLayout {
  backgroundImage: string;
  width: number;
  height: number;
  elements: {
    username: Omit<TextElement, 'text'>;
    userImage: Omit<ImageElement, 'url'>;
    score: Omit<TextElement, 'text'> & { scoreColor?: string };
    subtitleHeader: Omit<TextElement, 'text'>;
    description: Omit<TextElement, 'text'>;
  };
}

const CARD_LAYOUTS: Record<CardTemplate, CardLayout> = {
  guud: {
    backgroundImage: '/theme/guud-card.png',
    width: 500,
    height: 500,
    elements: {
      username: {
        x: 155,
        y: 110,
        fontFamily: 'Arial, sans-serif',
        fontSize: 24,
        fontWeight: 900,
        color: '#fff',
        textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
        textTransform: 'uppercase',
        letterSpacing: 0.08,
        maxWidth: 198,
      },
      userImage: {
        x: 153.5,
        y: 126,
        width: 198,
        height: 198,
        borderRadius: 8,
      },
      score: {
        x: 150,
        y: 350,
        fontFamily: 'Arial, sans-serif',
        fontSize: 20,
        fontWeight: 700,
        color: '#FFD700',
        scoreColor: '#00B4D8',
        maxWidth: 198,
      },
      subtitleHeader: {
        x: 200,
        y: 380,
        fontFamily: 'monospace',
        fontSize: 12,
        fontWeight: 600,
        color: '#fff',
        maxWidth: 198,
      },
      description: {
        x: 200,
        y: 395,
        fontFamily: 'monospace',
        fontSize: 10,
        fontWeight: 400,
        color: '#ccc',
        lineHeight: 1.4,
        maxWidth: 198,
      },
    },
  },
  avax: {
    backgroundImage: '/theme/avax.png',
    width: 500,
    height: 500,
    elements: {
      username: {
        x: 155,
        y: 110,
        fontFamily: 'Arial, sans-serif',
        fontSize: 24,
        fontWeight: 900,
        color: '#fff',
        textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
        textTransform: 'uppercase',
        letterSpacing: 0.08,
        maxWidth: 198,
      },
      userImage: {
        x: 153.5,
        y: 126,
        width: 198,
        height: 198,
        borderRadius: 8,
      },
      score: {
        x: 150,
        y: 350,
        fontFamily: 'Arial, sans-serif',
        fontSize: 20,
        fontWeight: 700,
        color: '#E84142',
        scoreColor: '#E84142',
        maxWidth: 198,
      },
      subtitleHeader: {
        x: 200,
        y: 380,
        fontFamily: 'monospace',
        fontSize: 12,
        fontWeight: 600,
        color: '#fff',
        maxWidth: 198,
      },
      description: {
        x: 200,
        y: 395,
        fontFamily: 'monospace',
        fontSize: 10,
        fontWeight: 400,
        color: '#ccc',
        lineHeight: 1.4,
        maxWidth: 198,
      },
    },
  },
  desci: {
    backgroundImage: '/theme/desci.png',
    width: 500,
    height: 500,
    elements: {
      username: {
        x: 155,
        y: 110,
        fontFamily: 'Arial, sans-serif',
        fontSize: 24,
        fontWeight: 900,
        color: '#fff',
        textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
        textTransform: 'uppercase',
        letterSpacing: 0.08,
        maxWidth: 198,
      },
      userImage: {
        x: 153.5,
        y: 126,
        width: 198,
        height: 198,
        borderRadius: 8,
      },
      score: {
        x: 150,
        y: 350,
        fontFamily: 'Arial, sans-serif',
        fontSize: 20,
        fontWeight: 700,
        color: '#8B5CF6',
        scoreColor: '#8B5CF6',
        maxWidth: 198,
      },
      subtitleHeader: {
        x: 200,
        y: 380,
        fontFamily: 'monospace',
        fontSize: 12,
        fontWeight: 600,
        color: '#fff',
        maxWidth: 198,
      },
      description: {
        x: 200,
        y: 395,
        fontFamily: 'monospace',
        fontSize: 10,
        fontWeight: 400,
        color: '#ccc',
        lineHeight: 1.4,
        maxWidth: 198,
      },
    },
  },
  'no-chillio': {
    backgroundImage: '/theme/no-chillio.png',
    width: 500,
    height: 500,
    elements: {
      username: {
        x: 155,
        y: 110,
        fontFamily: 'Arial, sans-serif',
        fontSize: 24,
        fontWeight: 900,
        color: '#fff',
        textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
        textTransform: 'uppercase',
        letterSpacing: 0.08,
        maxWidth: 198,
      },
      userImage: {
        x: 153.5,
        y: 126,
        width: 198,
        height: 198,
        borderRadius: 8,
      },
      score: {
        x: 150,
        y: 350,
        fontFamily: 'Arial, sans-serif',
        fontSize: 20,
        fontWeight: 700,
        color: '#10B981',
        scoreColor: '#10B981',
        maxWidth: 198,
      },
      subtitleHeader: {
        x: 200,
        y: 380,
        fontFamily: 'monospace',
        fontSize: 12,
        fontWeight: 600,
        color: '#fff',
        maxWidth: 198,
      },
      description: {
        x: 200,
        y: 395,
        fontFamily: 'monospace',
        fontSize: 10,
        fontWeight: 400,
        color: '#ccc',
        lineHeight: 1.4,
        maxWidth: 198,
      },
    },
  },
  gta: {
    backgroundImage: '/theme/gta.png',
    width: 500,
    height: 500,
    elements: {
      username: {
        x: 155,
        y: 110,
        fontFamily: 'Arial, sans-serif',
        fontSize: 24,
        fontWeight: 900,
        color: '#fff',
        textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
        textTransform: 'uppercase',
        letterSpacing: 0.08,
        maxWidth: 198,
      },
      userImage: {
        x: 153.5,
        y: 126,
        width: 198,
        height: 198,
        borderRadius: 8,
      },
      score: {
        x: 150,
        y: 350,
        fontFamily: 'Arial, sans-serif',
        fontSize: 20,
        fontWeight: 700,
        color: '#F59E0B',
        scoreColor: '#F59E0B',
        maxWidth: 198,
      },
      subtitleHeader: {
        x: 200,
        y: 380,
        fontFamily: 'monospace',
        fontSize: 12,
        fontWeight: 600,
        color: '#fff',
        maxWidth: 198,
      },
      description: {
        x: 200,
        y: 395,
        fontFamily: 'monospace',
        fontSize: 10,
        fontWeight: 400,
        color: '#ccc',
        lineHeight: 1.4,
        maxWidth: 198,
      },
    },
  },
  coq: {
    backgroundImage: '/theme/coq.png',
    width: 500,
    height: 500,
    elements: {
      username: {
        x: 155,
        y: 110,
        fontFamily: 'Arial, sans-serif',
        fontSize: 24,
        fontWeight: 900,
        color: '#fff',
        textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
        textTransform: 'uppercase',
        letterSpacing: 0.08,
        maxWidth: 198,
      },
      userImage: {
        x: 153.5,
        y: 126,
        width: 198,
        height: 198,
        borderRadius: 8,
      },
      score: {
        x: 150,
        y: 350,
        fontFamily: 'Arial, sans-serif',
        fontSize: 20,
        fontWeight: 700,
        color: '#EF4444',
        scoreColor: '#EF4444',
        maxWidth: 198,
      },
      subtitleHeader: {
        x: 200,
        y: 380,
        fontFamily: 'monospace',
        fontSize: 12,
        fontWeight: 600,
        color: '#fff',
        maxWidth: 198,
      },
      description: {
        x: 200,
        y: 395,
        fontFamily: 'monospace',
        fontSize: 10,
        fontWeight: 400,
        color: '#ccc',
        lineHeight: 1.4,
        maxWidth: 198,
      },
    },
  },
};

// Image cache to avoid reloading images
const imageCache = new Map<string, HTMLImageElement>();

const loadImage = (url: string): Promise<HTMLImageElement> => {
  // Check cache first
  const cached = imageCache.get(url);
  if (cached && cached.complete) {
    return Promise.resolve(cached);
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      imageCache.set(url, img);
      resolve(img);
    };

    img.onerror = (error) => {
      console.error(`Failed to load image: ${url}`, error);
      reject(new Error(`Failed to load image: ${url}`));
    };

    img.src = url;
  });
};

// Preload all background images on module load for faster rendering
const preloadBackgrounds = () => {
  const backgrounds = [
    '/theme/guud-card.png',
    '/theme/avax.png',
    '/theme/desci.png',
    '/theme/no-chillio.png',
    '/theme/gta.png',
    '/theme/coq.png',
  ];

  backgrounds.forEach(url => {
    loadImage(url).catch(() => {
      // Silently fail for preloading
    });
  });
};

// Preload in background
if (typeof window !== 'undefined') {
  // Delay preloading slightly to not block initial page load
  setTimeout(preloadBackgrounds, 1000);
}

const drawRoundedImage = (
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) => {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(img, x, y, width, height);
  ctx.restore();
};

const drawText = (ctx: CanvasRenderingContext2D, config: TextElement) => {
  const {
    text,
    x,
    y,
    fontFamily,
    fontSize,
    fontWeight,
    color,
    textShadow,
    textTransform,
    letterSpacing = 0,
  } = config;

  let displayText = text;
  if (textTransform === 'uppercase') displayText = text.toUpperCase();
  if (textTransform === 'lowercase') displayText = text.toLowerCase();

  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  ctx.fillStyle = color;

  if (textShadow) {
    const shadowMatch = textShadow.match(
      /([-\d.]+)px\s+([-\d.]+)px\s+([-\d.]+)px\s+rgba?\(([^)]+)\)/,
    );
    if (shadowMatch) {
      const [, offsetX, offsetY, blur, rgbaValues] = shadowMatch;
      ctx.shadowOffsetX = parseFloat(offsetX);
      ctx.shadowOffsetY = parseFloat(offsetY);
      ctx.shadowBlur = parseFloat(blur);
      ctx.shadowColor = `rgba(${rgbaValues})`;
    }
  }

  if (letterSpacing > 0) {
    let currentX = x;
    for (const char of displayText) {
      ctx.fillText(char, currentX, y);
      currentX += ctx.measureText(char).width + fontSize * letterSpacing;
    }
  } else {
    ctx.fillText(displayText, x, y);
  }

  // Reset shadow
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  ctx.shadowBlur = 0;
};

export const renderCardToCanvas = async (
  template: CardTemplate,
  data: CardRenderData,
): Promise<HTMLCanvasElement> => {
  const layout = CARD_LAYOUTS[template];
  if (!layout) {
    throw new Error(`Unknown card template: ${template}`);
  }

  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.width = layout.width;
  canvas.height = layout.height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // Load and draw background
  const backgroundImg = await loadImage(layout.backgroundImage);
  ctx.drawImage(backgroundImg, 0, 0, layout.width, layout.height);

  // Draw user image
  try {
    const userImg = await loadImage(data.imageUrl);
    const imgConfig = layout.elements.userImage;
    if (imgConfig.borderRadius) {
      drawRoundedImage(
        ctx,
        userImg,
        imgConfig.x,
        imgConfig.y,
        imgConfig.width,
        imgConfig.height,
        imgConfig.borderRadius,
      );
    } else {
      ctx.drawImage(
        userImg,
        imgConfig.x,
        imgConfig.y,
        imgConfig.width,
        imgConfig.height,
      );
    }
  } catch (error) {
    console.error('Failed to load user image:', error);
    // Draw placeholder
    const imgConfig = layout.elements.userImage;
    ctx.fillStyle = '#ccc';
    ctx.fillRect(imgConfig.x, imgConfig.y, imgConfig.width, imgConfig.height);
  }

  // Draw username
  drawText(ctx, {
    ...layout.elements.username,
    text: data.username,
  });

  // Draw score with special formatting
  const scoreConfig = layout.elements.score;
  const scoreText = `SCORE: ${data.score}`;
  ctx.font = `${scoreConfig.fontWeight} ${scoreConfig.fontSize}px ${scoreConfig.fontFamily}`;
  ctx.fillStyle = scoreConfig.color;
  ctx.fillText('SCORE: ', scoreConfig.x, scoreConfig.y);

  const scorePrefix = ctx.measureText('SCORE: ').width;
  ctx.fillStyle = scoreConfig.scoreColor || scoreConfig.color;
  if (scoreConfig.scoreColor === '#00B4D8') {
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'rgba(0, 180, 216, 0.6)';
  }
  ctx.fillText(data.score, scoreConfig.x + scorePrefix, scoreConfig.y);
  ctx.shadowBlur = 0;

  // Draw subtitle header
  drawText(ctx, {
    ...layout.elements.subtitleHeader,
    text: data.subtitleHeader,
  });

  // Draw description
  drawText(ctx, {
    ...layout.elements.description,
    text: data.description,
  });

  return canvas;
};

export const renderCardToBlob = async (
  template: CardTemplate,
  data: CardRenderData,
): Promise<Blob> => {
  const canvas = await renderCardToCanvas(template, data);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob from canvas'));
        }
      },
      'image/png',
      1.0,
    );
  });
};
