const CARD_BASE_SIZE = 500;

const getSafeDimension = (dimension?: number) => {
  if (
    typeof dimension === 'number' &&
    Number.isFinite(dimension) &&
    dimension > 0
  ) {
    return dimension;
  }
  return CARD_BASE_SIZE;
};

export const getResponsiveCardStyles = (width?: number, height?: number) => {
  const safeWidth = getSafeDimension(width);
  const safeHeight = getSafeDimension(height);
  const targetSize = Math.min(safeWidth, safeHeight);
  const scale = targetSize / CARD_BASE_SIZE;

  return {
    containerStyle: {
      width: '100%',
      height: '100%',
      position: 'relative' as const,
    },
    contentStyle: {
      width: CARD_BASE_SIZE,
      height: CARD_BASE_SIZE,
      transform: `scale(${scale})`,
      transformOrigin: 'top left',
      position: 'relative' as const,
    },
  };
};

export const getScaleValue = (width?: number, height?: number) => {
  const safeWidth = getSafeDimension(width);
  const safeHeight = getSafeDimension(height);
  const targetSize = Math.min(safeWidth, safeHeight);
  return targetSize / CARD_BASE_SIZE;
};
