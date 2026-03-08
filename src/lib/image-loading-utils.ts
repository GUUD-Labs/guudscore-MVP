/**
 * Enhanced image loading utilities for reliable card capture on all platforms (especially iOS)
 */

/**
 * Wait for all images in an element to fully load
 * Includes multiple fallback strategies for iOS compatibility
 */
export const waitForAllImages = async (
  element: HTMLElement,
  timeout = 15000
): Promise<void> => {
  if (!element) return;

  const startTime = performance.now();
  const images = Array.from(
    element.querySelectorAll('img')
  ) as HTMLImageElement[];

  if (images.length === 0) {
    return; // No images to wait for
  }

  console.log(`Waiting for ${images.length} images to load...`);

  const imageLoadPromises = images.map(img => {
    return new Promise<void>(resolve => {
      // If already loaded, resolve immediately
      if (img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
        console.log(`Image already loaded: ${img.src}`);
        resolve();
        return;
      }

      // If there's an error, still resolve (don't block capture)
      if (img.complete && (img.naturalWidth === 0 || img.naturalHeight === 0)) {
        console.warn(`Image failed to load: ${img.src}`);
        resolve();
        return;
      }

      let timeoutId: ReturnType<typeof setTimeout>;
      let resolved = false;

      const handleLoad = () => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeoutId);
          img.removeEventListener('load', handleLoad);
          img.removeEventListener('error', handleError);
          console.log(`Image loaded: ${img.src}`);
          resolve();
        }
      };

      const handleError = () => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeoutId);
          img.removeEventListener('load', handleLoad);
          img.removeEventListener('error', handleError);
          console.warn(`Image failed to load: ${img.src}`);
          // Don't reject - just resolve to continue with capture
          resolve();
        }
      };

      // Set individual timeout for this image
      timeoutId = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          img.removeEventListener('load', handleLoad);
          img.removeEventListener('error', handleError);
          console.warn(`Image load timeout: ${img.src}`);
          resolve();
        }
      }, 5000);

      img.addEventListener('load', handleLoad, { once: true });
      img.addEventListener('error', handleError, { once: true });

      // Force image to start loading by accessing src
      if (!img.src) {
        resolve();
      }
    });
  });

  try {
    // Use Promise.race to ensure we don't wait forever for all images
    await Promise.race([
      Promise.all(imageLoadPromises),
      new Promise<void>(resolve => setTimeout(resolve, timeout)),
    ]);

    const elapsedTime = performance.now() - startTime;
    console.log(`All images loaded in ${elapsedTime.toFixed(0)}ms`);
  } catch (error) {
    console.warn('Error waiting for images:', error);
    // Continue anyway - don't block capture
  }
};

/**
 * Wait for fonts to be ready
 */
export const waitForFonts = async (): Promise<void> => {
  if (typeof document === 'undefined' || !document.fonts) {
    return;
  }

  try {
    // Set a reasonable timeout for font loading
    const fontLoadPromise = document.fonts.ready;
    const timeoutPromise = new Promise<void>(resolve =>
      setTimeout(resolve, 5000)
    );

    await Promise.race([fontLoadPromise, timeoutPromise]);
    console.log('Fonts ready for capture');
  } catch (error) {
    console.warn('Font loading warning:', error);
    // Continue anyway
  }
};

/**
 * Detect if device is iOS
 */
export const isIOSDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  const platform = window.navigator.platform || '';
  const userAgent = window.navigator.userAgent || '';

  const isIOS =
    /iPad|iPhone|iPod/.test(platform) ||
    (platform === 'MacIntel' && window.navigator.maxTouchPoints > 1) ||
    /iPhone|iPad|iPod/.test(userAgent);

  return isIOS;
};

/**
 * Detect if device is Android
 */
export const isAndroidDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  return /Android/i.test(window.navigator.userAgent);
};

/**
 * Get optimal pixel ratio for the device
 * iOS needs lower values to avoid performance issues
 */
export const getOptimalPixelRatio = (): number => {
  if (!isIOSDevice()) {
    return 2.0; // Standard for Android and desktop
  }

  // iOS: use lower value to ensure capture works reliably
  const dpr = window.devicePixelRatio || 1;

  if (dpr >= 3) {
    return 1.5; // iPhone 11 Pro/Pro Max and higher
  } else if (dpr >= 2) {
    return 1.8; // iPhone 6+ and newer
  } else {
    return 1.5; // iPad and older iPhones
  }
};

/**
 * Convert image to data URL for iOS compatibility
 * This avoids CORS issues on iOS Safari during capture
 */
