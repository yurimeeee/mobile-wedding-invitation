'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, Monitor, Phone, MapPin, ChevronDown, Heart, Music } from 'lucide-react';
import { type EditorState, type GalleryImage, type TemplateType, formatParentName } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { KakaoMapDisplay } from '@/components/editor/kakao-map';
import { WeddingCalendar } from '@/components/editor/wedding-calendar';
import { ShareSection } from '@/components/editor/share-section';
import { GuestMessageSection } from '@/components/invitation/guest-message-section';
import { RSVPSection } from '@/components/invitation/rsvp-section';
import Image from 'next/image';

interface InvitationPreviewProps {
  state: EditorState;
  invitationId: string;
}

// ─── Template configs ─────────────────────────────────────────────────────────
const templateConfig: Record<TemplateType, {
  bg: string
  text: string
  divider: string
  sectionBg: string
  isDark: boolean
}> = {
  'classic-elegant': {
    bg: '#FCFDF8',
    text: '#261C1D',
    divider: '#DDD2C8',
    sectionBg: 'rgba(0,0,0,0.04)',
    isDark: false,
  },
  'modern-minimal': {
    bg: '#FFFFFF',
    text: '#2D2D2D',
    divider: '#E5E5E5',
    sectionBg: 'rgba(0,0,0,0.04)',
    isDark: false,
  },
  'floral-romantic': {
    bg: '#F8F4EB',
    text: '#261C1D',
    divider: '#E1DBD5',
    sectionBg: 'rgba(0,0,0,0.04)',
    isDark: false,
  },
  'dark-luxury': {
    bg: '#181818',
    text: '#F5F5F0',
    divider: '#333',
    sectionBg: 'rgba(255,255,255,0.06)',
    isDark: true,
  },
  'korean-traditional': {
    bg: '#F8F4EB',
    text: '#261C1D',
    divider: '#E1DBD5',
    sectionBg: 'rgba(0,0,0,0.04)',
    isDark: false,
  },
};

