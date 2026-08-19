'use client';

import { useState } from 'react';
import type { CSSProperties } from 'react';
import { CalendarPlus, ChevronDown, Copy, Heart, MapPin, Navigation, Phone } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';
import { type EditorState, type GalleryImage } from '@/lib/types';
import type { PreviewStyleConfig } from '@/lib/preview-style';
import { Button } from '@/components/ui/button';
import { ParentName } from '@/components/invitation/parent-name';
import { cn } from '@/lib/utils';
import { copyText } from '@/lib/clipboard';
import { downloadWeddingIcs } from '@/lib/calendar-export';
import { openNaverMapDirections, openTmapDirections } from '@/lib/navigation-links';
import { KakaoMapDisplay } from '@/components/editor/kakao-map';
import { WeddingCalendar } from '@/components/editor/wedding-calendar';
import { ShareSection } from '@/components/editor/share-section';
import { GuestMessageSection } from '@/components/invitation/guest-message-section';
import { RSVPSection } from '@/components/invitation/rsvp-section';

export interface FullViewSectionProps {
  state: EditorState;
  style: PreviewStyleConfig;
  invitationId: string;
  invitationUrl: string;
  onOpenLightbox: (index: number) => void;
}

function getDerived(state: EditorState, style: PreviewStyleConfig) {
  const info = state.weddingInfo;
  const mainImage = state.gallery.length > 0 ? state.gallery[0] : null;
  const textStyle: CSSProperties = { color: style.text };
  const mutedStyle: CSSProperties = { color: style.text, opacity: 0.55 };
  const dividerStyle: CSSProperties = { background: style.divider };
  const groomParentsLine = (
    <>
      <ParentName name={info.groomFatherName} deceased={info.groomFatherDeceased} showDeceasedMark={info.showDeceasedMark} /> ·{' '}
      <ParentName name={info.groomMotherName} deceased={info.groomMotherDeceased} showDeceasedMark={info.showDeceasedMark} />의 아들 {info.groomLastNameKr}{info.groomFirstNameKr}
    </>
  );
  const brideParentsLine = (
    <>
      <ParentName name={info.brideFatherName} deceased={info.brideFatherDeceased} showDeceasedMark={info.showDeceasedMark} /> ·{' '}
      <ParentName name={info.brideMotherName} deceased={info.brideMotherDeceased} showDeceasedMark={info.showDeceasedMark} />의 딸 {info.brideLastNameKr}{info.brideFirstNameKr}
    </>
  );
  return { info, mainImage, textStyle, mutedStyle, dividerStyle, groomParentsLine, brideParentsLine };
}

// ─── Hero components ──────────────────────────────────────────────────────────

function HeroClassicElegant({ info, mainImage }: { info: EditorState['weddingInfo']; mainImage: GalleryImage | null }) {
  return (
    <div className="flex flex-col items-center pt-12 pb-6 px-8">
      <Image src="/assets/templates/type_1/save_the_date.svg" alt="save the date" width={106} height={40} className="mb-5" />
      <Image src="/assets/templates/type_1/wedding_day.svg" alt="wedding day" width={230} height={40} className="mb-10" />
      <div className="relative w-[250px] h-[362px] rounded-full overflow-hidden mb-10" style={{ background: 'rgba(0,0,0,0.06)' }}>
        {mainImage
          ? <Image src={mainImage.url} alt="메인" fill sizes="250px" className="object-cover" />
          : <div className="w-full h-full flex items-center justify-center"><Heart className="w-12 h-12 opacity-10" /></div>}
      </div>
      <CoupleNames info={info} color="#261C1D" />
    </div>
  );
}

function HeroModernMinimal({ info, mainImage }: { info: EditorState['weddingInfo']; mainImage: GalleryImage | null }) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-full">
        <Image src="/assets/templates/type_2/wedding_day.svg" alt="wedding day" width={230} height={40}
          className="absolute top-5 left-1/2 -translate-x-1/2 z-10" />
        <div className="relative w-full aspect-[3/4] overflow-hidden" style={{ background: 'rgba(0,0,0,0.06)' }}>
          {mainImage
            ? <Image src={mainImage.url} alt="메인" fill sizes="393px" className="object-cover" />
            : <div className="w-full h-full flex items-center justify-center"><Heart className="w-12 h-12 opacity-10" /></div>}
        </div>
      </div>
      <div className="pt-10 pb-6 px-8 w-full">
        <CoupleNames info={info} color="#2D2D2D" />
      </div>
    </div>
  );
}

