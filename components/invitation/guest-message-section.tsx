'use client'

import { useEffect, useState } from 'react'
import { MessageCircle, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  addGuestMessage, deleteGuestMessageWithPassword, loadGuestMessages, type GuestMessage,
} from '@/lib/message-service'

interface GuestMessageSectionProps {
  invitationId: string
  textStyle: React.CSSProperties
  mutedStyle: React.CSSProperties
  sectionBg: string
  accentColor: string
}

export function GuestMessageSection({ invitationId, textStyle, mutedStyle, sectionBg, accentColor }: GuestMessageSectionProps) {
  const [messages, setMessages] = useState<GuestMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [form, setForm] = useState({ name: '', password: '', contents: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deletePassword, setDeletePassword] = useState('')

  useEffect(() => {
    loadGuestMessages(invitationId)
      .then(setMessages)
      .catch(() => toast.error('메시지를 불러오지 못했습니다'))
      .finally(() => setIsLoading(false))
  }, [invitationId])

  const handleSubmit = async () => {
    if (!form.name.trim()) return toast('성함을 입력해주세요')
    if (!form.password.trim()) return toast('비밀번호를 입력해주세요')
    if (!form.contents.trim()) return toast('내용을 입력해주세요')

    setIsSubmitting(true)
    try {
      await addGuestMessage(invitationId, form.name.trim(), form.password.trim(), form.contents.trim())
      toast.success('메시지가 등록되었습니다')
      setForm({ name: '', password: '', contents: '' })
      const updated = await loadGuestMessages(invitationId)
      setMessages(updated)
    } catch {
      toast.error('메시지 등록에 실패했습니다')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (messageId: string) => {
    if (!deletePassword.trim()) return toast('비밀번호를 입력해주세요')
    try {
      const ok = await deleteGuestMessageWithPassword(invitationId, messageId, deletePassword.trim())
      if (!ok) {
        toast.error('비밀번호가 일치하지 않습니다')
        return
      }
      setMessages((prev) => prev.filter((m) => m.id !== messageId))
      setDeletingId(null)
      setDeletePassword('')
      toast.success('메시지가 삭제되었습니다')
    } catch {
      toast.error('삭제에 실패했습니다')
    }
  }

  return (
    <div className="mb-10">
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle className="h-4 w-4" style={mutedStyle} />
        <h2 className="text-sm font-medium" style={textStyle}>축하 메시지</h2>
      </div>

      {/* Write form */}
      <div className="rounded-lg p-4 mb-4 space-y-2" style={{ background: sectionBg }}>
        <div className="flex gap-2">
          <Input
            placeholder="성함"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="flex-1"
          />
          <Input
            type="password"
            placeholder="비밀번호"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            className="flex-1"
          />
        </div>
        <Textarea
          placeholder="축하의 마음을 남겨주세요"
          value={form.contents}
          onChange={(e) => setForm((f) => ({ ...f, contents: e.target.value }))}
          rows={3}
        />
        <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full" style={{ background: accentColor }}>
          메시지 남기기
        </Button>
      </div>

      {/* Message list */}
      {!isLoading && messages.length === 0 && (
        <p className="text-center text-sm py-4" style={mutedStyle}>아직 남겨진 메시지가 없어요</p>
      )}
      <div className="space-y-2">
        {messages.map((msg) => (
          <div key={msg.id} className="rounded-lg p-3" style={{ background: sectionBg }}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium" style={textStyle}>{msg.name}</p>
                <p className="text-sm mt-1 whitespace-pre-line break-words" style={mutedStyle}>{msg.contents}</p>
              </div>
              <button
                onClick={() => setDeletingId(deletingId === msg.id ? null : msg.id)}
                className="shrink-0 opacity-40 hover:opacity-100 transition-opacity"
              >
                <Trash2 className="h-3.5 w-3.5" style={textStyle} />
              </button>
            </div>
            {deletingId === msg.id && (
              <div className="flex gap-2 mt-2">
                <Input
                  type="password"
                  placeholder="비밀번호 확인"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="flex-1 h-8 text-sm"
                />
                <Button size="sm" variant="destructive" onClick={() => handleDelete(msg.id)}>삭제</Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
