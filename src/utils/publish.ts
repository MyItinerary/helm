import type { PublishChecklistItem } from '@/types'

// itin's publish checklist (app/core/services/publish.py), in form order.
export const PUBLISH_LABELS: Record<PublishChecklistItem, string> = {
  fitness: 'Fitness level',
  age: 'Age',
  accessibility: 'Accessibility',
  max_group_size: 'Max group size',
  meeting_landmark: 'Meeting landmark',
  pin: 'Map pin (latitude and longitude)',
  photo: 'At least one photo',
}

export interface PublishChecklistInput {
  fitness_level: string
  age_policy: string
  accessibility: string
  group_size_max: string
  meeting_landmark: string
  latitude: string
  longitude: string
  photos: number
}

/** What the form still needs before the experience can go live, as itin checks it. */
export function missingForPublish(input: PublishChecklistInput): PublishChecklistItem[] {
  const present: Record<PublishChecklistItem, boolean> = {
    fitness: !!input.fitness_level,
    age: !!input.age_policy,
    accessibility: !!input.accessibility,
    max_group_size: Number(input.group_size_max) > 0,
    meeting_landmark: !!input.meeting_landmark.trim(),
    pin: input.latitude !== '' && input.longitude !== '',
    photo: input.photos > 0,
  }
  return (Object.keys(PUBLISH_LABELS) as PublishChecklistItem[]).filter((item) => !present[item])
}

/** The missing items from itin's 422 when publishing is refused, or null. */
export function missingFromError(error: unknown): PublishChecklistItem[] | null {
  const detail = (error as { response?: { status?: number; data?: { detail?: unknown } } })?.response
  if (detail?.status !== 422) return null
  const missing = (detail.data?.detail as { missing?: unknown } | undefined)?.missing
  return Array.isArray(missing) ? (missing as PublishChecklistItem[]) : null
}

export const describeMissing = (items: PublishChecklistItem[]) => items.map((item) => PUBLISH_LABELS[item] ?? item).join(', ')
