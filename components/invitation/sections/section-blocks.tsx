'use client';

import type { CSSProperties } from 'react';
import { ChevronDown, Heart, MapPin, Phone } from 'lucide-react';
import Image from 'next/image';
import { type EditorState, type GalleryImage, formatParentName } from '@/lib/types';
import type { PreviewStyleConfig } from '@/lib/preview-style';
import { Button } from '@/components/ui/button';
import { KakaoMapDisplay } from '@/components/editor/kakao-map';
import { WeddingCalendar } from '@/components/editor/wedding-calendar';
import { ShareSection } from '@/components/editor/share-section';
import { GuestMessageSection } from '@/components/invitation/guest-message-section';
import { RSVPSection } from '@/components/invitation/rsvp-section';

export interface SectionBlockProps {
  state: EditorState;
  style: PreviewStyleConfig;
  invitationId: string;
}

function getDerived(state: EditorState, style: PreviewStyleConfig) {
  const info = state.weddingInfo;
  const mainImage = state.gallery.length > 0 ? state.gallery[0] : null;
  const textStyle: CSSProperties = { color: style.text };
  const mutedStyle: CSSProperties = { color: style.text, opacity: 0.55 };
  const dividerStyle: CSSProperties = { background: style.divider };
  const sectionStyle: CSSProperties = { background: style.sectionBg };
  const groomParentsLine = `${formatParentName(info.groomFatherName, info.groomFatherDeceased, info.showDeceasedMark)} · ${formatParentName(info.groomMotherName, info.groomMotherDeceased, info.showDeceasedMark)}의 아들 ${info.groomLastNameKr}${info.groomFirstNameKr}`;
  const brideParentsLine = `${formatParentName(info.brideFatherName, info.brideFatherDeceased, info.showDeceasedMark)} · ${formatParentName(info.brideMotherName, info.brideMotherDeceased, info.showDeceasedMark)}의 딸 ${info.brideLastNameKr}${info.brideFirstNameKr}`;
  return { info, mainImage, textStyle, mutedStyle, dividerStyle, sectionStyle, groomParentsLine, brideParentsLine };
}

// ─── Per-template hero sections ───────────────────────────────────────────────

function HeroClassicElegant({ info, mainImage, textStyle }: { info: EditorState['weddingInfo']; mainImage: GalleryImage | null; textStyle: CSSProperties }) {
  return (
    <div className="flex flex-col items-center pt-10 pb-4 px-6">
      <Image src="/assets/templates/type_1/save_the_date.svg" alt="save the date" width={106} height={40} className="mb-4" />
      <Image src="/assets/templates/type_1/wedding_day.svg" alt="wedding day" width={200} height={40} className="mb-8" />

      <div className="w-[200px] h-[288px] rounded-full overflow-hidden mb-8" style={{ background: 'rgba(0,0,0,0.08)' }}>
        {mainImage
          ? <img src={mainImage.url} alt="메인" className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center"><Heart className="w-10 h-10 opacity-10" /></div>
        }
      </div>

      <CoupleNames info={info} textStyle={textStyle} />
    </div>
  );
}

function HeroModernMinimal({ info, mainImage, textStyle }: { info: EditorState['weddingInfo']; mainImage: GalleryImage | null; textStyle: CSSProperties }) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-full">
        <Image src="/assets/templates/type_2/wedding_day.svg" alt="wedding day" width={200} height={40} className="absolute top-4 left-1/2 -translate-x-1/2 z-10" />
        <div className="w-full aspect-[3/4] overflow-hidden" style={{ background: 'rgba(0,0,0,0.06)' }}>
          {mainImage
            ? <img src={mainImage.url} alt="메인" className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center"><Heart className="w-10 h-10 opacity-10" /></div>
          }
        </div>
      </div>
      <div className="pt-8 pb-4 px-6 w-full">
        <CoupleNames info={info} textStyle={textStyle} />
      </div>
    </div>
  );
}

function HeroKoreanTraditional({ info, mainImage, textStyle }: { info: EditorState['weddingInfo']; mainImage: GalleryImage | null; textStyle: CSSProperties }) {
  const dateStr = info.weddingDate;
  const [, mm, dd] = (dateStr || '').split('-');
  const dateOverlay = mm && dd ? `${mm}.${dd}` : '';

  return (
    <div className="flex flex-col items-center pt-10 pb-4 px-6">
      <Image src="/assets/templates/type_3/the_wedding_of.svg" alt="the wedding of" width={138} height={40} className="mb-8" />

      <div
        className="relative overflow-hidden mb-10"
        style={{
          width: '100%',
          maxWidth: 260,
          height: 340,
          borderTopLeftRadius: 140,
          borderTopRightRadius: 140,
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
          background: 'rgba(0,0,0,0.08)',
        }}
      >
        {mainImage
          ? <img src={mainImage.url} alt="메인" className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center"><Heart className="w-10 h-10 opacity-10" /></div>
        }
        {dateOverlay && (
          <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-white font-bold tracking-widest opacity-80"
            style={{ fontSize: 48, letterSpacing: '0.1em' }}>
            {dateOverlay}
          </span>
        )}
      </div>

      <CoupleNames info={info} textStyle={textStyle} />
    </div>
  );
}

