// The public website, where travellers see a listing.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://myjourny.io').replace(/\/+$/, '')

// The website's preview page shows any listing as travellers would see it.
// The token goes after # so it never reaches a server log.
export const previewExperienceUrl = (id: string, token: string) =>
  `${SITE_URL}/experiences/${id}/preview#t=${encodeURIComponent(token)}`
