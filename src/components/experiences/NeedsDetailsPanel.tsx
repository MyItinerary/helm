'use client'

import { Alert } from 'react-bootstrap'
import type { PublishChecklistItem } from '@/types'
import { PUBLISH_LABELS } from '@/utils/publish'

interface Props {
  missing: PublishChecklistItem[]
  live: boolean
}

/** What the experience still needs before it can go live. */
export default function NeedsDetailsPanel({ missing, live }: Props) {
  if (!missing.length) return null
  return (
    <Alert variant="warning" className="small">
      <strong>Needs details.</strong>{' '}
      {live
        ? 'This listing is live from before these details were required. Add them so the page shows everything:'
        : "It can't be published until these are added:"}
      <ul className="mb-0 mt-1 ps-3">
        {missing.map((item) => <li key={item}>{PUBLISH_LABELS[item] ?? item}</li>)}
      </ul>
    </Alert>
  )
}
