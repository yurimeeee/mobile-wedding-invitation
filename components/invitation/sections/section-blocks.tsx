'use client';

import { useState } from 'react';
import type { CSSProperties } from 'react';
import { Bus, CalendarPlus, Car, ChevronDown, Copy, Heart, MapPin, Navigation, Phone } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';
import { type EditorState, type GalleryImage } from '@/lib/types';
import type { PreviewStyleConfig } from '@/lib/preview-style';
import { Button } from '@/components/ui/button';
import { ParentsNames } from '@/components/invitation/parent-name';
import { cn } from '@/lib/utils';
import { copyText } from '@/lib/clipboard';
import { downloadWeddingIcs } from '@/lib/calendar-export';
import { openNaverMapDirections, openTmapDirections } from '@/lib/navigation-links';
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

// 저장 전 편집 중인 이미지는 data: URL(base64)이라 next/image 최적화 API가 처리할 수
// 없다 — 이 경우엔 unoptimized로 그대로 렌더링하고, 저장된 Firebase Storage URL만 최적화한다.
function PreviewImage({ src, alt, sizes, className }: { src: string; alt: string; sizes: string; className?: string }) {
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      unoptimized={src.startsWith('data:')}
      className={className}
    />
  );
}

function getDerived(state: EditorState, style: PreviewStyleConfig) {
  const info = state.weddingInfo;
  const mainImage = state.gallery.length > 0 ? state.gallery[0] : null;
  const textStyle: CSSProperties = { color: style.text };
  const mutedStyle: CSSProperties = { color: style.text, opacity: 0.55 };
  const dividerStyle: CSSProperties = { background: style.divider };
  const sectionStyle: CSSProperties = { background: style.sectionBg };
  const groomParentsLine = (
    <>
      <ParentsNames fatherName={info.groomFatherName} fatherDeceased={info.groomFatherDeceased} motherName={info.groomMotherName} motherDeceased={info.groomMotherDeceased} showDeceasedMark={info.showDeceasedMark} />의 아들 {info.groomLastNameKr}{info.groomFirstNameKr}
    </>
  );
  const brideParentsLine = (
    <>
      <ParentsNames fatherName={info.brideFatherName} fatherDeceased={info.brideFatherDeceased} motherName={info.brideMotherName} motherDeceased={info.brideMotherDeceased} showDeceasedMark={info.showDeceasedMark} />의 딸 {info.brideLastNameKr}{info.brideFirstNameKr}
    </>
  );
  return { info, mainImage, textStyle, mutedStyle, dividerStyle, sectionStyle, groomParentsLine, brideParentsLine };
}

// ─── Per-template hero sections ───────────────────────────────────────────────

