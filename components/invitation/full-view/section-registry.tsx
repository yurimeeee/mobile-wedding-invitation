import type { ComponentType } from 'react';
import type { SectionKind } from '@/lib/types';
import {
  type FullViewSectionProps,
  CoverBlock,
  GreetingBlock,
  StoryBlock,
  CalendarBlock,
  GalleryBlock,
  LocationBlock,
  AccountBlock,
  RsvpBlock,
  GuestbookBlock,
  ShareBlock,
} from '@/components/invitation/full-view/section-blocks';

export const fullViewSectionRegistry: Record<SectionKind, ComponentType<FullViewSectionProps>> = {
  cover: CoverBlock,
  greeting: GreetingBlock,
  story: StoryBlock,
  calendar: CalendarBlock,
  gallery: GalleryBlock,
  location: LocationBlock,
  account: AccountBlock,
  rsvp: RsvpBlock,
  guestbook: GuestbookBlock,
  share: ShareBlock,
};
