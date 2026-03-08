import { toPng } from 'html-to-image';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import React, { useEffect, useMemo, useRef, useState } from 'react';

import { useShareToX } from '@/hooks/use-share-to-x';
import { getCardDisplayPropsSimple } from '@/lib/card-display-utils';
import {
  captureWithNativeCanvas,
  getOptimalPixelRatio,
  isIOSDevice,
  prepareElementForCapture,
} from '@/lib/image-loading-utils';
import { authService } from '@/services/auth';
import { fileService } from '@/services/file';
import { type CardTemplate } from './social-media-card';
import { GuuldCard as AvaxTheme } from './theme/avax';
import { GuuldCard as CoqTheme } from './theme/coq';
import { GuuldCard as DesciTheme } from './theme/desci';
import { GuuldCard as GtaTheme } from './theme/gta';
import { GuuldCard as GuudTheme } from './theme/guud';
import { GuuldCard as NoChillioTheme } from './theme/no-chillio';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Textarea } from './ui/textarea';

const themeComponents = {
  guud: GuudTheme,
  avax: AvaxTheme,
  desci: DesciTheme,
  'no-chillio': NoChillioTheme,
  gta: GtaTheme,
  coq: CoqTheme,
};

const SHARE_CARD_SIZE = 500;

interface SharePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: CardTemplate;
  name: string;
  score: number;
  slug?: string;
  cardPhotoUrl?: string;
  defaultShareText?: string;
  hasEmptyWallets?: boolean;
  rankTitle?: string;
  rankDescription?: string;
}

