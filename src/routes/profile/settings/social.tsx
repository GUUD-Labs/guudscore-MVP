import { zodResolver } from '@hookform/resolvers/zod';
import { Edit, Trash } from 'lucide-react';

import { type ReactNode, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import { createFileRoute } from '@tanstack/react-router';

import {
  CustomButtonsEmptyState,
  SocialLinksEmptyState,
} from '@/components/empty-state';
import Icons from '@/components/icons';
import { SettingsHeading } from '@/components/settings-heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from '@/components/ui/input-group';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  useArenaCallback,
  useArenaConnect,
  useArenaDisconnect,
  useArenaStatus,
  useCreateCustomLink,
  useCreateSocialLink,
  useCurrentUser,
  useDeleteCustomLink,
  useDeleteSocialLink,
  useUpdateCustomLink,
  useUpdateSocialLink,
} from '@/hooks';
import {
  type CustomLinkFormData,
  type SocialLinkFormData,
  customLinkSchema,
  socialLinkSchema,
} from '@/lib/validations/social';

export const Route = createFileRoute('/profile/settings/social')({
  component: RouteComponent,
});

const SOCIAL_PLATFORMS = [
  { id: 'facebook', name: 'Facebook', icon: Icons.facebook },
  { id: 'github', name: 'GitHub', icon: Icons.github },
  { id: 'instagram', name: 'Instagram', icon: Icons.instagram },
  { id: 'linkedin', name: 'LinkedIn', icon: Icons.linkedin },
  { id: 'telegram', name: 'Telegram', icon: Icons.telegram },
  { id: 'tiktok', name: 'TikTok', icon: Icons.tiktok },
  { id: 'whatsapp', name: 'WhatsApp', icon: Icons.whatsapp },
];

// Include X/Twitter and Arena for rendering existing links
const ALL_PLATFORMS = [
  ...SOCIAL_PLATFORMS,
  { id: 'x', name: 'X', icon: Icons.xLogo },
  { id: 'twitter', name: 'Twitter', icon: Icons.twitter },
  { id: 'arena', name: 'Arena', icon: Icons.arena },
];

interface LinkCardProps {
  title: string;
  url: string;
  visibility: boolean;
  icon: ReactNode;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
  canDelete?: boolean;
  canEdit?: boolean;
}

function LinkCard({
  title,
  url,
  visibility,
  icon,
  onEdit,
  onDelete,
  isDeleting,
  canDelete = true,
  canEdit = true,
}: LinkCardProps) {
  return (
    <div className="glass flex items-center justify-between rounded-md p-2 sm:p-3 gap-2">
      <div className="flex items-center gap-2 sm:gap-3 md:gap-4 min-w-0 flex-1">
        <div className="flex-shrink-0">{icon}</div>
        <div className="grid gap-1 min-w-0 flex-1">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <h5 className="font-pixel text-sm sm:text-base md:text-lg lg:text-xl truncate">{title}</h5>
            <Badge
              variant={visibility ? 'default' : 'destructive'}
              className="px-1.5 py-0 text-[10px] flex-shrink-0"
            >
              {visibility ? 'Public' : 'Private'}
            </Badge>
          </div>
          <span className="text-muted truncate text-[10px] sm:text-xs">
            {url}
          </span>
        </div>
      </div>
      <div className="flex gap-1 sm:gap-2 flex-shrink-0">
        {canEdit && (
          <Button size="icon" variant="ghost" onClick={onEdit} className="h-8 w-8 sm:h-10 sm:w-10">
            <Edit className="size-3 sm:size-4" />
          </Button>
        )}
        {canDelete && (
          <Button
            size="icon"
            variant="ghost"
            className="text-destructive hover:text-destructive h-8 w-8 sm:h-10 sm:w-10"
            onClick={onDelete}
            disabled={isDeleting}
          >
            <Trash className="size-3 sm:size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

interface PublicSwitchFieldProps {
  control: any;
  name: string;
}

function PublicSwitchField({ control, name }: PublicSwitchFieldProps) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex items-center justify-between">
          <div className="space-y-0.5">
            <FormLabel>Make this link public</FormLabel>
            <FormDescription className="m-0!">
              This link will be visible on your public profile
            </FormDescription>
          </div>
          <FormControl>
            <Switch checked={field.value} onCheckedChange={field.onChange} />
          </FormControl>
        </FormItem>
      )}
    />
  );
}

