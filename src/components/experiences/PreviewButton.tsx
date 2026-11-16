'use client'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons'
import { useState } from 'react'
import { toast } from 'sonner'
import { experienceService } from '@/services/experience.service'
import { previewExperienceUrl } from '@/utils/site'

// Opens the listing on the website as travellers would see it, in a new tab,
// whatever its status. The tab opens on the click itself (so it isn't blocked
// as a popup) and moves to the preview once the token arrives. Helm stays as
// it was, unsaved edits included.
export default function PreviewButton({ experienceId, compact = false }: { experienceId: string; compact?: boolean }) {
  const [opening, setOpening] = useState(false)

  const open = async () => {
    const tab = window.open('', '_blank')
    if (tab) tab.opener = null
    setOpening(true)
    try {
      const url = previewExperienceUrl(experienceId, await experienceService.previewToken(experienceId))
      if (tab) tab.location.href = url
      else window.open(url, '_blank', 'noopener')
    } catch {
      tab?.close()
      toast.error("Couldn't open the preview")
    } finally {
      setOpening(false)
    }
  }

  return (
    <button
      type="button"
      className="btn btn-sm btn-outline-primary"
      title="Preview as traveller"
      disabled={opening}
      onClick={open}
    >
      <FontAwesomeIcon icon={faArrowUpRightFromSquare} className={compact ? undefined : 'me-1'} />
      {!compact && 'Preview as traveller'}
    </button>
  )
}