function HeroFloralRomantic({ info, mainImage, textStyle }: { info: EditorState['weddingInfo']; mainImage: GalleryImage | null; textStyle: CSSProperties }) {
  return (
    <div className="flex flex-col items-center pt-10 pb-4 px-6">
      <Image src="/assets/templates/type_4/the_wedding_of.svg" alt="the wedding of" width={240} height={40} className="mb-4 relative z-10" />

      <div className="relative w-full flex justify-center mb-10">
        <Image src="/assets/templates/type_4/flower_2.png" alt="" width={200} height={200}
          className="absolute -left-8 -top-12 pointer-events-none select-none" style={{ zIndex: 1 }} />
        <Image src="/assets/templates/type_4/flower_1.png" alt="" width={200} height={200}
          className="absolute -right-8 bottom-0 pointer-events-none select-none" style={{ zIndex: 1 }} />
        <Image src="/assets/templates/type_4/flower_3.png" alt="" width={120} height={120}
          className="absolute -left-6 bottom-8 pointer-events-none select-none" style={{ zIndex: 1 }} />

        <div
          className="relative overflow-hidden"
          style={{
            width: 180,
            boxShadow: '0 6px 6px rgba(88,88,88,0.08), 0 10px 10px rgba(99,99,99,0)',
            border: '8px solid white',
            zIndex: 2,
          }}
        >
          {mainImage
            ? <img src={mainImage.url} alt="메인" className="w-full h-auto" />
            : <div className="w-full aspect-[3/4] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.06)' }}>
                <Heart className="w-8 h-8 opacity-10" />
              </div>
          }
        </div>
      </div>

      <CoupleNames info={info} textStyle={textStyle} />
    </div>
  );
}

