'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, Monitor, Phone, MapPin, Calendar, MessageSquare, Copy, Share2, Music, ChevronDown, Heart } from 'lucide-react';
import { type EditorState, type GalleryImage } from '@/lib/types';
import { type TemplateType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { KakaoMapDisplay } from '@/components/editor/kakao-map';

interface InvitationPreviewProps {
  state: EditorState;
}

const templateStyles: Record<TemplateType, { bg: string; text: string; accent: string }> = {
  'classic-elegant': {
    bg: 'bg-gradient-to-b from-amber-50 to-amber-100/50',
    text: 'text-amber-950',
    accent: 'bg-amber-800',
  },
  'modern-minimal': {
    bg: 'bg-white',
    text: 'text-gray-900',
    accent: 'bg-gray-900',
  },
  'floral-romantic': {
    bg: 'bg-gradient-to-b from-rose-50 to-white',
    text: 'text-rose-950',
    accent: 'bg-rose-400',
  },
  'dark-luxury': {
    bg: 'bg-gradient-to-b from-gray-900 to-gray-950',
    text: 'text-white',
    accent: 'bg-amber-400',
  },
  'korean-traditional': {
    bg: 'bg-gradient-to-b from-orange-50 to-amber-50',
    text: 'text-amber-950',
    accent: 'bg-red-700',
  },
};

export function InvitationPreview({ state }: InvitationPreviewProps) {
  const [previewMode, setPreviewMode] = useState<'mobile' | 'desktop'>('mobile');
  const { template, weddingInfo: info, musicSettings } = state;
  const styles = templateStyles[template];

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    });
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const period = hour >= 12 ? '오후' : '오전';
    const displayHour = hour > 12 ? hour - 12 : hour;
    return `${period} ${displayHour}시${minutes !== '00' ? ` ${minutes}분` : ''}`;
  };

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
              <div className={cn('phone-screen w-[320px] h-[640px]', styles.bg)}>
                <div className="w-full h-full overflow-y-auto">
                  <PreviewContent
                    info={info}
                    styles={styles}
                    formatDate={formatDate}
                    formatTime={formatTime}
                    template={template}
                    musicSettings={musicSettings}
                    gallery={state.gallery}
                  />
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="desktop"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={cn('w-full max-w-2xl rounded-lg shadow-2xl overflow-auto border border-border', styles.bg)}
              style={{ maxHeight: 'calc(100vh - 200px)' }}
            >
              <PreviewContent
                info={info}
                styles={styles}
                formatDate={formatDate}
                formatTime={formatTime}
                template={template}
                musicSettings={musicSettings}
                gallery={state.gallery}
                isDesktop
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

interface PreviewContentProps {
  info: EditorState['weddingInfo'];
  styles: { bg: string; text: string; accent: string };
  formatDate: (date: string) => string;
  formatTime: (time: string) => string;
  template: TemplateType;
  musicSettings: EditorState['musicSettings'];
  gallery: GalleryImage[];
  isDesktop?: boolean;
}

