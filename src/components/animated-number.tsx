import { useEffect } from 'react';

import { useCountUp, useInView } from '@/hooks';

interface AnimatedNumberProps {
  value: number | string;
  duration?: number;
  delay?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
}

export const AnimatedNumber = ({
  value,
  duration = 2000,
  delay = 0,
  className = '',
  prefix = '',
  suffix = '',
}: AnimatedNumberProps) => {
  const { ref, inView } = useInView({ threshold: 0.3 });

  // Parse numeric value more intelligently
  const parseNumericValue = (val: number | string): number => {
    if (typeof val === 'number') return val;

    // Remove all non-numeric characters except dots and commas
    const cleaned = val.toString().replace(/[^0-9.,.-]/g, '');

    // Handle different decimal separators
    const normalized = cleaned.replace(',', '');

    const parsed = parseFloat(normalized);
    return isNaN(parsed) ? 0 : parsed;
  };

  const numericValue = parseNumericValue(value);

  // Determine decimal places from original value
  const getDecimalPlaces = (val: number | string): number => {
    if (typeof val === 'number') {
      return val % 1 !== 0 ? 2 : 0;
    }

    const str = val.toString();
    if (str.includes('.')) {
      const parts = str.split('.');
      if (parts[1]) {
        // Extract only numeric part after decimal
        const decimals = parts[1].replace(/[^0-9]/g, '');
        return decimals.length;
      }
    }
    return 0;
  };

  const decimalPlaces = getDecimalPlaces(value);

  const { count, startAnimation } = useCountUp({
    start: 0,
    end: numericValue,
    duration,
    delay,
    decimals: decimalPlaces,
  });

  useEffect(() => {
    if (inView) {
      startAnimation();
    }
  }, [inView, startAnimation]);

  // Smart formatting based on original value
  const formatValue = (num: number): string => {
    if (typeof value === 'string') {
      const originalStr = value.toString();

      // Handle currency formatting
      if (originalStr.includes('$')) {
        // Preserve the original decimal places
        return `$${num.toFixed(decimalPlaces)}`;
      }

      // Handle percentage
      if (originalStr.includes('%') || suffix === '%') {
        return decimalPlaces > 0 ? num.toFixed(decimalPlaces) : num.toString();
      }
    }

    // Default formatting for regular numbers
    return decimalPlaces > 0
      ? num.toFixed(decimalPlaces)
      : num.toLocaleString();
  };

  return (
    <span ref={ref} className={className}>
      {prefix}
      {formatValue(count)}
      {suffix}
    </span>
  );
};
