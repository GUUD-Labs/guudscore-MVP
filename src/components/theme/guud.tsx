import { useLayoutEffect, useRef, useState } from 'react';

import {
  calculateTopOffset,
  useAdaptiveFontSize,
  useDescriptionFontSize,
} from './use-adaptive-font-size';
import { getResponsiveCardStyles } from './utils';

const CARD_BASE_SIZE = 500;
const MAX_USERNAME_WIDTH = 180;
const USERNAME_LETTER_SPACING_EM = 0.08;
const USERNAME_MAX_FONT = 17;
const USERNAME_MIN_FONT = 8;
const USERNAME_DEFAULT_FONT = 22;
const BASE_TOP_POSITION = 95;

let measurementCanvas: HTMLCanvasElement | null = null;

const getMeasurementContext = () => {
  if (typeof window === 'undefined') {
    return null;
  }
  if (!measurementCanvas) {
    measurementCanvas = document.createElement('canvas');
  }
  return measurementCanvas.getContext('2d');
};

const measureTextWidth = (
  text: string,
  fontSize: number,
  ctx: CanvasRenderingContext2D
) => {
  ctx.font = `900 ${fontSize}px Arial`;
  const baseWidth = ctx.measureText(text).width || 0;
  const extraSpacing =
    Math.max(0, text.length - 1) * fontSize * USERNAME_LETTER_SPACING_EM;
  return baseWidth + extraSpacing;
};

const calculateUsernameFontSize = (text: string) => {
  const content = (text || '').toUpperCase().trim();
  if (!content) {
    return USERNAME_DEFAULT_FONT;
  }

  const ctx = getMeasurementContext();
  if (!ctx) {
    return USERNAME_DEFAULT_FONT;
  }

  let low = USERNAME_MIN_FONT;
  let high = USERNAME_MAX_FONT;
  let best = USERNAME_MIN_FONT;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const width = measureTextWidth(content, mid, ctx);

    if (width <= MAX_USERNAME_WIDTH) {
      best = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  const finalWidth = measureTextWidth(content, best, ctx);
  if (finalWidth > MAX_USERNAME_WIDTH) {
    const ratio = MAX_USERNAME_WIDTH / finalWidth;
    const adjusted = Math.max(USERNAME_MIN_FONT, Math.floor(best * ratio));
    return adjusted;
  }

  return best;
};

const isFallbackDimension = (value?: number) => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    return true;
  }
  return Math.abs(value - CARD_BASE_SIZE) < 0.5;
};

interface GuuldCardProps {
  username: string;
  imageUrl: string;
  score: string;
  subtitleHeader: string;
  description: string;
  logoUrl?: string;
  width?: number;
  height?: number;
}

