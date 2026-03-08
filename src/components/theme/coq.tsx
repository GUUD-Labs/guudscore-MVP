import {
  calculateTopOffset,
  useAdaptiveFontSize,
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

const MAX_FONT_SIZE = 23;
const MIN_FONT_SIZE = 10;
const BASE_TOP_POSITION = 95;

export function GuuldCard({
  username,
  imageUrl,
  score,
  subtitleHeader,
  description,
  logoUrl: _logoUrl,
  hasEmptyWallets: _hasEmptyWallets,
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
    fontFamily: 'Fredoka',
    fontWeight: 600, // SemiBold
  });

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
          backgroundImage: 'url(/theme/coq.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* Username */}
        <div
          className="absolute z-10"
          style={{ top: `${dynamicTop}px`, left: '165px' }}
        >
          <div
            className="font-fredoka text-center"
            style={{
              fontSize: `${usernameFontSize}px`,
              fontWeight: 600, // SemiBold
              color: '#000',
              whiteSpace: 'nowrap',
              overflow: 'visible',
              maxWidth: '180px',
            }}
            title={displayUsername} // Tooltip for full text on hover
          >
            {displayUsername}
          </div>
        </div>

        {/* User Image */}
        <div
          className="absolute z-10"
          style={{
            width: '196.5px',
            height: '195.5px',
            top: '132.5px',
            left: '160px',
            borderTopLeftRadius: '0px',
            borderBottomRightRadius: '0px',
          }}
        >
          <div className="relative h-full w-full">
            <div className="h-full w-full overflow-hidden rounded-[8px] rounded-tl-none rounded-br-none">
              <div className="relative h-full w-full bg-gradient-to-br from-pink-300 to-pink-400">
                {imageUrl && (
                  <img
                    src={imageUrl}
                    alt={displayUsername}
                    crossOrigin="anonymous"
                    className="absolute inset-0 h-full w-full object-cover object-top"
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Score */}
        <div className="absolute z-10" style={{ top: '329px', left: '165px' }}>
          <div
            className="font-fredoka"
            style={{
              fontSize: '21px',
              fontWeight: 400, // Regular
            }}
          >
            Score:{' '}
            <span
              className="font-fredoka"
              style={{ fontWeight: 600 }} // SemiBold
            >
              #{score}
            </span>
          </div>
        </div>

        {/* Subtitle Header */}
        <div
          className="absolute z-10"
          style={{
            top: '357px',
            left: '209px',
            width: '150px',
          }}
        >
          <div
            style={{
              fontFamily: 'Pixel Digivolve, monospace',
              fontSize: '12px',
              fontWeight: 400,
              color: '#000',
            }}
          >
            {subtitleHeader}
          </div>
        </div>

        {/* Description (Subtitle Text) */}
        <div
          className="absolute z-10"
          style={{
            top: '372px',
            left: '209px',
            width: '150px',
            height: '34px', // ~3 lines at 8px font with 1.4 line-height
          }}
        >
          <div
            className="font-fredoka"
            style={{
              fontSize: '8px',
              fontWeight: 300, // Light
              color: '#000',
              lineHeight: 1.4,
              overflow: 'hidden',
              overflowWrap: 'break-word',
              wordBreak: 'normal',
              whiteSpace: 'normal',
              width: '100%',
              height: '100%',
            }}
            title={description} // Tooltip for full text on hover
          >
            {description}
          </div>
        </div>
      </div>
    </div>
  );
}
