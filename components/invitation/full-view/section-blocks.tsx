'use client';

import { useState } from 'react';
import type { CSSProperties } from 'react';
import { CalendarPlus, ChevronDown, Copy, Heart, MapPin, Navigation, Phone } from 'lucide-react';
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
import { PetalOverlay } from '@/components/invitation/full-view/petal-overlay';

// Templates whose aesthetic suits a falling-petal overlay on the cover.
const PETAL_TEMPLATES = new Set(['floral-romantic', 'vintage-forest', 'korean-traditional', 'lovely-blush']);

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
      <ParentsNames fatherName={info.groomFatherName} fatherDeceased={info.groomFatherDeceased} motherName={info.groomMotherName} motherDeceased={info.groomMotherDeceased} showDeceasedMark={info.showDeceasedMark} />의 아들 {info.groomLastNameKr}{info.groomFirstNameKr}
    </>
  );
  const brideParentsLine = (
    <>
      <ParentsNames fatherName={info.brideFatherName} fatherDeceased={info.brideFatherDeceased} motherName={info.brideMotherName} motherDeceased={info.brideMotherDeceased} showDeceasedMark={info.showDeceasedMark} />의 딸 {info.brideLastNameKr}{info.brideFirstNameKr}
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
    <div className="pt-10 pb-8 px-8" style={{ background: 'linear-gradient(180deg, #FBDCE3 0%, #FCEFE8 55%, #FFF8F4 100%)' }}>
      <div className="relative flex justify-center mb-8">
        <svg width="90" height="90" viewBox="0 0 90 90" className="absolute -top-3 -left-3 pointer-events-none select-none" fill="none">
          <g opacity="0.85">
            <ellipse cx="28" cy="30" rx="14" ry="11" fill="#F6C6D0" />
            <ellipse cx="44" cy="23" rx="11" ry="9" fill="#FBE0D9" />
            <ellipse cx="18" cy="42" rx="10" ry="8" fill="#F3D9E4" />
          </g>
          <g stroke="#C08A94" strokeWidth="1.2" strokeLinecap="round" opacity="0.55">
            <path d="M27 36 Q18 52 10 62" />
          </g>
        </svg>
        <svg width="90" height="90" viewBox="0 0 90 90" className="absolute -top-3 -right-3 pointer-events-none select-none" style={{ transform: 'scaleX(-1)' }} fill="none">
          <g opacity="0.8">
            <ellipse cx="28" cy="30" rx="12" ry="9" fill="#F6C6D0" />
            <ellipse cx="44" cy="23" rx="9" ry="7" fill="#FBE0D9" />
          </g>
        </svg>
        <div className="relative w-[240px] h-[320px] rounded-[28px] overflow-hidden" style={{ border: '6px solid #FFFFFF', boxShadow: '0 14px 28px rgba(182,92,108,0.18)' }}>
          {mainImage
            ? <Image src={mainImage.url} alt="메인" fill sizes="240px" className="object-cover" />
            : <div className="w-full h-full flex items-center justify-center" style={{ background: 'rgba(201,112,127,0.08)' }}><Heart className="w-10 h-10" style={{ color: '#C9707F', opacity: 0.25 }} /></div>}
        </div>
      </div>

      <div className="text-center">
        <p className="text-[11px] tracking-[0.3em] mb-3" style={{ color: '#C9707F' }}>WE ARE GETTING MARRIED</p>
        <h1 style={{ fontFamily: "'Dancing Script', cursive", fontWeight: 700, fontSize: 40, color: '#B65C6C', lineHeight: 1.1 }}>
          {firstEn} <span style={{ fontSize: 26, color: '#E8A0AE' }}>&amp;</span> {secondEn}
        </h1>
        <p className="font-serif text-[15px] mt-2 tracking-widest" style={{ color: '#5B4A4E' }}>{firstKr} · {secondKr}</p>
        {dateLabel && (
          <div className="flex items-center justify-center gap-2.5 mt-5">
            <span className="w-5 h-px" style={{ background: '#E8A0AE' }} />
            <span className="text-xs" style={{ color: '#9C8B90' }}>{dateLabel}</span>
            <span className="w-5 h-px" style={{ background: '#E8A0AE' }} />
          </div>
        )}
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
  const accent = accentColor || '#c47a85';
  const style = info.nameDisplayStyle || 'dot';

  if (style === 'ampersand') {
    return (
      <div className="text-center space-y-1.5">
        <h1 className="font-serif text-3xl" style={{ color }}>
          {first}
          <span className="mx-3 font-light" style={{ color: accent }}>&amp;</span>
          {second}
        </h1>
        <p className="text-sm tracking-widest" style={{ color, opacity: 0.5 }}>
          {firstEn} & {secondEn}
        </p>
      </div>
    );
  }

  if (style === 'stacked') {
    return (
      <div className="text-center space-y-2">
        <h1 className="font-serif text-2xl leading-relaxed" style={{ color }}>
          {first}
          <br />
          <span className="text-sm font-light tracking-widest" style={{ color: accent }}>and</span>
          <br />
          {second}
        </h1>
        <p className="text-sm tracking-widest" style={{ color, opacity: 0.5 }}>
          {firstEn} & {secondEn}
        </p>
      </div>
    );
  }

  if (style === 'english-lead') {
    return (
      <div className="text-center space-y-1.5">
        <h1 className="font-serif italic text-3xl" style={{ color }}>
          {firstEn}
          <span className="mx-3 font-light not-italic" style={{ color: accent }}>&amp;</span>
          {secondEn}
        </h1>
        <p className="text-sm tracking-widest" style={{ color, opacity: 0.5 }}>
          {first} · {second}
        </p>
      </div>
    );
  }

  return (
    <div className="text-center space-y-1.5">
      <h1 className="font-serif text-2xl" style={{ color }}>
        {first}
        <span className="mx-3 font-light" style={{ color: accent }}>·</span>
        {second}
      </h1>
      <p className="text-sm tracking-widest" style={{ color, opacity: 0.5 }}>
        {firstEn} & {secondEn}
      </p>
    </div>
  );
}