function PreviewContent({ info, styles, formatDate, formatTime, template, musicSettings, gallery, isDesktop }: PreviewContentProps) {
  const isDark = template === 'dark-luxury';
  const mainImage = gallery.length > 0 ? gallery[0] : null;

  return (
    <div className={cn('min-h-full', styles.text)}>
      {/* Header */}
      <div className={cn('text-center py-8', isDesktop ? 'py-12' : '')}>
        <p className={cn('text-xs tracking-[0.3em] mb-3', isDark ? 'text-gray-400' : 'opacity-60')}>청첩장</p>
        <div className={cn('w-12 h-px mx-auto mb-6', styles.accent)} />

        {/* Names */}
        <h1 className={cn('font-serif mb-2', isDesktop ? 'text-3xl' : 'text-xl')}>
          {info.groomLastNameKr}
          {info.groomFirstNameKr} & {info.brideLastNameKr}
          {info.brideFirstNameKr}
        </h1>
        <p className={cn('text-sm', isDark ? 'text-gray-400' : 'opacity-60')}>
          {info.groomFirstName} & {info.brideFirstName}
        </p>
      </div>

      {/* Main photo */}
      <div className={cn('mx-4 aspect-square rounded-lg overflow-hidden mb-8', isDark ? 'bg-gray-800' : 'bg-black/5')}>
        {mainImage ? (
          <img src={mainImage.url} alt="대표 사진" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Heart className={cn('h-12 w-12', isDark ? 'text-gray-700' : 'text-black/10')} />
          </div>
        )}
      </div>

      {/* Main phrase */}
      <div className="text-center px-6 mb-8">
        <p className={cn('font-serif whitespace-pre-line leading-relaxed', isDesktop ? 'text-lg' : 'text-sm')}>{info.mainPhrase}</p>
      </div>

      {/* Date & Time */}
      <div className={cn('mx-4 p-4 rounded-lg text-center mb-6', isDark ? 'bg-white/5' : 'bg-black/5')}>
        <div className="flex items-center justify-center gap-2 mb-2">
          <Calendar className="h-4 w-4" />
          <span className="font-medium">{formatDate(info.weddingDate)}</span>
        </div>
        <p className={cn('text-sm', isDark ? 'text-gray-400' : 'opacity-70')}>{formatTime(info.weddingTime)}</p>
      </div>

      {/* Venue */}
      <div className={cn('mx-4 p-4 rounded-lg mb-6', isDark ? 'bg-white/5' : 'bg-black/5')}>
        <div className="flex items-start gap-3 mb-3">
          <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">{info.ceremonyHall}</p>
            <p className={cn('text-sm', isDark ? 'text-gray-400' : 'opacity-70')}>{info.venue}</p>
            <p className={cn('text-xs mt-1', isDark ? 'text-gray-500' : 'opacity-50')}>{info.address}</p>
          </div>
        </div>
        <KakaoMapDisplay address={info.address} latitude={info.latitude} longitude={info.longitude} venueName={info.ceremonyHall} isDark={isDark} />
      </div>

      {/* Parents */}
      <div className="text-center px-6 mb-8">
        <p className={cn('text-sm mb-3', isDark ? 'text-gray-400' : 'opacity-60')}>
          {info.groomFatherName} · {info.groomMotherName}
          <span className={cn('mx-2', isDark ? 'text-gray-600' : 'opacity-40')}>|</span>
          {'의 아들 '}
          {info.groomFirstNameKr}
        </p>
        <p className={cn('text-sm', isDark ? 'text-gray-400' : 'opacity-60')}>
          {info.brideFatherName} · {info.brideMotherName}
          <span className={cn('mx-2', isDark ? 'text-gray-600' : 'opacity-40')}>|</span>
          {'의 딸 '}
          {info.brideFirstNameKr}
        </p>
      </div>

      {/* Bank accounts */}
      <div className={cn('mx-4 p-4 rounded-lg mb-6', isDark ? 'bg-white/5' : 'bg-black/5')}>
        <button className="flex items-center justify-between w-full">
          <span className="font-medium">{'축하의 마음을 전하세요'}</span>
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>

      {/* Contact buttons */}
      <div className="flex gap-2 mx-4 mb-6">
        <Button variant="outline" size="sm" className={cn('flex-1', isDark ? 'border-white/20 text-white hover:bg-white/10' : '')}>
          <Phone className="h-3 w-3 mr-1" />
          {'신랑측 연락'}
        </Button>
        <Button variant="outline" size="sm" className={cn('flex-1', isDark ? 'border-white/20 text-white hover:bg-white/10' : '')}>
          <Phone className="h-3 w-3 mr-1" />
          {'신부측 연락'}
        </Button>
      </div>

      {/* RSVP */}
      <div className={cn('mx-4 p-4 rounded-lg text-center mb-6', styles.accent, 'text-white')}>
        <MessageSquare className="h-5 w-5 mx-auto mb-2" />
        <p className="font-medium text-sm">{'참석 여부를 알려주세요'}</p>
        <p className="text-xs opacity-80 mt-1">RSVP</p>
      </div>

      {/* Share buttons */}
      <div className="flex gap-2 mx-4 mb-8">
        <Button variant="outline" size="sm" className={cn('flex-1', isDark ? 'border-white/20 text-white hover:bg-white/10' : '')}>
          <Copy className="h-3 w-3 mr-1" />
          {'링크 복사'}
        </Button>
        <Button variant="outline" size="sm" className={cn('flex-1', isDark ? 'border-white/20 text-white hover:bg-white/10' : '')}>
          <Share2 className="h-3 w-3 mr-1" />
          {'카카오톡'}
        </Button>
      </div>

      {/* Music indicator */}
      {musicSettings.enabled && (
        <div className={cn('fixed bottom-4 right-4 p-2 rounded-full shadow-lg', isDark ? 'bg-gray-800' : 'bg-white')}>
          <Music className={cn('h-4 w-4', isDark ? 'text-white' : '')} />
        </div>
      )}

      {/* Footer */}
      <div className={cn('text-center py-6', isDark ? 'text-gray-600' : 'opacity-40')}>
        <p className="text-xs">WedInvite로 만들었어요</p>
      </div>
    </div>
  );
}
