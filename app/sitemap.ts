import type { MetadataRoute } from 'next'
import { Timestamp } from 'firebase-admin/firestore'
import { adminDb } from '@/lib/firebase-admin'
import { getSiteUrl } from '@/lib/site-url'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteUrl, changeFrequency: 'weekly', priority: 1 },
    { url: `${siteUrl}/login`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${siteUrl}/signup`, changeFrequency: 'yearly', priority: 0.3 },
  ]

  const snap = await adminDb.collection('invitations').where('status', '==', 'published').get()
  const now = new Date()

  const invitationRoutes: MetadataRoute.Sitemap = snap.docs
    .map((docSnap) => {
      const data = docSnap.data()
      const expiresAt = data.expiresAt instanceof Timestamp ? data.expiresAt.toDate() : null
      if (expiresAt && expiresAt < now) return null
      const updatedAt = data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : now
      return {
        url: `${siteUrl}/invitation/${data.slug || docSnap.id}`,
        lastModified: updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.5,
      }
    })
    .filter((route): route is NonNullable<typeof route> => route !== null)

  return [...staticRoutes, ...invitationRoutes]
}
