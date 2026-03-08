import { createFileRoute } from '@tanstack/react-router';

import { SettingsHeading } from '@/components/settings-heading';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useCurrentUser, useUpdateUserProfile } from '@/hooks';
import { BANNER_THEMES, FONTS, THEMES } from '@/lib/theme-constants';

export const Route = createFileRoute('/profile/settings/style')({
  component: RouteComponent,
});

function RouteComponent() {
  const { data: currentUser, isPending: isUserLoading } = useCurrentUser();
  const updateProfileMutation = useUpdateUserProfile();

  // All banners are available to everyone (no badge requirement)
  const availableBanners = BANNER_THEMES;

  const handleThemeChange = (themeId: string) => {
    updateProfileMutation.mutate({
      themeId,
    });
  };

  const handleFontChange = (fontId: string) => {
    updateProfileMutation.mutate({
      fontId,
    });
  };

  return (
    <div className="flex flex-col gap-10">
      <div className="glass rounded-md p-6">
        <div className="flex flex-col gap-6">
          <SettingsHeading
            title="Customize Your Profile"
            description="Personalize your profile with custom themes and fonts."
          />

          <div className="flex flex-col gap-3">
            <h5 className="font-pixel text-sm">Select Theme</h5>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
              {THEMES.map(theme => (
                <button
                  key={theme.id}
                  onClick={() => handleThemeChange(theme.id)}
                  disabled={isUserLoading || updateProfileMutation.isPending}
                  className={`glass relative flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all ${
                    currentUser?.themeId === theme.id
                      ? 'border-primary scale-105'
                      : 'hover:border-primary/50 border-transparent'
                  } ${isUserLoading || updateProfileMutation.isPending ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                >
                  <div className={`size-12 rounded-md ${theme.color}`} />
                  <span className="font-pixel text-xs">{theme.name}</span>
                  {currentUser?.themeId === theme.id && (
                    <div className="bg-primary text-primary-foreground absolute -top-2 -right-2 rounded-full p-1">
                      <svg
                        className="size-3"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {availableBanners.length > 0 && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <h5 className="font-pixel text-sm">Custom Banners</h5>
              </div>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
                {availableBanners.map(banner => (
                  <button
                    key={banner.id}
                    onClick={() => handleThemeChange(banner.id)}
                    disabled={isUserLoading || updateProfileMutation.isPending}
                    className={`glass relative flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all ${
                      currentUser?.themeId === banner.id
                        ? 'border-primary scale-105'
                        : 'hover:border-primary/50 border-transparent'
                    } ${isUserLoading || updateProfileMutation.isPending ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                  >
                    <div className="relative size-12 overflow-hidden rounded-md">
                      <img
                        src={banner.preview}
                        alt={banner.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <span className="font-pixel text-center text-xs">{banner.name}</span>
                    {currentUser?.themeId === banner.id && (
                      <div className="bg-primary text-primary-foreground absolute -top-2 -right-2 rounded-full p-1">
                        <svg
                          className="size-3"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <h5 className="font-pixel text-sm">Select Font</h5>
            <Select
              value={currentUser?.fontId || 'dm-sans'}
              onValueChange={handleFontChange}
              disabled={isUserLoading || updateProfileMutation.isPending}
            >
              <SelectTrigger
                className={`w-full md:w-[280px] ${FONTS.find(f => f.id === currentUser?.fontId)?.style || ''}`}
              >
                <SelectValue placeholder="Choose a font" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Fonts</SelectLabel>
                  {FONTS.map(font => (
                    <SelectItem
                      key={font.id}
                      value={font.id}
                      className={font.style}
                    >
                      {font.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}
