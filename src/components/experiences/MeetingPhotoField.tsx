'use client'

import { Button, Form, Spinner } from 'react-bootstrap'
import { useState } from 'react'
import { toast } from 'sonner'
import { uploadService } from '@/services/upload.service'

// Cloudinary refuses larger images on our plan.
const MAX_FILE_BYTES = 10 * 1024 * 1024

interface Props {
  url: string
  onChange: (url: string) => void
  onUploadingChange?: (uploading: boolean) => void
}

/** One public photo of the meeting point, e.g. the gate or the entrance. */
export default function MeetingPhotoField({ url, onChange, onUploadingChange }: Props) {
  const [uploading, setUploading] = useState(false)

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target
    const file = input.files?.[0]
    input.value = ''
    if (!file) return
    if (!file.type.startsWith('image/') || file.size > MAX_FILE_BYTES) {
      toast.error('The photo must be an image under 10 MB')
      return
    }
    setUploading(true)
    onUploadingChange?.(true)
    try {
      const [result] = await uploadService.uploadManyToCloudinary([file])
      if (result?.url) onChange(result.url)
      else toast.error('Upload failed, please try again')
    } finally {
      setUploading(false)
      onUploadingChange?.(false)
    }
  }

  return (
    <Form.Group className="mb-3">
      <Form.Label>Meeting photo (optional)</Form.Label>
      {url && (
        <div className="d-flex align-items-center gap-2 mb-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="Meeting point" style={{ width: 120, height: 80, objectFit: 'cover', borderRadius: 6 }} />
          <Button size="sm" variant="outline-danger" onClick={() => onChange('')}>Remove</Button>
        </div>
      )}
      <div className="d-flex align-items-center gap-2">
        <Form.Control type="file" accept="image/*" onChange={handleFile} disabled={uploading} aria-label="Upload meeting photo" />
        {uploading && <Spinner size="sm" />}
      </div>
      <Form.Text className="text-muted">
        Public. Shown above the map so guests can spot the meeting point. Images up to 10 MB.
      </Form.Text>
    </Form.Group>
  )
}