export const SharePreviewDialog = ({
  open,
  onOpenChange,
  template,
  name,
  score,
  cardPhotoUrl,
  defaultShareText,
  hasEmptyWallets = false,
  rankTitle,
  rankDescription,
}: SharePreviewDialogProps) => {
  const [shareText, setShareText] = useState(
    defaultShareText || `Check my GUUD Score 🎯 - ${name}`
  );
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('');
  const [isCapturing, setIsCapturing] = useState(false);
  const cardPreviewRef = useRef<HTMLDivElement>(null);
  const captureCardRef = useRef<HTMLDivElement>(null);

  // Use the hybrid OAuth share hook
  const { shareToX, isSharing } = useShareToX({
    onSuccess: (data) => {
      if (data.shareUrl) {
        // Success! Open the tweet in a new window
        window.open(data.shareUrl, '_blank', 'noopener,noreferrer');
        toast.success('Successfully shared to X!', { duration: 3000 });
        
        // Close dialog after successful share
        onOpenChange(false);
      }
    },
    onError: (error) => {
      console.error('[SharePreview] Share error:', error);
      toast.error(
        error.message || 'Failed to share to X. Please try again.',
        { duration: 4000 }
      );
    },
    onAuthRequired: async (authUrl) => {
      // Let user know they need to authorize
      toast.info(
        'Twitter authorization required. Redirecting...',
        { duration: 2000 }
      );
      // Redirect to OAuth 1.0a authorization with correct returnTo
      try {
        const correctAuthUrl = await authService.getTwitterOAuth1ShareAuthUrl(window.location.pathname);
        setTimeout(() => {
          window.location.href = correctAuthUrl;
        }, 500);
      } catch (error) {
        console.error('[SharePreview] Failed to get OAuth1 auth URL:', error);
        toast.error('Failed to start authorization. Please try again.');
      }
    },
    returnTo: window.location.pathname, // Return to current page after OAuth
  });

  const isPosting = isCapturing || isSharing;

  // Check for OAuth callback and auto-trigger share
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('twitterAuth') === 'success' && open) {
      const pendingShareStr = localStorage.getItem('pendingTwitterShare');
      if (pendingShareStr) {
        console.log('[SharePreview] OAuth callback detected, auto-triggering share...');
        localStorage.removeItem('pendingTwitterShare');
        
        // Clean up URL
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('twitterAuth');
        window.history.replaceState({}, '', newUrl.toString());
        
        // Auto-trigger share after a small delay
        setTimeout(() => {
          handlePostToX();
        }, 500);
      }
    }
  }, [open]);

  // Update shareText when name or defaultShareText changes
  useEffect(() => {
    const newShareText = defaultShareText || `Check my GUUD Score 🎯 - ${name}`;
    setShareText(newShareText);
    console.log('Share Dialog Name:', name);
    console.log('Updated Share Text:', newShareText);
  }, [name, defaultShareText]);

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
        await prepareElementForCapture(targetNode, {
          imageTimeout: 20000,
        });

        try {
          await toPng(targetNode, {
            pixelRatio: 0.1,
            cacheBust: false,
            backgroundColor: 'transparent',
          });
        } catch (e) {
          console.warn('Share dialog warmup skipped:', e);
        }
      } catch (error) {
        console.warn('Share dialog preload error:', error);
      }
    };

    setTimeout(prepareForCapture, 100);
  }, [open, template]);

  const captureCardAsBlob = async (): Promise<Blob | null> => {
    const captureNode = captureCardRef.current || cardPreviewRef.current;
    if (!captureNode) {
      toast.error('Card preview not found');
      return null;
    }

    const isIOS = isIOSDevice();
    let originalStyle = '';
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

        originalStyle = captureNode.style.cssText;
        captureNode.style.cssText = `${originalStyle}; position: fixed !important; top: 0 !important; left: 0 !important; width: ${SHARE_CARD_SIZE}px !important; height: ${SHARE_CARD_SIZE}px !important; transform: scale(1) !important; max-width: none !important; max-height: none !important; margin: 0 !important; padding: 0 !important; pointer-events: none !important; opacity: 0.001 !important; visibility: visible !important; z-index: -1 !important; background: transparent !important;`;
        restoreCaptureNodeStyle = () => {
          captureNode.style.cssText = originalStyle;
        };

        // Prepare element for iOS capture with force pre-render
        await prepareElementForCapture(captureNode, {
          imageTimeout: 20000,
          forcePreRender: true,
        });

        // Use native canvas method
        blob = await captureWithNativeCanvas(captureNode, {
          width: SHARE_CARD_SIZE,
          height: SHARE_CARD_SIZE,
        });

        if (!blob) {
          throw new Error('Native canvas capture failed for iOS');
        }
      } else {
        // Non-iOS: Use html-to-image library
        let dialogOriginalStyle = '';

        originalStyle = captureNode.style.cssText;
        const dialogContent = captureNode.closest('[role="dialog"]');
        dialogOriginalStyle = dialogContent
          ? (dialogContent as HTMLElement).style.cssText
          : '';

        // Ensure element is at full size and visible for capture
        captureNode.style.cssText = `${originalStyle}; position: fixed !important; background: transparent !important; width: ${SHARE_CARD_SIZE}px !important; height: ${SHARE_CARD_SIZE}px !important; transform: scale(1) !important; max-width: none !important; max-height: none !important; margin: 0 !important; padding: 0 !important; top: 0 !important; left: 0 !important; pointer-events: none !important; opacity: 1 !important; visibility: visible !important;`;

        if (dialogContent) {
          (dialogContent as HTMLElement).style.cssText =
            dialogOriginalStyle + '; background: transparent !important;';
        }

        // Wait for all assets to load
        await prepareElementForCapture(captureNode, {
          imageTimeout: 20000,
        });

        // Get optimal pixel ratio for device
        const pixelRatio = getOptimalPixelRatio();
        console.log(`Using pixel ratio: ${pixelRatio}`);

        // Add small delay to ensure everything is truly ready
        await new Promise(resolve => setTimeout(resolve, 200));

        // Perform the capture
        const dataUrl = await toPng(captureNode, {
          pixelRatio,
          cacheBust: true,
          skipFonts: false,
          backgroundColor: 'transparent',
          width: SHARE_CARD_SIZE,
          height: SHARE_CARD_SIZE,
          style: {
            transform: 'scale(1)',
            transformOrigin: 'top left',
            margin: '0',
            padding: '0',
          },
        });

        // Restore original styles
        captureNode.style.cssText = originalStyle;
        if (dialogContent && dialogOriginalStyle) {
          (dialogContent as HTMLElement).style.cssText = dialogOriginalStyle;
        }

        // Validate that we actually captured something
        if (!dataUrl || dataUrl === 'data:,') {
          throw new Error(
            'Capture produced empty image - assets may not have loaded properly'
          );
        }

        // Convert data URL to blob
        const base64 = dataUrl.split(',')[1];
        if (!base64) {
          throw new Error('Invalid image data - unable to extract base64');
        }

        const byteCharacters = atob(base64);
        const byteArray = new Uint8Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteArray[i] = byteCharacters.charCodeAt(i);
        }
        blob = new Blob([byteArray], { type: 'image/png' });
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
            pixelRatio: 1.5,
            cacheBust: true,
            backgroundColor: '#000000',
            width: SHARE_CARD_SIZE,
            height: SHARE_CARD_SIZE,
          });

          if (dataUrl && dataUrl !== 'data:,') {
            const base64 = dataUrl.split(',')[1];
            if (base64) {
              const byteCharacters = atob(base64);
              const byteArray = new Uint8Array(byteCharacters.length);
              for (let i = 0; i < byteCharacters.length; i++) {
                byteArray[i] = byteCharacters.charCodeAt(i);
              }
              const fallbackBlob = new Blob([byteArray], { type: 'image/png' });

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

  const handlePostToX = async () => {
    if (!shareText.trim()) {
      toast.error('Please enter some text to share');
      return;
    }

    setIsCapturing(true);
    try {

      // Step 1: Capture card image
      toast.info('Capturing card...', { duration: 2000 });
      const cardBlob = await captureCardAsBlob();
      if (!cardBlob) {
        setIsCapturing(false);
        return;
      }

      // Step 2: Upload image to Pinata if not already uploaded
      let imageUrl = uploadedImageUrl;

      if (!imageUrl) {
        toast.info('Uploading card image...', { duration: 2000 });

        const file = new File(
          [cardBlob],
          `guudscore-card-${name}-${template}.png`,
          { type: 'image/png' }
        );

        const uploadResponse = await fileService.uploadFile(file);

        if (!uploadResponse.success || !uploadResponse.data?.url) {
          throw new Error('Failed to upload card image');
        }

        imageUrl = uploadResponse.data.url;
        setUploadedImageUrl(imageUrl);
        console.log('Card image uploaded to Pinata:', imageUrl);
      }

      setIsCapturing(false);

      // Step 3: Share to X using hybrid OAuth flow
      toast.info('Posting to X...', { duration: 2000 });

      // Use the hybrid OAuth share hook
      shareToX({
        text: shareText,
        imageUrl: imageUrl,
      });
    } catch (error) {
      console.error('Error preparing share:', error);
      if (error instanceof Error) {
        toast.error(`Failed to prepare share: ${error.message}`);
      } else {
        toast.error('Failed to prepare share');
      }
      setIsCapturing(false);
    }
  };

  const cardProps = useMemo(
    () =>
      getCardDisplayPropsSimple(
        template,
        name,
        score,
        cardPhotoUrl,
        hasEmptyWallets,
        rankTitle,
        rankDescription
      ),
    [
      cardPhotoUrl,
      hasEmptyWallets,
      name,
      rankDescription,
      rankTitle,
      score,
      template,
    ]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="dark flex max-h-[90vh] max-w-[95vw] flex-col overflow-y-auto"
        style={{
          maxWidth: '700px',
        }}
      >
        <DialogHeader>
          <DialogTitle>Share to X</DialogTitle>
        </DialogHeader>

        <div className="flex flex-1 flex-col gap-6">
          {/* Card Preview */}
          <div className="relative flex w-full justify-center">
            <div
              ref={cardPreviewRef}
              className="transform overflow-hidden rounded-xl shadow-2xl"
              style={{
                position: 'relative',
                backgroundColor: 'transparent',
                width: `min(${SHARE_CARD_SIZE}px, 85vw)`,
                height: `min(${SHARE_CARD_SIZE}px, 85vw)`,
                maxWidth: `${SHARE_CARD_SIZE}px`,
                maxHeight: `${SHARE_CARD_SIZE}px`,
                transform: 'scale(1)',
                transformOrigin: 'center',
              }}
              key={template}
            >
              {React.createElement(themeComponents[template], {
                ...cardProps,
              } as any)}
            </div>

            {/* Hidden capture card mirrors the preview at base resolution */}
            <div
              ref={captureCardRef}
              aria-hidden="true"
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: `${SHARE_CARD_SIZE}px`,
                height: `${SHARE_CARD_SIZE}px`,
                pointerEvents: 'none',
                backgroundColor: 'transparent',
                opacity: 0,
                visibility: 'hidden',
                zIndex: -1,
              }}
              key={`capture-${template}`}
            >
              {React.createElement(themeComponents[template], {
                ...cardProps,
              } as any)}
            </div>
          </div>

          {/* Share Text Input */}
          <div className="flex flex-col gap-2">
            <label
              htmlFor="share-text"
              className="text-sm font-medium text-gray-300"
            >
              What do you want to say?
            </label>
            <Textarea
              id="share-text"
              value={shareText}
              onChange={e => setShareText(e.target.value)}
              placeholder="Enter your message..."
              className="min-h-[120px] resize-none"
              maxLength={280}
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>This will be posted to X (Twitter)</span>
              <span>{shareText.length}/280</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={isPosting}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-blue-500 hover:bg-blue-600"
              onClick={handlePostToX}
              disabled={isPosting || !shareText.trim()}
            >
              {isPosting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isPosting ? 'Posting...' : 'Post to X'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
