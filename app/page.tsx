'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, Check, Heart, MapPin, Music, Palette, Share2, Sparkles, Star, Lock, SearchX, BookOpen, Armchair } from 'lucide-react';
import { onAuthStateChanged, type User } from 'firebase/auth';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Logo } from '@/components/logo';
import { motion } from 'framer-motion';
import { TemplateThumbnail } from '@/components/editor/template-thumbnail';
import { type TemplateType, templates } from '@/lib/types';
import { auth } from '@/lib/firebase';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 },
};

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export default function LandingPage() {
  // 로그인된 상태로 마케팅 홈에 들어와도 "로그인/시작하기"가 다시 뜨면 로그아웃된 것처럼
  // 보인다 — 실제로는 세션이 살아있으니, 로그인 여부에 따라 CTA를 대시보드로 바꿔준다.
  // onAuthStateChanged는 비동기라 첫 응답 전까지는 user가 무조건 null이라, authChecked로
  // "아직 확인 안 됨"과 "확인했는데 로그아웃 상태"를 구분해 로그인 버튼이 잠깐 스쳐 보이는 걸 막는다.
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthChecked(true);
    });
    return () => unsubscribe();
  }, []);
  const primaryHref = user ? '/dashboard' : '/signup';

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <Logo width={140} height={24} />
            </Link>
            <div className="hidden md:flex items-center gap-8">
              <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                기능
              </Link>
              <Link href="#templates" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                템플릿
              </Link>
              <Link href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                가격
              </Link>
            </div>
            <div className="flex items-center gap-3">
              {!authChecked ? (
                <div className="h-9 w-[88px] rounded-md bg-muted animate-pulse" />
              ) : user ? (
                <Link href="/dashboard">
                  <Button size="sm">대시보드로 이동</Button>
                </Link>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="ghost" size="sm">
                      로그인
                    </Button>
                  </Link>
                  <Link href="/signup">
                    <Button size="sm">시작하기</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent/5 via-background to-background" />
        <motion.div className="max-w-4xl mx-auto text-center relative" initial="initial" animate="animate" variants={stagger}>
          <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent-foreground text-sm mb-6">
            <Sparkles className="h-4 w-4" />
            <span>나만의 모바일 청첩장, 간편하게</span>
          </motion.div>

          <motion.h1 variants={fadeInUp} className="font-serif text-4xl sm:text-5xl lg:text-6xl font-semibold leading-tight text-balance mb-6">
            우리만의
            <br />
            <span className="text-accent">모바일 청첩장</span>
          </motion.h1>

          <motion.p variants={fadeInUp} className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8 text-pretty">
            쉽고 빠르게 직접 만드는 나만의 청첩장. 템플릿을 선택하고, 사진을 추가하고, 바로 공유하세요.
          </motion.p>

          <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href={primaryHref}>
              <Button size="lg" className="min-w-[180px]">
                {user ? '대시보드로 이동' : '시작하기'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="#templates">
              <Button variant="outline" size="lg" className="min-w-[180px]">
                템플릿 보기
              </Button>
            </Link>
          </motion.div>
        </motion.div>

        {/* Preview mockup */}
        <motion.div className="mt-16 max-w-5xl mx-auto relative" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3 }}>
          <div className="relative mx-auto w-full max-w-[280px] sm:max-w-[320px]">
            <div className="phone-frame">
              <div className="phone-notch" />
              <div className="phone-screen aspect-[9/19.5] bg-gradient-to-b from-accent/5 to-background">
                <div className="p-6 text-center">
                  <p className="text-xs text-muted-foreground mb-2 tracking-widest">청첩장</p>
                  <div className="w-12 h-px bg-accent mx-auto mb-4" />
                  <h3 className="font-serif text-lg mb-1">{'김민호 & 이유나'}</h3>
                  <p className="text-sm text-muted-foreground mb-4">민호 & 유나</p>
                  <div className="aspect-square bg-muted rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                    <div className="text-muted-foreground text-xs">웨딩 사진</div>
                  </div>
                  <p className="font-serif text-sm leading-relaxed text-muted-foreground">
                    {'서로 다른 두 사람이'}
                    <br />
                    {'사랑으로 하나가 되는 날'}
                  </p>
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-xs text-muted-foreground">{'2026년 6월 20일 토요일'}</p>
                    <p className="text-xs text-muted-foreground">{'오후 2시'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Floating badges */}
          <div className="hidden lg:block absolute top-8 -left-4">
            <motion.div className="glass rounded-xl p-3 shadow-lg" animate={{ y: [0, -10, 0] }} transition={{ duration: 3, repeat: Infinity }}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                  <Palette className="h-4 w-4 text-accent" />
                </div>
                <span className="text-sm font-medium">5가지+ 템플릿</span>
              </div>
            </motion.div>
          </div>

          <div className="hidden lg:block absolute top-32 -right-4">
            <motion.div className="glass rounded-xl p-3 shadow-lg" animate={{ y: [0, -10, 0] }} transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                  <Music className="h-4 w-4 text-accent" />
                </div>
                <span className="text-sm font-medium">배경 음악</span>
              </div>
            </motion.div>
          </div>

          <div className="hidden lg:block absolute bottom-12 -left-8">
            <motion.div className="glass rounded-xl p-3 shadow-lg" animate={{ y: [0, -10, 0] }} transition={{ duration: 3, repeat: Infinity, delay: 1 }}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                  <Share2 className="h-4 w-4 text-accent" />
                </div>
                <span className="text-sm font-medium">간편 공유</span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-card">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold mb-4">Features</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">웨딩인비가 제공하는 다양한 기능을 소개합니다.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Palette,
                title: '디자인 템플릿',
                description: '감성적인 에디토리얼부터 모던한 스타일까지, 취향에 맞게 선택해 보세요.',
              },
              {
                icon: Music,
                title: '배경 음악',
                description: '청첩장을 열 때 흘러나오는 음악으로 첫인상의 분위기를 더해 보세요.',
              },
              {
                icon: MapPin,
                title: '스마트 길안내',
                description: '지도와 내비게이션 연결로 하객분들이 오시는 길을 편안하게 안내해 드립니다.',
              },
              {
                icon: Share2,
                title: '간편 공유',
                description: '카카오톡, 문자, QR코드 등 원하는 방식으로 손쉽게 소식을 전해 보세요.',
              },
              {
                icon: Heart,
                title: '참석 여부 (RSVP)',
                description: '하객들의 참석 여부를 한눈에 확인하고 손쉽게 명단을 관리해 보세요.',
              },
              {
                icon: Star,
                title: '포토 갤러리',
                description: '두 사람의 소중한 순간이 담긴 사진들을 감각적인 갤러리로 채워보세요.',
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                className="p-6 rounded-xl bg-background border border-border hover:shadow-lg transition-shadow"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-accent" />
                </div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Privacy & Extra Features */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold mb-4">더 세심하게, 더 안전하게</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">청첩장을 더 편하고 안전하게 관리할 수 있는 기능들이에요.</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {[
              {
                icon: Lock,
                title: '청첩장 잠금 설정',
                description: '필요할 때, 청첩장을 볼 수 없게 잠금 설정이 가능해요.',
                bullets: ['보안성과 프라이버시 확보', '비밀번호 입력시에만 열람 가능', '언제든지 잠금 설정/해제 가능'],
              },
              {
                icon: SearchX,
                title: '확대방지',
                description: '사진을 확대할 수 없도록 설정 가능해요.',
                bullets: ['핀치 줌 확대 방지', '청첩장 내 모든사진 확대 방지'],
              },
              {
                icon: BookOpen,
                title: '방명록',
                description: '초대장을 받은 모든 분들이 축하글을 남길 수 있어요.',
                bullets: ['방명록 비공개 설정 제공', '방명록 관리 페이지 제공', '신규 방명록 카톡 알림 받기'],
              },
              {
                icon: Armchair,
                title: '참석여부 · RSVP',
                description: '참석 여부부터 다양한 설문을 받을 수 있어요.',
                bullets: [
                  '참석여부 응답 집계 대시보드 제공',
                  '동행인원, 식사여부, 셔틀이용 등 설문 옵션 제공',
                  '응답결과 엑셀 다운로드',
                  '팝업 배너로 설정 가능',
                  '신규 응답 카톡 알림 받기',
                ],
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                className="p-6 rounded-xl bg-card border border-border"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <feature.icon className="h-5 w-5 text-foreground mb-4" strokeWidth={1.5} />
                <h3 className="font-semibold mb-1.5">{feature.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">{feature.description}</p>
                <div className="h-px bg-border mb-4" />
                <ul className="space-y-1">
                  {feature.bullets.map((bullet) => (
                    <li key={bullet} className="text-xs text-muted-foreground">
                      · {bullet}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Templates Preview */}
      <section id="templates" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold mb-4">Templates</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">디자인된 템플릿으로 나만의 청첩장을 쉽게 꾸밀 수 있어요</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template, index) => (
              <motion.div
                key={template.id}
                className="group relative"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Link href={primaryHref}>
                  <motion.div className="aspect-[3/4] rounded-xl border border-border overflow-hidden cursor-pointer" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <TemplateThumbnail id={template.id} />
                  </motion.div>
                  <div className="mt-3">
                    <h3 className="font-medium">{template.nameKr}</h3>
                    <p className="text-sm text-muted-foreground">{template.name}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4 bg-card">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold mb-4">Pricing</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">가격은 단순하게, 기능은 아낌없이.</p>
          </div>

          <motion.div
            className="max-w-md mx-auto rounded-2xl border border-border bg-background p-8 shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent-foreground text-xs mb-5">
              <Sparkles className="h-3.5 w-3.5" />
              <span>1회 결제 · 평생 이용</span>
            </div>

            <h3 className="font-serif text-xl font-semibold mb-1">웨딩인비 청첩장</h3>
            <p className="text-sm text-muted-foreground mb-6">모든 템플릿과 기능이 처음부터 다 열려 있어요.</p>

            <div className="flex items-baseline gap-1 mb-1">
              <span className="font-serif text-4xl font-semibold">29,000원</span>
            </div>
            <p className="text-xs text-muted-foreground mb-6">월 구독 아님 · 발행 후 추가 비용 없음</p>

            <Link href={primaryHref} className="block mb-6">
              <Button size="lg" className="w-full">
                {user ? '대시보드로 이동' : '무료로 시작하기'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <p className="text-xs text-center text-muted-foreground mb-6">
              결제 전까지는 무료예요. 시안이 마음에 들 때 결제해 발행하세요.
            </p>

            <div className="h-px bg-border mb-6" />

            <ul className="space-y-3">
              {[
                '디자인 템플릿 전체 이용',
                '자유 커스텀 에디터 (스티커·텍스트·배경)',
                '방명록 · 참석여부(RSVP) 응답 관리',
                '카카오톡 · 링크 · QR코드 공유',
                '청첩장 잠금 · 확대방지 설정',
                '결제 후에도 무제한 수정',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-serif text-3xl sm:text-4xl font-semibold mb-4">지금 바로 시작해보세요</h2>
          <p className="text-primary-foreground/80 mb-8 max-w-2xl mx-auto">우리만의 모바일 청첩장으로 특별한 날을 공유한 수천 커플과 함께하세요.</p>
          <Link href={primaryHref}>
            <Button size="lg" variant="secondary" className="min-w-[180px]">
              {user ? '내 청첩장 관리하기' : '청첩장 만들러가기'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Logo width={120} height={20} />
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="#" className="hover:text-foreground transition-colors">
                이용약관
              </Link>
              <Link href="#" className="hover:text-foreground transition-colors">
                개인정보처리방침
              </Link>
              <Link href="#" className="hover:text-foreground transition-colors">
                고객지원
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">2026 WedInvite. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
