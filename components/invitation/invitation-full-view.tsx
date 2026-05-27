'use client'

import { type EditorState, type GalleryImage, type TemplateType } from '@/lib/types'
import { KakaoMapDisplay } from '@/components/editor/kakao-map'
import { WeddingCalendar } from '@/components/editor/wedding-calendar'
import { ShareSection } from '@/components/editor/share-section'
import Image from 'next/image'
import { MapPin, Phone, ChevronDown, Music, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface InvitationFullViewProps {
  state: EditorState
  invitationId: string
}

const templateConfig: Record<TemplateType, {
  bg: string
  text: string
  divider: string
  sectionBg: string
  isDark: boolean
}> = {
  'classic-elegant': { bg: '#FCFDF8', text: '#261C1D', divider: '#DDD2C8', sectionBg: 'rgba(0,0,0,0.04)', isDark: false },
  'modern-minimal':  { bg: '#FFFFFF',  text: '#2D2D2D', divider: '#E5E5E5', sectionBg: 'rgba(0,0,0,0.04)', isDark: false },
  'floral-romantic': { bg: '#F8F4EB', text: '#261C1D', divider: '#E1DBD5', sectionBg: 'rgba(0,0,0,0.04)', isDark: false },
  'dark-luxury':     { bg: '#181818', text: '#F5F5F0', divider: '#333',    sectionBg: 'rgba(255,255,255,0.06)', isDark: true },
  'korean-traditional': { bg: '#F8F4EB', text: '#261C1D', divider: '#E1DBD5', sectionBg: 'rgba(0,0,0,0.04)', isDark: false },
}

// ─── Hero components ──────────────────────────────────────────────────────────

function HeroClassicElegant({ info, mainImage }: { info: EditorState['weddingInfo']; mainImage: GalleryImage | null }) {
  return (
    <div className="flex flex-col items-center pt-12 pb-6 px-8">
      <Image src="/assets/templates/type_1/save_the_date.svg" alt="save the date" width={106} height={40} className="mb-5" />
      <Image src="/assets/templates/type_1/wedding_day.svg" alt="wedding day" width={230} height={40} className="mb-10" />
      <div className="w-[250px] h-[362px] rounded-full overflow-hidden mb-10" style={{ background: 'rgba(0,0,0,0.06)' }}>
        {mainImage
          ? <img src={mainImage.url} alt="메인" className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center"><Heart className="w-12 h-12 opacity-10" /></div>}
      </div>
      <CoupleNames info={info} color="#261C1D" />
    </div>
  )
}

function HeroModernMinimal({ info, mainImage }: { info: EditorState['weddingInfo']; mainImage: GalleryImage | null }) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-full">
        <Image src="/assets/templates/type_2/wedding_day.svg" alt="wedding day" width={230} height={40}
          className="absolute top-5 left-1/2 -translate-x-1/2 z-10" />
        <div className="w-full aspect-[3/4] overflow-hidden" style={{ background: 'rgba(0,0,0,0.06)' }}>
          {mainImage
            ? <img src={mainImage.url} alt="메인" className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center"><Heart className="w-12 h-12 opacity-10" /></div>}
        </div>
      </div>
      <div className="pt-10 pb-6 px-8 w-full">
        <CoupleNames info={info} color="#2D2D2D" />
      </div>
    </div>
  )
}

function HeroKoreanTraditional({ info, mainImage }: { info: EditorState['weddingInfo']; mainImage: GalleryImage | null }) {
  const [, mm, dd] = (info.weddingDate || '').split('-')
  const dateOverlay = mm && dd ? `${mm}.${dd}` : ''
  return (
    <div className="flex flex-col items-center pt-12 pb-6 px-8">
      <Image src="/assets/templates/type_3/the_wedding_of.svg" alt="the wedding of" width={138} height={40} className="mb-10" />
      <div className="relative overflow-hidden mb-12" style={{
        width: 320, height: 428, borderTopLeftRadius: 180, borderTopRightRadius: 180, background: 'rgba(0,0,0,0.06)',
      }}>
        {mainImage
          ? <img src={mainImage.url} alt="메인" className="w-full h-full object-cover" />
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
  )
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
        <div className="relative overflow-hidden" style={{
          width: 218, border: '10px solid white', zIndex: 2,
          boxShadow: '0 10px 10px rgba(99,99,99,0), 0 6px 6px rgba(88,88,88,0.082)',
        }}>
          {mainImage
            ? <img src={mainImage.url} alt="메인" className="w-full h-auto" />
            : <div className="w-full aspect-[3/4] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.06)' }}>
                <Heart className="w-10 h-10 opacity-10" />
              </div>}
        </div>
      </div>
      <CoupleNames info={info} color="#261C1D" />
    </div>
  )
}

function HeroDarkLuxury({ info, mainImage }: { info: EditorState['weddingInfo']; mainImage: GalleryImage | null }) {
  return (
    <div className="flex flex-col items-center pt-12 pb-6 px-8">
      <p className="text-xs tracking-[0.4em] mb-4" style={{ color: '#d4af37' }}>WEDDING</p>
      <div className="w-10 h-px mb-8" style={{ background: '#d4af37' }} />
      <div className="w-[250px] h-[362px] overflow-hidden mb-10" style={{ border: '1px solid #d4af37', background: 'rgba(255,255,255,0.04)' }}>
        {mainImage
          ? <img src={mainImage.url} alt="메인" className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center"><Heart className="w-12 h-12" style={{ color: '#d4af37', opacity: 0.3 }} /></div>}
      </div>
      <CoupleNames info={info} color="#F5F5F0" accentColor="#d4af37" />
    </div>
  )
}

function CoupleNames({ info, color, accentColor }: { info: EditorState['weddingInfo']; color: string; accentColor?: string }) {
  return (
    <div className="text-center space-y-1.5">
      <h1 className="font-serif text-2xl" style={{ color }}>
        {info.groomLastNameKr}{info.groomFirstNameKr}
        <span className="mx-3 font-light" style={{ color: accentColor || '#c47a85' }}>·</span>
        {info.brideLastNameKr}{info.brideFirstNameKr}
      </h1>
      <p className="text-sm tracking-widest" style={{ color, opacity: 0.5 }}>
        {info.groomFirstName} & {info.brideFirstName}
      </p>
    </div>
  )
}

// ─── Account accordion ────────────────────────────────────────────────────────
function AccountSection({ info, cfg }: { info: EditorState['weddingInfo']; cfg: typeof templateConfig['classic-elegant'] }) {
  const [open, setOpen] = useState(false)
  const textStyle = { color: cfg.text }
  const mutedStyle = { color: cfg.text, opacity: 0.55 }

  return (
    <div className="rounded-lg px-4 py-3" style={{ background: cfg.sectionBg }}>
      <button className="flex items-center justify-between w-full" onClick={() => setOpen(v => !v)}>
        <span className="text-sm font-medium" style={textStyle}>축하의 마음을 전하세요</span>
        <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} style={mutedStyle} />
      </button>
      {open && (
        <div className="mt-4 space-y-3">
          {info.groomBankName && (
            <div className="flex justify-between items-center text-sm">
              <span style={mutedStyle}>신랑 {info.groomLastNameKr}{info.groomFirstNameKr}</span>
              <span style={textStyle}>{info.groomBankName} {info.groomBankAccount}</span>
            </div>
          )}
          {info.brideBankName && (
            <div className="flex justify-between items-center text-sm">
              <span style={mutedStyle}>신부 {info.brideLastNameKr}{info.brideFirstNameKr}</span>
              <span style={textStyle}>{info.brideBankName} {info.brideBankAccount}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main full view ───────────────────────────────────────────────────────────
export function InvitationFullView({ state, invitationId }: InvitationFullViewProps) {
  const { template, weddingInfo: info, musicSettings } = state
  const cfg = templateConfig[template]
  const mainImage = state.gallery.length > 0 ? state.gallery[0] : null
  const textStyle = { color: cfg.text }
  const mutedStyle = { color: cfg.text, opacity: 0.55 }
  const dividerStyle = { background: cfg.divider }
  const invitationUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/invitation/${invitationId}`
    : ''

  return (
    <div className="min-h-screen max-w-[393px] mx-auto" style={{ background: cfg.bg, color: cfg.text }}>
      {/* Hero */}
      {template === 'classic-elegant'    && <HeroClassicElegant    info={info} mainImage={mainImage} />}
      {template === 'modern-minimal'     && <HeroModernMinimal     info={info} mainImage={mainImage} />}
      {template === 'korean-traditional' && <HeroKoreanTraditional info={info} mainImage={mainImage} />}
      {template === 'floral-romantic'    && <HeroFloralRomantic    info={info} mainImage={mainImage} />}
      {template === 'dark-luxury'        && <HeroDarkLuxury        info={info} mainImage={mainImage} />}

      <div className="px-8">
        {/* Divider */}
        <div className="h-px mb-10" style={dividerStyle} />

        {/* Main phrase */}
        {info.mainPhrase && (
          <div className="text-center mb-10">
            <p className="font-serif whitespace-pre-line leading-loose" style={textStyle}>{info.mainPhrase}</p>
          </div>
        )}

        <div className="h-px mb-10" style={dividerStyle} />

        {/* Calendar */}
        <div className="mb-10 px-4 py-6 rounded-lg" style={{ background: cfg.sectionBg }}>
          <WeddingCalendar
            weddingDate={info.weddingDate}
            weddingTime={info.weddingTime}
            settings={state.calendarSettings}
            isDark={cfg.isDark}
          />
        </div>

        {/* Parents */}
        <div className="text-center mb-10 space-y-2">
          <p className="text-sm" style={mutedStyle}>
            {info.groomFatherName} · {info.groomMotherName}의 아들 {info.groomLastNameKr}{info.groomFirstNameKr}
          </p>
          <p className="text-sm" style={mutedStyle}>
            {info.brideFatherName} · {info.brideMotherName}의 딸 {info.brideLastNameKr}{info.brideFirstNameKr}
          </p>
        </div>

        <div className="h-px mb-10" style={dividerStyle} />

        {/* Gallery */}
        {state.gallery.length > 1 && (
          <div className="mb-10">
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
        <div className="mb-6 px-4 py-4 rounded-lg" style={{ background: cfg.sectionBg }}>
          <div className="flex items-start gap-2 mb-3">
            <MapPin className="h-4 w-4 mt-0.5 shrink-0" style={{ color: cfg.isDark ? '#d4af37' : '#c47a85' }} />
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
            isDark={cfg.isDark}
          />
        </div>

        {/* Account */}
        <div className="mb-6">
          <AccountSection info={info} cfg={cfg} />
        </div>

        {/* Contact */}
        <div className="flex gap-2 mb-10">
          {info.groomContact && (
            <a href={`tel:${info.groomContact}`} className="flex-1">
              <Button variant="outline" size="sm" className="w-full"
                style={cfg.isDark ? { borderColor: 'rgba(255,255,255,0.2)', color: cfg.text } : {}}>
                <Phone className="h-3 w-3 mr-1" />신랑측 연락
              </Button>
            </a>
          )}
          {info.brideContact && (
            <a href={`tel:${info.brideContact}`} className="flex-1">
              <Button variant="outline" size="sm" className="w-full"
                style={cfg.isDark ? { borderColor: 'rgba(255,255,255,0.2)', color: cfg.text } : {}}>
                <Phone className="h-3 w-3 mr-1" />신부측 연락
              </Button>
            </a>
          )}
        </div>

        {/* Share */}
        <div className="mb-10">
          <ShareSection
            shareSettings={state.shareSettings}
            weddingInfo={info}
            isDark={cfg.isDark}
            invitationUrl={invitationUrl}
          />
        </div>

        {/* Footer */}
        <div className="h-px mb-6" style={dividerStyle} />
        <p className="text-center text-xs pb-10" style={{ color: cfg.text, opacity: 0.3 }}>WedInvite로 만들었어요</p>
      </div>

      {/* BGM indicator */}
      {musicSettings.enabled && (
        <div className="fixed bottom-6 right-6 p-3 rounded-full shadow-lg"
          style={{ background: cfg.isDark ? '#2a2a2a' : 'white' }}>
          <Music className="h-5 w-5" style={textStyle} />
        </div>
      )}
    </div>
  )
}