function HeroClassicElegant({ info, mainImage, textStyle }: { info: EditorState['weddingInfo']; mainImage: GalleryImage | null; textStyle: CSSProperties }) {
  return (
    <div className="flex flex-col items-center pt-10 pb-4 px-6">
      <Image src="/assets/templates/type_1/save_the_date.svg" alt="save the date" width={106} height={40} className="mb-4" />
      <Image src="/assets/templates/type_1/wedding_day.svg" alt="wedding day" width={200} height={40} className="mb-8" />

      <div className="relative w-[200px] h-[288px] rounded-full overflow-hidden mb-8" style={{ background: 'rgba(0,0,0,0.08)' }}>
        {mainImage
          ? <PreviewImage src={mainImage.url} alt="메인" sizes="200px" className="object-cover" />
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
        <div className="relative w-full aspect-[3/4] overflow-hidden" style={{ background: 'rgba(0,0,0,0.06)' }}>
          {mainImage
            ? <PreviewImage src={mainImage.url} alt="메인" sizes="400px" className="object-cover" />
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
          ? <PreviewImage src={mainImage.url} alt="메인" sizes="260px" className="object-cover" />
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
          className="relative overflow-hidden aspect-[3/4]"
          style={{
            width: 180,
            boxShadow: '0 6px 6px rgba(88,88,88,0.08), 0 10px 10px rgba(99,99,99,0)',
            border: '8px solid white',
            zIndex: 2,
          }}
        >
          {mainImage
            ? <PreviewImage src={mainImage.url} alt="메인" sizes="180px" className="object-cover" />
            : <div className="w-full h-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.06)' }}>
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
        className="relative w-[200px] h-[280px] overflow-hidden mb-8"
        style={{ border: '1px solid #d4af37', background: 'rgba(255,255,255,0.04)' }}
      >
        {mainImage
          ? <PreviewImage src={mainImage.url} alt="메인" sizes="200px" className="object-cover" />
          : <div className="w-full h-full flex items-center justify-center"><Heart className="w-10 h-10" style={{ color: '#d4af37', opacity: 0.3 }} /></div>
        }
      </div>

      <CoupleNames info={info} textStyle={textStyle} accentColor="#d4af37" />
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
    <div className="relative w-full h-[380px] overflow-hidden">
      {mainImage
        ? <PreviewImage src={mainImage.url} alt="메인" sizes="100vw" className="object-cover" />
        : <div className="w-full h-full flex items-center justify-center" style={{ background: '#3D3830' }}><Heart className="w-10 h-10 text-white/20" /></div>
      }
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.75), rgba(0,0,0,0.15) 55%, transparent)' }} />
      <div className="absolute inset-x-0 bottom-0 pb-7 px-6 text-center">
        <p className="text-white/70 text-[10px] tracking-[0.3em] mb-2">WE ARE GETTING MARRIED</p>
        <h1 className="font-serif italic text-2xl text-white mb-1.5">
          {first}
          <span className="mx-2 font-light text-white/70">&amp;</span>
          {second}
        </h1>
        {dateLabel && <p className="text-white/75 text-[11px] tracking-widest">{dateLabel}</p>}
      </div>
    </div>
  );
}

function HeroLovely({ info, mainImage }: { info: EditorState['weddingInfo']; mainImage: GalleryImage | null }) {
  const groomEn = info.groomFirstName || `${info.groomLastNameKr}${info.groomFirstNameKr}`;
  const brideEn = info.brideFirstName || `${info.brideLastNameKr}${info.brideFirstNameKr}`;
  const firstEn = info.brideFirst ? brideEn : groomEn;
  const secondEn = info.brideFirst ? groomEn : brideEn;
  const groomKr = `${info.groomLastNameKr}${info.groomFirstNameKr}`;
  const brideKr = `${info.brideLastNameKr}${info.brideFirstNameKr}`;
  const firstKr = info.brideFirst ? brideKr : groomKr;
  const secondKr = info.brideFirst ? groomKr : brideKr;
  const dateLabel = formatWeddingDateLabel(info.weddingDate);

  return (
    <div className="pt-8 pb-6 px-6" style={{ background: 'linear-gradient(180deg, #F5E3E4 0%, #F7EDE9 55%, #FBF7F3 100%)' }}>
      <div className="relative flex justify-center mb-6">
        <svg width="70" height="70" viewBox="0 0 90 90" className="absolute -top-2 -left-2 pointer-events-none select-none" fill="none">
          <g opacity="0.85">
            <ellipse cx="28" cy="30" rx="14" ry="11" fill="#EACBCE" />
            <ellipse cx="44" cy="23" rx="11" ry="9" fill="#EFD9D6" />
            <ellipse cx="18" cy="42" rx="10" ry="8" fill="#F0E0E1" />
          </g>
        </svg>
        <svg width="70" height="70" viewBox="0 0 90 90" className="absolute -top-2 -right-2 pointer-events-none select-none" style={{ transform: 'scaleX(-1)' }} fill="none">
          <g opacity="0.8">
            <ellipse cx="28" cy="30" rx="12" ry="9" fill="#EACBCE" />
            <ellipse cx="44" cy="23" rx="9" ry="7" fill="#EFD9D6" />
          </g>
        </svg>
        <div className="relative w-[200px] h-[268px] rounded-[24px] overflow-hidden" style={{ border: '5px solid #FFFFFF', boxShadow: '0 12px 24px rgba(140,81,88,0.18)' }}>
          {mainImage
            ? <PreviewImage src={mainImage.url} alt="메인" sizes="200px" className="object-cover" />
            : <div className="w-full h-full flex items-center justify-center" style={{ background: 'rgba(201,112,127,0.08)' }}><Heart className="w-9 h-9" style={{ color: '#B98088', opacity: 0.25 }} /></div>}
        </div>
      </div>

      <div className="text-center">
        <p className="text-[10px] tracking-[0.3em] mb-2" style={{ color: '#B98088' }}>WE ARE GETTING MARRIED</p>
        <h1 style={{ fontFamily: "'Dancing Script', cursive", fontWeight: 700, fontSize: 34, color: '#8C5158', lineHeight: 1.1 }}>
          {firstEn} <span style={{ fontSize: 22, color: '#C99BA0' }}>&amp;</span> {secondEn}
        </h1>
        <p className="font-serif text-[13px] mt-1.5 tracking-widest" style={{ color: '#4A3F3F' }}>{firstKr} · {secondKr}</p>
        {dateLabel && (
          <div className="flex items-center justify-center gap-2 mt-4">
            <span className="w-4 h-px" style={{ background: '#C99BA0' }} />
            <span className="text-[11px]" style={{ color: '#8A7B7B' }}>{dateLabel}</span>
            <span className="w-4 h-px" style={{ background: '#C99BA0' }} />
          </div>
        )}
      </div>
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
  const accent = accentColor || '#c47a85';
  const mutedStyle: CSSProperties = { color: textStyle.color, opacity: 0.5 };
  const style = info.nameDisplayStyle || 'dot';

  if (style === 'ampersand') {
    return (
      <div className="text-center space-y-1">
        <h1 className="font-serif text-2xl" style={textStyle}>
          {first}
          <span className="mx-2 font-light" style={{ color: accent }}>&amp;</span>
          {second}
        </h1>
        <p className="text-xs tracking-widest" style={mutedStyle}>{firstEn} & {secondEn}</p>
      </div>
    );
  }

  if (style === 'stacked') {
    return (
      <div className="text-center space-y-1.5">
        <h1 className="font-serif text-xl leading-relaxed" style={textStyle}>
          {first}
          <br />
          <span className="text-xs font-light tracking-widest" style={{ color: accent }}>and</span>
          <br />
          {second}
        </h1>
        <p className="text-xs tracking-widest" style={mutedStyle}>{firstEn} & {secondEn}</p>
      </div>
    );
  }

  if (style === 'english-lead') {
    return (
      <div className="text-center space-y-1">
        <h1 className="font-serif italic text-2xl" style={textStyle}>
          {firstEn}
          <span className="mx-2 font-light not-italic" style={{ color: accent }}>&amp;</span>
          {secondEn}
        </h1>
        <p className="text-xs tracking-widest" style={mutedStyle}>{first} · {second}</p>
      </div>
    );
  }

  return (
    <div className="text-center space-y-1">
      <h1 className="font-serif text-xl" style={textStyle}>
        {first}
        <span className="mx-2 font-light" style={{ color: accent }}>·</span>
        {second}
      </h1>
      <p className="text-xs tracking-widest" style={mutedStyle}>
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
      {template === 'vintage-forest'     && <HeroVintageForest     info={info} mainImage={mainImage} />}
      {template === 'lovely-blush'       && <HeroLovely            info={info} mainImage={mainImage} />}
    </>
  );
}

export function GreetingBlock({ state, style }: SectionBlockProps) {
  const { info, textStyle, dividerStyle } = getDerived(state, style);
  const lovely = state.template === 'lovely-blush';

  if (lovely) {
    return (
      <>
        <div className="flex justify-center mb-3">
          <svg width="48" height="36" viewBox="0 0 60 46" fill="none">
            <g opacity="0.9">
              <ellipse cx="22" cy="18" rx="10" ry="8" fill="#EACBCE" />
              <ellipse cx="34" cy="14" rx="8" ry="6.5" fill="#EFD9D6" />
              <ellipse cx="38" cy="24" rx="7" ry="6" fill="#F0E0E1" />
            </g>
            <g fill="#B7C2A9" opacity="0.8">
              <path d="M27 30 Q19 28 17 20 Q27 22 27 30Z" />
              <path d="M33 33 Q41 31 43 24 Q34 25 33 33Z" />
            </g>
          </svg>
        </div>
        {info.mainPhrase && (
          <div className="text-center px-8 mb-6">
            <p className="font-serif whitespace-pre-line leading-loose text-sm" style={{ color: '#4A3F3F' }}>{info.mainPhrase}</p>
          </div>
        )}
        <div className="flex items-center justify-center gap-2 mb-8">
          <span className="w-6 h-px" style={{ background: '#C99BA0' }} />
          <svg width="10" height="10" viewBox="0 0 24 24" fill="#C99BA0"><path d="M12 20.5c-.3 0-.6-.1-.8-.3C7.8 17.4 3 13.6 3 9.3 3 6.4 5.3 4 8.2 4c1.7 0 3.2.8 4.1 2.1C13.2 4.8 14.7 4 16.4 4 19.3 4 21.6 6.4 21.6 9.3c0 4.3-4.8 8.1-8.2 10.9-.2.2-.5.3-.8.3Z" /></svg>
          <span className="w-6 h-px" style={{ background: '#C99BA0' }} />
        </div>
      </>
    );
  }

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

function formatStoryDate(dateStr: string): string {
  const date = new Date(dateStr);
  if (!dateStr || Number.isNaN(date.getTime())) return '';
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}. ${mm}. ${dd}`;
}

export function StoryBlock({ state, style }: SectionBlockProps) {
  const { textStyle, mutedStyle, dividerStyle } = getDerived(state, style);
  const lovely = state.template === 'lovely-blush';
  const items = [...state.storyItems].sort((a, b) => a.order - b.order);
  if (items.length === 0) return null;

  const dotColor = lovely ? '#C99BA0' : style.accent;
  const lineColor = lovely ? '#F0E0E1' : style.divider;

  return (
    <>
      <div className="h-px mx-8 mb-8" style={dividerStyle} />
      <div className="mx-4 mb-8 space-y-6">
        {items.map((item, i) => (
          <div key={item.id} className="flex gap-3">
            <div className="flex flex-col items-center shrink-0 pt-1">
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: dotColor }} />
              {i < items.length - 1 && <span className="w-px flex-1 mt-1" style={{ background: lineColor }} />}
            </div>
            <div className="flex-1 min-w-0 pb-1">
              {item.date && <p className="text-[11px] mb-1" style={{ color: dotColor }}>{formatStoryDate(item.date)}</p>}
              <div className="flex gap-2.5">
                {item.imageUrl && (
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0" style={{ background: 'rgba(0,0,0,0.06)' }}>
                    <PreviewImage src={item.imageUrl} alt="" sizes="48px" className="object-cover" />
                  </div>
                )}
                <div className="min-w-0">
                  {item.title && <p className="font-medium text-xs mb-0.5" style={textStyle}>{item.title}</p>}
                  {item.description && (
                    <p className="text-[11px] whitespace-pre-line leading-relaxed" style={mutedStyle}>{item.description}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export function CalendarBlock({ state, style }: SectionBlockProps) {
  const { info, mutedStyle, dividerStyle, sectionStyle, groomParentsLine, brideParentsLine } = getDerived(state, style);
  const lovely = state.template === 'lovely-blush';

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
    <>
      <div className="h-px mx-8 mb-8" style={dividerStyle} />
      <div
        className="mx-4 mb-8 px-4 py-5 rounded-lg"
        style={lovely ? { background: '#FFFFFF', borderRadius: 26, boxShadow: '0 12px 28px rgba(74,63,63,0.09)' } : sectionStyle}
      >
        <WeddingCalendar
          weddingDate={info.weddingDate}
          weddingTime={info.weddingTime}
          settings={state.calendarSettings}
          isDark={style.isDark}
          lovely={lovely}
        />
        {info.weddingDate && (
          <Button
            variant="outline" size="sm" className="w-full mt-4"
            style={
              lovely ? { borderColor: '#C99BA0', color: '#8C5158', borderRadius: 999 }
              : style.isDark ? { borderColor: 'rgba(255,255,255,0.2)', color: style.text } : {}
            }
            onClick={handleAddToCalendar}
          >
            <CalendarPlus className="h-3.5 w-3.5 mr-1.5" />캘린더에 저장
          </Button>
        )}
      </div>
      <div className="text-center px-6 mb-8 space-y-1.5">
        {(info.brideFirst ? [brideParentsLine, groomParentsLine] : [groomParentsLine, brideParentsLine]).map((line, i) => (
          <p key={i} className="text-xs" style={mutedStyle}>{line}</p>
        ))}
      </div>
    </>
  );
}

const SCRAPBOOK_ROTATIONS = [-1.5, 1.5, -2, 1];

export function GalleryBlock({ state, style }: SectionBlockProps) {
  const { dividerStyle } = getDerived(state, style);
  const lovely = state.template === 'lovely-blush';

  if (lovely) {
    return (
      <>
        <div className="h-px mx-8 mb-8" style={dividerStyle} />
        {state.gallery.length > 1 && (
          <div className="mx-4 mb-8 grid grid-cols-2 gap-3">
            {state.gallery.slice(0, 4).map((img, i) => (
              <div
                key={img.id}
                className="bg-white rounded-lg p-1.5 pb-3 shadow-[0_8px_16px_rgba(74,63,63,0.14)]"
                style={{ transform: `rotate(${SCRAPBOOK_ROTATIONS[i % SCRAPBOOK_ROTATIONS.length]}deg)` }}
              >
                <div className="relative aspect-square rounded overflow-hidden">
                  <PreviewImage src={img.url} alt="" sizes="160px" className="object-cover" />
                </div>
              </div>
            ))}
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <div className="h-px mx-8 mb-8" style={dividerStyle} />
      {state.gallery.length > 1 && (
        <div className="mx-4 mb-8">
          <div className="grid grid-cols-2 gap-1 rounded-lg overflow-hidden">
            {state.gallery.slice(0, 4).map((img) => (
              <div key={img.id} className="relative aspect-square overflow-hidden">
                <PreviewImage src={img.url} alt="" sizes="200px" className="object-cover" />
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
  const hasCoords = !!(info.latitude && info.longitude);
  const destinationName = info.ceremonyHall || info.venue || info.address;
  const navButtonStyle = style.isDark ? { borderColor: 'rgba(255,255,255,0.2)', color: style.text } : {};
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
      {hasCoords && (
        <div className="flex gap-2 mt-2">
          <Button
            variant="outline" size="sm" className="flex-1 text-xs" style={navButtonStyle}
            onClick={() => openNaverMapDirections(destinationName, info.latitude, info.longitude)}
          >
            <Navigation className="h-3 w-3 mr-1" />네이버지도
          </Button>
          <Button
            variant="outline" size="sm" className="flex-1 text-xs" style={navButtonStyle}
            onClick={() => openTmapDirections(destinationName, info.latitude, info.longitude)}
          >
            <Navigation className="h-3 w-3 mr-1" />티맵
          </Button>
        </div>
      )}
      {(info.transportGuide || info.parkingInfo || info.shuttleInfo) && (
        <div className="mt-3 pt-3 space-y-2" style={{ borderTop: `1px solid ${style.divider}` }}>
          {info.transportGuide && (
            <div className="flex items-start gap-1.5">
              <Navigation className="h-3 w-3 mt-0.5 shrink-0" style={{ color: style.accent }} />
              <p className="text-[11px] whitespace-pre-line leading-relaxed" style={mutedStyle}>{info.transportGuide}</p>
            </div>
          )}
          {info.parkingInfo && (
            <div className="flex items-start gap-1.5">
              <Car className="h-3 w-3 mt-0.5 shrink-0" style={{ color: style.accent }} />
              <p className="text-[11px] whitespace-pre-line leading-relaxed" style={mutedStyle}>{info.parkingInfo}</p>
            </div>
          )}
          {info.shuttleInfo && (
            <div className="flex items-start gap-1.5">
              <Bus className="h-3 w-3 mt-0.5 shrink-0" style={{ color: style.accent }} />
              <p className="text-[11px] whitespace-pre-line leading-relaxed" style={mutedStyle}>{info.shuttleInfo}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AccountAccordion({ info, style, lovely }: { info: EditorState['weddingInfo']; style: PreviewStyleConfig; lovely?: boolean }) {
  const [open, setOpen] = useState(false);
  const textStyle = { color: style.text };
  const mutedStyle = { color: style.text, opacity: 0.55 };

  const handleCopy = async (label: string, bank: string, account: string) => {
    const ok = await copyText(`${bank} ${account}`);
    if (ok) toast.success(`${label} 계좌번호가 복사되었습니다`);
    else toast.error('복사에 실패했습니다');
  };

  const parties = info.brideFirst
    ? [
        { label: '신부', name: `${info.brideLastNameKr}${info.brideFirstNameKr}`, bank: info.brideBankName, account: info.brideBankAccount },
        { label: '신랑', name: `${info.groomLastNameKr}${info.groomFirstNameKr}`, bank: info.groomBankName, account: info.groomBankAccount },
      ]
    : [
        { label: '신랑', name: `${info.groomLastNameKr}${info.groomFirstNameKr}`, bank: info.groomBankName, account: info.groomBankAccount },
        { label: '신부', name: `${info.brideLastNameKr}${info.brideFirstNameKr}`, bank: info.brideBankName, account: info.brideBankAccount },
      ];

  if (lovely) {
    return (
      <div className="rounded-[22px] px-5 py-4" style={{ background: 'linear-gradient(160deg, #EACBCE, #F5E3E4)' }}>
        <button className="flex items-center justify-between w-full" onClick={() => setOpen((v) => !v)}>
          <span className="flex items-center gap-2 text-sm font-bold" style={{ color: '#4A3F3F' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8C5158" strokeWidth="2"><circle cx="12" cy="12" r="8" /></svg>
            축하의 마음을 전하세요
          </span>
          <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} style={{ color: '#8C5158' }} />
        </button>
        {open && (
          <div className="mt-3 pt-3 space-y-0.5" style={{ borderTop: '1px solid rgba(140,81,88,0.15)' }}>
            {parties.map((p) => p.bank && (
              <div key={p.label} className="flex justify-between items-center gap-2 py-2.5" style={{ borderBottom: '1px solid rgba(140,81,88,0.12)' }}>
                <div className="min-w-0">
                  <p className="text-xs font-bold" style={{ color: '#4A3F3F' }}>{p.name} ({p.label})</p>
                  <p className="text-[11px] truncate mt-0.5" style={{ color: '#8A7B7B' }}>{p.bank} {p.account}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(p.label, p.bank, p.account)}
                  className="shrink-0 text-[11px] px-3 py-1.5 rounded-full"
                  style={{ color: '#8C5158', border: '1px solid #C99BA0' }}
                  aria-label={`${p.label} 계좌번호 복사`}
                >
                  복사
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-lg px-4 py-3" style={{ background: style.sectionBg }}>
      <button className="flex items-center justify-between w-full" onClick={() => setOpen((v) => !v)}>
        <span className="text-sm font-medium" style={textStyle}>축하의 마음을 전하세요</span>
        <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} style={mutedStyle} />
      </button>
      {open && (
        <div className="mt-4 space-y-3">
          {parties.map((p) => p.bank && (
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

export function AccountBlock({ state, style }: SectionBlockProps) {
  const { info } = getDerived(state, style);
  const lovely = state.template === 'lovely-blush';
  return (
    <>
      <div className="mx-4 mb-6">
        <AccountAccordion info={info} style={style} lovely={lovely} />
      </div>

      <div className="flex gap-2 mx-4 mb-6">
        {(info.brideFirst
          ? [{ label: '신부측 연락', contact: info.brideContact }, { label: '신랑측 연락', contact: info.groomContact }]
          : [{ label: '신랑측 연락', contact: info.groomContact }, { label: '신부측 연락', contact: info.brideContact }]
        ).map((c) => c.contact && (
          <a key={c.label} href={`tel:${c.contact}`} className="flex-1">
            <Button
              variant="outline" size="sm"
              className="w-full text-xs"
              style={style.isDark ? { borderColor: 'rgba(255,255,255,0.2)', color: style.text } : {}}
            >
              <Phone className="h-3 w-3 mr-1" />{c.label}
            </Button>
          </a>
        ))}
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
        lovely={state.template === 'lovely-blush'}
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
        lovely={state.template === 'lovely-blush'}
      />
    </div>
  );
}

export function ShareBlock({ state, style }: SectionBlockProps) {
  const { info } = getDerived(state, style);
  return (
    <div className="mx-4 mb-8">
      <ShareSection
        shareSettings={state.shareSettings}
        weddingInfo={info}
        isDark={style.isDark}
        lovely={state.template === 'lovely-blush'}
      />
    </div>
  );
}
