import { toPng } from 'html-to-image';
import { Copy, Loader2, Lock } from 'lucide-react';
import { toast } from 'sonner';



import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';



import { useCurrentUser } from '@/hooks/use-user';
import { getCardDisplayProps } from '@/lib/card-display-utils';
import { captureWithNativeCanvas, getOptimalPixelRatio, isIOSDevice, prepareElementForCapture } from '@/lib/image-loading-utils';



import { type CardTemplate } from './social-media-card';
import { GuuldCard as AvaxTheme } from './theme/avax';
import { GuuldCard as CoqTheme } from './theme/coq';
import { GuuldCard as DesciTheme } from './theme/desci';
import { GuuldCard as GtaTheme } from './theme/gta';
import { GuuldCard as GuudTheme } from './theme/guud';
import { GuuldCard as NoChillioTheme } from './theme/no-chillio';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';





const BASE_CARD_SIZE = 500;
const CARD_PREVIEW_MAX_SIZE = 540; // ~10% bump from previous 490px default
const CARD_PREVIEW_VIEWPORT_PERCENT = 95;

const CARD_TEMPLATES: CardTemplate[] = [
  'guud',
  'avax',
  'desci',
  'no-chillio',
  'gta',
  'coq',
];

const TEMPLATE_NAMES: Record<CardTemplate, string> = {
  guud: 'Guud',
  avax: 'Avax',
  desci: 'De Sci',
  'no-chillio': 'No Chillio',
  gta: 'GTA',
  coq: 'COQ',
};

const DEBUG_SCORE_PRESETS = [100, 250, 450, 650, 850];

// Badge images for templates
const TEMPLATE_BADGE_IMAGES: Record<CardTemplate, string> = {
  guud: '/badges/noob.png', // Default badge
  avax: '/badges/avaxmaxi.png',
  desci: '/badges/arenaveteran.png', // Using Arena Veteran as DeSci placeholder
  'no-chillio': '/badges/degenerateautist.png',
  gta: '/badges/guudlord.png',
  coq: '/badges/coqlover.png',
};

// Badge requirements for unlocking card templates
const TEMPLATE_BADGE_REQUIREMENTS: Record<
  CardTemplate,
  { badgeName: string; matchers: RegExp[] }
> = {
  guud: {
    badgeName: 'GUUD Badge',
    matchers: [/\bguud\b/i, /guud\s*badge/i, /guud\s*score/i],
  },
  avax: {
    badgeName: 'Avax Badge',
    matchers: [/\bavax\b/i, /avalanche/i],
  },
  desci: {
    badgeName: 'DeSci Badge',
    matchers: [/\bdesci\b/i, /de\s*sci/i, /decentralized\s*science/i],
  },
  'no-chillio': {
    badgeName: 'Nochillio Badge',
    matchers: [/nochillio/i, /no\s*chillio/i, /chillio/i],
  },
  gta: {
    badgeName: 'GTA Badge',
    matchers: [/\bgta\b/i, /grand\s*theft/i],
  },
  coq: {
    badgeName: 'COQ Badge',
    matchers: [/\bcoq\b/i, /\$coq/i],
  },
};

type ScoreTierRule = {
  min: number;
  max: number;
  title: string;
  description: string;
};

const SCORE_TIER_RULES: ScoreTierRule[] = [
  {
    min: 0,
    max: 1999,
    title: 'Tourist',
    description: 'Every legend starts somewhere.',
  },
  {
    min: 2000,
    max: 3999,
    title: 'Paperhands',
    description: 'Sold the bottom. Bought the top. Classic Degen.',
  },
  {
    min: 4000,
    max: 5999,
    title: 'AVAX Maxi',
    description: 'Dorito loyalist. Shills Avalanche at family dinners.',
  },
  {
    min: 6000,
    max: 7999,
    title: 'Arena Veteran',
    description:
      'Your AVAX footprint is loud and your Arena record is clean. You move the culture forward.',
  },
  {
    min: 8000,
    max: Number.POSITIVE_INFINITY,
    title: 'Guudlord',
    description: 'You leveled from street hustler to red chain kingpin.',
  },
];

type TemplateDetail = {
  title: string;
  description: string;
  requirementMessage?: string;
};

const TEMPLATE_DETAILS: Partial<Record<CardTemplate, TemplateDetail>> = {
  avax: {
    title: 'AVAX Maxi',
    description: 'Dorito loyalist. Shills Avalanche at family dinners.',
    requirementMessage:
      'Reach 4000+ GUUD Score points or earn the Avax Badge to unlock the AVAX card design.',
  },
  gta: {
    title: 'Guudlord',
    description: 'You leveled from street hustler to red chain kingpin.',
    requirementMessage:
      'Reach 8000+ GUUD Score points or earn the GTA Badge to unlock the GUUD GTA card design.',
  },
  desci: {
    title: 'On-chain Scientist',
    description: 'You study markets and molecules. Science becomes capital.',
    requirementMessage:
      'Hold the required amount of $MELT to unlock the DeSci card design (coming soon).',
  },
  'no-chillio': {
    title: 'Degenerate Autist',
    description: 'Pure conviction and controlled chaos. Nochillio energy.',
    requirementMessage:
      'Hold the Nochillio NFT to unlock the Nochillio card design.',
  },
  coq: {
    title: 'COQ Lover',
    description: 'Keeper of the iconic bird. You carry your COQ with pride.',
    requirementMessage: 'Hold the COQ NFT to unlock the COQ card design.',
  },
};