function HeroKoreanTraditional({ info, mainImage }: { info: EditorState['weddingInfo']; mainImage: GalleryImage | null }) {
  const [, mm, dd] = (info.weddingDate || '').split('-');
  const dateOverlay = mm && dd ? `${mm}.${dd}` : '';
  return (
    <div className="flex flex-col items-center pt-12 pb-6 px-8">
      <Image src="/assets/templates/type_3/the_wedding_of.svg" alt="the wedding of" width={138} height={40} className="mb-10" />
      <div className="relative overflow-hidden mb-12" style={{
        width: 320, height: 428, borderTopLeftRadius: 180, borderTopRightRadius: 180, background: 'rgba(0,0,0,0.06)',
      }}>
        {mainImage
          ? <Image src={mainImage.url} alt="메인" fill sizes="320px" className="object-cover" />
          : <div className="w-full h-full flex items-center justify-center"><Heart className="w-12 h-12 opacity-10" /></div>}
        {dateOverlay && (
          <span className="absolute bottom-3 left-1/2 -translate-x-1/2 text-white font-bold opacity-80"
            style={{ fontSize: 64, letterSpacing: '0.1em' }}>
            {dateOverlay}
          </span>
        )}
      </div>
      <CoupleNames info={info} color="#261C1D" />
    </div>
  );
}

function HeroFloralRomantic({ info, mainImage }: { info: EditorState['weddingInfo']; mainImage: GalleryImage | null }) {
  return (
    <div className="flex flex-col items-center pt-10 pb-6 px-8">
      <Image src="/assets/templates/type_4/the_wedding_of.svg" alt="the wedding of" width={300} height={40} className="mb-4 relative z-10" />
      <div className="relative w-full flex justify-center mb-12">
        <Image src="/assets/templates/type_4/flower_2.png" alt="" width={300} height={300}
          className="absolute -left-10 -top-20 pointer-events-none select-none" style={{ zIndex: 1 }} />
        <Image src="/assets/templates/type_4/flower_1.png" alt="" width={300} height={300}
          className="absolute -right-10 bottom-10 pointer-events-none select-none" style={{ zIndex: 1 }} />
        <Image src="/assets/templates/type_4/flower_3.png" alt="" width={150} height={150}
          className="absolute -left-10 bottom-20 pointer-events-none select-none" style={{ zIndex: 1 }} />
        <div className="relative overflow-hidden aspect-[3/4]" style={{
          width: 218, border: '10px solid white', zIndex: 2,
          boxShadow: '0 10px 10px rgba(99,99,99,0), 0 6px 6px rgba(88,88,88,0.082)',
        }}>
          {mainImage
            ? <Image src={mainImage.url} alt="메인" fill sizes="218px" className="object-cover" />
            : <div className="w-full h-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.06)' }}>
                <Heart className="w-10 h-10 opacity-10" />
              </div>}
        </div>
      </div>
      <CoupleNames info={info} color="#261C1D" />
    </div>
  );
}

function HeroDarkLuxury({ info, mainImage }: { info: EditorState['weddingInfo']; mainImage: GalleryImage | null }) {
  return (
    <div className="flex flex-col items-center pt-12 pb-6 px-8">
      <p className="text-xs tracking-[0.4em] mb-4" style={{ color: '#d4af37' }}>WEDDING</p>
      <div className="w-10 h-px mb-8" style={{ background: '#d4af37' }} />
      <div className="relative w-[250px] h-[362px] overflow-hidden mb-10" style={{ border: '1px solid #d4af37', background: 'rgba(255,255,255,0.04)' }}>
        {mainImage
          ? <Image src={mainImage.url} alt="메인" fill sizes="250px" className="object-cover" />
          : <div className="w-full h-full flex items-center justify-center"><Heart className="w-12 h-12" style={{ color: '#d4af37', opacity: 0.3 }} /></div>}
      </div>
      <CoupleNames info={info} color="#F5F5F0" accentColor="#d4af37" />
    </div>
  );
}

