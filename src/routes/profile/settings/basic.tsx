import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { createFileRoute } from '@tanstack/react-router';

// import { ProfileAvatar } from '@/components/profile-avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    useCurrentUser,
    // useFileUpload,
    // useUpdateAvatar,
    useUpdateUserProfile,
} from '@/hooks';
import { type ProfileFormData, profileSchema } from '@/lib/validations/profile';

export const Route = createFileRoute('/profile/settings/basic')({
  component: RouteComponent,
});

// const getPhotoUrl = (photo?: { url: string } | string): string | null => {
//   if (!photo) return null;
//   if (typeof photo === 'string') return photo;
//   if (typeof photo === 'object' && photo.url) return photo.url;
//   return null;
// };

function RouteComponent() {
  const { data: currentUser } = useCurrentUser();
  // const [selectedImage, setSelectedImage] = useState<string | null>(null);
  // const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const updateProfileMutation = useUpdateUserProfile();
  // const updateAvatarMutation = useUpdateAvatar();
  // const fileUploadMutation = useFileUpload();

  const {
    reset,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      title: '',
      bio: '',
    },
  });

  useEffect(() => {
    if (currentUser) {
      reset({
        title: currentUser.title || '',
        bio: currentUser.bio || '',
      });
    }
  }, [currentUser, reset]);

  // const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const file = e.target.files?.[0];
  //   if (!file) return;

  //   if (!file.type.startsWith('image/')) {
  //     toast.error('Please select a valid image file');
  //     return;
  //   }

  //   if (file.size > 5 * 1024 * 1024) {
  //     toast.error('Image size must be less than 5MB');
  //     return;
  //   }

  //   setIsUploadingAvatar(true);

  //   const reader = new FileReader();
  //   reader.onload = e => {
  //     setSelectedImage(e.target?.result as string);
  //   };
  //   reader.readAsDataURL(file);

  //   try {
  //     const fileUploadResponse = await fileUploadMutation.mutateAsync(file);
  //     const fileId = fileUploadResponse.data.id;

  //     await updateAvatarMutation.mutateAsync({
  //       avatarId: fileId,
  //     });

  //     setSelectedImage(null);
  //   } catch (error: any) {
  //     console.error('Avatar upload failed:', error);

  //     let errorMessage = 'Failed to upload file. Please try again.';
  //     if (error?.message?.includes('too large')) {
  //       errorMessage =
  //         'Image file is too large. Please choose a smaller image.';
  //     } else if (error?.message?.includes('format')) {
  //       errorMessage = 'Unsupported image format. Please use JPG, PNG, or GIF.';
  //     } else if (error?.message?.includes('network')) {
  //       errorMessage =
  //         'Network error. Please check your connection and try again.';
  //     }

  //     toast.error(errorMessage);
  //     setSelectedImage(null);
  //   } finally {
  //     setIsUploadingAvatar(false);
  //   }
  // };

  const onSubmit = async (data: ProfileFormData) => {
    try {
      await updateProfileMutation.mutateAsync({
        title: data.title || '',
        bio: data.bio || '',
      });
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error('Failed to update profile. Please try again.');
    }
  };

  return (
    <div className="flex flex-col gap-10">
      {/* Profile Picture Upload - Disabled: Using Twitter photo */}
      {/* <div className="flex flex-col gap-6">
        <h4>Profile Picture</h4>
        <div className="glass w-full rounded-md p-6">
          <div className="flex items-center gap-4">
            <div className="flex justify-center">
              <div className="relative">
                {selectedImage ? (
                  <img
                    src={selectedImage}
                    alt="Profile picture preview"
                    className="border-glass-border h-24 w-24 rounded-full border-2 object-cover"
                  />
                ) : (
                  <ProfileAvatar
                    src={getPhotoUrl(currentUser?.photo)}
                    name={currentUser?.name}
                    size="xl"
                    className="border-glass-border border-2"
                  />
                )}
                {isUploadingAvatar && (
                  <div className="bg-opacity-50 absolute inset-0 flex items-center justify-center rounded-full bg-black">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  </div>
                )}
              </div>
            </div>

            <Input
              id="picture"
              type="file"
              accept="image/*"
              wrapperClassName="w-auto"
              onChange={handleFileChange}
              disabled={isUploadingAvatar}
            />
          </div>
        </div>
      </div> */}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        <h4>Basic Information</h4>

        <div className="glass grid grid-cols-1 gap-6 rounded-md p-6 md:grid-cols-2">
          <div className="flex w-full flex-col gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              type="text"
              placeholder="e.g., Web3 Developer, NFT Collector"
              {...register('title')}
              className={errors.title ? 'border-destructive' : ''}
            />
            {errors.title && (
              <p className="text-destructive text-sm">
                {errors.title.message}
              </p>
            )}
            <p className="text-muted text-xs">
              Your professional title or role. Display name is automatically synced from Twitter.
            </p>
          </div>

          <div className="flex h-full w-full flex-col gap-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              placeholder="Tell us about yourself..."
              className={`h-full ${errors.bio ? 'border-destructive' : ''}`}
              {...register('bio')}
            />
            {errors.bio && (
              <p className="text-destructive text-sm">{errors.bio.message}</p>
            )}
          </div>
        </div>

        <div className="flex gap-4">
          <Button
            type="submit"
            disabled={isSubmitting || updateProfileMutation.isPending}
          >
            {isSubmitting || updateProfileMutation.isPending
              ? 'Saving...'
              : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}