// Extract all text keywords from badge objects (deep traversal)
const extractBadgeKeywords = (badgeData: unknown): Set<string> => {
  const keywords = new Set<string>();

  const addString = (value: unknown): void => {
    if (typeof value === 'string' && value.trim()) {
      keywords.add(value.toLowerCase().trim());
    }
  };

  const traverse = (obj: unknown): void => {
    if (!obj) return;
    if (typeof obj === 'string') {
      addString(obj);
    } else if (Array.isArray(obj)) {
      obj.forEach(traverse);
    } else if (typeof obj === 'object') {
      Object.values(obj as Record<string, unknown>).forEach(traverse);
    }
  };

  traverse(badgeData);
  return keywords;
};

interface CardCustomizationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentTemplate: CardTemplate;
  onSave: (template: CardTemplate) => void;
  name: string;
  score: number;
  slug?: string;
  cardPhotoUrl?: string;
  userWallets?: Array<{
    id: string;
    walletAddress: string;
    ensName: string | null;
    ensAvatar: string | null;
  }>;
  testMode?: boolean;
  onShareClick?: (template: CardTemplate) => void;
}

export const CardCustomizationModal = ({
  open,
  onOpenChange,
  currentTemplate,
  name,
  slug,
  score,
  cardPhotoUrl,
  userWallets = [],
  testMode = false,
  onShareClick,
}: CardCustomizationModalProps) => {
  console.log('userWallets:', userWallets);
  console.log('name:', name);
  const [selectedTemplate, setSelectedTemplate] =
    useState<CardTemplate>(currentTemplate);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharingX, setIsSharingX] = useState(false);
  const [debugScoreOverride, setDebugScoreOverride] = useState<number | null>(
    null
  );
  const cardPreviewRef = useRef<HTMLDivElement>(null);
  const captureCardRef = useRef<HTMLDivElement>(null);
  const cachedBlobRef = useRef<{ template: CardTemplate; blob: Blob } | null>(
    null
  );
  const [cardDimensions, setCardDimensions] = useState({
    width: BASE_CARD_SIZE,
    height: BASE_CARD_SIZE,
  });

  // Get current user to check badge status
  const { data: currentUser } = useCurrentUser();

  // Check if user has wallets (authenticated but no onchain activity)
  // In test mode, bypass the empty wallets check to test Case 2

  // Extract all badge keywords for template unlock matching
  const badgeKeywords = React.useMemo(() => {
    if (testMode) {
      // Test mode: Mock badges for all templates
      const mockKeywords = new Set([
        'guud badge',
        'avax',
        'avalanche',
        'desci badge',
        'nochillio',
        'no chillio badge',
        'coq',
        '$coq holder',
        'gta',
      ]);
      console.log('Test mode - Mock badge keywords:', Array.from(mockKeywords));
      return mockKeywords;
    }

    if (!currentUser?.badges) {
      return new Set<string>();
    }

    const {
      userBadges = [],
      poapBadges = [],
      nftBadges = [],
    } = currentUser.badges;

    // Deep keyword extraction from all badge types
    const allKeywords = new Set<string>();
    [userBadges, poapBadges, nftBadges].forEach(badgeCollection => {
      const keywords = extractBadgeKeywords(badgeCollection);
      keywords.forEach((keyword: string) => allKeywords.add(keyword));
    });

    if (allKeywords.size > 0) {
      console.log('User badge keywords:', Array.from(allKeywords));
    }

    return allKeywords;
  }, [currentUser, testMode]);

  useEffect(() => {
    if (testMode) {
      // Seed debug score when entering test mode or opening the modal.
      setDebugScoreOverride(prev => {
        if (prev !== null) return prev;
        if (typeof score === 'number' && Number.isFinite(score)) {
          return Math.max(0, Math.floor(score));
        }
        return 0;
      });
    } else {
      setDebugScoreOverride(null);
    }
  }, [score, testMode]);

  useLayoutEffect(() => {
    const node = cardPreviewRef.current;
    if (!node) {
      return;
    }
    let rafId: number | null = null;

    const updateSize = () => {
      const rect = node.getBoundingClientRect();
      if (!rect.width || !rect.height) {
        rafId = window.requestAnimationFrame(updateSize);
        return;
      }

      const nextWidth = rect.width || BASE_CARD_SIZE;
      const nextHeight = rect.height || BASE_CARD_SIZE;
      setCardDimensions(prev =>
        prev.width === nextWidth && prev.height === nextHeight
          ? prev
          : { width: nextWidth, height: nextHeight }
      );
    };

    updateSize();
    if (typeof ResizeObserver === 'undefined') {
      return () => {
        if (rafId) {
          window.cancelAnimationFrame(rafId);
        }
      };
    }

    const resizeObserver = new ResizeObserver(() => updateSize());
    resizeObserver.observe(node);

    return () => {
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
      resizeObserver.disconnect();
    };
  }, [open, selectedTemplate]);

  const normalizedScore = useMemo(() => {
    const effectiveScore =
      debugScoreOverride ??
      (typeof score === 'number' && Number.isFinite(score) ? score : 0);

    if (typeof effectiveScore === 'number' && Number.isFinite(effectiveScore)) {
      return Math.max(0, Math.floor(effectiveScore));
    }
    return 0;
  }, [debugScoreOverride, score]);

  const scoreTier = useMemo(() => {
    const tier =
      SCORE_TIER_RULES.find(
        rule => normalizedScore >= rule.min && normalizedScore <= rule.max
      ) ?? SCORE_TIER_RULES[SCORE_TIER_RULES.length - 1];
    return tier;
  }, [normalizedScore]);

  const getBadgeUnlockKeyword = useCallback(
    (template: CardTemplate): string | null => {
      const requirement = TEMPLATE_BADGE_REQUIREMENTS[template];
      if (!requirement) return null;

      for (const keyword of badgeKeywords) {
        if (requirement.matchers.some(matcher => matcher.test(keyword))) {
          return keyword;
        }
      }

      return null;
    },
    [badgeKeywords]
  );

  // Check if a template is unlocked by matching badge keywords
  const isTemplateUnlockedByBadge = useCallback(
    (template: CardTemplate): boolean => {
      // 'guud' is always unlocked (default template)
      if (template === 'guud') return true;

      const requirement = TEMPLATE_BADGE_REQUIREMENTS[template];
      if (!requirement) return true;

      const matchedKeyword = getBadgeUnlockKeyword(template);
      if (matchedKeyword) {
        console.log(
          `✅ Theme "${template}" unlocked by keyword: "${matchedKeyword}"`
        );
        return true;
      }

      return false;
    },
    [getBadgeUnlockKeyword]
  );

  const isTemplateUnlockedByScore = useCallback(
    (template: CardTemplate): boolean => {
      if (template === 'guud') return true;

      if (template === 'avax') {
        return normalizedScore >= 4000;
      }

      if (template === 'gta') {
        return normalizedScore >= 8000;
      }

      return false;
    },
    [normalizedScore]
  );

  const isTemplateUnlocked = useCallback(
    (template: CardTemplate): boolean => {
      if (isTemplateUnlockedByScore(template)) {
        return true;
      }

      return isTemplateUnlockedByBadge(template);
    },
    [isTemplateUnlockedByBadge, isTemplateUnlockedByScore]
  );

  // Check if a template is locked
  const isTemplateLocked = useCallback(
    (template: CardTemplate): boolean => !isTemplateUnlocked(template),
    [isTemplateUnlocked]
  );

  // Check if currently selected template is locked
  const isSelectedTemplateLocked = isTemplateLocked(selectedTemplate);

  const handleCopyProfileLink = async () => {
    const profileUrl = `${window.location.origin}/profile/${slug}`;
    try {
      await navigator.clipboard.writeText(profileUrl);
      toast.success('Profile link copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const handleTemplateSelect = useCallback((template: CardTemplate) => {
    // Allow selecting locked templates, they just can't download/share
    setSelectedTemplate(template);
    // Clear cache when template changes
    cachedBlobRef.current = null;
  }, []);
  const hasEmptyWallets = testMode ? false : userWallets.length === 0;
  const hasNonEmptyWallets = testMode ? true : userWallets.length > 0;
  const shouldDisableActions =
    hasEmptyWallets || (hasNonEmptyWallets && isSelectedTemplateLocked);
  const isAnyActionInProgress = isDownloading || isSharingX;

  // Preload fonts and images when modal opens for faster capture
  useEffect(() => {
    if (!open) {
      return;
    }

    const targetNode = captureCardRef.current || cardPreviewRef.current;
    if (!targetNode) {
      return;
    }

    const prepareForCapture = async () => {
      try {
        // Prepare element with all assets loaded
        await prepareElementForCapture(targetNode, {
          imageTimeout: 15000,
        });

        // Warmup capture: do a very fast, low-quality capture to warm up the library
        // This makes the real capture much faster (first capture is always slower)
        try {
          await toPng(targetNode, {
            pixelRatio: 0.1,
            cacheBust: false,
            backgroundColor: 'transparent',
          });
          console.log('Warmup capture completed');
        } catch (e) {
          console.warn('Warmup capture skipped:', e);
          // Continue anyway
        }
      } catch (error) {
        console.warn('Preload error:', error);
        // Continue anyway - capture might still work
      }
    };

    // Run prep after a short delay to not block initial render
    setTimeout(prepareForCapture, 100);
  }, [open, selectedTemplate]);

  const captureCardAsBlob = async (): Promise<Blob | null> => {
    const captureNode = captureCardRef.current || cardPreviewRef.current;
    if (!captureNode) {
      toast.error('Card preview not found');
      return null;
    }

    const captureWidth = BASE_CARD_SIZE;
    const captureHeight = BASE_CARD_SIZE;

    // Check cache first - if we already captured this template, reuse it
    if (cachedBlobRef.current?.template === selectedTemplate) {
      console.log('Using cached blob');
      return cachedBlobRef.current.blob;
    }

    const isIOS = isIOSDevice();

    let restoreCaptureNodeStyle: (() => void) | null = null;

    try {
      const startTime = performance.now();
      console.log(
        `Starting card capture on ${isIOS ? 'iOS' : 'non-iOS'} device...`
      );

      let blob: Blob | null = null;

      if (isIOS) {
        // iOS: Use native canvas capture for maximum compatibility
        console.log('📱 Using native canvas capture for iOS...');

        const originalStyle = captureNode.style.cssText;
        captureNode.style.cssText = `${originalStyle}; position: fixed !important; top: 0 !important; left: 0 !important; width: ${captureWidth}px !important; height: ${captureHeight}px !important; transform: scale(1) !important; max-width: none !important; max-height: none !important; margin: 0 !important; padding: 0 !important; pointer-events: none !important; opacity: 0.001 !important; visibility: visible !important; z-index: -1 !important; background: transparent !important;`;
        restoreCaptureNodeStyle = () => {
          captureNode.style.cssText = originalStyle;
        };

        // Prepare element for iOS capture
        await prepareElementForCapture(captureNode, {
          imageTimeout: 20000,
          forcePreRender: true,
        });

        // Use native canvas method
        blob = await captureWithNativeCanvas(captureNode, {
          width: captureWidth,
          height: captureHeight,
        });

        if (!blob) {
          throw new Error('Native canvas capture failed for iOS');
        }
      } else {
        // Non-iOS: Use html-to-image library
        let originalStyle = '';
        let dialogOriginalStyle = '';
        const originalSrcs = new Map<HTMLImageElement, string>();

        // Temporarily add explicit styling to ensure clean capture
        originalStyle = captureNode.style.cssText;

        // Find the dialog content and temporarily set its background
        const dialogContent = captureNode.closest('[role="dialog"]');
        dialogOriginalStyle = dialogContent
          ? (dialogContent as HTMLElement).style.cssText
          : '';

        // Ensure element is at full size and visible for capture
        captureNode.style.cssText = `${originalStyle}; position: fixed !important; background: transparent !important; width: ${captureWidth}px !important; height: ${captureHeight}px !important; transform: scale(1) !important; max-width: none !important; max-height: none !important; margin: 0 !important; padding: 0 !important; top: 0 !important; left: 0 !important; pointer-events: none !important; opacity: 1 !important; visibility: visible !important;`;

        if (dialogContent) {
          (dialogContent as HTMLElement).style.cssText =
            dialogOriginalStyle + '; background: transparent !important;';
        }

        // Replace all image sources with CORS-friendly versions
        const images = captureNode.querySelectorAll('img');
        
        images.forEach((img) => {
          const src = img.src || img.getAttribute('src');
          if (src) {
            originalSrcs.set(img, src);
            
            // Convert IPFS URLs to dweb.link to avoid CORS
            if (src.includes('gateway.pinata.cloud/ipfs/') || src.includes('ipfs.guudfun.space/ipfs/')) {
              const match = src.match(/\/ipfs\/([^?]+)/);
              if (match) {
                const ipfsHash = match[1];
                const newSrc = `https://dweb.link/ipfs/${ipfsHash}`;
                img.src = newSrc;
                img.setAttribute('crossorigin', 'anonymous');
              }
            } else {
              img.setAttribute('crossorigin', 'anonymous');
            }
          }
        });

        // Wait for all assets to load
        await prepareElementForCapture(captureNode, {
          imageTimeout: 15000,
        });

        // Get optimal pixel ratio for device
        const pixelRatio = getOptimalPixelRatio();
        console.log(`Using pixel ratio: ${pixelRatio}`);

        // Add small delay to ensure everything is ready
        await new Promise(resolve => setTimeout(resolve, 200));

        // Perform the capture
        const dataUrl = await toPng(captureNode, {
          pixelRatio: 2, // Fixed lower pixel ratio to reduce file size
          cacheBust: true,
          skipFonts: false,
          backgroundColor: 'transparent',
          width: captureWidth,
          height: captureHeight,
          style: {
            transform: 'scale(1)',
            transformOrigin: 'top left',
            margin: '0',
            padding: '0',
          },
          // Skip external stylesheets to avoid CORS issues with Google Fonts
          filter: (node: HTMLElement) => {
            // Skip external link tags (like Google Fonts)
            if (node.tagName === 'LINK' && node.getAttribute('rel') === 'stylesheet') {
              const href = node.getAttribute('href');
              if (href && href.includes('googleapis.com')) {
                return false;
              }
            }
            return true;
          },
        });

        // Restore original styles
        captureNode.style.cssText = originalStyle;
        if (dialogContent && dialogOriginalStyle) {
          (dialogContent as HTMLElement).style.cssText = dialogOriginalStyle;
        }

        // Restore original image sources
        originalSrcs.forEach((src, img) => {
          img.src = src;
          img.removeAttribute('crossorigin');
        });

        // Validate that we actually captured something
        if (!dataUrl || dataUrl === 'data:,') {
          throw new Error(
            'Capture produced empty image - assets may not have loaded properly'
          );
        }

        // Convert PNG data URL to blob
        const base64 = dataUrl.split(',')[1];
        if (!base64) {
          throw new Error('Invalid image data - unable to extract base64');
        }

        const binaryStr = atob(base64);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }
        blob = new Blob([bytes], { type: 'image/png' });
      }

      if (!blob) {
        throw new Error('Failed to generate image blob');
      }

      // Validate blob size
      if (blob.size < 1000) {
        console.warn(
          `Warning: Very small blob size (${(blob.size / 1024).toFixed(2)}KB) - image may be incomplete`
        );
      }

      // Cache the blob for instant re-downloads
      cachedBlobRef.current = { template: selectedTemplate, blob };

      const endTime = performance.now();
      console.log(
        `✅ Card captured in ${(endTime - startTime).toFixed(0)}ms, size: ${(blob.size / 1024).toFixed(0)}KB`
      );
      return blob;
    } catch (error) {
      console.error('❌ Error capturing card:', error);

      // Try fallback method for iOS if native canvas failed
      if (isIOS) {
        console.log('🔄 iOS native capture failed, trying fallback method...');
        try {
          // Fallback: try html-to-image as last resort
          const dataUrl = await toPng(captureNode!, {
            pixelRatio: 2,
            cacheBust: true,
            backgroundColor: '#ffffff',
            width: captureWidth,
            height: captureHeight,
            filter: (node: HTMLElement) => {
              if (node.tagName === 'LINK' && node.getAttribute('rel') === 'stylesheet') {
                const href = node.getAttribute('href');
                if (href && href.includes('googleapis.com')) {
                  return false;
                }
              }
              return true;
            },
          });

          if (dataUrl && dataUrl !== 'data:,') {
            // Convert data URL to blob
            const base64 = dataUrl.split(',')[1];
            if (base64) {
              const binaryStr = atob(base64);
              const bytes = new Uint8Array(binaryStr.length);
              for (let i = 0; i < binaryStr.length; i++) {
                bytes[i] = binaryStr.charCodeAt(i);
              }
              const fallbackBlob = new Blob([bytes], { type: 'image/png' });

              cachedBlobRef.current = {
                template: selectedTemplate,
                blob: fallbackBlob,
              };
              console.log('✅ iOS fallback capture successful');
              toast.success('Card captured using fallback method');
              return fallbackBlob;
            }
          }
        } catch (fallbackError) {
          console.error('❌ iOS fallback capture also failed:', fallbackError);
        }
      }

      if (error instanceof Error) {
        toast.error(`Failed to capture: ${error.message}`);
      } else {
        toast.error('Failed to capture card image');
      }
      return null;
    } finally {
      if (restoreCaptureNodeStyle) {
        restoreCaptureNodeStyle();
        restoreCaptureNodeStyle = null;
      }
    }
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const blob = await captureCardAsBlob();
      if (!blob) return;

      // Sanitize filename for iOS compatibility (remove special chars, spaces)
      const sanitizedName = name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

      const filename = `guudscore-card-${sanitizedName}-${selectedTemplate}.png`;

      // iOS-specific handling for blob downloads with enhanced fallbacks
      if (isIOSDevice()) {
        try {
          console.log('Attempting iOS download...');

          // Method 1: Standard download attempt
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = filename;
          link.style.display = 'none';

          // iOS Safari sometimes needs the link to be added to a specific container
          const container = document.createElement('div');
          container.style.position = 'absolute';
          container.style.top = '-9999px';
          container.style.left = '-9999px';
          document.body.appendChild(container);
          container.appendChild(link);

          setTimeout(() => {
            link.click();
            console.log('iOS download click triggered');
          }, 50);

          // Method 2: Fallback to opening in new tab if download fails
          setTimeout(async () => {
            try {
              const dataUrl = await new Promise<string>(resolve => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.readAsDataURL(blob);
              });

              // Open image in new tab for user to save manually
              const newWindow = window.open(dataUrl, '_blank');
              if (newWindow) {
                newWindow.focus();
                toast.success(
                  'Image opened in new tab - save it with long press'
                );
              } else {
                // Method 3: Final fallback to share API
                if (navigator.share) {
                  const file = new File([blob], filename, {
                    type: 'image/png',
                  });
                  try {
                    await navigator.share({
                      files: [file],
                      title: 'GUUD Score Card',
                      text: 'Check out my GUUD Score card!',
                    });
                    toast.success('Share dialog opened');
                  } catch (shareError) {
                    console.log('Share API failed or was dismissed');
                  }
                } else {
                  toast.error('Download failed. Please try sharing instead.');
                }
              }
            } catch (error) {
              console.error('Fallback method failed:', error);
              toast.error('Download failed. Please try sharing instead.');
            }

            // Cleanup
            setTimeout(() => {
              if (container.parentNode) {
                container.parentNode.removeChild(container);
              }
              URL.revokeObjectURL(url);
            }, 1000);
          }, 1500);
        } catch (error) {
          console.error('iOS download error:', error);

          // Final fallback: Try share API directly
          try {
            const file = new File([blob], filename, { type: 'image/png' });
            if (navigator.share) {
              await navigator.share({
                files: [file],
                title: 'GUUD Score Card',
                text: 'Check out my GUUD Score card!',
              });
              toast.success('Share dialog opened');
            } else {
              toast.error('Download failed. Please try a different browser.');
            }
          } catch (shareError) {
            toast.error('Download failed. Please try sharing instead.');
          }
        }
      } else {
        // Standard download for non-iOS devices
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }

      toast.success('Card downloaded successfully!');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShareToX = async () => {
    setIsSharingX(true);
    try {
      // Pass template selection to parent for share preview
      if (onShareClick) {
        onShareClick(selectedTemplate);
      }

      // Close this dialog
      onOpenChange(false);
    } catch (error) {
      console.error('Error preparing share:', error);
      if (error instanceof Error) {
        toast.error(`Failed to prepare share: ${error.message}`);
      } else {
        toast.error('Failed to prepare share');
      }
    } finally {
      setIsSharingX(false);
    }
  };

  const themeComponents = useMemo(
    () => ({
      guud: GuudTheme,
      avax: AvaxTheme,
      desci: DesciTheme,
      'no-chillio': NoChillioTheme,
      gta: GtaTheme,
      coq: CoqTheme,
    }),
    []
  );

  const selectedTemplateInfo = useMemo(() => {
    const detail = TEMPLATE_DETAILS[selectedTemplate];
    const locked = isTemplateLocked(selectedTemplate);
    const matchedBadgeKeyword = getBadgeUnlockKeyword(selectedTemplate);
    const unlockedByScoreForTemplate =
      isTemplateUnlockedByScore(selectedTemplate);
    const statusParts: string[] = [];

    if (!locked) {
      if (selectedTemplate === 'guud') {
        statusParts.push('Default theme');
      }

      if (selectedTemplate !== 'guud' && unlockedByScoreForTemplate) {
        statusParts.push(`Score (${normalizedScore} pts)`);
      }

      if (matchedBadgeKeyword) {
        const badgeName =
          TEMPLATE_BADGE_REQUIREMENTS[selectedTemplate]?.badgeName ?? 'Badge';
        statusParts.push(badgeName);
      }
    }

    const useScoreTierDetails =
      selectedTemplate === 'guud' || unlockedByScoreForTemplate || !detail;

    const title = useScoreTierDetails
      ? scoreTier.title
      : (detail?.title ?? scoreTier.title);
    const description = useScoreTierDetails
      ? scoreTier.description
      : (detail?.description ?? scoreTier.description);

    const statusMessage = locked
      ? 'Locked'
      : statusParts.length > 0
        ? `Unlocked (${statusParts.join(' / ')})`
        : 'Unlocked';

    const requirementMessage = locked
      ? (detail?.requirementMessage ??
        'Unlock this theme by meeting the required score or badge conditions.')
      : undefined;

    return {
      title,
      description,
      statusMessage,
      isUnlocked: !locked,
      requirementMessage,
    };
  }, [
    getBadgeUnlockKeyword,
    isTemplateLocked,
    isTemplateUnlockedByScore,
    normalizedScore,
    scoreTier,
    selectedTemplate,
  ]);

  // Memoized theme button component to prevent unnecessary re-renders
  const ThemeButton = useMemo(() => {
    return React.memo(
      ({
        template,
        isSelected,
        onSelect,
      }: {
        template: CardTemplate;
        isSelected: boolean;
        onSelect: (t: CardTemplate) => void;
      }) => {
        const isLocked = isTemplateLocked(template);
        // In Case 1: Allow clicking all themes (not disabled)
        // In Case 2: Allow clicking all themes, locked ones just can't be shared/downloaded
        const shouldDisableButton = false;
        // Apply fading: Case 1 all faded, Case 2 only locked faded
        const isFaded = hasEmptyWallets || (hasNonEmptyWallets && isLocked);
        const backgroundImageUrl = `/theme/subtitle/${template}-logo.png`;
        const detail = TEMPLATE_DETAILS[template];
        const tooltip = isLocked
          ? (detail?.requirementMessage ??
            'Unlock this theme by meeting the required score or badge conditions.')
          : (detail?.description ?? TEMPLATE_NAMES[template]);

        return (
          <div className="flex w-[64px] flex-col items-center gap-1">
            <button
              onClick={() => onSelect(template)}
              disabled={shouldDisableButton}
              aria-label={detail?.title ?? TEMPLATE_NAMES[template]}
              title={tooltip}
              className={`relative flex cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 transition-all duration-200 active:scale-95 ${
                isFaded ? 'opacity-40' : ''
              } ${
                isSelected && !isFaded
                  ? 'border-blue-500 shadow-md'
                  : isFaded
                    ? 'border-gray-300 dark:border-gray-700'
                    : 'border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500'
              }`}
              style={{
                width: '64px',
                height: '64px',
                minWidth: '64px',
                minHeight: '64px',
                backgroundImage: `linear-gradient(rgba(0, 0, 0, ${isLocked ? '0.6' : '0'}), rgba(0, 0, 0, ${isLocked ? '0.6' : '0'})), url(${backgroundImageUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
              }}
            >
              {/* Show lock icon for locked themes */}
              {isLocked && (
                <div className="absolute top-1 right-1 z-20 flex h-5 w-5 items-center justify-center rounded-full bg-black/60">
                  <Lock className="h-3 w-3 text-white" />
                </div>
              )}
              {/* Show badge icon for unlocked themes */}
              {!isLocked && TEMPLATE_BADGE_IMAGES[template] && (
                <div className="absolute right-1 bottom-1 z-20">
                  <img
                    src={TEMPLATE_BADGE_IMAGES[template]}
                    alt={`${TEMPLATE_NAMES[template]} badge`}
                    className="h-6 w-6 object-contain drop-shadow-md"
                  />
                </div>
              )}
            </button>
            <span className="text-center text-[10px] leading-tight font-semibold text-white sm:text-xs">
              {TEMPLATE_NAMES[template]}
            </span>
          </div>
        );
      }
    );
  }, [hasEmptyWallets, hasNonEmptyWallets, isTemplateLocked]);

  const previewCardProps = useMemo(
    () =>
      getCardDisplayProps(
        currentUser,
        selectedTemplate,
        score,
        cardPhotoUrl,
        hasEmptyWallets,
        name,
        {
          score: normalizedScore,
          title: selectedTemplateInfo.title,
          description: selectedTemplateInfo.description,
        },
        cardDimensions.width,
        cardDimensions.height
      ),
    [
      cardDimensions.height,
      cardDimensions.width,
      cardPhotoUrl,
      currentUser,
      hasEmptyWallets,
      name,
      normalizedScore,
      score,
      selectedTemplate,
      selectedTemplateInfo.description,
      selectedTemplateInfo.title,
    ]
  );

  const captureCardProps = useMemo(
    () =>
      getCardDisplayProps(
        currentUser,
        selectedTemplate,
        score,
        cardPhotoUrl,
        hasEmptyWallets,
        name,
        {
          score: normalizedScore,
          title: selectedTemplateInfo.title,
          description: selectedTemplateInfo.description,
        },
        BASE_CARD_SIZE,
        BASE_CARD_SIZE
      ),
    [
      cardPhotoUrl,
      currentUser,
      hasEmptyWallets,
      name,
      normalizedScore,
      score,
      selectedTemplate,
      selectedTemplateInfo.description,
      selectedTemplateInfo.title,
    ]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="dark flex max-h-[90vh] w-[95vw] flex-col overflow-y-auto p-4 sm:w-[90vw] sm:p-6 md:w-auto"
        style={{
          maxWidth: '700px',
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">
            Customize Your Card
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-1 flex-col gap-3 sm:gap-4">
          {/* Card Preview - Centered with mobile optimization */}
          <div className="relative flex w-full justify-center px-2 sm:px-0">
            <div
              ref={cardPreviewRef}
              className={`overflow-hidden rounded-lg shadow-xl transition-transform sm:rounded-xl sm:shadow-2xl ${
                !hasEmptyWallets && !isSelectedTemplateLocked
                  ? 'sm:hover:scale-105'
                  : ''
              } ${hasEmptyWallets && !testMode ? 'opacity-40' : ''} ${hasNonEmptyWallets && isSelectedTemplateLocked && !testMode ? 'opacity-40' : ''}`}
              style={{
                position: 'relative',
                backgroundColor: 'transparent',
                width: `min(${CARD_PREVIEW_MAX_SIZE}px, 90vw, ${CARD_PREVIEW_VIEWPORT_PERCENT}vw)`,
                height: `min(${CARD_PREVIEW_MAX_SIZE}px, 90vw, ${CARD_PREVIEW_VIEWPORT_PERCENT}vw)`,
                maxWidth: `${CARD_PREVIEW_MAX_SIZE}px`,
                maxHeight: `${CARD_PREVIEW_MAX_SIZE}px`,
              }}
              key={selectedTemplate}
            >
              {React.createElement(themeComponents[selectedTemplate], {
                ...previewCardProps,
              } as any)}
            </div>

            {/* Hidden capture card ensures exports are pixel-perfect */}
            <div
              ref={captureCardRef}
              aria-hidden="true"
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: `${BASE_CARD_SIZE}px`,
                height: `${BASE_CARD_SIZE}px`,
                pointerEvents: 'none',
                backgroundColor: 'transparent',
                opacity: 0,
                visibility: 'hidden',
                zIndex: -1,
              }}
              key={`capture-${selectedTemplate}`}
            >
              {React.createElement(themeComponents[selectedTemplate], {
                ...captureCardProps,
              } as any)}
            </div>

            {/* Overlay messages - mobile optimized */}
            {hasEmptyWallets && (
              <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/40 p-4 sm:rounded-xl">
                <div className="max-w-[280px] rounded-lg bg-amber-50 px-4 py-3 text-center text-xs font-medium text-amber-800 sm:max-w-xs sm:px-6 sm:py-4 sm:text-sm dark:bg-amber-950 dark:text-amber-200">
                  Connect a wallet to unlock sharing features
                </div>
              </div>
            )}
            {/* {hasNonEmptyWallets && isSelectedTemplateLocked && (
              <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/40">
                <div className="max-w-xs rounded-lg bg-amber-50 px-6 py-4 text-center text-sm font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                  {selectedTemplateInfo.requirementMessage ??
                    'Unlock this theme by meeting the required score or badge conditions.'}
                </div>
              </div>
            )} */}
          </div>

          {/* Theme Selection - Button Grid - Mobile optimized */}
          <div className="flex flex-wrap justify-center gap-2 px-2 sm:gap-3 sm:px-0">
            {CARD_TEMPLATES.map(template => (
              <ThemeButton
                key={template}
                template={template}
                isSelected={selectedTemplate === template}
                onSelect={handleTemplateSelect}
              />
            ))}
          </div>

          {testMode && (
            <div className="space-y-2 rounded-lg border border-dashed border-gray-300 p-4 dark:border-gray-700">
              <div>
                <Label htmlFor="debug-guud-score">Debug GUUD Score</Label>
                <Input
                  id="debug-guud-score"
                  type="number"
                  min={0}
                  max={2000}
                  step={10}
                  value={debugScoreOverride ?? ''}
                  placeholder="Enter a score to test unlocks"
                  onChange={event => {
                    const { value } = event.currentTarget;
                    if (value === '') {
                      setDebugScoreOverride(null);
                      return;
                    }
                    const parsed = Number(value);
                    if (!Number.isNaN(parsed)) {
                      setDebugScoreOverride(parsed);
                    }
                  }}
                  className="mt-2"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {DEBUG_SCORE_PRESETS.map(preset => (
                  <Button
                    key={preset}
                    type="button"
                    variant={normalizedScore === preset ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setDebugScoreOverride(preset)}
                  >
                    {preset} pts
                  </Button>
                ))}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setDebugScoreOverride(null)}
                >
                  Reset
                </Button>
              </div>
              <p className="text-muted-foreground text-xs">
                Current test score: {normalizedScore} pts — Active tier:{' '}
                <span className="font-medium">{scoreTier.title}</span>
              </p>
            </div>
          )}

          {/* Action Buttons - Share and Download - Mobile optimized with larger touch targets */}
          <div className="flex w-full flex-col gap-2 px-2 sm:gap-3 sm:px-0">
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
              <Button
                variant="outline"
                className="h-11 flex-1 text-sm sm:h-10 sm:text-base"
                onClick={handleShareToX}
                disabled={isAnyActionInProgress || shouldDisableActions}
                title={
                  isSelectedTemplateLocked
                    ? (selectedTemplateInfo.requirementMessage ??
                      'This theme is locked until you meet the required score or badge conditions.')
                    : ''
                }
              >
                {isSharingX && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isSelectedTemplateLocked && !isSharingX && (
                  <Lock className="mr-2 h-4 w-4" />
                )}
                {isSharingX ? 'Preparing...' : 'Share to X'}
              </Button>
              <Button
                variant="outline"
                className="h-11 flex-1 text-sm sm:h-10 sm:text-base"
                onClick={handleDownload}
                disabled={isAnyActionInProgress || shouldDisableActions}
                title={
                  isSelectedTemplateLocked
                    ? (selectedTemplateInfo.requirementMessage ??
                      'This theme is locked until you meet the required score or badge conditions.')
                    : ''
                }
              >
                {isDownloading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isSelectedTemplateLocked && !isDownloading && (
                  <Lock className="mr-2 h-4 w-4" />
                )}
                {isDownloading ? 'Preparing...' : 'Download Card'}
              </Button>
            </div>
          </div>

          {/* Profile Link with Copy Action - Mobile optimized */}
          <div className="flex w-full gap-2 px-2 sm:px-0">
            <Input
              readOnly
              value={`${window.location.origin}/profile/${slug}`}
              className="h-11 flex-1 py-0 text-xs sm:h-9 sm:text-sm"
              onClick={e => e.currentTarget.select()}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopyProfileLink}
              title="Copy profile link"
              className="h-11 w-11 flex-shrink-0 sm:h-9 sm:w-9"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};