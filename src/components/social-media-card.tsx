import { cn } from '@/lib/utils';
import { ProfileAvatar } from './profile-avatar';

export type CardTemplate =
  | 'guud'
  | 'avax'
  | 'desci'
  | 'no-chillio'
  | 'gta'
  | 'coq';

interface SocialMediaCardProps {
  template: CardTemplate;
  name: string;
  score: number;
  subtitleHeader?: string;
  subtitleText?: string;
  avatarUrl?: string;
  className?: string;
}

const templateStyles = {
  guud: {
    container: 'bg-gradient-to-br from-pink-400 via-pink-300 to-rose-400',
    name: {
      fontFamily: 'MoonGet',
      fontSize: '24px',
      fontWeight: 900,
    },
    score: {
      primary: {
        fontFamily: 'NK57 Monospace',
        fontSize: '20px',
        fontWeight: 700,
      },
      secondary: {
        fontFamily: 'NK57 Monospace',
        fontSize: '16px',
        fontWeight: 700,
      },
    },
    subtitleHeader: {
      fontFamily: 'NK57 Monospace',
      fontSize: '9px',
      fontWeight: 600,
    },
    subtitleText: {
      fontFamily: 'NK57 Monospace',
      fontSize: '7px',
      fontWeight: 300,
    },
  },
  avax: {
    container: 'bg-gradient-to-br from-red-600 via-red-700 to-red-900',
    name: {
      fontFamily: 'Roboto',
      fontSize: '21px',
      fontWeight: 900,
    },
    score: {
      primary: {
        fontFamily: 'Roboto',
        fontSize: '21px',
        fontWeight: 700,
      },
      secondary: {
        fontFamily: 'Roboto',
        fontSize: '21px',
        fontWeight: 700,
      },
    },
    subtitleHeader: {
      fontFamily: 'Roboto',
      fontSize: '12px',
      fontWeight: 500,
    },
    subtitleText: {
      fontFamily: 'NK57 Monospace SC',
      fontSize: '8px',
      fontWeight: 400,
    },
  },
  desci: {
    container: 'bg-gradient-to-br from-blue-900 via-blue-800 to-cyan-900',
    name: {
      fontFamily: 'Montserrat',
      fontSize: '20px',
      fontWeight: 800,
    },
    score: {
      primary: {
        fontFamily: 'Montserrat',
        fontSize: '19px',
        fontWeight: 700,
      },
      secondary: {
        fontFamily: 'Montserrat',
        fontSize: '19px',
        fontWeight: 800,
      },
    },
    subtitleHeader: {
      fontFamily: 'Roboto',
      fontSize: '12px',
      fontWeight: 700,
    },
    subtitleText: {
      fontFamily: 'NK57 Monospace SC',
      fontSize: '8px',
      fontWeight: 400,
    },
  },
  'no-chillio': {
    container: 'bg-gradient-to-br from-green-900 via-green-800 to-teal-900',
    name: {
      fontFamily: 'VCR OSD Mono',
      fontSize: '23px',
      fontWeight: 400,
    },
    score: {
      primary: {
        fontFamily: 'Pixel Digivolve',
        fontSize: '19px',
        fontWeight: 400,
      },
      secondary: {
        fontFamily: 'Pixel Digivolve',
        fontSize: '19px',
        fontWeight: 400,
      },
    },
    subtitleHeader: {
      fontFamily: 'Pixel Digivolve',
      fontSize: '12px',
      fontWeight: 400,
    },
    subtitleText: {
      fontFamily: 'NK57 Monospace SC',
      fontSize: '8px',
      fontWeight: 400,
    },
  },
  gta: {
    container: 'bg-gradient-to-br from-orange-900 via-yellow-800 to-amber-900',
    name: {
      fontFamily: 'Pricedown',
      fontSize: '24px',
      fontWeight: 900,
    },
    score: {
      primary: {
        fontFamily: 'Pricedown',
        fontSize: '28px',
        fontWeight: 900,
      },
      secondary: {
        fontFamily: 'Pricedown',
        fontSize: '28px',
        fontWeight: 900,
      },
    },
    subtitleHeader: {
      fontFamily: 'Pixel Digivolve',
      fontSize: '12px',
      fontWeight: 400,
    },
    subtitleText: {
      fontFamily: 'NK57 Monospace SC',
      fontSize: '8px',
      fontWeight: 400,
    },
  },
  coq: {
    container: 'bg-gradient-to-br from-pink-900 via-pink-800 to-rose-900',
    name: {
      fontFamily: 'Fredoka',
      fontSize: '23px',
      fontWeight: 600,
    },
    score: {
      primary: {
        fontFamily: 'Fredoka',
        fontSize: '21px',
        fontWeight: 400,
      },
      secondary: {
        fontFamily: 'Fredoka',
        fontSize: '21px',
        fontWeight: 600,
      },
    },
    subtitleHeader: {
      fontFamily: 'Pixel Digivolve',
      fontSize: '12px',
      fontWeight: 400,
    },
    subtitleText: {
      fontFamily: 'Fredoka',
      fontSize: '8px',
      fontWeight: 300,
    },
  },
};