export const imageToDataUrl = async (
  imageUrl: string,
  timeout = 5000
): Promise<string | null> => {
  return new Promise(resolve => {
    // Return data URLs directly
    if (imageUrl.startsWith('data:')) {
      resolve(imageUrl);
      return;
    }

    // Return blob URLs directly
    if (imageUrl.startsWith('blob:')) {
      resolve(imageUrl);
      return;
    }

    const timeoutId = setTimeout(() => {
      console.warn(`Image conversion timeout: ${imageUrl}`);
      resolve(null);
    }, timeout);

    const img = new Image();
    img.crossOrigin = 'anonymous';

    const handleLoad = () => {
      clearTimeout(timeoutId);
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const dataUrl = canvas.toDataURL('image/png');
          resolve(dataUrl);
        } else {
          resolve(imageUrl); // Fallback to original URL
        }
      } catch (error) {
        console.warn(`Failed to convert image to data URL: ${imageUrl}`, error);
        resolve(imageUrl); // Fallback to original URL
      }
    };

    const handleError = () => {
      clearTimeout(timeoutId);
      console.warn(`Failed to load image for conversion: ${imageUrl}`);
      resolve(null);
    };

    img.addEventListener('load', handleLoad, { once: true });
    img.addEventListener('error', handleError, { once: true });

    try {
      img.src = imageUrl;
    } catch (error) {
      clearTimeout(timeoutId);
      console.warn(`Error setting image source: ${imageUrl}`, error);
      resolve(null);
    }
  });
};

/**
 * Convert all external images in element to data URLs for iOS compatibility
 * This prevents CORS issues during html-to-image capture on iOS Safari
 */
export const convertImagesToDataUrls = async (
  element: HTMLElement,
  timeout = 15000
): Promise<void> => {
  if (!element) return;

  console.log(`🔄 Converting images to data URLs for iOS compatibility...`);
  const startTime = performance.now();

  // Find all images including nested ones and background images
  const findAllImages = (
    el: HTMLElement
  ): {
    img: HTMLImageElement;
    type: 'element' | 'background';
    parent?: HTMLElement;
  }[] => {
    const results: {
      img: HTMLImageElement;
      type: 'element' | 'background';
      parent?: HTMLElement;
    }[] = [];

    // Direct img elements
    if (el.tagName === 'IMG') {
      results.push({ img: el as HTMLImageElement, type: 'element' });
    }

    // Check for background images
    const style = window.getComputedStyle(el);
    const bgImage = style.backgroundImage;
    if (bgImage && bgImage !== 'none') {
      const matches = bgImage.matchAll(/url\(['"]?([^'"]+)['"]?\)/g);
      for (const match of matches) {
        if (match[1] && !match[1].startsWith('data:')) {
          // Create a temporary img element for background images
          const tempImg = document.createElement('img');
          tempImg.src = match[1];
          tempImg.crossOrigin = 'anonymous';
          results.push({ img: tempImg, type: 'background', parent: el });
        }
      }
    }

    // Recursively search children
    for (const child of Array.from(el.children)) {
      results.push(...findAllImages(child as HTMLElement));
    }

    return results;
  };

  const imageTargets = findAllImages(element);
  console.log(
    `📸 Found ${imageTargets.length} images to convert (${imageTargets.filter(t => t.type === 'background').length} backgrounds, ${imageTargets.filter(t => t.type === 'element').length} elements)`
  );

  if (imageTargets.length === 0) return;

  const conversionPromises = imageTargets.map(async ({ img, type, parent }) => {
    const originalSrc = img.src;
    if (
      !originalSrc ||
      originalSrc.startsWith('data:') ||
      originalSrc.startsWith('blob:')
    ) {
      return;
    }

    try {
      // Enhanced image loading with multiple fallback strategies
      const dataUrl = await imageToDataUrlWithFallback(originalSrc, timeout);

      if (dataUrl && type === 'element' && document.contains(img)) {
        // Update actual IMG element in DOM
        img.src = dataUrl;
        console.log(`✓ Converted element image to data URL`);
      } else if (dataUrl && type === 'background' && parent) {
        // Store data URL for later use in canvas capture
        (parent as any)._cachedBackgroundImage = dataUrl;
        console.log(`✓ Converted background image to data URL`);
      }
    } catch (error) {
      console.warn(`⚠️ Failed to convert ${type} image: ${originalSrc}`, error);
      // Continue with original src - canvas capture will handle it
    }
  });

  try {
    await Promise.all(conversionPromises);
    const elapsedTime = performance.now() - startTime;
    console.log(`✅ Image conversion complete in ${elapsedTime.toFixed(0)}ms`);
  } catch (error) {
    console.warn('⚠️ Error converting images:', error);
    // Continue anyway - capture might still work partially
  }
};

/**
 * Enhanced image to data URL conversion with iOS Safari fallbacks
 */