export function GuuldCard({
  username,
  imageUrl,
  score,
  subtitleHeader,
  description,
  logoUrl: _logoUrl,
  width,
  height,
}: GuuldCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [measuredSize, setMeasuredSize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const shouldMeasure =
    isFallbackDimension(width) || isFallbackDimension(height);

  const displayUsername = username?.trim() || 'Anonymous';

  const usernameFontSize = useAdaptiveFontSize(displayUsername, {
    maxWidth: MAX_USERNAME_WIDTH,
    maxFontSize: USERNAME_MAX_FONT,
    minFontSize: USERNAME_MIN_FONT,
    fontFamily: 'MoonGet, Arial, sans-serif',
    fontWeight: 900,
    letterSpacingEm: USERNAME_LETTER_SPACING_EM,
  });

  // Responsive font size for description (max 10px, min 7px)
  // Reduced maxWidth to 160px to prevent overflow and account for monospace font spacing
  const descriptionFontSize = useDescriptionFontSize(description, 160, 10, 7);

  // Measure the rendered container so the card scales correctly on the very first paint
  useLayoutEffect(() => {
    if (!shouldMeasure) {
      setMeasuredSize(prev => (prev ? null : prev));
      return;
    }

    const node = containerRef.current;
    if (!node) {
      return;
    }

    const updateSize = () => {
      const rect = node.getBoundingClientRect();
      if (!rect.width || !rect.height) {
        return;
      }
      setMeasuredSize(prev => {
        if (
          prev &&
          Math.abs(prev.width - rect.width) < 0.5 &&
          Math.abs(prev.height - rect.height) < 0.5
        ) {
          return prev;
        }
        return { width: rect.width, height: rect.height };
      });
    };

    updateSize();

    if (typeof ResizeObserver === 'undefined') {
      return;
    }

    const observer = new ResizeObserver(() => updateSize());
    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [height, shouldMeasure, width]);

  const topOffset = calculateTopOffset(
    usernameFontSize,
    USERNAME_MAX_FONT,
    USERNAME_MIN_FONT,
    10
  );
  const dynamicTop = BASE_TOP_POSITION + topOffset;

  const effectiveWidth = isFallbackDimension(width)
    ? (measuredSize?.width ?? width)
    : width;
  const effectiveHeight = isFallbackDimension(height)
    ? (measuredSize?.height ?? height)
    : height;

  const { containerStyle, contentStyle } = getResponsiveCardStyles(
    effectiveWidth,
    effectiveHeight
  );

  return (
    <div ref={containerRef} className="relative" style={containerStyle}>
      <div
        className="relative overflow-hidden"
        style={{
          ...contentStyle,
          backgroundColor: '#000',
          backgroundImage: 'url(/theme/guud-card.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* Username */}
        <div
          className="absolute z-10"
          style={{ width: '180px', top: `${dynamicTop}px`, left: '155px' }}
        >
          <div
            style={{
              fontFamily: 'MoonGet, Arial, sans-serif',
              fontSize: `${usernameFontSize}px`,
              fontWeight: 900,
              color: '#fff',
              textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
              textTransform: 'uppercase',
              letterSpacing: `${USERNAME_LETTER_SPACING_EM}em`,
              whiteSpace: 'nowrap',
              overflow: 'visible',
              maxWidth: '180px',
            }}
            title={displayUsername}
          >
            {displayUsername}
          </div>
        </div>

        {/* User Image */}
        <div
          style={{
            position: 'absolute',
            zIndex: 10,
            width: '197px',
            top: '126px',
            left: '153.5px',
          }}
        >
          <div style={{ position: 'relative' }}>
            <div style={{ overflow: 'hidden', borderRadius: '8px' }}>
              <div
                style={{
                  position: 'relative',
                  width: '198px',
                  height: '198px',
                  background:
                    'linear-gradient(to bottom right, #f9a8d4, #f472b6)',
                }}
              >
                {imageUrl && (
                  <img
                    src={imageUrl}
                    alt={displayUsername}
                    crossOrigin="anonymous"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      height: '100%',
                      width: '100%',
                      objectFit: 'cover',
                      objectPosition: 'top',
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Score */}
        <div
          className="absolute z-10"
          style={{ width: '198px', top: '333px', left: '150px' }}
        >
          <div
            style={{
              fontFamily: 'NK57 Monospace, monospace',
              fontSize: '19px',
              fontWeight: 800,
              color: '#FFD700',
            }}
          >
            SCORE:
            <span
              style={{
                color: '#00B4D8',
                textShadow: '0 0 10px rgba(0, 180, 216, 0.6)',
              }}
            >
              #
            </span>
            <span
              style={{
                color: '#FFFFFF',
                textShadow: '0 0 10px rgba(255, 255, 255, 0.6)',
              }}
            >
              {score}
            </span>
          </div>
        </div>

        {/* Subtitle Header */}
        <div
          className="absolute z-10"
          style={{ width: '196px', top: '365px', left: '202px' }}
        >
          <div
            style={{
              fontFamily: 'NK57 Monospace, monospace',
              fontSize: '9px',
              fontWeight: 700,
              color: '#fff',
            }}
          >
            {subtitleHeader}
          </div>
        </div>

        {/* Description */}
        <div
          className="absolute z-10"
          style={{
            width: '160px',
            top: '380px',
            left: '202px',
            maxWidth: '160px',
            height: '42px',
          }}
        >
          <div
            style={
              {
                fontFamily: 'NK57 Monospace, monospace',
                fontSize: `${descriptionFontSize}px`,
                fontWeight: 300,
                color: '#ccc',
                lineHeight: 1.4,
                overflow: 'hidden',
                overflowWrap: 'break-word',
                wordBreak: 'normal',
                whiteSpace: 'normal',
                width: '100%',
                height: '100%',
              } as React.CSSProperties
            }
            title={description}
          >
            {description}
          </div>
        </div>
      </div>
    </div>
  );
}