function HeroDarkLuxury({ info, mainImage, textStyle }: { info: EditorState['weddingInfo']; mainImage: GalleryImage | null; textStyle: CSSProperties }) {
  return (
    <div className="flex flex-col items-center pt-10 pb-4 px-6">
      <p className="text-xs tracking-[0.4em] mb-3" style={{ color: '#d4af37' }}>WEDDING</p>
      <div className="w-10 h-px mb-6" style={{ background: '#d4af37' }} />

      <div
        className="w-[200px] h-[280px] overflow-hidden mb-8"
        style={{ border: '1px solid #d4af37', background: 'rgba(255,255,255,0.04)' }}
      >
        {mainImage
          ? <img src={mainImage.url} alt="메인" className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center"><Heart className="w-10 h-10" style={{ color: '#d4af37', opacity: 0.3 }} /></div>
        }
      </div>

      <CoupleNames info={info} textStyle={textStyle} accentColor="#d4af37" />
    </div>
  );
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function CoupleNames({ info, textStyle, accentColor }: {
  info: EditorState['weddingInfo'];
  textStyle: CSSProperties;
  accentColor?: string;
}) {
  const groomKr = `${info.groomLastNameKr}${info.groomFirstNameKr}`;
  const brideKr = `${info.brideLastNameKr}${info.brideFirstNameKr}`;
  const first = info.brideFirst ? brideKr : groomKr;
  const second = info.brideFirst ? groomKr : brideKr;
  const firstEn = info.brideFirst ? info.brideFirstName : info.groomFirstName;
  const secondEn = info.brideFirst ? info.groomFirstName : info.brideFirstName;

  return (
    <div className="text-center space-y-1">
      <h1 className="font-serif text-xl" style={textStyle}>
        {first}
        <span className="mx-2 font-light" style={{ color: accentColor || '#c47a85' }}>·</span>
        {second}
      </h1>
      <p className="text-xs tracking-widest" style={{ color: textStyle.color, opacity: 0.5 }}>
        {firstEn} & {secondEn}
      </p>
    </div>
  );
}

// ─── Section blocks (one per SectionKind) ─────────────────────────────────────

export function CoverBlock({ state, style }: SectionBlockProps) {
  const { info, mainImage, textStyle } = getDerived(state, style);
  const { template } = state;
  return (
    <>
      {template === 'classic-elegant'    && <HeroClassicElegant    info={info} mainImage={mainImage} textStyle={textStyle} />}
      {template === 'modern-minimal'     && <HeroModernMinimal     info={info} mainImage={mainImage} textStyle={textStyle} />}
      {template === 'korean-traditional' && <HeroKoreanTraditional info={info} mainImage={mainImage} textStyle={textStyle} />}
      {template === 'floral-romantic'    && <HeroFloralRomantic    info={info} mainImage={mainImage} textStyle={textStyle} />}
      {template === 'dark-luxury'        && <HeroDarkLuxury        info={info} mainImage={mainImage} textStyle={textStyle} />}
    </>
  );
}

export function GreetingBlock({ state, style }: SectionBlockProps) {
  const { info, textStyle, dividerStyle } = getDerived(state, style);
  return (
    <>
      <div className="h-px mx-8 mb-8" style={dividerStyle} />
      {info.mainPhrase && (
        <div className="text-center px-8 mb-10">
          <p className="font-serif whitespace-pre-line leading-loose text-sm" style={textStyle}>{info.mainPhrase}</p>
        </div>
      )}
    </>
  );
}

export function CalendarBlock({ state, style }: SectionBlockProps) {
  const { info, mutedStyle, dividerStyle, sectionStyle, groomParentsLine, brideParentsLine } = getDerived(state, style);
  return (
    <>
      <div className="h-px mx-8 mb-8" style={dividerStyle} />
      <div className="mx-4 mb-8 px-4 py-5 rounded-lg" style={sectionStyle}>
        <WeddingCalendar
          weddingDate={info.weddingDate}
          weddingTime={info.weddingTime}
          settings={state.calendarSettings}
          isDark={style.isDark}
        />
      </div>
      <div className="text-center px-6 mb-8 space-y-1.5">
        {(info.brideFirst ? [brideParentsLine, groomParentsLine] : [groomParentsLine, brideParentsLine]).map((line, i) => (
          <p key={i} className="text-xs" style={mutedStyle}>{line}</p>
        ))}
      </div>
    </>
  );
}

export function GalleryBlock({ state, style }: SectionBlockProps) {
  const { dividerStyle } = getDerived(state, style);
  return (
    <>
      <div className="h-px mx-8 mb-8" style={dividerStyle} />
      {state.gallery.length > 1 && (
        <div className="mx-4 mb-8">
          <div className="grid grid-cols-2 gap-1 rounded-lg overflow-hidden">
            {state.gallery.slice(0, 4).map((img) => (
              <div key={img.id} className="aspect-square overflow-hidden">
                <img src={img.url} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

export function LocationBlock({ state, style }: SectionBlockProps) {
  const { info, textStyle, mutedStyle, sectionStyle } = getDerived(state, style);
  return (
    <div className="mx-4 mb-6 px-4 py-4 rounded-lg" style={sectionStyle}>
      <div className="flex items-start gap-2 mb-3">
        <MapPin className="h-4 w-4 mt-0.5 shrink-0" style={{ color: style.accent }} />
        <div>
          <p className="font-medium text-sm" style={textStyle}>{info.ceremonyHall}</p>
          <p className="text-xs mt-0.5" style={mutedStyle}>{info.venue}</p>
          <p className="text-xs mt-0.5" style={mutedStyle}>{info.address}</p>
        </div>
      </div>
      <KakaoMapDisplay
        address={info.address}
        latitude={info.latitude}
        longitude={info.longitude}
        venueName={info.ceremonyHall}
        isDark={style.isDark}
      />
    </div>
  );
}

export function AccountBlock({ state, style }: SectionBlockProps) {
  const { info, textStyle, mutedStyle, sectionStyle } = getDerived(state, style);
  return (
    <>
      <div className="mx-4 mb-6 px-4 py-3 rounded-lg" style={sectionStyle}>
        <button className="flex items-center justify-between w-full">
          <span className="text-sm font-medium" style={textStyle}>축하의 마음을 전하세요</span>
          <ChevronDown className="h-4 w-4" style={mutedStyle} />
        </button>
      </div>

      <div className="flex gap-2 mx-4 mb-6">
        <Button
          variant="outline" size="sm"
          className="flex-1 text-xs"
          style={style.isDark ? { borderColor: 'rgba(255,255,255,0.2)', color: style.text } : {}}
        >
          <Phone className="h-3 w-3 mr-1" />{info.brideFirst ? '신부측 연락' : '신랑측 연락'}
        </Button>
        <Button
          variant="outline" size="sm"
          className="flex-1 text-xs"
          style={style.isDark ? { borderColor: 'rgba(255,255,255,0.2)', color: style.text } : {}}
        >
          <Phone className="h-3 w-3 mr-1" />{info.brideFirst ? '신랑측 연락' : '신부측 연락'}
        </Button>
      </div>
    </>
  );
}

export function RsvpBlock({ state, style, invitationId }: SectionBlockProps) {
  const { textStyle, mutedStyle } = getDerived(state, style);
  if (!invitationId) return null;
  return (
    <div className="mx-4">
      <RSVPSection
        invitationId={invitationId}
        textStyle={textStyle}
        mutedStyle={mutedStyle}
        sectionBg={style.sectionBg}
        accentColor={style.accent}
      />
    </div>
  );
}

export function GuestbookBlock({ state, style, invitationId }: SectionBlockProps) {
  const { textStyle, mutedStyle } = getDerived(state, style);
  if (!invitationId) return null;
  return (
    <div className="mx-4">
      <GuestMessageSection
        invitationId={invitationId}
        textStyle={textStyle}
        mutedStyle={mutedStyle}
        sectionBg={style.sectionBg}
        accentColor={style.accent}
      />
    </div>
  );
}

export function ShareBlock({ state, style }: SectionBlockProps) {
  const { info } = getDerived(state, style);
  return (
    <div className="mx-4 mb-8">
      <ShareSection shareSettings={state.shareSettings} weddingInfo={info} isDark={style.isDark} />
    </div>
  );
}
