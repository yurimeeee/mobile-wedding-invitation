'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  Copy,
  ExternalLink,
  LogOut,
  Settings,
  Clock,
  FileText,
  Heart,
  Loader2,
  Link as LinkIcon,
  QrCode,
  MessageCircle,
  Sparkles,
  RefreshCw,
  ClipboardCheck,
} from 'lucide-react';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { loadUserInvitations, deleteInvitation, duplicateInvitation, type DashboardInvitation } from '@/lib/invitation-service';
import { type EditorMode } from '@/lib/types';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Logo } from '@/components/logo';
import { QrCodeModal } from '@/components/dashboard/qr-code-modal';
import { GuestMessagesModal } from '@/components/dashboard/guest-messages-modal';
import { RSVPModal } from '@/components/dashboard/rsvp-modal';
import { NewInvitationDialog } from '@/components/dashboard/new-invitation-dialog';

const templateColors: Record<string, string> = {
  'classic-elegant': 'from-amber-50 to-amber-100',
  'modern-minimal': 'from-gray-50 to-gray-100',
  'floral-romantic': 'from-rose-50 to-rose-100',
  'dark-luxury': 'from-gray-800 to-gray-900',
  'korean-traditional': 'from-orange-50 to-orange-100',
  'vintage-forest': 'from-stone-100 to-stone-200',
};