// ─── Account accordion ────────────────────────────────────────────────────────

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
      <div className="rounded-[22px] px-5 py-4" style={{ background: 'linear-gradient(160deg, #FBE3D3, #FBDCE3)' }}>
        <button className="flex items-center justify-between w-full" onClick={() => setOpen((v) => !v)}>
          <span className="flex items-center gap-2 text-sm font-bold" style={{ color: '#5B4A4E' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#B65C6C" strokeWidth="2"><circle cx="12" cy="12" r="8" /></svg>
            축하의 마음을 전하세요
          </span>
          <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} style={{ color: '#B65C6C' }} />
        </button>
        {open && (
          <div className="mt-3 pt-3 space-y-0.5" style={{ borderTop: '1px solid rgba(182,92,108,0.15)' }}>
            {parties.map((p) => p.bank && (
              <div key={p.label} className="flex justify-between items-center gap-2 py-2.5" style={{ borderBottom: '1px solid rgba(182,92,108,0.12)' }}>
                <div className="min-w-0">
                  <p className="text-xs font-bold" style={{ color: '#5B4A4E' }}>{p.name} ({p.label})</p>
                  <p className="text-[11px] truncate mt-0.5" style={{ color: '#9C8B90' }}>{p.bank} {p.account}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(p.label, p.bank, p.account)}
                  className="shrink-0 text-[11px] px-3 py-1.5 rounded-full"
                  style={{ color: '#B65C6C', border: '1px solid #E8A0AE' }}
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

// ─── Section blocks (one per SectionKind) ─────────────────────────────────────

export function CoverBlock({ state, style }: FullViewSectionProps) {
  const info = state.weddingInfo;
  const mainImage = state.gallery.length > 0 ? state.gallery[0] : null;
  const { template } = state;
  return (
    <div className="relative overflow-hidden">
      {template === 'classic-elegant'    && <HeroClassicElegant    info={info} mainImage={mainImage} />}
      {template === 'modern-minimal'     && <HeroModernMinimal     info={info} mainImage={mainImage} />}
      {template === 'korean-traditional' && <HeroKoreanTraditional info={info} mainImage={mainImage} />}
      {template === 'floral-romantic'    && <HeroFloralRomantic    info={info} mainImage={mainImage} />}
      {template === 'dark-luxury'        && <HeroDarkLuxury        info={info} mainImage={mainImage} />}
      {template === 'vintage-forest'     && <HeroVintageForest     info={info} mainImage={mainImage} />}
      {template === 'lovely-blush'       && <HeroLovely            info={info} mainImage={mainImage} />}
      {PETAL_TEMPLATES.has(template) && <PetalOverlay color={style.accent} />}
    </div>
  );
}

function FloralSprig({ className }: { className?: string }) {
  return (
    <svg width="60" height="46" viewBox="0 0 60 46" fill="none" className={className}>
      <g opacity="0.9">
        <ellipse cx="22" cy="18" rx="10" ry="8" fill="#F6C6D0" />
        <ellipse cx="34" cy="14" rx="8" ry="6.5" fill="#FBE0D9" />
        <ellipse cx="38" cy="24" rx="7" ry="6" fill="#F3D9E4" />
      </g>
      <path d="M30 22 Q30 34 26 42" stroke="#C08A94" strokeWidth="1.1" strokeLinecap="round" opacity="0.6" fill="none" />
      <g fill="#B8CDB0" opacity="0.8">
        <path d="M27 30 Q19 28 17 20 Q27 22 27 30Z" />
        <path d="M33 33 Q41 31 43 24 Q34 25 33 33Z" />
      </g>
    </svg>
  );
}

function HeartDivider() {
  return (
    <div className="flex items-center justify-center gap-2.5 mb-10">
      <span className="w-8 h-px" style={{ background: '#E8A0AE' }} />
      <svg width="12" height="12" viewBox="0 0 24 24" fill="#E8A0AE">
        <path d="M12 20.5c-.3 0-.6-.1-.8-.3C7.8 17.4 3 13.6 3 9.3 3 6.4 5.3 4 8.2 4c1.7 0 3.2.8 4.1 2.1C13.2 4.8 14.7 4 16.4 4 19.3 4 21.6 6.4 21.6 9.3c0 4.3-4.8 8.1-8.2 10.9-.2.2-.5.3-.8.3Z" />
      </svg>
      <span className="w-8 h-px" style={{ background: '#E8A0AE' }} />
    </div>
  );
}

export function GreetingBlock({ state, style }: FullViewSectionProps) {
  const { info, textStyle, dividerStyle } = getDerived(state, style);
  const lovely = state.template === 'lovely-blush';

  if (lovely) {
    return (
      <div className="px-8">
        <div className="flex justify-center mb-4"><FloralSprig /></div>
        {info.mainPhrase && (
          <div className="text-center mb-8">
            <p className="font-serif whitespace-pre-line leading-loose" style={{ color: '#5B4A4E' }}>{info.mainPhrase}</p>
          </div>
        )}
        <HeartDivider />
      </div>
    );
  }

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
    <div className="px-8">
      <div className="h-px mb-10" style={dividerStyle} />
      <div
        className="mb-10 px-4 py-6 rounded-lg"
        style={lovely
          ? { background: '#FFFFFF', borderRadius: 26, boxShadow: '0 12px 28px rgba(91,74,78,0.09)' }
          : { background: style.sectionBg }}
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
              lovely ? { borderColor: '#E8A0AE', color: '#B65C6C', borderRadius: 999 }
              : style.isDark ? { borderColor: 'rgba(255,255,255,0.2)', color: style.text } : {}
            }
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

// 홀수번째 사진은 반시계, 짝수번째는 시계 방향으로 살짝 기울여 스크랩북/폴라로이드 느낌을 낸다.
const SCRAPBOOK_ROTATIONS = [-1.5, 1.5, -2, 1, -1, 2];

export function GalleryBlock({ state, style, onOpenLightbox }: FullViewSectionProps) {
  const { dividerStyle } = getDerived(state, style);
  const zoomPrevention = state.privacySettings.zoomPrevention;
  const lovely = state.template === 'lovely-blush';

  if (lovely) {
    return (
      <div className="px-8">
        <div className="h-px mb-10" style={dividerStyle} />
        {state.gallery.length > 1 && (
          <div className="mb-10 grid grid-cols-2 gap-4">
            {state.gallery.map((img, i) => (
              <div
                key={img.id}
                className="bg-white rounded-xl p-2 pb-4 shadow-[0_10px_20px_rgba(91,74,78,0.14)]"
                style={{ transform: `rotate(${SCRAPBOOK_ROTATIONS[i % SCRAPBOOK_ROTATIONS.length]}deg)` }}
              >
                <div
                  className={cn('relative aspect-square rounded-lg overflow-hidden', !zoomPrevention && 'cursor-pointer')}
                  onClick={() => !zoomPrevention && onOpenLightbox(i)}
                >
                  <Image src={img.url} alt="" fill sizes="160px" className="object-cover" />
                </div>
                {img.caption && (
                  <p className="text-center text-[10px] mt-2" style={{ color: '#9C8B90' }}>{img.caption}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

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
  const lovely = state.template === 'lovely-blush';

  return (
    <div className="px-8">
      <div
        className="mb-6 px-4 py-4 rounded-lg"
        style={lovely ? { background: '#FFFFFF', borderRadius: 22, boxShadow: '0 10px 24px rgba(91,74,78,0.08)' } : { background: style.sectionBg }}
      >
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
  const lovely = state.template === 'lovely-blush';
  return (
    <div className="px-8">
      <div className="mb-6">
        <AccountAccordion info={info} style={style} lovely={lovely} />
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
        lovely={state.template === 'lovely-blush'}
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
        lovely={state.template === 'lovely-blush'}
      />
    </div>
  );
}

export function ShareBlock({ state, style, invitationUrl }: FullViewSectionProps) {
  const { info } = getDerived(state, style);
  return (
    <div className="px-8">
      <div className="mb-10">
        <ShareSection
          shareSettings={state.shareSettings}
          weddingInfo={info}
          isDark={style.isDark}
          invitationUrl={invitationUrl}
          lovely={state.template === 'lovely-blush'}
        />
      </div>
    </div>
  );
}
