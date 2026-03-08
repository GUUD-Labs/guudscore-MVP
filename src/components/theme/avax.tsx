import {
  calculateTopOffset,
  useAdaptiveFontSize,
  useDescriptionFontSize,
} from './use-adaptive-font-size';
import { getResponsiveCardStyles } from './utils';

interface GuuldCardProps {
  username: string;
  imageUrl: string;
  score: string;
  subtitleHeader: string;
  description: string;
  logoUrl?: string;
  hasEmptyWallets?: boolean;
  width?: number;
  height?: number;
}

const MAX_FONT_SIZE = 21;
const MIN_FONT_SIZE = 8;
const BASE_TOP_POSITION = 100;

export function GuuldCard({
  username,
  imageUrl,
  score,
  subtitleHeader,
  description,
  logoUrl: _logoUrl,
  hasEmptyWallets,
  width,
  height,
}: GuuldCardProps) {
  const { containerStyle, contentStyle } = getResponsiveCardStyles(
    width,
    height
  );
  const displayUsername = username?.trim() || 'Anonymous';

  const usernameFontSize = useAdaptiveFontSize(displayUsername, {
    maxWidth: 180,
    maxFontSize: MAX_FONT_SIZE,
    minFontSize: MIN_FONT_SIZE,
    fontFamily: 'Roboto',
    fontWeight: 900,
  });

  // Responsive font size for description (max 8px, min 6px)
  // Reduced maxWidth to 120px to prevent overlap with border on iPhone
  const descriptionFontSize = useDescriptionFontSize(description, 120, 8, 6);

  const topOffset = calculateTopOffset(
    usernameFontSize,
    MAX_FONT_SIZE,
    MIN_FONT_SIZE,
    10
  );
  const dynamicTop = BASE_TOP_POSITION + topOffset;

  return (
    <div className="relative" style={containerStyle}>
      <div
        className="relative overflow-hidden"
        style={{
          ...contentStyle,
          backgroundImage: 'url(/theme/avax.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div
          className="absolute z-10"
          style={{ width: '180px', top: `${dynamicTop}px`, left: '160px' }}
        >
          {/* Main Card Container */}
          <div
            style={{
              fontFamily: 'Roboto, sans-serif',
              fontSize: `${usernameFontSize}px`,
              fontWeight: 900,
              color: '#fff',
              overflow: 'visible',
              whiteSpace: 'nowrap',
              maxWidth: '180px',
            }}
            title={displayUsername} // Tooltip for full text on hover
          >
            {displayUsername}
          </div>
        </div>
        <div
          className="absolute z-10"
          style={{ width: '197px', top: '126px', left: '159.5px' }}
        >
          {/* Main Card Container */}
          <div className="relative">
            {/* Card with white/transparent border styling */}
            <div className="overflow-hidden rounded-[5px]">
              {/* Image section with blue border */}
              <div
                className="relative w-full bg-gradient-to-br from-pink-300 to-pink-400"
                style={{ height: '198px', width: '198px' }}
              >
                {imageUrl && (
                  <img
                    src={imageUrl}
                    alt={displayUsername}
                    crossOrigin="anonymous"
                    className="absolute inset-0 h-full w-full object-cover object-top"
                  />
                )}
              </div>

              {/* Score and info section */}
              <div></div>
            </div>
          </div>
        </div>
        <div
          className="absolute z-10"
          style={{ width: '198px', top: '327px', left: '164px' }}
        >
          {/* Main Card Container */}
          <div
            style={{
              fontFamily: 'Roboto, sans-serif',
              fontSize: '21px',
              fontWeight: 700,
              color: 'red',
            }}
          >
            Score: #{score}
          </div>
        </div>
        <div
          className="absolute z-10"
          style={{ width: '198px', top: '356px', left: '214px' }}
        >
          {/* Main Card Container */}
          <div
            style={{
              fontFamily: 'Roboto, sans-serif',
              fontSize: '12px',
              fontWeight: 500,
              color: 'red',
            }}
          >
            {subtitleHeader}
          </div>
        </div>
        <div
          className="absolute z-10"
          style={{
            width: hasEmptyWallets ? '110px' : '120px',
            top: hasEmptyWallets ? '371px' : '371px',
            left: '214px',
            maxWidth: '120px',
            height: '34px',
          }}
        >
          {/* Main Card Container */}
          <div
            style={
              {
                fontFamily: 'NK57 Monospace SC, monospace',
                fontSize: `${descriptionFontSize}px`,
                fontWeight: 400,
                color: 'red',
                lineHeight: 1.4,
                overflow: 'hidden',
                overflowWrap: 'break-word',
                wordBreak: 'normal',
                whiteSpace: 'normal',
                width: '100%',
                height: '100%',
              } as React.CSSProperties
            }
            title={description} // Tooltip for full text on hover
          >
            {description}
          </div>
        </div>
      </div>
    </div>
  );
}
