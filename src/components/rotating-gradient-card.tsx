import { type CSSProperties, type FC, useEffect } from 'react';

import { cn } from '@/lib/utils';

interface RotatingGradientCardProps {
  title: string;
  description: string | undefined;
  image: string;
}

const RotatingGradientCard: FC<RotatingGradientCardProps> = ({
  title,
  image,
  description,
}) => {
  useEffect(() => {
    const styleId = 'rotating-gradient-card-styles';

    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        @keyframes rotate-gradient {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes float-particles {
          0%, 100% {
            transform: translateY(0px) scale(1);
            opacity: 0.6;
          }
          50% {
            transform: translateY(-20px) scale(1.2);
            opacity: 1;
          }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  const cardBeforeStyle: CSSProperties = {
    content: '""',
    position: 'absolute',
    top: '-350px',
    left: '-250px',
    right: '-250px',
    bottom: '-350px',
    background:
      'linear-gradient(45deg, var(--primary), var(--tertiary), var(--quaternary), var(--accent), var(--primary))',
    zIndex: -1,
    animation: 'rotate-gradient 3s linear infinite',
  };

  return (
    <div className={cn('h-full w-full')}>
      <div className="relative overflow-hidden rounded-md p-0.5">
        <div style={cardBeforeStyle} className="absolute" />

        <div className="relative z-10 flex items-center gap-3 rounded-sm p-3.5">
          <div className="size-16 overflow-hidden rounded-md">
            <img
              src={image}
              alt={title}
              className="h-full w-full object-cover"
            />
          </div>
          <div>
            <h6 className="font-pixel">{title}</h6>
            <span className="text-muted text-sm">{description}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RotatingGradientCard;