const imageToDataUrlWithFallback = async (
  src: string,
  timeout = 15000
): Promise<string | null> => {
  // Try standard method first
  try {
    return await imageToDataUrl(src, Math.min(timeout, 10000));
  } catch (error) {
    console.warn('Standard conversion failed, trying iOS fallback:', error);
  }

  // iOS Safari fallback: Fetch as blob then convert
  try {
    const response = await fetch(src, {
      mode: 'cors',
      credentials: 'omit',
      headers: {
        Accept: 'image/*',
        'Cache-Control': 'no-cache',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const blob = await response.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn('iOS fallback failed, trying proxy method:', error);
  }

  // Last resort: Try with cache busting
  try {
    const separator = src.includes('?') ? '&' : '?';
    const bustSrc = src + separator + '_ios_fallback=' + Date.now();
    return await imageToDataUrl(bustSrc, 5000);
  } catch (error) {
    console.warn('All conversion methods failed:', error);
    return null;
  }
};

/**
 * iOS-specific: Remove problematic CSS styles that break capture
 */
const sanitizeForIOSCapture = (element: HTMLElement): void => {
  if (!isIOSDevice()) return;

  // Find all elements and remove problematic styles
  const allElements = element.querySelectorAll('*');
  const elementsToCheck = [
    element,
    ...Array.from(allElements),
  ] as HTMLElement[];

  elementsToCheck.forEach(el => {
    if (!el.style) return;

    const computedStyle = window.getComputedStyle(el);
    const style = el.style;

    // Remove or replace problematic CSS properties for iOS
    if (
      computedStyle.backdropFilter &&
      computedStyle.backdropFilter !== 'none'
    ) {
      console.log('Removing backdrop-filter for iOS compatibility');
      style.backdropFilter = 'none';
    }

    if (computedStyle.filter && computedStyle.filter !== 'none') {
      // Only remove complex filters that might cause issues
      const filterValue = computedStyle.filter;
      if (filterValue.includes('blur') || filterValue.includes('drop-shadow')) {
        console.log('Simplifying filter for iOS compatibility:', filterValue);
        style.filter = 'none';
      }
    }

    // Ensure transform-origin is set correctly for iOS
    if (computedStyle.transform && computedStyle.transform !== 'none') {
      if (!style.transformOrigin) {
        style.transformOrigin = 'top left';
      }
    }
  });
};

/**
 * iOS-specific: Pre-render images to canvas to avoid CORS issues
 */
const preRenderImagesForIOS = async (element: HTMLElement): Promise<void> => {
  if (!isIOSDevice()) return;

  const images = Array.from(
    element.querySelectorAll('img')
  ) as HTMLImageElement[];

  for (const img of images) {
    if (!img.src || img.src.startsWith('data:')) continue;

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) continue;

      canvas.width = img.naturalWidth || 300;
      canvas.height = img.naturalHeight || 300;

      // Set crossOrigin for the canvas draw operation
      img.crossOrigin = 'anonymous';

      // Wait for image to load if not already loaded
      if (!img.complete) {
        await new Promise<void>((resolve, reject) => {
          const handleLoad = () => {
            img.removeEventListener('load', handleLoad);
            img.removeEventListener('error', handleError);
            resolve();
          };
          const handleError = () => {
            img.removeEventListener('load', handleLoad);
            img.removeEventListener('error', handleError);
            reject(new Error(`Failed to load image: ${img.src}`));
          };
          img.addEventListener('load', handleLoad);
          img.addEventListener('error', handleError);
        });
      }

      ctx.drawImage(img, 0, 0);
      const dataUrl = canvas.toDataURL('image/png');

      // Replace image source with pre-rendered version
      img.src = dataUrl;
      console.log('✓ Pre-rendered image for iOS capture');
    } catch (error) {
      console.warn('Failed to pre-render image for iOS:', img.src, error);
      // Keep original image as fallback
    }
  }
};

/**
 * Debug function to analyze card elements before capture
 */
export const debugCardElements = (element: HTMLElement): void => {
  console.log('🔍 Debugging card elements...');

  const analyzeElement = (el: HTMLElement, depth = 0): void => {
    const indent = '  '.repeat(depth);
    const style = window.getComputedStyle(el);
    const rect = el.getBoundingClientRect();

    const hasBgImage = style.backgroundImage !== 'none';
    const isImg = el.tagName === 'IMG';
    const hasText = el.textContent?.trim();
    const isVisible = style.display !== 'none' && style.visibility !== 'hidden';

    if (hasBgImage || isImg || hasText) {
      const debugInfo = {
        tag: el.tagName.toLowerCase(),
        classes: el.className || 'none',
        position: `${rect.left.toFixed(0)},${rect.top.toFixed(0)}`,
        size: `${rect.width.toFixed(0)}x${rect.height.toFixed(0)}`,
        zIndex: style.zIndex,
        hasBgImage,
        isImg,
        hasText,
        isVisible,
        textContent: hasText
          ? el.textContent?.substring(0, 30) + '...'
          : undefined,
        fontSize: hasText ? style.fontSize : undefined,
        fontFamily: hasText
          ? style.fontFamily?.substring(0, 30) + '...'
          : undefined,
        fontWeight: hasText ? style.fontWeight : undefined,
        color: hasText ? style.color : undefined,
        src: isImg
          ? (el as HTMLImageElement).src?.substring(0, 50) + '...'
          : undefined,
        bgImage: hasBgImage
          ? style.backgroundImage.substring(0, 100) + '...'
          : undefined,
        childCount: el.children.length,
      };

      // Highlight potential issues
      const issues = [];
      if (hasText && parseFloat(rect.width.toString()) < 10)
        issues.push('very narrow text container');
      if (hasText && parseFloat(rect.height.toString()) < 5)
        issues.push('very short text container');
      if (hasText && style.fontSize === '0px') issues.push('zero font size');
      if (hasText && style.color === 'transparent')
        issues.push('transparent text color');
      if (el.textContent?.toLowerCase().includes('score')) {
        console.group(
          `🎯 ${indent}SCORE ELEMENT FOUND: ${el.tagName.toLowerCase()}`
        );
        console.table(debugInfo);
        if (issues.length > 0) console.warn('⚠️ Issues:', issues);
        console.groupEnd();
      } else {
        console.log(
          `${indent}${el.tagName.toLowerCase()}${el.className ? '.' + el.className.split(' ').join('.') : ''}`,
          debugInfo
        );
      }
    }

    // Recursively analyze children
    for (const child of Array.from(el.children)) {
      analyzeElement(child as HTMLElement, depth + 1);
    }
  };

  analyzeElement(element);
  console.log(
    '📊 Debug complete - check for SCORE ELEMENT FOUND entries above'
  );
};

/**
 * Test function to capture and download card image for debugging
 */
export const testCardCapture = async (
  element: HTMLElement,
  filename = 'test-card-capture.png'
): Promise<void> => {
  console.log('🧪 Testing card capture...');

  try {
    // Prepare element for capture
    await prepareElementForCapture(element, {
      imageTimeout: 15000,
      forcePreRender: true,
    });

    // Capture using enhanced canvas method
    const blob = await captureWithNativeCanvas(element, {
      width: 490,
      height: 490,
    });

    if (blob) {
      // Download the captured image
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log(
        `✅ Test capture successful: ${filename} (${(blob.size / 1024).toFixed(0)}KB)`
      );
    } else {
      console.error('❌ Test capture failed: No blob generated');
    }
  } catch (error) {
    console.error('❌ Test capture error:', error);
  }
};

/**
 * iOS-specific: Native canvas capture method for maximum compatibility
 * This bypasses html-to-image library entirely and uses manual canvas rendering
 */
export const captureWithNativeCanvas = async (
  element: HTMLElement,
  options: { width?: number; height?: number } = {}
): Promise<Blob | null> => {
  if (!element) return null;

  const { width = 490, height = 490 } = options;
  console.log('🎨 Using enhanced native canvas capture for iOS...');

  // Debug elements before capture
  if (process.env.NODE_ENV === 'development') {
    debugCardElements(element);
  }

  try {
    // Create high-DPI canvas for crisp output
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }

    // Set canvas size with device pixel ratio for sharpness
    const dpr = Math.min(window.devicePixelRatio || 1, 2); // Cap DPR for performance
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Set canvas dimensions
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';

    // Fill with black background (matching card design)
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    // Collect all renderable elements with proper layering
    const collectRenderableElements = (
      el: HTMLElement
    ): RenderableElement[] => {
      const elements: RenderableElement[] = [];
      const style = window.getComputedStyle(el);

      // Skip hidden elements
      if (
        style.display === 'none' ||
        style.visibility === 'hidden' ||
        style.opacity === '0'
      ) {
        return elements;
      }

      // Get z-index for proper layering
      const zIndex = parseInt(style.zIndex) || 0;
      const position = style.position;

      // Collect this element if it has visual content
      const hasContent =
        el.textContent?.trim() ||
        el.tagName === 'IMG' ||
        style.backgroundImage !== 'none';

      if (hasContent) {
        elements.push({
          element: el,
          zIndex,
          position,
          style,
          rect: el.getBoundingClientRect(),
        });
      }

      // Recursively collect children
      for (const child of Array.from(el.children)) {
        elements.push(...collectRenderableElements(child as HTMLElement));
      }

      return elements;
    };

    interface RenderableElement {
      element: HTMLElement;
      zIndex: number;
      position: string;
      style: CSSStyleDeclaration;
      rect: DOMRect;
    }

    // Collect all elements and sort by z-index and DOM order
    const containerRect = element.getBoundingClientRect();
    const allElements = collectRenderableElements(element);

    // Sort by z-index (ascending) then DOM order
    allElements.sort((a, b) => {
      if (a.zIndex !== b.zIndex) {
        return a.zIndex - b.zIndex;
      }
      return 0; // Maintain DOM order for same z-index
    });

    console.log(`📋 Found ${allElements.length} renderable elements`);

    // Track elements that have been rendered as part of mixed content
    // to prevent duplicate rendering
    const renderedElements = new Set<HTMLElement>();

    // Process elements in proper order
    for (const { element: el, style, rect } of allElements) {
      // Skip if this element was already rendered as part of mixed content
      if (renderedElements.has(el)) {
        console.log(
          `⏭️  Skipping already-rendered element: ${el.tagName} "${el.textContent?.substring(0, 30)}..."`
        );
        continue;
      }

      // Calculate relative position
      const x = rect.left - containerRect.left;
      const y = rect.top - containerRect.top;
      const elementWidth = rect.width;
      const elementHeight = rect.height;

      // 1. Handle background images (CSS backgrounds)
      const bgImage = style.backgroundImage;
      if (
        bgImage &&
        bgImage !== 'none' &&
        elementWidth > 0 &&
        elementHeight > 0
      ) {
        const matches = bgImage.matchAll(/url\(['"]?([^'"]+)['"]?\)/g);
        for (const match of matches) {
          if (match[1]) {
            try {
              let imgSrc = match[1];
              let img: HTMLImageElement;

              // Check if we have a cached data URL for this background image
              const cachedDataUrl = (el as any)._cachedBackgroundImage;
              if (cachedDataUrl && cachedDataUrl.startsWith('data:')) {
                img = new Image();
                img.src = cachedDataUrl;
                await new Promise<void>(resolve => {
                  if (img.complete) {
                    resolve();
                  } else {
                    img.onload = () => resolve();
                    img.onerror = () => resolve(); // Continue even if cached image fails
                  }
                });
              } else {
                // Try to load the original image with enhanced CORS handling
                img = new Image();
                img.crossOrigin = 'anonymous';
                img.referrerPolicy = 'no-referrer-when-downgrade';

                await new Promise<void>((resolve, reject) => {
                  const timeout = setTimeout(
                    () => reject(new Error('Image load timeout')),
                    3000
                  );
                  img.onload = () => {
                    clearTimeout(timeout);
                    resolve();
                  };
                  img.onerror = () => {
                    clearTimeout(timeout);
                    reject(new Error('Image load failed'));
                  };

                  // Add cache busting for cross-origin images
                  if (
                    imgSrc.startsWith('http') &&
                    !imgSrc.includes(window.location.hostname)
                  ) {
                    const separator = imgSrc.includes('?') ? '&' : '?';
                    imgSrc =
                      imgSrc + separator + '_canvas_capture=' + Date.now();
                  }

                  img.src = imgSrc;
                });
              }

              // Apply background sizing and positioning
              const bgSize = style.backgroundSize || 'cover';
              const bgPosition = style.backgroundPosition || 'center';
              const bgRepeat = style.backgroundRepeat || 'no-repeat';

              ctx.save();

              if (bgRepeat === 'no-repeat') {
                // Handle background-position
                let drawX = x;
                let drawY = y;
                let drawWidth = elementWidth;
                let drawHeight = elementHeight;

                if (bgPosition.includes('center')) {
                  drawX = x + (elementWidth - drawWidth) / 2;
                  drawY = y + (elementHeight - drawHeight) / 2;
                } else if (bgPosition.includes('top')) {
                  drawY = y;
                } else if (bgPosition.includes('bottom')) {
                  drawY = y + elementHeight - drawHeight;
                }

                // Handle background-size
                if (bgSize === 'cover') {
                  const scale = Math.max(
                    elementWidth / img.width,
                    elementHeight / img.height
                  );
                  drawWidth = img.width * scale;
                  drawHeight = img.height * scale;
                  drawX = x + (elementWidth - drawWidth) / 2;
                  drawY = y + (elementHeight - drawHeight) / 2;
                } else if (bgSize === 'contain') {
                  const scale = Math.min(
                    elementWidth / img.width,
                    elementHeight / img.height
                  );
                  drawWidth = img.width * scale;
                  drawHeight = img.height * scale;
                  drawX = x + (elementWidth - drawWidth) / 2;
                  drawY = y + (elementHeight - drawHeight) / 2;
                } else if (bgSize === '100% 100%') {
                  drawWidth = elementWidth;
                  drawHeight = elementHeight;
                }

                ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
              } else {
                // Tiled background
                const pattern = ctx.createPattern(
                  img,
                  bgRepeat as 'repeat' | 'repeat-x' | 'repeat-y' | 'no-repeat'
                );
                if (pattern) {
                  ctx.fillStyle = pattern;
                  ctx.fillRect(x, y, elementWidth, elementHeight);
                }
              }

              ctx.restore();
              console.log(
                '✓ Drew background image:',
                imgSrc.substring(0, 50) + '...'
              );
            } catch (error) {
              console.warn('Failed to load background image:', match[1], error);
              // Draw a colored rectangle as fallback for debugging
              ctx.save();
              ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
              ctx.fillRect(x, y, elementWidth, elementHeight);
              ctx.restore();
            }
          }
        }
      }

      // 2. Handle image elements (including nested avatars and logos)
      if (el.tagName === 'IMG') {
        const img = el as HTMLImageElement;
        if (img.src && img.complete && img.naturalWidth > 0) {
          try {
            // Handle rounded corners
            const borderRadius = parseFloat(style.borderRadius) || 0;
            const hasBorderRadius = borderRadius > 0;

            if (hasBorderRadius) {
              ctx.save();
              ctx.beginPath();
              // Use individual parameters instead of array for better compatibility
              ctx.roundRect(x, y, elementWidth, elementHeight, borderRadius);
              ctx.clip();
            }

            // Apply object-fit behavior
            const objectFit = style.objectFit || 'fill';
            let drawX = x;
            let drawY = y;
            let drawWidth = elementWidth;
            let drawHeight = elementHeight;

            if (objectFit === 'cover') {
              const scale = Math.max(
                elementWidth / img.naturalWidth,
                elementHeight / img.naturalHeight
              );
              drawWidth = img.naturalWidth * scale;
              drawHeight = img.naturalHeight * scale;
              drawX = x + (elementWidth - drawWidth) / 2;
              drawY = y + (elementHeight - drawHeight) / 2;
            } else if (objectFit === 'contain') {
              const scale = Math.min(
                elementWidth / img.naturalWidth,
                elementHeight / img.naturalHeight
              );
              drawWidth = img.naturalWidth * scale;
              drawHeight = img.naturalHeight * scale;
              drawX = x + (elementWidth - drawWidth) / 2;
              drawY = y + (elementHeight - drawHeight) / 2;
            }

            ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

            if (hasBorderRadius) {
              ctx.restore();
            }

            console.log(
              `✓ Drew image at (${x}, ${y}) size: ${elementWidth}x${elementHeight}`
            );
          } catch (error) {
            console.warn('Failed to draw image:', img.src, error);
          }
        }
      }

      // 3. Handle text elements (including mixed content like "SCORE: " + <span>0</span>)
      // Render text for elements that contain text content
      // IMPORTANT: Only render text for leaf nodes or nodes with mixed content (text + children)
      // Skip pure container divs that only wrap other elements
      if (el.textContent && el.textContent.trim()) {
        // Check if element has meaningful styling that affects text rendering
        const hasTextStyling =
          style.fontSize !== '0px' &&
          style.color !== 'transparent' &&
          style.display !== 'none';

        // Check if this element has direct text content (not just from children)
        const hasDirectTextContent = Array.from(el.childNodes).some(
          node => node.nodeType === Node.TEXT_NODE && node.textContent?.trim()
        );

        // Check if this element has explicit styling (inline style with font/color properties)
        // Elements without explicit styling are typically wrappers and should be skipped
        const hasExplicitStyling =
          el.style &&
          (el.style.fontSize || el.style.color || el.style.fontWeight);

        // Only render if:
        // 1. Has text styling AND
        // 2. Has direct text content (mixed content or pure text) AND
        // 3. (Has explicit styling OR has no children - leaf node)
        const shouldRenderText =
          hasTextStyling &&
          hasDirectTextContent &&
          (hasExplicitStyling || el.children.length === 0);

        if (shouldRenderText) {
          try {
            const fontSize = parseFloat(style.fontSize) || 16;
            const fontFamily = style.fontFamily || 'Arial, sans-serif';
            const fontWeight = style.fontWeight || 'normal';
            const color = style.color || '#ffffff';
            const textTransform = style.textTransform || 'none';
            const lineHeight = parseFloat(style.lineHeight) || fontSize * 1.2;

            ctx.save();
            ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
            ctx.fillStyle = color;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';

            // Apply text effects
            const textShadow = style.textShadow;
            if (textShadow && textShadow !== 'none') {
              const shadowMatch = textShadow.match(
                /(-?\d+)px\s+(-?\d+)px\s+(\d+)px\s+(.+?)(?=\s*$)/
              );
              if (shadowMatch) {
                ctx.shadowColor = shadowMatch[4];
                ctx.shadowBlur = parseFloat(shadowMatch[3]);
                ctx.shadowOffsetX = parseFloat(shadowMatch[1]);
                ctx.shadowOffsetY = parseFloat(shadowMatch[2]);
              }
            }

            // Handle mixed content: text + child elements (like "SCORE: " + <span>0</span>)
            if (el.children.length > 0) {
              // Render mixed content with child element styling
              let currentX = x;
              const currentY = y;

              console.log(
                `🔤 Rendering mixed content element with ${el.childNodes.length} child nodes at (${x}, ${y})`
              );

              // Get all child nodes (including text nodes) - ONLY direct children
              Array.from(el.childNodes).forEach((node, index) => {
                if (node.nodeType === Node.TEXT_NODE) {
                  // Text node - render the text
                  const textContent = node.textContent?.trim();
                  if (textContent) {
                    // Apply parent's text transform
                    let transformedText = textContent;
                    if (textTransform === 'uppercase') {
                      transformedText = transformedText.toUpperCase();
                    } else if (textTransform === 'lowercase') {
                      transformedText = transformedText.toLowerCase();
                    }

                    console.log(
                      `  [${index}] TEXT NODE: "${transformedText}" | Font: ${fontWeight} ${fontSize}px ${fontFamily} | Color: ${color} | Pos: (${currentX}, ${currentY})`
                    );
                    ctx.fillText(transformedText, currentX, currentY);
                    const textMetrics = ctx.measureText(transformedText);
                    currentX += textMetrics.width;
                  }
                } else if (node.nodeType === Node.ELEMENT_NODE) {
                  // Element node - apply its styling and render its content
                  const childEl = node as HTMLElement;
                  const childStyle = window.getComputedStyle(childEl);

                  // Mark this child element AND all its descendants as rendered
                  // to prevent duplicate rendering
                  const markAsRendered = (element: HTMLElement) => {
                    renderedElements.add(element);
                    Array.from(element.children).forEach(child =>
                      markAsRendered(child as HTMLElement)
                    );
                  };
                  markAsRendered(childEl);
                  console.log(
                    `    ✓ Marked child element as rendered: ${childEl.tagName} "${childEl.textContent?.substring(0, 30)}..."`
                  );

                  // Apply child-specific styling
                  const childFontSize =
                    parseFloat(childStyle.fontSize) || fontSize;
                  const childFontWeight = childStyle.fontWeight || fontWeight;
                  const childFontFamily = childStyle.fontFamily || fontFamily;
                  const childColor = childStyle.color || color;

                  ctx.font = `${childFontWeight} ${childFontSize}px ${childFontFamily}`;
                  ctx.fillStyle = childColor;

                  // Apply child-specific text shadow if present
                  const childTextShadow = childStyle.textShadow;
                  if (childTextShadow && childTextShadow !== 'none') {
                    const childShadowMatch = childTextShadow.match(
                      /(-?\d+)px\s+(-?\d+)px\s+(\d+)px\s+(.+?)(?=\s*$)/
                    );
                    if (childShadowMatch) {
                      ctx.shadowColor = childShadowMatch[4];
                      ctx.shadowBlur = parseFloat(childShadowMatch[3]);
                      ctx.shadowOffsetX = parseFloat(childShadowMatch[1]);
                      ctx.shadowOffsetY = parseFloat(childShadowMatch[2]);
                    }
                  } else {
                    // Reset shadow if child has no shadow
                    ctx.shadowColor = 'transparent';
                    ctx.shadowBlur = 0;
                    ctx.shadowOffsetX = 0;
                    ctx.shadowOffsetY = 0;
                  }

                  // Render child text content directly
                  const childText = childEl.textContent?.trim();
                  if (childText) {
                    console.log(
                      `  [${index}] CHILD ELEMENT: "${childText}" | Font: ${childFontWeight} ${childFontSize}px ${childFontFamily} | Color: ${childColor} | Pos: (${currentX}, ${currentY})`
                    );
                    ctx.fillText(childText, currentX, currentY);
                    const textMetrics = ctx.measureText(childText);
                    currentX += textMetrics.width;
                  }
                }
              });
            } else {
              // Simple text content (no children) - render directly with word wrapping
              console.log(
                `📝 Rendering simple text element at (${x}, ${y}) | Font: ${fontWeight} ${fontSize}px ${fontFamily} | Color: ${color}`
              );
              let text = el.textContent.trim();
              if (textTransform === 'uppercase') {
                text = text.toUpperCase();
              } else if (textTransform === 'lowercase') {
                text = text.toLowerCase();
              } else if (textTransform === 'capitalize') {
                text = text.replace(/\b\w/g, l => l.toUpperCase());
              }

              // Check if text needs word wrapping (multi-line support)
              const maxWidth = elementWidth > 0 ? elementWidth : width - x;
              const whiteSpace = style.whiteSpace || 'normal';
              const shouldWrap = whiteSpace !== 'nowrap' && maxWidth > 0;

              if (shouldWrap) {
                // Word-wrap text to fit within container width
                const words = text.split(/\s+/);
                let currentLine = '';
                let currentY = y;
                const maxLines = Math.floor(elementHeight / lineHeight) || 3;
                let lineCount = 0;

                for (let i = 0; i < words.length && lineCount < maxLines; i++) {
                  const word = words[i];
                  const testLine = currentLine
                    ? currentLine + ' ' + word
                    : word;
                  const metrics = ctx.measureText(testLine);

                  if (metrics.width > maxWidth && currentLine) {
                    // Draw current line and start new line
                    console.log(
                      `  Line ${lineCount}: "${currentLine}" at (${x}, ${currentY})`
                    );
                    ctx.fillText(currentLine, x, currentY);
                    currentLine = word;
                    currentY += lineHeight;
                    lineCount++;
                  } else {
                    currentLine = testLine;
                  }
                }

                // Draw remaining text (last line)
                if (currentLine && lineCount < maxLines) {
                  console.log(
                    `  Line ${lineCount}: "${currentLine}" at (${x}, ${currentY})`
                  );
                  ctx.fillText(currentLine, x, currentY);
                }
              } else {
                // No wrapping - single line
                const lines = text.split('\n');
                lines.forEach((line, index) => {
                  const lineY = y + index * lineHeight;
                  console.log(`  Line ${index}: "${line}" at (${x}, ${lineY})`);
                  ctx.fillText(line, x, lineY);
                });
              }
            }

            ctx.restore();

            // Reset shadow
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;

            console.log(
              `✅ Text element completed: "${el.textContent.substring(0, 50)}..." at (${x}, ${y}) | Children: ${el.children.length}`
            );
          } catch (error) {
            console.warn('❌ Failed to draw text element:', error);
            console.warn('  Element info:', {
              tag: el.tagName,
              text: el.textContent?.substring(0, 50),
              position: { x, y },
              style: {
                fontSize: parseFloat(style.fontSize) || 16,
                fontFamily: style.fontFamily || 'Arial, sans-serif',
                color: style.color || '#ffffff',
              },
            });
          }
        }
      }
    }

    // Convert canvas to blob
    return new Promise(resolve => {
      canvas.toBlob(
        blob => {
          if (blob) {
            console.log(
              `✅ Enhanced native canvas capture successful, size: ${(blob.size / 1024).toFixed(0)}KB`
            );
            resolve(blob);
          } else {
            console.error('❌ Canvas toBlob failed');
            resolve(null);
          }
        },
        'image/png',
        0.95 // Quality
      );
    });
  } catch (error) {
    console.error('❌ Enhanced native canvas capture failed:', error);
    return null;
  }
};

