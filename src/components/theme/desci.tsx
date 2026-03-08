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

const MAX_FONT_SIZE = 20;
const MIN_FONT_SIZE = 10;
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
    fontFamily: 'Montserrat, sans-serif',
    fontWeight: 800,
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
          backgroundImage: 'url(/theme/desci.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* Username */}
        <div
          className="absolute z-10"
          style={{ width: '180px', top: `${dynamicTop}px`, left: '153px' }}
        >
          <div
            style={{
              fontFamily: 'Montserrat, sans-serif',
              fontSize: `${usernameFontSize}px`,
              fontWeight: 800,
              color: '#fff',
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
            width: '190px',
            height: '190px',
            top: '130px',
            left: '154.5px',
          }}
        >
          <div className="relative">
            <div className="overflow-hidden">
              <div
                className="relative w-full bg-gradient-to-br from-pink-300 to-pink-400"
                style={{ height: '190px', width: '190px' }}
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
            </div>
          </div>
        </div>

        {/* Score */}
        <div
          className="absolute z-10"
          style={{ width: '198px', top: '327px', left: '155px' }}
        >
          <div
            style={{
              fontFamily: 'Montserrat, sans-serif',
              fontSize: '19px',
              fontWeight: 700,
              color: '#fff',
            }}
          >
            Score: #{score}
          </div>
        </div>

        {/* Subtitle Header */}
        <div
          className="absolute z-10"
          style={{
            width: hasEmptyWallets ? '198px' : '155px',
            top: hasEmptyWallets ? '360px' : '358px',
            left: '210px',
          }}
        >
          <div
            style={{
              fontFamily: 'Roboto, sans-serif',
              fontSize: '12px',
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
            width: hasEmptyWallets ? '130px' : '155px',
            top: hasEmptyWallets ? '375px' : '373px',
            left: '210px',
            maxWidth: '150px',
            height: '34px',
          }}
        >
          <div
            style={{
              fontFamily: 'NK57 Monospace SC, monospace',
              fontSize: '8px',
              fontWeight: 400,
              color: '#ccc',
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
