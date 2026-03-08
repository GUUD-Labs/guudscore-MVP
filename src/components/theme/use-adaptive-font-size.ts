import { useLayoutEffect, useState } from 'react';

type AdaptiveFontSizeOptions = {
  maxWidth: number;
  maxFontSize: number;
  minFontSize?: number;
  fontFamily?: string;
  fontWeight?: number | string;
  letterSpacingEm?: number;
  uppercase?: boolean;
  safetyFactor?: number;
};

type ResolvedOptions = Required<
  Omit<AdaptiveFontSizeOptions, 'minFontSize'>
> & {
  minFontSize: number;
};

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
  ctx: CanvasRenderingContext2D,
  options: ResolvedOptions
) => {
  ctx.font = `${options.fontWeight} ${fontSize}px ${options.fontFamily}`;
  const baseWidth = ctx.measureText(text).width || 0;
  const extraSpacing =
    options.letterSpacingEm > 0
      ? Math.max(0, text.length - 1) * fontSize * options.letterSpacingEm
      : 0;

  return baseWidth + extraSpacing;
};

const resolveOptions = (options: AdaptiveFontSizeOptions): ResolvedOptions => {
  const maxFontSize = options.maxFontSize;
  const minFontSize =
    options.minFontSize ?? Math.max(10, Math.floor(maxFontSize * 0.6));

  return {
    maxWidth: Math.max(0, options.maxWidth),
    maxFontSize,
    minFontSize,
    fontFamily: options.fontFamily ?? 'Arial, sans-serif',
    fontWeight: options.fontWeight ?? 700,
    letterSpacingEm: options.letterSpacingEm ?? 0,
    uppercase: options.uppercase ?? false,
    safetyFactor:
      typeof options.safetyFactor === 'number' && options.safetyFactor > 0
        ? Math.min(options.safetyFactor, 1)
        : 0.97,
  };
};

const calculateFontSize = (
  text: string,
  unresolvedOptions: AdaptiveFontSizeOptions
) => {
  const options = resolveOptions(unresolvedOptions);
  const normalized = (options.uppercase ? text?.toUpperCase() : text)?.trim();

  if (!normalized) {
    return options.maxFontSize;
  }

  if (options.maxWidth <= 0) {
    return options.minFontSize;
  }

  const ctx = getMeasurementContext();
  if (!ctx) {
    return options.maxFontSize;
  }

  let low = options.minFontSize;
  let high = options.maxFontSize;
  let best = options.minFontSize;
  const effectiveMaxWidth = options.maxWidth * options.safetyFactor;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const width = measureTextWidth(normalized, mid, ctx, options);

    if (width <= effectiveMaxWidth) {
      best = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  const finalWidth = measureTextWidth(normalized, best, ctx, options);
  if (finalWidth > effectiveMaxWidth && best > options.minFontSize) {
    const ratio = effectiveMaxWidth / finalWidth;
    const adjusted = Math.max(options.minFontSize, Math.floor(best * ratio));
    return adjusted;
  }

  return best;
};

/**
 * Calculate the vertical offset for adaptive font sizing
 * When font size decreases, add vertical offset to maintain visual balance
 * @param fontSize - Current calculated font size
 * @param maxFontSize - Maximum font size
 * @param minFontSize - Minimum font size
 * @param maxOffset - Maximum offset in pixels (default: 10)
 * @returns Offset in pixels (0 to maxOffset)
 */
export const calculateTopOffset = (
  fontSize: number,
  maxFontSize: number,
  minFontSize: number,
  maxOffset: number = 10
): number => {
  if (fontSize >= maxFontSize) {
    return 0;
  }
  if (fontSize <= minFontSize) {
    return maxOffset;
  }

  // Linear interpolation: smaller font = larger offset
  const fontRange = maxFontSize - minFontSize;
  const fontDiff = maxFontSize - fontSize;
  const offset = (fontDiff / fontRange) * maxOffset;

  return Math.round(offset);
};

export const useAdaptiveFontSize = (
  text: string,
  options: AdaptiveFontSizeOptions
) => {
  const {
    maxWidth,
    maxFontSize,
    minFontSize,
    fontFamily,
    fontWeight,
    letterSpacingEm,
    uppercase,
    safetyFactor,
  } = options;

  const [fontSize, setFontSize] = useState(() =>
    calculateFontSize(text, options)
  );

  useLayoutEffect(() => {
    let isMounted = true;
    const resolvedOptions = {
      maxWidth,
      maxFontSize,
      minFontSize,
      fontFamily,
      fontWeight,
      letterSpacingEm,
      uppercase,
      safetyFactor,
    };

    const recalc = () => {
      if (!isMounted) {
        return;
      }
      setFontSize(calculateFontSize(text, resolvedOptions));
    };

    recalc();

    const fonts = typeof document !== 'undefined' ? document.fonts : undefined;
    if (fonts?.ready) {
      fonts.ready.then(() => {
        if (isMounted) {
          recalc();
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [
    text,
    maxWidth,
    maxFontSize,
    minFontSize,
    fontFamily,
    fontWeight,
    letterSpacingEm,
    uppercase,
    safetyFactor,
  ]);

  return fontSize;
};

export const calculateAdaptiveFontSize = (
  text: string,
  options: AdaptiveFontSizeOptions
) => calculateFontSize(text, options);

/**
 * Hook to calculate responsive font size for multi-line descriptions
 * Prevents awkward word breaks by using break-spacing instead of break-word
 * @param text - Description text
 * @param maxWidth - Maximum width in pixels
 * @param maxFontSize - Maximum font size in pixels
 * @param minFontSize - Minimum font size in pixels (defaults to 60% of max)
 * @returns Calculated font size
 */
export const useDescriptionFontSize = (
  text: string,
  maxWidth: number,
  maxFontSize: number,
  minFontSize?: number
) => {
  return useAdaptiveFontSize(text, {
    maxWidth,
    maxFontSize,
    minFontSize,
    fontFamily: 'NK57 Monospace, monospace',
    fontWeight: 300,
    safetyFactor: 0.95, // Slightly more conservative for descriptions
  });
};
