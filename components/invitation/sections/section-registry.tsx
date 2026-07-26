import type { ComponentType } from 'react';
import type { SectionKind } from '@/lib/types';
import {
  type SectionBlockProps,
  CoverBlock,
  GreetingBlock,
  CalendarBlock,
  GalleryBlock,
  LocationBlock,
  AccountBlock,
  RsvpBlock,
  GuestbookBlock,
  ShareBlock,
} from '@/components/invitation/sections/section-blocks';

export const sectionRegistry: Record<SectionKind, ComponentType<SectionBlockProps>> = {
  cover: CoverBlock,
  greeting: GreetingBlock,
  calendar: CalendarBlock,
  gallery: GalleryBlock,
  location: LocationBlock,
  account: AccountBlock,
  rsvp: RsvpBlock,
  guestbook: GuestbookBlock,
  share: ShareBlock,
};
