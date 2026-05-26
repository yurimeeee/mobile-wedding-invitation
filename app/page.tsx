'use client';

import { ArrowRight, Heart, MapPin, Music, Palette, Share2, Sparkles, Star } from 'lucide-react';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Logo } from '@/components/logo';
import { motion } from 'framer-motion';
import { TemplateThumbnail } from '@/components/editor/template-thumbnail';
import { type TemplateType, templates } from '@/lib/types';

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
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  로그인
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm">시작하기</Button>
              </Link>
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
            <Link href="/signup">
              <Button size="lg" className="min-w-[180px]">
                시작하기
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
                title: '아름다운 템플릿',
                description: '클래식, 모던, 플로럴, 한국 전통 디자인 중에서 선택하세요.',
              },
              {
                icon: Music,
                title: '배경 음악',
                description: '청첩장이 열릴 때 로맨틱한 음악이 자동으로 재생됩니다.',
              },
              {
                icon: MapPin,
                title: '카카오맵 연동',
                description: '통합 지도로 하객들이 예식장을 쉽게 찾을 수 있도록 도와주세요.',
              },
              {
                icon: Share2,
                title: '간편 공유',
                description: '카카오톡, SMS로 공유하거나 QR코드를 생성하세요.',
              },
              {
                icon: Heart,
                title: 'RSVP 관리',
                description: '한 곳에서 참석 여부를 수집하고 하객 명단을 관리하세요.',
              },
              {
                icon: Star,
                title: '포토 갤러리',
                description: '아름다운 약혼 및 웨딩 사진을 청첩장에 담아 보여주세요.',
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
                <Link href="/signup">
                  <motion.div
                    className="aspect-[3/4] rounded-xl border border-border overflow-hidden cursor-pointer"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
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

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-serif text-3xl sm:text-4xl font-semibold mb-4">지금 바로 청첩장을 만들어보세요</h2>
          <p className="text-primary-foreground/80 mb-8 max-w-2xl mx-auto">우리만의 모바일 청첩장으로 특별한 날을 공유한 수천 커플과 함께하세요.</p>
          <Link href="/signup">
            <Button size="lg" variant="secondary" className="min-w-[180px]">
              청첩장 만들러가기
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
