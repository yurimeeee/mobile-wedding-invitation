import { NextResponse, type NextRequest } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { adminDb } from '@/lib/firebase-admin'
import { requireAdminRequest } from '@/lib/admin-api-auth'
import {
  defaultCalendarSettings, defaultShareSettings, defaultWeddingInfo,
  defaultMusicSettings, defaultPrivacySettings, defaultCustomLayout, defaultStoryItems,
  reconcileSections,
  type EditorState,
} from '@/lib/types'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminRequest(request)
  if (!admin) return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 401 })

  const { id } = await params
  const snap = await adminDb.collection('invitations').doc(id).get()
  if (!snap.exists) return NextResponse.json({ error: '청첩장을 찾을 수 없습니다.' }, { status: 404 })

  const data = snap.data()!
  const state: EditorState = {
    template: data.template ?? 'classic-elegant',
    weddingInfo: { ...defaultWeddingInfo, ...(data.weddingInfo ?? {}) },
    musicSettings: data.musicSettings ?? defaultMusicSettings,
    gallery: data.gallery ?? [],
    storyItems: data.storyItems ?? defaultStoryItems,
    calendarSettings: data.calendarSettings ?? defaultCalendarSettings,
    shareSettings: data.shareSettings ?? defaultShareSettings,
    privacySettings: { ...defaultPrivacySettings, ...(data.privacySettings ?? {}) },
    slug: data.slug ?? '',
    mode: data.mode ?? 'template',
    customLayout: data.customLayout
      ? { ...data.customLayout, sections: reconcileSections(data.customLayout.sections) }
      : defaultCustomLayout,
    introStyle: data.introStyle ?? 'fade',
  }

  return NextResponse.json({ state })
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminRequest(request)
  if (!admin) return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 401 })

  const { id } = await params
  const body = await request.json().catch(() => null) as { status?: string } | null
  if (body?.status !== 'draft' && body?.status !== 'published') {
    return NextResponse.json({ error: "status는 'draft' 또는 'published'여야 합니다." }, { status: 400 })
  }

  const docRef = adminDb.collection('invitations').doc(id)
  const snap = await docRef.get()
  if (!snap.exists) return NextResponse.json({ error: '청첩장을 찾을 수 없습니다.' }, { status: 404 })

  await docRef.update({ status: body.status, updatedAt: FieldValue.serverTimestamp() })
  return NextResponse.json({ id, status: body.status })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminRequest(request)
  if (!admin) return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 401 })

  const { id } = await params
  const docRef = adminDb.collection('invitations').doc(id)
  const snap = await docRef.get()
  if (!snap.exists) return NextResponse.json({ error: '청첩장을 찾을 수 없습니다.' }, { status: 404 })

  await adminDb.recursiveDelete(docRef)
  return NextResponse.json({ id })
}