export function InvitationPreview({ state, invitationId }: InvitationPreviewProps) {
  const [previewMode, setPreviewMode] = useState<'mobile' | 'desktop'>('mobile');
  const { template, weddingInfo: info, musicSettings } = state;
  const cfg = templateConfig[template];

  return (
    <div className="flex flex-col h-full">
      {/* Preview controls */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="font-medium">미리보기</h3>
        <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
          <Button variant={previewMode === 'mobile' ? 'default' : 'ghost'} size="sm" onClick={() => setPreviewMode('mobile')}>
            <Smartphone className="h-4 w-4 mr-1" />
            모바일
          </Button>
          <Button variant={previewMode === 'desktop' ? 'default' : 'ghost'} size="sm" onClick={() => setPreviewMode('desktop')}>
            <Monitor className="h-4 w-4 mr-1" />
            데스크탑
          </Button>
        </div>
      </div>

      {/* Preview area */}
      <div className="flex-1 overflow-auto p-4 bg-muted/30 flex items-start justify-center">
        <AnimatePresence mode="wait">
          {previewMode === 'mobile' ? (
            <motion.div key="mobile" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="phone-frame">
              <div className="phone-notch" />
              <div className="phone-screen w-[320px] h-[640px]" style={{ background: cfg.bg }}>
                <div className="w-full h-full overflow-y-auto">
                  <PreviewContent state={state} cfg={cfg} invitationId={invitationId} />
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="desktop"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl rounded-lg shadow-2xl overflow-auto border border-border"
              style={{ maxHeight: 'calc(100vh - 200px)', background: cfg.bg }}
            >
              <PreviewContent state={state} cfg={cfg} invitationId={invitationId} isDesktop />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Per-template hero sections ───────────────────────────────────────────────

function HeroClassicElegant({ info, mainImage, cfg }: { info: EditorState['weddingInfo']; mainImage: GalleryImage | null; cfg: typeof templateConfig['classic-elegant'] }) {
  const textStyle = { color: cfg.text }
  return (
    <div className="flex flex-col items-center pt-10 pb-4 px-6">
      <Image src="/assets/templates/type_1/save_the_date.svg" alt="save the date" width={106} height={40} className="mb-4" />
      <Image src="/assets/templates/type_1/wedding_day.svg" alt="wedding day" width={200} height={40} className="mb-8" />

      {/* Circular main image */}
      <div className="w-[200px] h-[288px] rounded-full overflow-hidden mb-8" style={{ background: 'rgba(0,0,0,0.08)' }}>
        {mainImage
          ? <img src={mainImage.url} alt="메인" className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center"><Heart className="w-10 h-10 opacity-10" /></div>
        }
      </div>

      <CoupleNames info={info} textStyle={textStyle} />
    </div>
  )
}

function HeroModernMinimal({ info, mainImage, cfg }: { info: EditorState['weddingInfo']; mainImage: GalleryImage | null; cfg: typeof templateConfig['modern-minimal'] }) {
  const textStyle = { color: cfg.text }
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-full">
        <Image src="/assets/templates/type_2/wedding_day.svg" alt="wedding day" width={200} height={40} className="absolute top-4 left-1/2 -translate-x-1/2 z-10" />
        {/* Full-width main image */}
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
  )
}

function HeroKoreanTraditional({ info, mainImage, cfg }: { info: EditorState['weddingInfo']; mainImage: GalleryImage | null; cfg: typeof templateConfig['korean-traditional'] }) {
  const textStyle = { color: cfg.text }
  const dateStr = info.weddingDate
  const [, mm, dd] = (dateStr || '').split('-')
  const dateOverlay = mm && dd ? `${mm}.${dd}` : ''

  return (
    <div className="flex flex-col items-center pt-10 pb-4 px-6">
      <Image src="/assets/templates/type_3/the_wedding_of.svg" alt="the wedding of" width={138} height={40} className="mb-8" />

      {/* Arch-shaped image */}
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
  )
}

function HeroFloralRomantic({ info, mainImage, cfg }: { info: EditorState['weddingInfo']; mainImage: GalleryImage | null; cfg: typeof templateConfig['floral-romantic'] }) {
  const textStyle = { color: cfg.text }
  return (
    <div className="flex flex-col items-center pt-10 pb-4 px-6">
      <Image src="/assets/templates/type_4/the_wedding_of.svg" alt="the wedding of" width={240} height={40} className="mb-4 relative z-10" />

      {/* Floral container */}
      <div className="relative w-full flex justify-center mb-10">
        <Image src="/assets/templates/type_4/flower_2.png" alt="" width={200} height={200}
          className="absolute -left-8 -top-12 pointer-events-none select-none" style={{ zIndex: 1 }} />
        <Image src="/assets/templates/type_4/flower_1.png" alt="" width={200} height={200}
          className="absolute -right-8 bottom-0 pointer-events-none select-none" style={{ zIndex: 1 }} />
        <Image src="/assets/templates/type_4/flower_3.png" alt="" width={120} height={120}
          className="absolute -left-6 bottom-8 pointer-events-none select-none" style={{ zIndex: 1 }} />

        {/* White-bordered image */}
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
  )
}

function HeroDarkLuxury({ info, mainImage, cfg }: { info: EditorState['weddingInfo']; mainImage: GalleryImage | null; cfg: typeof templateConfig['dark-luxury'] }) {
  const textStyle = { color: cfg.text }
  return (
    <div className="flex flex-col items-center pt-10 pb-4 px-6">
      <p className="text-xs tracking-[0.4em] mb-3" style={{ color: '#d4af37' }}>WEDDING</p>
      <div className="w-10 h-px mb-6" style={{ background: '#d4af37' }} />

      {/* Main image with gold border */}
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
  )
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function CoupleNames({ info, textStyle, accentColor }: {
  info: EditorState['weddingInfo']
  textStyle: React.CSSProperties
  accentColor?: string
}) {
  const groomKr = `${info.groomLastNameKr}${info.groomFirstNameKr}`
  const brideKr = `${info.brideLastNameKr}${info.brideFirstNameKr}`
  const first = info.brideFirst ? brideKr : groomKr
  const second = info.brideFirst ? groomKr : brideKr
  const firstEn = info.brideFirst ? info.brideFirstName : info.groomFirstName
  const secondEn = info.brideFirst ? info.groomFirstName : info.brideFirstName

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
  )
}

// ─── Main PreviewContent ──────────────────────────────────────────────────────

interface PreviewContentProps {
  state: EditorState
  cfg: typeof templateConfig['classic-elegant']
  invitationId: string
  isDesktop?: boolean
}

function PreviewContent({ state, cfg, invitationId, isDesktop }: PreviewContentProps) {
  const { template, weddingInfo: info, musicSettings } = state
  const mainImage = state.gallery.length > 0 ? state.gallery[0] : null
  const textStyle: React.CSSProperties = { color: cfg.text }
  const mutedStyle: React.CSSProperties = { color: cfg.text, opacity: 0.55 }
  const dividerStyle: React.CSSProperties = { background: cfg.divider }
  const sectionStyle: React.CSSProperties = { background: cfg.sectionBg }
  const groomParentsLine = `${formatParentName(info.groomFatherName, info.groomFatherDeceased, info.showDeceasedMark)} · ${formatParentName(info.groomMotherName, info.groomMotherDeceased, info.showDeceasedMark)}의 아들 ${info.groomLastNameKr}${info.groomFirstNameKr}`
  const brideParentsLine = `${formatParentName(info.brideFatherName, info.brideFatherDeceased, info.showDeceasedMark)} · ${formatParentName(info.brideMotherName, info.brideMotherDeceased, info.showDeceasedMark)}의 딸 ${info.brideLastNameKr}${info.brideFirstNameKr}`

  return (
    <div style={{ color: cfg.text }}>
      {/* Template-specific hero */}
      {template === 'classic-elegant'    && <HeroClassicElegant    info={info} mainImage={mainImage} cfg={cfg} />}
      {template === 'modern-minimal'     && <HeroModernMinimal     info={info} mainImage={mainImage} cfg={cfg} />}
      {template === 'korean-traditional' && <HeroKoreanTraditional info={info} mainImage={mainImage} cfg={cfg} />}
      {template === 'floral-romantic'    && <HeroFloralRomantic    info={info} mainImage={mainImage} cfg={cfg} />}
      {template === 'dark-luxury'        && <HeroDarkLuxury        info={info} mainImage={mainImage} cfg={cfg} />}

      {/* Divider */}
      <div className="h-px mx-8 mb-8" style={dividerStyle} />

      {/* Main phrase */}
      {info.mainPhrase && (
        <div className="text-center px-8 mb-10">
          <p className="font-serif whitespace-pre-line leading-loose text-sm" style={textStyle}>{info.mainPhrase}</p>
        </div>
      )}

      {/* Divider */}
      <div className="h-px mx-8 mb-8" style={dividerStyle} />

      {/* Calendar */}
      <div className="mx-4 mb-8 px-4 py-5 rounded-lg" style={sectionStyle}>
        <WeddingCalendar
          weddingDate={info.weddingDate}
          weddingTime={info.weddingTime}
          settings={state.calendarSettings}
          isDark={cfg.isDark}
        />
      </div>

      {/* Parents */}
      <div className="text-center px-6 mb-8 space-y-1.5">
        {(info.brideFirst ? [brideParentsLine, groomParentsLine] : [groomParentsLine, brideParentsLine]).map((line, i) => (
          <p key={i} className="text-xs" style={mutedStyle}>{line}</p>
        ))}
      </div>

      {/* Divider */}
      <div className="h-px mx-8 mb-8" style={dividerStyle} />

      {/* Gallery strip */}
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

      {/* Venue */}
      <div className="mx-4 mb-6 px-4 py-4 rounded-lg" style={sectionStyle}>
        <div className="flex items-start gap-2 mb-3">
          <MapPin className="h-4 w-4 mt-0.5 shrink-0" style={{ color: cfg.isDark ? '#d4af37' : '#c47a85' }} />
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
          isDark={cfg.isDark}
        />
      </div>

      {/* Bank accounts */}
      <div className="mx-4 mb-6 px-4 py-3 rounded-lg" style={sectionStyle}>
        <button className="flex items-center justify-between w-full">
          <span className="text-sm font-medium" style={textStyle}>축하의 마음을 전하세요</span>
          <ChevronDown className="h-4 w-4" style={mutedStyle} />
        </button>
      </div>

      {/* Contact buttons */}
      <div className="flex gap-2 mx-4 mb-6">
        <Button
          variant="outline" size="sm"
          className="flex-1 text-xs"
          style={cfg.isDark ? { borderColor: 'rgba(255,255,255,0.2)', color: cfg.text } : {}}
        >
          <Phone className="h-3 w-3 mr-1" />{info.brideFirst ? '신부측 연락' : '신랑측 연락'}
        </Button>
        <Button
          variant="outline" size="sm"
          className="flex-1 text-xs"
          style={cfg.isDark ? { borderColor: 'rgba(255,255,255,0.2)', color: cfg.text } : {}}
        >
          <Phone className="h-3 w-3 mr-1" />{info.brideFirst ? '신랑측 연락' : '신부측 연락'}
        </Button>
      </div>

      {/* RSVP */}
      {invitationId && (
        <div className="mx-4">
          <RSVPSection
            invitationId={invitationId}
            textStyle={textStyle}
            mutedStyle={mutedStyle}
            sectionBg={cfg.sectionBg}
            accentColor={cfg.isDark ? '#d4af37' : '#c47a85'}
          />
        </div>
      )}

      {/* Guest messages */}
      {invitationId && (
        <div className="mx-4">
          <GuestMessageSection
            invitationId={invitationId}
            textStyle={textStyle}
            mutedStyle={mutedStyle}
            sectionBg={cfg.sectionBg}
            accentColor={cfg.isDark ? '#d4af37' : '#c47a85'}
          />
        </div>
      )}

      {/* Share */}
      <div className="mx-4 mb-8">
        <ShareSection shareSettings={state.shareSettings} weddingInfo={info} isDark={cfg.isDark} />
      </div>

      {/* Music indicator */}
      {musicSettings.enabled && (
        <div
          className="fixed bottom-4 right-4 p-2 rounded-full shadow-lg"
          style={{ background: cfg.isDark ? '#2a2a2a' : 'white' }}
        >
          <Music className="h-4 w-4" style={textStyle} />
        </div>
      )}

      {/* Footer */}
      <div className="h-px mx-8 mb-6" style={dividerStyle} />
      <p className="text-center text-[10px] pb-8" style={{ color: cfg.text, opacity: 0.3 }}>WedInvite로 만들었어요</p>
    </div>
  );
}
