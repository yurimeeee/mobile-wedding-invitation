import { NextResponse, type NextRequest } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

// Firestore 보안 규칙은 status/uid로만 쿼리를 정적으로 검증할 수 있어
// slug 조건만 있는 쿼리는 클라이언트 SDK로 실행할 수 없다. Admin SDK로 우회한다.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const slug = searchParams.get('slug')?.trim() ?? ''
  const excludeId = searchParams.get('excludeId') ?? ''

  if (!slug) return NextResponse.json({ error: 'slug가 필요합니다.' }, { status: 400 })

  const snap = await adminDb.collection('invitations').where('slug', '==', slug).limit(1).get()
  const available = snap.empty || snap.docs[0].id === excludeId

  return NextResponse.json({ available })
}
