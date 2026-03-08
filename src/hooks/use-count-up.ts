import { useEffect, useState } from 'react';

interface UseCountUpOptions {
  start?: number;
  end: number;
  duration?: number;
  delay?: number;
  decimals?: number;
}

export const useCountUp = ({
  start = 0,
  end,
  duration = 2000,
  delay = 0,
  decimals = 0,
}: UseCountUpOptions) => {
  const [count, setCount] = useState(start);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    if (!hasStarted) return;

    const timer = setTimeout(() => {
      const startTime = Date.now();
      const difference = end - start;

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing function for smooth animation
        const easeOutCubic = 1 - Math.pow(1 - progress, 3);
        const currentValue = start + difference * easeOutCubic;

        // Preserve decimal places based on decimals parameter
        const roundedValue =
          decimals > 0
            ? parseFloat(currentValue.toFixed(decimals))
            : Math.round(currentValue);

        setCount(roundedValue);

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      animate();
    }, delay);

    return () => clearTimeout(timer);
  }, [start, end, duration, delay, hasStarted]);

  const startAnimation = () => setHasStarted(true);

  return { count, startAnimation };
};
