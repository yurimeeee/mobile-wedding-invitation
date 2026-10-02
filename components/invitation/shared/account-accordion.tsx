'use client';

import { useState } from 'react';
import { ChevronDown, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { type EditorState } from '@/lib/types';
import type { PreviewStyleConfig } from '@/lib/preview-style';
import { cn } from '@/lib/utils';
import { copyText } from '@/lib/clipboard';

export function AccountAccordion({ info, style, lovely }: { info: EditorState['weddingInfo']; style: PreviewStyleConfig; lovely?: boolean }) {
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