export const SocialMediaCard = ({
  template,
  name,
  score,
  subtitleHeader = 'Total Score',
  subtitleText = 'Ranked in the top 1%',
  avatarUrl,
  className,
}: SocialMediaCardProps) => {
  const style = templateStyles[template];

  // Special layout for 'guud' template - avatar focused
  if (template === 'guud') {
    return (
      <div
        className={cn(
          'relative flex h-[400px] w-[600px] items-center justify-center overflow-hidden rounded-xl shadow-2xl',
          style.container,
          className
        )}
      >
        {/* Decorative background pattern */}
        <div className="absolute inset-0 opacity-5">
          <svg
            className="h-full w-full"
            viewBox="0 0 600 400"
            preserveAspectRatio="none"
          >
            <path d="M 100 50 Q 150 30 200 50 T 300 50" stroke="white" strokeWidth="2" fill="none" />
            <path d="M 350 80 Q 400 60 450 80 T 550 80" stroke="white" strokeWidth="2" fill="none" />
            <path d="M 50 200 Q 100 180 150 200 T 250 200" stroke="white" strokeWidth="2" fill="none" />
            <path d="M 400 300 Q 450 280 500 300 T 600 300" stroke="white" strokeWidth="2" fill="none" />
          </svg>
        </div>

        {/* Main Content - Avatar Focused */}
        <div className="relative z-10 flex h-full w-full flex-col items-center justify-center">
          {/* Large Avatar - Center Focus */}
          <div className="relative mb-4 flex items-center justify-center">
            <ProfileAvatar
              src={avatarUrl}
              name={name}
              alt={name}
              size="xl"
              className="size-56 border-4 border-white/30 shadow-2xl"
            />
          </div>

          {/* Info Below Avatar */}
          <div className="relative flex flex-col items-center gap-3">
            {/* Name */}
            <h1
              style={{
                fontFamily: style.name.fontFamily,
                fontSize: style.name.fontSize,
                fontWeight: style.name.fontWeight,
              }}
              className="text-center uppercase tracking-wider text-white drop-shadow-lg"
            >
              {name}
            </h1>

            {/* Score */}
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-baseline gap-1">
                <span
                  style={{
                    fontFamily: style.score.primary.fontFamily,
                    fontSize: style.score.primary.fontSize,
                    fontWeight: style.score.primary.fontWeight,
                  }}
                  className="text-yellow-200 drop-shadow-lg"
                >
                  {Math.floor(score)}
                </span>
                {score % 1 !== 0 && (
                  <span
                    style={{
                      fontFamily: style.score.secondary.fontFamily,
                      fontSize: style.score.secondary.fontSize,
                      fontWeight: style.score.secondary.fontWeight,
                    }}
                    className="text-yellow-100 drop-shadow-lg"
                  >
                    .{Math.round((score % 1) * 100)}
                  </span>
                )}
              </div>

              {/* Subtitle */}
              <span
                style={{
                  fontFamily: style.subtitleHeader.fontFamily,
                  fontSize: style.subtitleHeader.fontSize,
                  fontWeight: style.subtitleHeader.fontWeight,
                }}
                className="uppercase tracking-wide text-white/90 drop-shadow"
              >
                {subtitleHeader}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom branding */}
        <div className="absolute bottom-3 right-4 opacity-70">
          <span
            style={{
              fontFamily: 'NK57 Monospace',
              fontSize: '10px',
              fontWeight: 700,
            }}
            className="uppercase tracking-wider text-white drop-shadow"
          >
            GuudScore
          </span>
        </div>
      </div>
    );
  }

  // Default layout for other templates
  return (
    <div
      className={cn(
        'relative flex h-[400px] w-[600px] flex-col items-center justify-center gap-6 rounded-xl p-8 text-white shadow-2xl',
        style.container,
        className
      )}
    >
      {/* Decorative background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-6">
        {/* Avatar */}
        <div className="relative">
          <ProfileAvatar
            src={avatarUrl}
            name={name}
            alt={name}
            size="xl"
            className="size-32 border-4 border-white/20 shadow-xl"
          />
        </div>

        {/* Name */}
        <h1
          style={{
            fontFamily: style.name.fontFamily,
            fontSize: style.name.fontSize,
            fontWeight: style.name.fontWeight,
          }}
          className="text-center uppercase tracking-wider"
        >
          {name}
        </h1>

        {/* Score */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-baseline gap-2">
            <span
              style={{
                fontFamily: style.score.primary.fontFamily,
                fontSize: style.score.primary.fontSize,
                fontWeight: style.score.primary.fontWeight,
              }}
              className="text-yellow-300"
            >
              {Math.floor(score)}
            </span>
            {score % 1 !== 0 && (
              <span
                style={{
                  fontFamily: style.score.secondary.fontFamily,
                  fontSize: style.score.secondary.fontSize,
                  fontWeight: style.score.secondary.fontWeight,
                }}
                className="text-yellow-200"
              >
                .{Math.round((score % 1) * 100)}
              </span>
            )}
          </div>

          {/* Subtitle Header */}
          <span
            style={{
              fontFamily: style.subtitleHeader.fontFamily,
              fontSize: style.subtitleHeader.fontSize,
              fontWeight: style.subtitleHeader.fontWeight,
            }}
            className="uppercase tracking-wide text-white/90"
          >
            {subtitleHeader}
          </span>
        </div>

        {/* Subtitle Text */}
        <p
          style={{
            fontFamily: style.subtitleText.fontFamily,
            fontSize: style.subtitleText.fontSize,
            fontWeight: style.subtitleText.fontWeight,
          }}
          className="text-center uppercase tracking-wider text-white/70"
        >
          {subtitleText}
        </p>
      </div>

      {/* Bottom branding */}
      <div className="absolute bottom-4 right-4 opacity-50">
        <span
          style={{
            fontFamily: 'NK57 Monospace',
            fontSize: '10px',
            fontWeight: 700,
          }}
          className="uppercase tracking-wider"
        >
          GuudScore
        </span>
      </div>
    </div>
  );
};
