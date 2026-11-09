// The public website, where travellers see a listing.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://myjourny.io').replace(/\/+$/, '')

export const publicExperienceUrl = (id: string) => `${SITE_URL}/experiences/${id}`