function RouteComponent() {
  const { data: currentUser, isLoading } = useCurrentUser();
  const createSocialLink = useCreateSocialLink();
  const updateSocialLink = useUpdateSocialLink();
  const createCustomLink = useCreateCustomLink();
  const updateCustomLink = useUpdateCustomLink();
  const deleteSocialLink = useDeleteSocialLink();
  const deleteCustomLink = useDeleteCustomLink();

  // Arena connection hooks
  const { data: arenaStatus, isLoading: isArenaLoading } = useArenaStatus();
  const arenaConnect = useArenaConnect();
  const arenaDisconnect = useArenaDisconnect();
  
  // Handle Arena callback params (e.g., ?arena=connected or ?arena=failed)
  useArenaCallback();

  const [socialModalOpen, setSocialModalOpen] = useState(false);
  const [customModalOpen, setCustomModalOpen] = useState(false);
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
  const [isEditingMode, setIsEditingMode] = useState(false);

  const [searchPlatform, setSearchPlatform] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('');

  const socialForm = useForm<SocialLinkFormData>({
    resolver: zodResolver(socialLinkSchema),
    defaultValues: {
      platform: '',
      url: '',
      isPublic: true,
    },
  });

  const customForm = useForm<CustomLinkFormData>({
    resolver: zodResolver(customLinkSchema),
    defaultValues: {
      name: '',
      url: '',
      color: '#6366f1',
      isPublic: true,
    },
  });

  const socialLinks = currentUser?.social || [];
  const customLinks = currentUser?.custom || [];

  // Create Arena social link if connected
  const arenaLink = arenaStatus?.connected && arenaStatus.arenaHandle
    ? {
        id: 'arena-connected',
        platform: 'arena',
        url: `arena.social/${arenaStatus.arenaHandle}`,
        visible: true,
      }
    : null;

  // Combine social links with Arena if connected
  const allSocialLinks = arenaLink 
    ? [arenaLink, ...socialLinks]
    : socialLinks;

  // Get list of already added platforms (excluding the one being edited)
  const addedPlatforms = socialLinks
    .filter(link => !editingLinkId || link.id !== editingLinkId)
    .map(link => link.platform);

  const filteredPlatforms = SOCIAL_PLATFORMS.filter(platform =>
    platform.name.toLowerCase().includes(searchPlatform.toLowerCase())
  );

  useEffect(() => {
    if (selectedPlatform) {
      socialForm.setValue('platform', selectedPlatform);
    }
  }, [selectedPlatform, socialForm]);

  const onSubmitSocialLink = async (data: SocialLinkFormData) => {
    try {
      const cleanUrl = data.url.replace(/^https?:\/\//, '');

      if (editingLinkId) {
        // Update existing link
        await updateSocialLink.mutateAsync({
          id: editingLinkId,
          platform: data.platform,
          url: cleanUrl,
          isPublic: data.isPublic,
        });
      } else {
        // Create new link
        await createSocialLink.mutateAsync({
          platform: data.platform,
          url: cleanUrl,
          isPublic: data.isPublic,
        });
      }
      setSocialModalOpen(false);
      resetSocialForm();
    } catch (error) {
      console.error('Failed to save social link:', error);
    }
  };

  const onSubmitCustomLink = async (data: CustomLinkFormData) => {
    try {
      // Remove http:// or https:// prefix from URL
      const cleanUrl = data.url.replace(/^https?:\/\//, '');

      if (editingLinkId) {
        // Update existing link
        await updateCustomLink.mutateAsync({
          id: editingLinkId,
          name: data.name,
          url: cleanUrl,
          color: data.color,
          isPublic: data.isPublic,
        });
      } else {
        // Create new link
        await createCustomLink.mutateAsync({
          name: data.name,
          url: cleanUrl,
          color: data.color,
          isPublic: data.isPublic,
        });
      }
      setCustomModalOpen(false);
      resetCustomForm();
    } catch (error) {
      console.error('Failed to save custom link:', error);
    }
  };

  const resetSocialForm = () => {
    setEditingLinkId(null);
    setIsEditingMode(false);
    setSelectedPlatform('');
    setSearchPlatform('');
    socialForm.reset({
      platform: '',
      url: '',
      isPublic: true,
    });
  };

  const resetCustomForm = () => {
    setEditingLinkId(null);
    setIsEditingMode(false);
    customForm.reset({
      name: '',
      url: '',
      color: '#6366f1',
      isPublic: true,
    });
  };

  const handleDeleteSocialLink = async (id: string) => {
    try {
      await deleteSocialLink.mutateAsync(id);
    } catch (error) {
      console.error('Failed to delete social link:', error);
    }
  };

  const handleDeleteCustomLink = async (id: string) => {
    try {
      await deleteCustomLink.mutateAsync(id);
    } catch (error) {
      console.error('Failed to delete custom link:', error);
    }
  };

  const openSocialModal = () => setSocialModalOpen(true);
  const openCustomModal = () => setCustomModalOpen(true);

  const closeSocialModal = () => {
    setSocialModalOpen(false);
    resetSocialForm();
  };

  const closeCustomModal = () => {
    setCustomModalOpen(false);
    resetCustomForm();
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const addNewButton = (onClick: () => void, disabled?: boolean) => (
    <Button onClick={onClick} disabled={disabled}>
      Add New
    </Button>
  );

  // Get Arena status display info
  const getArenaStatusInfo = () => {
    if (isArenaLoading) {
      return {
        label: 'Loading...',
        variant: 'secondary' as const,
        showConnect: false,
        showReconnect: false,
      };
    }

    if (!arenaStatus) {
      return {
        label: 'Not Connected',
        variant: 'destructive' as const,
        showConnect: true,
        showReconnect: false,
      };
    }

    switch (arenaStatus.status) {
      case 'connected':
        return {
          label: `Connected as @${arenaStatus.arenaHandle || 'Unknown'}`,
          variant: 'default' as const,
          showConnect: false,
          showReconnect: true,
        };
      case 'invalid':
        return {
          label: 'Connection Expired',
          variant: 'destructive' as const,
          showConnect: false,
          showReconnect: true,
        };
      case 'revoked':
        return {
          label: 'Connection Revoked',
          variant: 'destructive' as const,
          showConnect: true,
          showReconnect: false,
        };
      case 'none':
      default:
        return {
          label: 'Not Connected',
          variant: 'destructive' as const,
          showConnect: true,
          showReconnect: false,
        };
    }
  };

  const arenaStatusInfo = getArenaStatusInfo();

  const handleArenaConnect = () => {
    arenaConnect.mutate();
  };

  const handleArenaDisconnect = () => {
    arenaDisconnect.mutate();
  };

  return (
    <div className="flex flex-col gap-10">
      {/* Arena Connect Section - Disabled until Arena team provides partner API callback URL */}
      {/* <div className="grid gap-4">
        <SettingsHeading
          title="Connect Arena"
          description="Link your Arena.social account to unlock additional features"
        />

        <div className="glass rounded-md p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="bg-primary flex aspect-square items-center justify-center rounded-md p-2.5 sm:p-3 h-12 w-12 sm:h-14 sm:w-14 overflow-hidden">
                <Icons.arena className="size-5 sm:size-6 invert" />
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-pixel text-base sm:text-lg md:text-xl">
                    Arena.social
                  </h4>
                  <Badge variant={arenaStatusInfo.variant} className="text-[10px] sm:text-xs">
                    {arenaStatusInfo.label}
                  </Badge>
                </div>
                {arenaStatus?.lastConnectedAt && arenaStatus.status === 'connected' && (
                  <span className="text-muted text-[10px] sm:text-xs">
                    Connected on {new Date(arenaStatus.lastConnectedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              {arenaStatusInfo.showConnect && (
                <Button
                  onClick={handleArenaConnect}
                  disabled={arenaConnect.isPending}
                  className="flex-1 sm:flex-none"
                >
                  {arenaConnect.isPending ? 'Connecting...' : 'Connect Arena'}
                </Button>
              )}
              {arenaStatusInfo.showReconnect && (
                <>
                  <Button
                    onClick={handleArenaConnect}
                    disabled={arenaConnect.isPending}
                    variant="outline"
                    className="flex-1 sm:flex-none"
                  >
                    {arenaConnect.isPending ? 'Reconnecting...' : 'Reconnect'}
                  </Button>
                  <Button
                    onClick={handleArenaDisconnect}
                    disabled={arenaDisconnect.isPending}
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                  >
                    {arenaDisconnect.isPending ? 'Disconnecting...' : 'Disconnect'}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div> */}

      <div className="grid gap-4">
        <SettingsHeading
          title="Social Links"
          description="Connect your social platforms"
          action={addNewButton(openSocialModal)}
        />

        {allSocialLinks.length === 0 ? (
          <SocialLinksEmptyState action={addNewButton(openSocialModal)} />
        ) : (
          <div className="glass grid grid-cols-1 gap-4 rounded-md p-6 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3">
            {allSocialLinks.map(link => {
              const platform = ALL_PLATFORMS.find(
                p => p.id === link.platform
              );
              const PlatformIcon = platform?.icon || Icons.twitter;
              const isTwitter =
                link.platform === 'x' || link.platform === 'twitter';
              const isArena = link.platform === 'arena';

              return (
                <LinkCard
                  key={link.id}
                  title={platform?.name || link.platform}
                  url={link.url}
                  visibility={link.visible}
                  icon={
                    <div className="bg-primary flex aspect-square items-center justify-center rounded-md p-2 sm:p-2.5 md:p-3 h-10 w-10 sm:h-11 sm:w-11 md:h-12 md:w-12 overflow-hidden">
                      <PlatformIcon className={`size-3 sm:size-3.5 md:size-4 ${isArena ? 'invert' : ''}`} />
                    </div>
                  }
                  onEdit={() => {
                    setEditingLinkId(link.id || null);
                    setIsEditingMode(true);
                    setSelectedPlatform(link.platform);
                    socialForm.reset({
                      platform: link.platform,
                      url: link.url.replace(/^https?:\/\//, ''),
                      isPublic: link.visible,
                    });
                    setSocialModalOpen(true);
                  }}
                  onDelete={() => link.id && handleDeleteSocialLink(link.id)}
                  isDeleting={deleteSocialLink.isPending}
                  canDelete={!isTwitter && !isArena}
                  canEdit={!isTwitter && !isArena}
                />
              );
            })}
          </div>
        )}
      </div>

      <div className="grid gap-4">
        <SettingsHeading
          title="Custom Buttons"
          description="Add custom links and buttons (max 3)"
          action={addNewButton(openCustomModal, customLinks.length >= 3)}
        />

        {customLinks.length === 0 ? (
          <CustomButtonsEmptyState action={addNewButton(openCustomModal)} />
        ) : (
          <div className="glass grid grid-cols-1 gap-4 rounded-md p-6 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3">
            {customLinks.map((link, index) => {
              return (
                <LinkCard
                  key={link.id || index}
                  title={link.name}
                  url={link.url}
                  visibility={link.visible}
                  icon={
                    <div
                      className="flex aspect-square items-center justify-center rounded-md p-2 sm:p-2.5 md:p-3 h-10 w-10 sm:h-11 sm:w-11 md:h-12 md:w-12"
                      style={{ backgroundColor: link.color }}
                    >
                      <span className="font-pixel text-white text-sm sm:text-base">
                        {link.name.charAt(0)}
                      </span>
                    </div>
                  }
                  onEdit={() => {
                    setEditingLinkId(link.id || null);
                    setIsEditingMode(true);
                    customForm.reset({
                      name: link.name,
                      url: link.url.replace(/^https?:\/\//, ''),
                      color: link.color,
                      isPublic: link.visible,
                    });
                    setCustomModalOpen(true);
                  }}
                  onDelete={() => handleDeleteCustomLink(link.id || link.name)}
                  isDeleting={deleteCustomLink.isPending}
                />
              );
            })}
          </div>
        )}
      </div>

      <Dialog
        open={socialModalOpen}
        onOpenChange={open =>
          open ? setSocialModalOpen(true) : closeSocialModal()
        }
      >
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Select Social Platform</DialogTitle>
          </DialogHeader>

          {!selectedPlatform ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <TooltipProvider>
                {filteredPlatforms.map(platform => {
                  const PlatformIcon = platform.icon;
                  const isAdded = addedPlatforms.includes(platform.id);

                  const button = (
                    <button
                      key={platform.id}
                      onClick={() =>
                        !isAdded && setSelectedPlatform(platform.id)
                      }
                      disabled={isAdded}
                      className={`glass flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors ${
                        isAdded
                          ? 'cursor-not-allowed opacity-50'
                          : 'hover:bg-primary/10 cursor-pointer'
                      }`}
                    >
                      <PlatformIcon className="text-foreground size-8" />
                      <span className="text-sm font-medium">
                        {platform.name}
                      </span>
                    </button>
                  );

                  if (isAdded) {
                    return (
                      <Tooltip key={platform.id}>
                        <TooltipTrigger asChild>{button}</TooltipTrigger>
                        <TooltipContent>
                          <p>Already added</p>
                        </TooltipContent>
                      </Tooltip>
                    );
                  }

                  return button;
                })}
              </TooltipProvider>
            </div>
          ) : (
            <Form {...socialForm}>
              <form
                onSubmit={socialForm.handleSubmit(onSubmitSocialLink)}
                className="space-y-4"
              >
                <div className="text-muted flex items-center gap-2 text-sm">
                  <Button
                    type="button"
                    onClick={() => setSelectedPlatform('')}
                    className="hover:text-foreground"
                  >
                    ← Back
                  </Button>
                  <span>
                    /{' '}
                    {
                      ALL_PLATFORMS.find(p => p.id === selectedPlatform)
                        ?.name
                    }
                  </span>
                </div>

                <FormField
                  control={socialForm.control}
                  name="url"
                  render={({ field }) => {
                    // Dynamic placeholder based on platform
                    const getPlaceholder = (platform: string) => {
                      switch (platform) {
                        case 'github':
                          return 'github.com/username';
                        case 'linkedin':
                          return 'linkedin.com/in/username';
                        case 'instagram':
                          return 'instagram.com/username';
                        case 'facebook':
                          return 'facebook.com/username';
                        case 'telegram':
                          return 't.me/username';
                        case 'tiktok':
                          return 'tiktok.com/@username';
                        case 'whatsapp':
                          return 'wa.me/1234567890';
                        case 'x':
                        case 'twitter':
                          return 'x.com/username';
                        default:
                          return 'example.com/profile';
                      }
                    };

                    return (
                      <FormItem>
                        <FormLabel>URL</FormLabel>
                        <FormControl>
                          <InputGroup>
                            <InputGroupAddon>
                              <InputGroupText>https://</InputGroupText>
                            </InputGroupAddon>
                            <InputGroupInput
                              placeholder={getPlaceholder(selectedPlatform)}
                              {...field}
                              disabled={
                                isEditingMode &&
                                (selectedPlatform === 'x' ||
                                  selectedPlatform === 'twitter')
                              }
                              onChange={e => {
                                const value = e.target.value.replace(
                                  /^https?:\/\//,
                                  ''
                                );
                                field.onChange(value);
                              }}
                            />
                          </InputGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />

                {isEditingMode &&
                  (selectedPlatform === 'x' ||
                    selectedPlatform === 'twitter') && (
                    <div className="rounded-md bg-slate-900 p-3 text-sm">
                      <p className="text-muted text-pretty">
                        Twitter/X URL cannot be changed as it's linked to your
                        account. You can only change visibility.
                      </p>
                    </div>
                  )}

                <PublicSwitchField
                  control={socialForm.control}
                  name="isPublic"
                />

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="link"
                    onClick={closeSocialModal}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      createSocialLink.isPending || updateSocialLink.isPending
                    }
                  >
                    {createSocialLink.isPending || updateSocialLink.isPending
                      ? 'Saving...'
                      : isEditingMode
                        ? 'Save'
                        : 'Add Social Link'}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={customModalOpen}
        onOpenChange={open =>
          open ? setCustomModalOpen(true) : closeCustomModal()
        }
      >
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>
              {isEditingMode ? 'Edit Custom Button' : 'Add Custom Button'}
            </DialogTitle>
          </DialogHeader>

          <Form {...customForm}>
            <form
              onSubmit={customForm.handleSubmit(onSubmitCustomLink)}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-6">
                <FormField
                  control={customForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Button Text</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Portfolio" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={customForm.control}
                  name="url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL</FormLabel>
                      <FormControl>
                        <InputGroup>
                          <InputGroupAddon>
                            <InputGroupText>https://</InputGroupText>
                          </InputGroupAddon>
                          <InputGroupInput
                            placeholder="example.com"
                            {...field}
                            onChange={e => {
                              const value = e.target.value.replace(
                                /^https?:\/\//,
                                ''
                              );
                              field.onChange(value);
                            }}
                          />
                        </InputGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={customForm.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Button Color</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-4">
                        <div
                          className="glass relative aspect-square size-14 cursor-pointer rounded-md"
                          style={{ backgroundColor: field.value }}
                          onClick={() => {
                            const input = document.getElementById(
                              'color-picker-input'
                            ) as HTMLInputElement;
                            input?.click();
                          }}
                        >
                          <Input
                            id="color-picker-input"
                            type="color"
                            className="absolute inset-0 size-full cursor-pointer opacity-0"
                            {...field}
                          />
                        </div>
                        <Input placeholder="#6366f1" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <PublicSwitchField control={customForm.control} name="isPublic" />

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="link" onClick={closeCustomModal}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    createCustomLink.isPending || updateCustomLink.isPending
                  }
                >
                  {createCustomLink.isPending || updateCustomLink.isPending
                    ? 'Saving...'
                    : isEditingMode
                      ? 'Save'
                      : 'Add Custom Button'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
