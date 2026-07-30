import { NextResponse, type NextRequest } from 'next/server'
import { Timestamp } from 'firebase-admin/firestore'
import { adminAuth, adminDb } from '@/lib/firebase-admin'
import { requireAdminRequest } from '@/lib/admin-api-auth'

interface Notification {
  id: string
  text: string
  createdAt: string
}

async function listAllAuthUsers() {
  const all = []
  let pageToken: string | undefined
  do {
    const page = await adminAuth.listUsers(1000, pageToken)
    all.push(...page.users)
    pageToken = page.pageToken
  } while (pageToken)
  return all
}

export async function GET(request: NextRequest) {
  const admin = await requireAdminRequest(request)
  if (!admin) return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 401 })

  const [invitationsSnap, authUsers] = await Promise.all([
    adminDb.collection('invitations').orderBy('createdAt', 'desc').limit(5).get(),
    listAllAuthUsers(),
  ])

  const invitationNotifications: Notification[] = invitationsSnap.docs
    .map((d) => {
      const data = d.data() as Record<string, unknown>
      const createdAt = data.createdAt instanceof Timestamp ? data.createdAt.toDate() : null
      if (!createdAt) return null
      const title = typeof data.title === 'string' ? data.title.replace(/\s*웨딩$/, '') : '이름 미입력'
      return { id: `inv-${d.id}`, text: `새로운 청첩장이 제작되었습니다: ${title}`, createdAt: createdAt.toISOString() }
    })
    .filter((n): n is Notification => n !== null)

  const userNotifications: Notification[] = authUsers
    .filter((u) => u.metadata.creationTime)
    .sort((a, b) => new Date(b.metadata.creationTime).getTime() - new Date(a.metadata.creationTime).getTime())
    .slice(0, 5)
    .map((u) => ({
      id: `user-${u.uid}`,
      text: `신규 사용자가 가입했습니다: ${u.displayName || u.email || '알 수 없음'}`,
      createdAt: new Date(u.metadata.creationTime).toISOString(),
    }))

  const notifications = [...invitationNotifications, ...userNotifications]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6)

  return NextResponse.json({ notifications })
}