export default function DashboardPage() {
  const router = useRouter();
  const [invitations, setInvitations] = useState<DashboardInvitation[]>([]);
  const [isLoadingInvitations, setIsLoadingInvitations] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [qrInvitation, setQrInvitation] = useState<DashboardInvitation | null>(null);
  const [messagesInvitation, setMessagesInvitation] = useState<DashboardInvitation | null>(null);
  const [rsvpInvitation, setRsvpInvitation] = useState<DashboardInvitation | null>(null);
  const [newDialogOpen, setNewDialogOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push('/login');
      } else {
        setUser(currentUser);
        setIsLoadingInvitations(true);
        loadUserInvitations(currentUser.uid)
          .then((data) => setInvitations(data))
          .catch(() => toast.error('청첩장을 불러오는 데 실패했습니다'))
          .finally(() => setIsLoadingInvitations(false));
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/');
  };

  const handleDelete = async (id: string) => {
    setInvitations((prev) => prev.filter((inv) => inv.id !== id));
    try {
      await deleteInvitation(id);
      toast.success('청첩장이 삭제되었습니다');
    } catch {
      toast.error('삭제에 실패했습니다');
      if (user)
        loadUserInvitations(user.uid)
          .then(setInvitations)
          .catch(() => {});
    }
  };

  const handleCreated = (id: string, mode: EditorMode) => {
    router.push(mode === 'custom' ? `/editor/${id}?start=custom` : `/editor/${id}`);
  };

  const handleDuplicate = async (id: string) => {
    if (!user) return;
    try {
      const newId = await duplicateInvitation(user.uid, id);
      toast.success('복제되었습니다');
      router.push(`/editor/${newId}`);
    } catch {
      toast.error('복제에 실패했습니다');
    }
  };

  const getInvitationUrl = (inv: DashboardInvitation) => {
    const identifier = inv.slug || inv.id;
    return `${window.location.origin}/invitation/${identifier}`;
  };

  const handleCopyLink = async (inv: DashboardInvitation) => {
    try {
      await navigator.clipboard.writeText(getInvitationUrl(inv));
      toast.success('링크가 복사되었습니다');
    } catch {
      toast.error('복사에 실패했습니다');
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatWeddingDate = (dateStr: string) => {
    if (!dateStr) return '날짜 미정';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '날짜 미정';
    return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <Logo width={140} height={24} />
            </Link>

            <div className="flex items-center gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user?.photoURL ?? undefined} />
                      <AvatarFallback className="bg-accent/10 text-accent-foreground">{getInitials(user?.displayName ?? null)}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex items-center gap-2 p-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.photoURL ?? undefined} />
                      <AvatarFallback className="bg-accent/10 text-accent-foreground text-xs">{getInitials(user?.displayName ?? null)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col min-w-0">
                      <p className="text-sm font-medium truncate">{user?.displayName ?? '사용자'}</p>
                      <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    설정
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    로그아웃
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-semibold">나의 청첩장</h1>
            {/* <p className="text-muted-foreground mt-1">청첩장을 관리하고 새로 만드세요</p> */}
          </div>
          <Button size="lg" onClick={() => setNewDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            새로 만들기
          </Button>
        </div>

        {/* Trust badges */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Card>
            <CardContent className="p-5 flex flex-col h-full">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                  <Sparkles className="h-4 w-4 text-accent" />
                </div>
                <Badge variant="secondary">무료로 100% 체험</Badge>
              </div>
              <h3 className="font-serif text-lg font-semibold mb-1">구매 전, 무료로 시안 제작</h3>
              <p className="text-sm text-muted-foreground mb-3">시작은 무료 시안으로, 선택은 마음에 들 때.</p>
              <p className="text-xs text-muted-foreground/70 mb-4">만족하지 않으면 언제든지 취소 가능합니다.</p>
              <Button className="mt-auto w-fit" onClick={() => setNewDialogOpen(true)}>
                청첩장 제작하기
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                  <RefreshCw className="h-4 w-4 text-green-600" />
                </div>
                <Badge variant="secondary">24시간 편집 지원</Badge>
              </div>
              <h3 className="font-serif text-lg font-semibold mb-1">구매 후에도 무제한 수정</h3>
              <p className="text-sm text-muted-foreground mb-3">편집은 결제와 관계없습니다.</p>
              <p className="text-xs text-muted-foreground/70">언제든 원하는 만큼 수정하세요.</p>
            </CardContent>
          </Card>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">{isLoadingInvitations ? <Loader2 className="h-5 w-5 animate-spin" /> : invitations.length}</p>
                  <p className="text-sm text-muted-foreground">전체 청첩장</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <ExternalLink className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">
                    {isLoadingInvitations ? <Loader2 className="h-5 w-5 animate-spin" /> : invitations.filter((i) => i.status === 'published').length}
                  </p>
                  <p className="text-sm text-muted-foreground">게시됨</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Pencil className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">
                    {isLoadingInvitations ? <Loader2 className="h-5 w-5 animate-spin" /> : invitations.filter((i) => i.status === 'draft').length}
                  </p>
                  <p className="text-sm text-muted-foreground">임시저장</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Loading skeleton */}
        {isLoadingInvitations && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <h2 className="font-medium">최근 편집</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <div className="aspect-[3/4] bg-muted animate-pulse" />
                  <CardContent className="p-3">
                    <div className="h-4 bg-muted rounded animate-pulse mb-2" />
                    <div className="h-3 w-24 bg-muted rounded animate-pulse" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Recently Edited */}
        {!isLoadingInvitations && invitations.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <h2 className="font-medium">최근 편집</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {invitations.slice(0, 4).map((invitation, index) => (
                <motion.div key={invitation.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                  <Card className="group relative overflow-hidden hover:shadow-lg transition-shadow">
                    <Link href={`/editor/${invitation.id}`}>
                      <div className={`aspect-[3/4] bg-gradient-to-br ${templateColors[invitation.template] || 'from-gray-50 to-gray-100'} relative overflow-hidden`}>
                        {invitation.thumbnail ? (
                          <img src={invitation.thumbnail} alt={invitation.title || '청첩장 미리보기'} className="absolute inset-0 w-full h-full object-cover" />
                        ) : (
                          /* Mini preview */
                          <div className={`absolute inset-0 flex flex-col items-center justify-center p-4 ${invitation.template === 'dark-luxury' ? 'text-white' : ''}`}>
                            <div className="w-12 h-12 rounded-full bg-current/10 mb-3" />
                            <div className="h-2 w-20 bg-current/20 rounded mb-1.5" />
                            <div className="h-1.5 w-14 bg-current/20 rounded mb-3" />
                            <div className="text-[10px] text-center opacity-70">
                              <p>{invitation.groomName || '신랑'}</p>
                              <p>&</p>
                              <p>{invitation.brideName || '신부'}</p>
                            </div>
                          </div>
                        )}

                        {/* Status badge */}
                        <div className="absolute top-2 left-2">
                          <Badge variant={invitation.status === 'published' ? 'default' : 'secondary'} className="text-xs">
                            {invitation.status === 'published' ? '게시됨' : '임시저장'}
                          </Badge>
                        </div>

                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Button variant="secondary" size="sm">
                            편집
                          </Button>
                        </div>
                      </div>
                    </Link>

                    <CardContent className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="min-w-0">
                          <h3 className="font-medium truncate">{invitation.title || '제목 없음'}</h3>
                          <p className="text-xs text-muted-foreground">{formatWeddingDate(invitation.weddingDate)}</p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/editor/${invitation.id}`}>
                                <Pencil className="mr-2 h-4 w-4" />
                                편집
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicate(invitation.id)} className="cursor-pointer">
                              <Copy className="mr-2 h-4 w-4" />
                              복제
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setMessagesInvitation(invitation)} className="cursor-pointer">
                              <MessageCircle className="mr-2 h-4 w-4" />
                              방명록
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setRsvpInvitation(invitation)} className="cursor-pointer">
                              <ClipboardCheck className="mr-2 h-4 w-4" />
                              참석여부
                            </DropdownMenuItem>
                            {invitation.status === 'published' && (
                              <>
                                <DropdownMenuItem onClick={() => handleCopyLink(invitation)} className="cursor-pointer">
                                  <LinkIcon className="mr-2 h-4 w-4" />
                                  링크 복사
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setQrInvitation(invitation)} className="cursor-pointer">
                                  <QrCode className="mr-2 h-4 w-4" />
                                  QR코드
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <a href={getInvitationUrl(invitation)} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                    라이브 보기
                                  </a>
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(invitation.id)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              삭제
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!isLoadingInvitations && invitations.length === 0 && (
          <motion.div className="text-center py-16" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
              <Heart className="h-8 w-8 text-accent" />
            </div>
            <h2 className="font-serif text-xl font-semibold mb-2">아직 청첩장이 없어요</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">첫 번째 청첩장을 만들고 소중한 분들과 특별한 날을 공유하세요.</p>
            <Button size="lg" onClick={() => setNewDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />첫 번째 청첩장 만들기
            </Button>
          </motion.div>
        )}
      </main>

      {qrInvitation && (
        <QrCodeModal open={!!qrInvitation} onOpenChange={(open) => !open && setQrInvitation(null)} url={getInvitationUrl(qrInvitation)} title={qrInvitation.title} />
      )}

      {messagesInvitation && (
        <GuestMessagesModal
          open={!!messagesInvitation}
          onOpenChange={(open) => !open && setMessagesInvitation(null)}
          invitationId={messagesInvitation.id}
          title={messagesInvitation.title}
        />
      )}

      {rsvpInvitation && (
        <RSVPModal open={!!rsvpInvitation} onOpenChange={(open) => !open && setRsvpInvitation(null)} invitationId={rsvpInvitation.id} title={rsvpInvitation.title} />
      )}

      {user && <NewInvitationDialog open={newDialogOpen} onOpenChange={setNewDialogOpen} uid={user.uid} onCreated={handleCreated} />}
    </div>
  );
}