function formatWeddingDateLabel(weddingDate: string): string {
  const date = new Date(weddingDate);
  if (!weddingDate || Number.isNaN(date.getTime())) return '';
  const dow = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][date.getDay()];
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}. ${mm}. ${dd} ${dow}`;
}

function HeroVintageForest({ info, mainImage }: { info: EditorState['weddingInfo']; mainImage: GalleryImage | null }) {
  const groomLabel = info.groomFirstName || `${info.groomLastNameKr}${info.groomFirstNameKr}`;
  const brideLabel = info.brideFirstName || `${info.brideLastNameKr}${info.brideFirstNameKr}`;
  const first = info.brideFirst ? brideLabel : groomLabel;
  const second = info.brideFirst ? groomLabel : brideLabel;
  const dateLabel = formatWeddingDateLabel(info.weddingDate);

  return (
    <div className="relative w-full h-[460px] overflow-hidden">
      {mainImage
        ? <Image src={mainImage.url} alt="메인" fill sizes="393px" className="object-cover" />
        : <div className="w-full h-full flex items-center justify-center" style={{ background: '#3D3830' }}><Heart className="w-12 h-12 text-white/20" /></div>}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.75), rgba(0,0,0,0.15) 55%, transparent)' }} />
      <div className="absolute inset-x-0 bottom-0 pb-10 px-8 text-center">
        <p className="text-white/70 text-xs tracking-[0.3em] mb-3">WE ARE GETTING MARRIED</p>
        <h1 className="font-serif italic text-3xl text-white mb-2">
          {first}
          <span className="mx-3 font-light text-white/70">&amp;</span>
          {second}
        </h1>
        {dateLabel && <p className="text-white/75 text-sm tracking-widest">{dateLabel}</p>}
      </div>
    </div>
  );
}

function CoupleNames({ info, color, accentColor }: { info: EditorState['weddingInfo']; color: string; accentColor?: string }) {
  const groomKr = `${info.groomLastNameKr}${info.groomFirstNameKr}`;
  const brideKr = `${info.brideLastNameKr}${info.brideFirstNameKr}`;
  const first = info.brideFirst ? brideKr : groomKr;
  const second = info.brideFirst ? groomKr : brideKr;
  const firstEn = info.brideFirst ? info.brideFirstName : info.groomFirstName;
  const secondEn = info.brideFirst ? info.groomFirstName : info.brideFirstName;

  return (
    <div className="text-center space-y-1.5">
      <h1 className="font-serif text-2xl" style={{ color }}>
        {first}
        <span className="mx-3 font-light" style={{ color: accentColor || '#c47a85' }}>·</span>
        {second}
      </h1>
      <p className="text-sm tracking-widest" style={{ color, opacity: 0.5 }}>
        {firstEn} & {secondEn}
      </p>
    </div>
  );
}

// ─── Account accordion ────────────────────────────────────────────────────────

function AccountAccordion({ info, style }: { info: EditorState['weddingInfo']; style: PreviewStyleConfig }) {
  const [open, setOpen] = useState(false);
  const textStyle = { color: style.text };
  const mutedStyle = { color: style.text, opacity: 0.55 };

  const handleCopy = async (label: string, bank: string, account: string) => {
    const ok = await copyText(`${bank} ${account}`);
    if (ok) toast.success(`${label} 계좌번호가 복사되었습니다`);
    else toast.error('복사에 실패했습니다');
  };

  return (
    <div className="rounded-lg px-4 py-3" style={{ background: style.sectionBg }}>
      <button className="flex items-center justify-between w-full" onClick={() => setOpen((v) => !v)}>
        <span className="text-sm font-medium" style={textStyle}>축하의 마음을 전하세요</span>
        <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} style={mutedStyle} />
      </button>
      {open && (
        <div className="mt-4 space-y-3">
          {(info.brideFirst
            ? [
                { label: '신부', name: `${info.brideLastNameKr}${info.brideFirstNameKr}`, bank: info.brideBankName, account: info.brideBankAccount },
                { label: '신랑', name: `${info.groomLastNameKr}${info.groomFirstNameKr}`, bank: info.groomBankName, account: info.groomBankAccount },
              ]
            : [
                { label: '신랑', name: `${info.groomLastNameKr}${info.groomFirstNameKr}`, bank: info.groomBankName, account: info.groomBankAccount },
                { label: '신부', name: `${info.brideLastNameKr}${info.brideFirstNameKr}`, bank: info.brideBankName, account: info.brideBankAccount },
              ]
          ).map((p) => p.bank && (
            <div key={p.label} className="flex justify-between items-center text-sm gap-2">
              <span className="shrink-0" style={mutedStyle}>{p.label} {p.name}</span>
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="truncate" style={textStyle}>{p.bank} {p.account}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(p.label, p.bank, p.account)}
                  className="p-1 rounded shrink-0 hover:opacity-70 transition-opacity"
                  style={mutedStyle}
                  aria-label={`${p.label} 계좌번호 복사`}
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Section blocks (one per SectionKind) ─────────────────────────────────────

export function CoverBlock({ state }: FullViewSectionProps) {
  const info = state.weddingInfo;
  const mainImage = state.gallery.length > 0 ? state.gallery[0] : null;
  const { template } = state;
  return (
    <>
      {template === 'classic-elegant'    && <HeroClassicElegant    info={info} mainImage={mainImage} />}
      {template === 'modern-minimal'     && <HeroModernMinimal     info={info} mainImage={mainImage} />}
      {template === 'korean-traditional' && <HeroKoreanTraditional info={info} mainImage={mainImage} />}
      {template === 'floral-romantic'    && <HeroFloralRomantic    info={info} mainImage={mainImage} />}
      {template === 'dark-luxury'        && <HeroDarkLuxury        info={info} mainImage={mainImage} />}
      {template === 'vintage-forest'     && <HeroVintageForest     info={info} mainImage={mainImage} />}
    </>
  );
}

export function GreetingBlock({ state, style }: FullViewSectionProps) {
  const { info, textStyle, dividerStyle } = getDerived(state, style);
  return (
    <div className="px-8">
      <div className="h-px mb-10" style={dividerStyle} />
      {info.mainPhrase && (
        <div className="text-center mb-10">
          <p className="font-serif whitespace-pre-line leading-loose" style={textStyle}>{info.mainPhrase}</p>
        </div>
      )}
    </div>
  );
}

export function CalendarBlock({ state, style }: FullViewSectionProps) {
  const { info, mutedStyle, dividerStyle, groomParentsLine, brideParentsLine } = getDerived(state, style);

  const handleAddToCalendar = () => {
    const groomName = `${info.groomLastNameKr}${info.groomFirstNameKr}`;
    const brideName = `${info.brideLastNameKr}${info.brideFirstNameKr}`;
    const names = info.brideFirst ? `${brideName} · ${groomName}` : `${groomName} · ${brideName}`;
    downloadWeddingIcs({
      title: `${names} 결혼식`,
      date: info.weddingDate,
      time: info.weddingTime,
      location: [info.ceremonyHall, info.venue, info.address].filter(Boolean).join(' '),
    });
  };

  return (
    <div className="px-8">
      <div className="h-px mb-10" style={dividerStyle} />
      <div className="mb-10 px-4 py-6 rounded-lg" style={{ background: style.sectionBg }}>
        <WeddingCalendar
          weddingDate={info.weddingDate}
          weddingTime={info.weddingTime}
          settings={state.calendarSettings}
          isDark={style.isDark}
        />
        {info.weddingDate && (
          <Button
            variant="outline" size="sm" className="w-full mt-4"
            style={style.isDark ? { borderColor: 'rgba(255,255,255,0.2)', color: style.text } : {}}
            onClick={handleAddToCalendar}
          >
            <CalendarPlus className="h-3.5 w-3.5 mr-1.5" />캘린더에 저장
          </Button>
        )}
      </div>
      <div className="text-center mb-10 space-y-2">
        {(info.brideFirst ? [brideParentsLine, groomParentsLine] : [groomParentsLine, brideParentsLine]).map((line, i) => (
          <p key={i} className="text-sm" style={mutedStyle}>{line}</p>
        ))}
      </div>
    </div>
  );
}

export function GalleryBlock({ state, style, onOpenLightbox }: FullViewSectionProps) {
  const { dividerStyle } = getDerived(state, style);
  const zoomPrevention = state.privacySettings.zoomPrevention;
  return (
    <div className="px-8">
      <div className="h-px mb-10" style={dividerStyle} />
      {state.gallery.length > 1 && (
        <div className="mb-10">
          <div className="grid grid-cols-3 gap-0.5 rounded-lg overflow-hidden">
            {state.gallery.map((img, i) => (
              <div
                key={img.id}
                className={cn('relative aspect-square overflow-hidden', !zoomPrevention && 'cursor-pointer')}
                onClick={() => !zoomPrevention && onOpenLightbox(i)}
              >
                <Image
                  src={img.url}
                  alt=""
                  fill
                  sizes="131px"
                  className={cn('object-cover transition-transform duration-300', !zoomPrevention && 'hover:scale-105')}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function LocationBlock({ state, style }: FullViewSectionProps) {
  const { info, textStyle, mutedStyle } = getDerived(state, style);
  const hasCoords = !!(info.latitude && info.longitude);
  const destinationName = info.ceremonyHall || info.venue || info.address;
  const navButtonStyle = style.isDark ? { borderColor: 'rgba(255,255,255,0.2)', color: style.text } : {};

  return (
    <div className="px-8">
      <div className="mb-6 px-4 py-4 rounded-lg" style={{ background: style.sectionBg }}>
        <div className="flex items-start gap-2 mb-3">
          <MapPin className="h-4 w-4 mt-0.5 shrink-0" style={{ color: style.accent }} />
          <div>
            <p className="font-medium" style={textStyle}>{info.ceremonyHall}</p>
            <p className="text-sm mt-0.5" style={mutedStyle}>{info.venue}</p>
            <p className="text-sm mt-0.5" style={mutedStyle}>{info.address}</p>
          </div>
        </div>
        {info.transportGuide && (
          <p className="text-xs mb-3" style={mutedStyle}>{info.transportGuide}</p>
        )}
        <KakaoMapDisplay
          address={info.address}
          latitude={info.latitude}
          longitude={info.longitude}
          venueName={info.ceremonyHall}
          isDark={style.isDark}
        />
        {hasCoords && (
          <div className="flex gap-2 mt-2">
            <Button
              variant="outline" size="sm" className="flex-1" style={navButtonStyle}
              onClick={() => openNaverMapDirections(destinationName, info.latitude, info.longitude)}
            >
              <Navigation className="h-3 w-3 mr-1" />네이버지도
            </Button>
            <Button
              variant="outline" size="sm" className="flex-1" style={navButtonStyle}
              onClick={() => openTmapDirections(destinationName, info.latitude, info.longitude)}
            >
              <Navigation className="h-3 w-3 mr-1" />티맵
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export function AccountBlock({ state, style }: FullViewSectionProps) {
  const { info } = getDerived(state, style);
  return (
    <div className="px-8">
      <div className="mb-6">
        <AccountAccordion info={info} style={style} />
      </div>
      <div className="flex gap-2 mb-10">
        {(info.brideFirst
          ? [{ label: '신부측 연락', contact: info.brideContact }, { label: '신랑측 연락', contact: info.groomContact }]
          : [{ label: '신랑측 연락', contact: info.groomContact }, { label: '신부측 연락', contact: info.brideContact }]
        ).map((c) => c.contact && (
          <a key={c.label} href={`tel:${c.contact}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full"
              style={style.isDark ? { borderColor: 'rgba(255,255,255,0.2)', color: style.text } : {}}>
              <Phone className="h-3 w-3 mr-1" />{c.label}
            </Button>
          </a>
        ))}
      </div>
    </div>
  );
}

export function RsvpBlock({ state, style, invitationId }: FullViewSectionProps) {
  const { textStyle, mutedStyle } = getDerived(state, style);
  return (
    <div className="px-8">
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

export function GuestbookBlock({ state, style, invitationId }: FullViewSectionProps) {
  const { textStyle, mutedStyle } = getDerived(state, style);
  return (
    <div className="px-8">
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

export function ShareBlock({ state, style, invitationUrl }: FullViewSectionProps) {
  const { info } = getDerived(state, style);
  return (
    <div className="px-8">
      <div className="mb-10">
        <ShareSection shareSettings={state.shareSettings} weddingInfo={info} isDark={style.isDark} invitationUrl={invitationUrl} />
      </div>
    </div>
  );
}
