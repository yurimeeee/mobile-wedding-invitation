'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Check, Eye, FileText, Image, ListOrdered, Loader2, MoreVertical, Music, Palette, Redo2, Save, Settings, Share2, Sticker, Link as LinkIcon, Copy, Undo2, X, Lock } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useParams, useRouter, useSearchParams } from 'next/navigation';

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
import { PrivacySettingsForm } from '@/components/editor/privacy-settings-form';
import { EditorSettingsDialog } from '@/components/editor/editor-settings-dialog';
import { SectionReorderList } from '@/components/editor/custom/section-reorder-list';
import { ElementPanel } from '@/components/editor/custom/element-panel';
import { BackgroundPicker } from '@/components/editor/custom/background-picker';
import { defaultCustomLayout } from '@/lib/types';
import { templateConfig } from '@/lib/preview-style';
import { auth } from '@/lib/firebase';
import { cn } from '@/lib/utils';
import { createNewInvitation } from '@/lib/invitation-service';
import { onAuthStateChanged } from 'firebase/auth';
import { useEditorState } from '@/hooks/use-editor-state';
import { useIsMobile } from '@/hooks/use-mobile';

export default function EditorPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawId = params.id as string;
  const startCustom = searchParams.get('start') === 'custom';

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
  const [activeSection, setActiveSection] = useState(startCustom ? 'elements' : 'template');
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [fullscreenPreview, setFullscreenPreview] = useState(false);

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
    updatePrivacySettings,
    updateSlug,
    reorderSections,
    toggleSectionVisibility,
    setBackground,
    addFreeElement,
    updateFreeElement,
    removeFreeElement,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useEditorState(invitationId);

  // Cmd/Ctrl+Z undo, Cmd/Ctrl+Shift+Z redo — skipped while typing so native
  // text-field undo isn't hijacked.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== 'z') return
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable) return;
      e.preventDefault();
      if (e.shiftKey) redo(); else undo();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo]);

  const sections = [
    { id: 'template', label: '템플릿', icon: Palette },
    { id: 'info', label: '정보', icon: FileText },
    { id: 'order', label: '순서', icon: ListOrdered },
    { id: 'elements', label: '요소', icon: Sticker },
    { id: 'gallery', label: '갤러리', icon: Image },
    { id: 'music', label: '음악', icon: Music },
    { id: 'share', label: '공유', icon: Share2 },
    { id: 'privacy', label: '보안', icon: Lock },
  ];

  const handlePublish = async () => {
    const id = await publish();
    if (id) {
      const identifier = state.slug || id;
      const url = `${window.location.origin}/invitation/${identifier}`;
      setPublishedUrl(url);
    }
  };

  const handleCopyLink = async () => {
    if (!publishedUrl) return;
    try {
      await navigator.clipboard.writeText(publishedUrl);
      toast.success('링크가 복사되었습니다');
    } catch {
      toast.error('복사에 실패했습니다');
    }
  };

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
          <div className="flex items-center justify-between px-4 h-14 gap-2">
            <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex items-center gap-1 shrink-0">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={undo} disabled={!canUndo} aria-label="실행 취소">
                <Undo2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={redo} disabled={!canRedo} aria-label="다시 실행">
                <Redo2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 min-w-0 flex justify-center">
              <SaveStatus />
            </div>
            <Button size="sm" onClick={handlePublish} disabled={isActionLoading}>
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
                <SectionReorderList
                  sections={(state.customLayout ?? defaultCustomLayout).sections}
                  onReorder={reorderSections}
                  onToggleVisibility={toggleSectionVisibility}
                />
                <ElementPanel
                  uid={auth.currentUser?.uid ?? ''}
                  elements={(state.customLayout ?? defaultCustomLayout).freeElements}
                  selectedId={selectedElementId}
                  onSelect={setSelectedElementId}
                  onAdd={addFreeElement}
                  onUpdate={updateFreeElement}
                  onRemove={removeFreeElement}
                />
                <MusicControls settings={state.musicSettings} onChange={setMusicSettings} />
                <GalleryUploader images={state.gallery} onAdd={addGalleryImage} onRemove={removeGalleryImage} onReorder={reorderGallery} />
                <ShareSettingsForm
                  shareSettings={state.shareSettings}
                  calendarSettings={state.calendarSettings}
                  onShareChange={updateShareSettings}
                  onCalendarChange={updateCalendarSettings}
                  slug={state.slug}
                  invitationId={invitationId}
                  onSlugChange={updateSlug}
                />
                <PrivacySettingsForm privacySettings={state.privacySettings} onChange={updatePrivacySettings} />
              </motion.div>
            )}
            {mobileTab === 'preview' && (
              <motion.div key="preview" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="h-full">
                <InvitationPreview state={state} invitationId={invitationId} />
              </motion.div>
            )}
            {mobileTab === 'templates' && (
              <motion.div key="templates" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="p-4 space-y-6">
                <TemplateSelector selected={state.template} onSelect={setTemplate} />
                <BackgroundPicker
                  background={(state.customLayout ?? defaultCustomLayout).background}
                  templateBg={templateConfig[state.template].bg}
                  onChange={setBackground}
                />
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
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={undo} disabled={!canUndo} aria-label="실행 취소" title="실행 취소 (⌘Z)">
                <Undo2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={redo} disabled={!canRedo} aria-label="다시 실행" title="다시 실행 (⌘⇧Z)">
                <Redo2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="h-4 w-px bg-border" />

            <SaveStatus />

            <div className="h-4 w-px bg-border" />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
                  <Settings className="mr-2 h-4 w-4" />
                  설정
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFullscreenPreview(true)}>
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

            <Button size="sm" onClick={handlePublish} disabled={isActionLoading}>
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
              <TabsList className="w-full flex-wrap justify-start h-auto p-1 bg-transparent gap-1">
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
                <TabsContent value="template" className="mt-0 space-y-6">
                  <TemplateSelector selected={state.template} onSelect={setTemplate} />
                  <BackgroundPicker
                    background={(state.customLayout ?? defaultCustomLayout).background}
                    templateBg={templateConfig[state.template].bg}
                    onChange={setBackground}
                  />
                </TabsContent>
                <TabsContent value="info" className="mt-0">
                  <WeddingInfoForm info={state.weddingInfo} onChange={updateWeddingInfo} calendarSettings={state.calendarSettings} onCalendarChange={updateCalendarSettings} />
                </TabsContent>
                <TabsContent value="order" className="mt-0">
                  <SectionReorderList
                    sections={(state.customLayout ?? defaultCustomLayout).sections}
                    onReorder={reorderSections}
                    onToggleVisibility={toggleSectionVisibility}
                  />
                </TabsContent>
                <TabsContent value="elements" className="mt-0">
                  <ElementPanel
                    uid={auth.currentUser?.uid ?? ''}
                    elements={(state.customLayout ?? defaultCustomLayout).freeElements}
                    selectedId={selectedElementId}
                    onSelect={setSelectedElementId}
                    onAdd={addFreeElement}
                    onUpdate={updateFreeElement}
                    onRemove={removeFreeElement}
                  />
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
                    slug={state.slug}
                    invitationId={invitationId}
                    onSlugChange={updateSlug}
                  />
                </TabsContent>
                <TabsContent value="privacy" className="mt-0">
                  <PrivacySettingsForm privacySettings={state.privacySettings} onChange={updatePrivacySettings} />
                </TabsContent>
              </Tabs>
            </div>
          </ScrollArea>
        </div>

        <div className="flex-1 bg-muted/30">
          <InvitationPreview
            state={state}
            invitationId={invitationId}
            elementsEditable={activeSection === 'elements'}
            selectedElementId={selectedElementId}
            onSelectElement={setSelectedElementId}
            onChangeElement={updateFreeElement}
          />
        </div>
      </div>

      {/* Publish success dialog */}
      <Dialog open={!!publishedUrl} onOpenChange={(open) => !open && setPublishedUrl(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-serif">발행 완료 🎉</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">아래 링크를 복사해서 하객분들께 공유하세요.</p>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted text-sm break-all">
              <LinkIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="flex-1 text-xs">{publishedUrl}</span>
            </div>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={handleCopyLink}>
                <Copy className="h-4 w-4 mr-2" />링크 복사
              </Button>
              <Button variant="outline" asChild>
                <a href={publishedUrl ?? ''} target="_blank" rel="noopener noreferrer">
                  미리보기
                </a>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <EditorSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        uid={auth.currentUser?.uid ?? ''}
        invitationId={invitationId}
        slug={state.slug}
        onSlugChange={updateSlug}
        onDeleted={() => router.push('/dashboard')}
        onDuplicated={(newId) => router.push(`/editor/${newId}`)}
      />

      {/* Fullscreen preview */}
      <AnimatePresence>
        {fullscreenPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-muted/30"
          >
            <Button
              variant="outline"
              size="icon"
              className="absolute top-4 right-4 z-10 bg-background"
              onClick={() => setFullscreenPreview(false)}
            >
              <X className="h-4 w-4" />
            </Button>
            <div className="h-full overflow-auto">
              <InvitationPreview state={state} invitationId={invitationId} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
