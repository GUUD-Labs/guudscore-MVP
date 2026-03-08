import { zodResolver } from '@hookform/resolvers/zod';

import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { Link, createFileRoute } from '@tanstack/react-router';

import Icons from '@/components/icons';
import TiltedCard from '@/components/tilted-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
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
} from '@/components/ui/input-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuthContext } from '@/contexts/auth-context';
import { useCreateCustomCard, useMyNFTCollections } from '@/hooks';
import {
  type CardCustomizationFormData,
  cardCustomizationSchema,
} from '@/lib/validations/card';
import { CardType } from '@/types';

export const Route = createFileRoute('/shop/customization')({
  component: RouteComponent,
});

function RouteComponent() {
  const { isAuthenticated } = useAuthContext();
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const createCustomCard = useCreateCustomCard();
  const { data: collectionsData, isLoading: collectionsLoading } =
    useMyNFTCollections();

  const collections = collectionsData?.data || [];

  if (!isAuthenticated) {
    return (
      <div className="mx-auto flex max-w-[480px] flex-col items-center justify-center py-12">
        <div className="glass flex min-h-[400px] flex-col items-center justify-center gap-6 rounded-md p-8">
          <div className="flex flex-col items-center gap-4 text-center">
            <Icons.lock className="text-muted size-12" />
            <div className="space-y-2">
              <h3 className="font-pixel text-lg">Authentication Required</h3>
              <p className="text-muted max-w-md text-sm">
                Please sign in to customize your cards.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button asChild>
              <Link to="/login">Sign In</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/register">Create Account</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const form = useForm<CardCustomizationFormData>({
    resolver: zodResolver(cardCustomizationSchema),
    defaultValues: {
      isPremium: true,
      nftId: '',
      collectionName: '',
      collectionNumber: '',
      name: '',
      title: '',
      affiliation: '',
    },
  });

  const isPremium = form.watch('isPremium');

  const onSubmit = async (data: CardCustomizationFormData) => {
    try {
      // Validate that either NFT or uploaded file is provided
      if (!data.nftId && !uploadedFile) {
        form.setError('nftId', {
          message: 'Please select an NFT or upload a photo',
        });
        return;
      }

      // Create custom card via API
      const response = await createCustomCard.mutateAsync({
        cardPhotoId: uploadedFile ? 'temp-photo-id' : undefined,
        nftId: data.nftId || undefined,
        name: data.name,
        collectionName: data.collectionName,
        collectionNumber: data.collectionNumber,
        title: data.title,
        cardType: data.isPremium ? CardType.PREMIUM : CardType.REGULAR,
        affiliation: data.affiliation,
      });

      // Store card data including the created card ID in sessionStorage
      sessionStorage.setItem(
        'cardData',
        JSON.stringify({
          cardId: response.id,
          isPremium: data.isPremium,
          price: data.isPremium ? 99.99 : 49.99,
          collectionName: data.collectionName,
          collectionNumber: data.collectionNumber,
          name: data.name,
          title: data.title,
          affiliation: data.affiliation,
          nftId: data.nftId,
          cardPhotoId: uploadedFile ? 'temp-photo-id' : undefined,
        })
      );

      // Navigate to payout page
      window.location.href = '/shop/payout';
    } catch (error) {
      console.error('Failed to create card:', error);
      form.setError('root', {
        message: 'Failed to create card. Please try again.',
      });
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="grid grid-cols-1 gap-8 lg:grid-cols-2"
        >
          <div className="flex items-center justify-center">
            <TiltedCard
              imageSrc={isPremium ? '/card2.png' : '/card1.png'}
              altText="Card Preview"
              containerHeight="500px"
              containerWidth="100%"
              imageHeight="500px"
              imageWidth="350px"
              scaleOnHover={1.05}
              rotateAmplitude={12}
              showMobileWarning={false}
              showTooltip={false}
            />
          </div>

          <div className="flex flex-col gap-6">
            <div>
              <h4 className="font-pixel text-2xl">CUSTOMIZE YOUR CARD</h4>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Badge variant={isPremium ? 'legendary' : 'default'}>
                  {isPremium ? 'PREMIUM' : 'REGULAR'}
                </Badge>
                <Button
                  type="button"
                  variant="link"
                  onClick={() => form.setValue('isPremium', !isPremium)}
                  className="font-pixel p-0 text-xs hover:underline"
                >
                  {isPremium ? 'Switch to Regular' : 'Switch to Premium'}
                </Button>
              </div>
              <Link
                to="/shop"
                className="font-pixel text-accent text-xs hover:underline"
              >
                Unlock Limited Edition
              </Link>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="font-pixel text-4xl">
                {isPremium ? '$99.99' : '$49.99'}
              </span>
            </div>

            <div className="flex flex-col gap-3">
              <FormLabel>Profile Picture (PFP)</FormLabel>
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                <FormField
                  control={form.control}
                  name="nftId"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={collectionsLoading}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue
                              placeholder={
                                collectionsLoading
                                  ? 'Loading collections...'
                                  : 'Select your NFT'
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {collections.map(collection => (
                              <SelectItem
                                key={collection.id}
                                value={collection.id}
                              >
                                {collection.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex h-11 items-center justify-center px-2 select-none">
                  <div className="flex items-center gap-2">
                    <div className="border-muted h-px w-6 border-t"></div>
                    <span className="text-muted text-xs font-medium whitespace-nowrap">
                      OR
                    </span>
                    <div className="border-muted h-px w-6 border-t"></div>
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="uploadedFile"
                  render={({ field: { value, onChange, ...field } }) => (
                    <FormItem className="space-y-2">
                      <FormControl>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={e => {
                            const files = e.target.files;
                            onChange(files);
                            if (files && files.length > 0) {
                              setUploadedFile(files[0]);
                            }
                          }}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex items-end gap-6">
              <FormField
                control={form.control}
                name="collectionName"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Collection Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter collection name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="collectionNumber"
                render={({ field }) => (
                  <FormItem className="w-32">
                    <FormControl>
                      <InputGroup>
                        <InputGroupAddon align="inline-start">
                          #
                        </InputGroupAddon>
                        <InputGroupInput placeholder="0000" {...field} />
                      </InputGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="affiliation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Affiliation</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your affiliation" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" size="lg">
              Proceed to Checkout
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