/**
 * Prepare element for capture by ensuring all images are loaded
 * and document fonts are ready (with enhanced iOS CORS workarounds)
 */
export const prepareElementForCapture = async (
  element: HTMLElement,
  options: { imageTimeout?: number; forcePreRender?: boolean } = {}
): Promise<void> => {
  const { imageTimeout = 15000, forcePreRender = false } = options;

  console.log('Preparing element for capture...');
  const startTime = performance.now();

  try {
    // Wait for fonts first
    if (
      typeof document !== 'undefined' &&
      document.fonts?.status === 'loading'
    ) {
      await waitForFonts();
    }

    // iOS-specific enhancements
    if (isIOSDevice()) {
      console.log('iOS detected - applying enhanced capture preparation...');

      // Remove problematic CSS styles
      sanitizeForIOSCapture(element);

      // Enhanced image processing for iOS
      if (forcePreRender) {
        await preRenderImagesForIOS(element);
      } else {
        // Standard image to data URL conversion
        await convertImagesToDataUrls(element, imageTimeout);
      }

      // Force iOS to repaint the element
      element.style.display = 'none';
      element.offsetHeight; // Force reflow
      element.style.display = '';

      // Give iOS Safari time to process the changes
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Wait for all images
    await waitForAllImages(element, imageTimeout);

    const elapsedTime = performance.now() - startTime;
    console.log(`Element prepared in ${elapsedTime.toFixed(0)}ms`);
  } catch (error) {
    console.warn('Error preparing element:', error);
    // Continue anyway - capture might still work partially
  }
};
