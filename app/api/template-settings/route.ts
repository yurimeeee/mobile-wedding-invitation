import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

// 관리자가 비활성화한 템플릿 id 목록. 누구나 읽을 수 있어야 에디터의 템플릿
// 선택 화면에서 비활성화 표시를 할 수 있어 인증 없이 공개한다(민감 정보 아님).
export async function GET() {
  const snap = await adminDb.collection('adminMeta').doc('templateSettings').get()
  const disabledTemplateIds = (snap.data()?.disabledTemplateIds as string[] | undefined) ?? []
  return NextResponse.json({ disabledTemplateIds })
}
