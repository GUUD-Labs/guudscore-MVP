export const LIGHT_THEMES = ['coral', 'pastel', 'sunset'] as const;
export const DARK_THEMES = ['vintage', 'dark'] as const;

export const FONT_MAP: Record<string, string> = {
  'dm-sans': 'font-dm-sans',
  inter: 'font-inter',
  roboto: 'font-roboto',
  'open-sans': 'font-open-sans',
  montserrat: 'font-montserrat',
  poppins: 'font-poppins',
  'google-sans': 'font-google-sans',
  grobold: 'font-grobold',
};

export const THEME_MAP: Record<string, string> = {
  dark: 'bg-gray-900 border border-gray-800',
  coral:
    'bg-gradient-to-br from-orange-400 to-pink-400 border border-orange-300/20',
  pastel:
    'bg-gradient-to-br from-blue-200 to-pink-200 border border-blue-300/20',
  vintage:
    'bg-gradient-to-br from-amber-700 to-stone-600 border border-amber-800/20',
  sunset:
    'bg-gradient-to-br from-orange-500 to-rose-500 border border-orange-600/20',
  bgavax: 'glass',
  bggoat: 'glass',
  bgnochill: 'glass',
  bgbase: 'glass',
  bgsolana: 'glass',
};

export const THEMES = [
  {
    id: 'custom',
    name: 'Custom',
    color: 'glass bg-background backdrop-blur-sm border border-white/30',
  },
  { id: 'dark', name: 'Dark', color: 'bg-gray-900' },
  {
    id: 'coral',
    name: 'Coral',
    color: 'bg-gradient-to-r from-orange-400 to-pink-400',
  },
  {
    id: 'pastel',
    name: 'Pastel',
    color: 'bg-gradient-to-r from-blue-200 to-pink-200',
  },
  {
    id: 'vintage',
    name: 'Vintage',
    color: 'bg-gradient-to-r from-amber-700 to-stone-600',
  },
  {
    id: 'sunset',
    name: 'Sunset',
    color: 'bg-gradient-to-r from-orange-500 to-rose-500',
  },
] as const;

export const BANNER_THEMES = [
  {
    id: 'bgavax',
    name: 'AVAX Banner',
    preview: '/banners/bgavax.svg',
    requiredBadges: ['avaxmaxi', 'avaxmaxi', 'avax maxi', 'AVAX Maxi', 'arenaveteran', 'arena veteran', 'Arena Veteran'],
  },
  {
    id: 'bgbase',
    name: 'Base Banner',
    preview: '/banners/bgbase.svg',
    requiredBadges: ['base', 'Base', 'basemaxi', 'base maxi', 'BASE Maxi', 'virtualsvirgen', 'virtuals virgen', 'Virtuals Virgen'],
  },
  {
    id: 'bgsolana',
    name: 'Solana Banner',
    preview: '/banners/bgsolana.svg',
    requiredBadges: ['solana', 'Solana', 'solmaxi', 'sol maxi', 'SOL Maxi', 'pumpfundegen', 'pumpfun degen', 'PumpFun Degen'],
  },
  {
    id: 'bggoat',
    name: 'GOAT Banner',
    preview: '/banners/bggoat.svg',
    requiredBadges: ['arenaveteran', 'arena veteran', 'Arena Veteran', 'virtualsvirgen', 'virtuals virgen', 'Virtuals Virgen', 'pumpfundegen', 'pumpfun degen', 'PumpFun Degen'],
  },
  {
    id: 'bgnochill',
    name: 'No Chill Banner',
    preview: '/banners/bgnochill.svg',
    requiredBadges: ['nochill', 'no chill', 'No Chill'],
  },
] as const;

export const FONTS = [
  { id: 'dm-sans', name: 'Default', style: 'font-sans' },
  { id: 'inter', name: 'Inter', style: 'font-inter' },
  { id: 'roboto', name: 'Roboto', style: 'font-roboto' },
  { id: 'open-sans', name: 'Open Sans', style: 'font-open-sans' },
  { id: 'montserrat', name: 'Montserrat', style: 'font-montserrat' },
  { id: 'poppins', name: 'Poppins', style: 'font-poppins' },
  { id: 'google-sans', name: 'Google Sans', style: 'font-google-sans' },
  { id: 'grobold', name: 'Grobold', style: 'font-grobold' },
] as const;

export const isLightTheme = (themeId?: string) =>
  themeId && LIGHT_THEMES.includes(themeId as any);
export const isDarkTheme = (themeId?: string) =>
  themeId && DARK_THEMES.includes(themeId as any);

export const getFontClass = (fontId?: string) =>
  FONT_MAP[fontId || ''] || 'font-dm-sans';
export const getThemeClass = (themeId?: string) =>
  !themeId || themeId === 'custom' ? 'glass' : THEME_MAP[themeId] || 'glass';
export const getThemeTextClass = (themeId?: string) =>
  isLightTheme(themeId) ? 'text-gray-900' : '';
export const getThemeMutedTextClass = (themeId?: string) =>
  isLightTheme(themeId)
    ? 'text-gray-800'
    : isDarkTheme(themeId)
      ? 'text-gray-300'
      : 'text-muted';
export const getThemeAvatarClass = (themeId?: string) =>
  isLightTheme(themeId)
    ? 'ring-2 ring-gray-900/30 shadow-lg'
    : isDarkTheme(themeId)
      ? 'ring-2 ring-white/20 shadow-lg'
      : '';
export const getThemeBadgeClass = (themeId?: string) =>
  isLightTheme(themeId)
    ? 'bg-gray-900/80 text-white border-gray-900'
    : isDarkTheme(themeId)
      ? 'bg-white/10 text-white border-white/20 backdrop-blur-sm'
      : '';
export const getThemeSocialIconClass = (themeId?: string) =>
  isLightTheme(themeId)
    ? 'text-gray-900 hover:text-gray-700'
    : isDarkTheme(themeId)
      ? 'text-gray-200 hover:text-white'
      : 'text-white hover:text-white/80';
