'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Check, Eye, FileText, Image, Loader2, MoreVertical, Music, Palette, Save, Settings, Share2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { GalleryUploader } from '@/components/editor/gallery-uploader';
import { InvitationPreview } from '@/components/editor/invitation-preview';
import Link from 'next/link';
import { Logo } from '@/components/logo';
import { MusicControls } from '@/components/editor/music-controls';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TemplateSelector } from '@/components/editor/template-selector';
import { WeddingInfoForm } from '@/components/editor/wedding-info-form';
import { ShareSettingsForm } from '@/components/editor/share-settings-form';
import { auth } from '@/lib/firebase';
import { cn } from '@/lib/utils';
import { createNewInvitation } from '@/lib/invitation-service';
import { onAuthStateChanged } from 'firebase/auth';
import { useEditorState } from '@/hooks/use-editor-state';
import { useIsMobile } from '@/hooks/use-mobile';

export default function EditorPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = params.id as string;

  const [invitationId, setInvitationId] = useState<string>(rawId === 'new' ? '' : rawId);
  const [isCreating, setIsCreating] = useState(rawId === 'new');

  // Create new invitation doc and redirect to its ID
  useEffect(() => {
    if (rawId !== 'new') return;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push('/login');
        return;
      }
      createNewInvitation(user.uid).then((newId) => {
        setInvitationId(newId);
        setIsCreating(false);
        router.replace(`/editor/${newId}`);
      });
      unsubscribe();
    });
    return () => unsubscribe();
  }, [rawId, router]);

  const isMobile = useIsMobile();
  const [mobileTab, setMobileTab] = useState<'edit' | 'preview' | 'templates'>('edit');
  const [activeSection, setActiveSection] = useState('template');

  const {
    state,
    isSaving,
    lastSaved,
    isLoading,
    isActionLoading,
    saveDraft,
    publish,
    setTemplate,
    updateWeddingInfo,
    setMusicSettings,
    addGalleryImage,
    removeGalleryImage,
    reorderGallery,
    updateCalendarSettings,
    updateShareSettings,
  } = useEditorState(invitationId);

  const sections = [
    { id: 'template', label: '템플릿', icon: Palette },
    { id: 'info', label: '정보', icon: FileText },
    { id: 'gallery', label: '갤러리', icon: Image },
    { id: 'music', label: '음악', icon: Music },
    { id: 'share', label: '공유', icon: Share2 },
  ];

  const SaveStatus = () => (
    <div className="flex items-center gap-1 text-sm text-muted-foreground">
      {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
      {!isSaving && lastSaved && <Check className="h-4 w-4 text-green-500" />}
      <span>{isSaving ? '저장 중...' : lastSaved ? `${lastSaved.toLocaleTimeString()} 저장됨` : ''}</span>
    </div>
  );

  if (isCreating || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>{isCreating ? '새 청첩장을 만드는 중...' : '불러오는 중...'}</span>
        </div>
      </div>
    );
  }

  // Mobile layout
  if (isMobile) {
    return (
      <div className="h-screen flex flex-col bg-background overflow-hidden">
        <header className="sticky top-0 z-50 glass border-b border-border">
          <div className="flex items-center justify-between px-4 h-14">
            <Link href="/dashboard" className="flex items-center gap-2">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <SaveStatus />
            <Button size="sm" onClick={publish} disabled={isActionLoading}>
              {isActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : '발행'}
            </Button>
          </div>
        </header>

        <div className="border-b border-border">
          <div className="flex">
            {(['edit', 'preview', 'templates'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setMobileTab(tab)}
                className={cn('flex-1 py-3 text-sm font-medium transition-colors relative', mobileTab === tab ? 'text-foreground' : 'text-muted-foreground')}
              >
                {{ edit: '편집', preview: '미리보기', templates: '템플릿' }[tab]}
                {mobileTab === tab && <motion.div layoutId="mobile-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <AnimatePresence mode="wait">
            {mobileTab === 'edit' && (
              <motion.div key="edit" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="p-4 space-y-6">
                <WeddingInfoForm info={state.weddingInfo} onChange={updateWeddingInfo} calendarSettings={state.calendarSettings} onCalendarChange={updateCalendarSettings} />
                <MusicControls settings={state.musicSettings} onChange={setMusicSettings} />
                <GalleryUploader images={state.gallery} onAdd={addGalleryImage} onRemove={removeGalleryImage} onReorder={reorderGallery} />
                <ShareSettingsForm
                  shareSettings={state.shareSettings}
                  calendarSettings={state.calendarSettings}
                  onShareChange={updateShareSettings}
                  onCalendarChange={updateCalendarSettings}
                />
              </motion.div>
            )}
            {mobileTab === 'preview' && (
              <motion.div key="preview" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="h-full">
                <InvitationPreview state={state} />
              </motion.div>
            )}
            {mobileTab === 'templates' && (
              <motion.div key="templates" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="p-4">
                <TemplateSelector selected={state.template} onSelect={setTemplate} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // Desktop layout
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-50 glass border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-5 w-5" />
              <span className="text-sm">돌아가기</span>
            </Link>
            <div className="h-4 w-px bg-border" />
            <Link href="/" className="flex items-center gap-2">
              <Logo width={120} height={20} />
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <SaveStatus />

            <div className="h-4 w-px bg-border" />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  설정
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Eye className="mr-2 h-4 w-4" />
                  전체 화면 미리보기
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Share2 className="mr-2 h-4 w-4" />
                  임시저장 공유
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="outline" size="sm" onClick={saveDraft} disabled={isActionLoading}>
              {isActionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
              임시저장
            </Button>

            <Button size="sm" onClick={publish} disabled={isActionLoading}>
              {isActionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              발행
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex">
        <div className="w-[420px] border-r border-border flex flex-col">
          <div className="border-b border-border">
            <Tabs value={activeSection} onValueChange={setActiveSection}>
              <TabsList className="w-full justify-start h-auto p-1 bg-transparent gap-1">
                {sections.map((section) => (
                  <TabsTrigger key={section.id} value={section.id} className="flex items-center gap-1.5 data-[state=active]:bg-muted">
                    <section.icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{section.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-4">
              <Tabs value={activeSection} onValueChange={setActiveSection}>
                <TabsContent value="template" className="mt-0">
                  <TemplateSelector selected={state.template} onSelect={setTemplate} />
                </TabsContent>
                <TabsContent value="info" className="mt-0">
                  <WeddingInfoForm info={state.weddingInfo} onChange={updateWeddingInfo} calendarSettings={state.calendarSettings} onCalendarChange={updateCalendarSettings} />
                </TabsContent>
                <TabsContent value="gallery" className="mt-0">
                  <GalleryUploader images={state.gallery} onAdd={addGalleryImage} onRemove={removeGalleryImage} onReorder={reorderGallery} />
                </TabsContent>
                <TabsContent value="music" className="mt-0">
                  <MusicControls settings={state.musicSettings} onChange={setMusicSettings} />
                </TabsContent>
                <TabsContent value="share" className="mt-0">
                  <ShareSettingsForm
                    shareSettings={state.shareSettings}
                    calendarSettings={state.calendarSettings}
                    onShareChange={updateShareSettings}
                    onCalendarChange={updateCalendarSettings}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </ScrollArea>
        </div>

        <div className="flex-1 bg-muted/30">
          <InvitationPreview state={state} />
        </div>
      </div>
    </div>
  );
}
