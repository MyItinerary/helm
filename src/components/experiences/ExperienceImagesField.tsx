'use client'

import {
  Badge, Button, Form, InputGroup, Spinner,
} from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowLeft, faArrowRight, faStar, faTrash,
} from '@fortawesome/free-solid-svg-icons'
import { useState } from 'react'
import { toast } from 'sonner'
import { uploadService } from '@/services/upload.service'

export const MAX_EXPERIENCE_IMAGES = 10
// Cloudinary refuses larger images on our plan.
const MAX_FILE_BYTES = 10 * 1024 * 1024

interface ExperienceImagesFieldProps {
  // In display order; the first is the cover.
  images: string[]
  // Takes an updater so uploads that finish late add to the latest list.
  onChange: (update: (prev: string[]) => string[]) => void
  onUploadingChange?: (uploading: boolean) => void
}

const addUnique = (prev: string[], urls: string[]) => [...prev, ...urls.filter((url) => !prev.includes(url))]
  .slice(0, MAX_EXPERIENCE_IMAGES)

export default function ExperienceImagesField({ images, onChange, onUploadingChange }: ExperienceImagesFieldProps) {
  const [uploading, setUploading] = useState(0)
  const [url, setUrl] = useState('')
  const room = MAX_EXPERIENCE_IMAGES - images.length - uploading

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target
    const picked = Array.from(input.files ?? [])
    input.value = ''
    if (!picked.length) return

    const usable = picked.filter((file) => file.type.startsWith('image/') && file.size <= MAX_FILE_BYTES)
    if (usable.length < picked.length) {
      toast.error(`${picked.length - usable.length} file${picked.length - usable.length === 1 ? '' : 's'} skipped: photos must be images under 10 MB`)
    }
    const files = usable.slice(0, room)
    if (files.length < usable.length) {
      toast.error(`Only ${MAX_EXPERIENCE_IMAGES} photos per experience; ${usable.length - files.length} not added`)
    }
    if (!files.length) return

    setUploading((n) => n + files.length)
    onUploadingChange?.(true)
    try {
      const results = await uploadService.uploadManyToCloudinary(files)
      const uploaded = results.flatMap((result) => (result.url ? [result.url] : []))
      const failed = results.filter((result) => !result.url).map((result) => result.file.name)
      if (uploaded.length) {
        onChange((prev) => addUnique(prev, uploaded))
        toast.success(`${uploaded.length} photo${uploaded.length === 1 ? '' : 's'} uploaded`)
      }
      if (failed.length) toast.error(`Upload failed: ${failed.join(', ')}`)
    } finally {
      setUploading((n) => {
        const left = n - files.length
        if (left === 0) onUploadingChange?.(false)
        return left
      })
    }
  }

  const addUrl = () => {
    const next = url.trim()
    if (!next) return
    if (!/^https?:\/\//i.test(next)) {
      toast.error('Enter a link starting with https://')
      return
    }
    if (images.includes(next)) {
      toast.error('That photo is already added')
      return
    }
    onChange((prev) => addUnique(prev, [next]))
    setUrl('')
  }

  const move = (from: number, to: number) => onChange((prev) => {
    if (to < 0 || to >= prev.length) return prev
    const next = [...prev]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    return next
  })
  const remove = (index: number) => onChange((prev) => prev.filter((_, i) => i !== index))

  return (
    <Form.Group className="mb-3">
      <Form.Label>Photos</Form.Label>
      {images.length > 0 && (
        <div className="d-flex flex-wrap gap-3 mb-2">
          {images.map((src, i) => (
            <div key={src} style={{ width: 132 }}>
              <div className="position-relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={i === 0 ? 'Cover photo' : `Photo ${i + 1}`}
                  style={{
                    width: 132, height: 99, objectFit: 'cover', borderRadius: 4,
                  }}
                />
                {i === 0 && <Badge bg="primary" className="position-absolute top-0 start-0 m-1">Cover</Badge>}
              </div>
              <div className="d-flex justify-content-between mt-1">
                <Button size="sm" variant="outline-secondary" title="Move earlier" aria-label={`Move photo ${i + 1} earlier`} disabled={i === 0} onClick={() => move(i, i - 1)}>
                  <FontAwesomeIcon icon={faArrowLeft} />
                </Button>
                <Button size="sm" variant="outline-secondary" title="Make cover" aria-label={`Make photo ${i + 1} the cover`} disabled={i === 0} onClick={() => move(i, 0)}>
                  <FontAwesomeIcon icon={faStar} />
                </Button>
                <Button size="sm" variant="outline-secondary" title="Move later" aria-label={`Move photo ${i + 1} later`} disabled={i === images.length - 1} onClick={() => move(i, i + 1)}>
                  <FontAwesomeIcon icon={faArrowRight} />
                </Button>
                <Button size="sm" variant="outline-danger" title="Remove" aria-label={`Remove photo ${i + 1}`} onClick={() => remove(i)}>
                  <FontAwesomeIcon icon={faTrash} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="d-flex align-items-center gap-2 mb-2">
        <Form.Control type="file" accept="image/*" multiple onChange={handleFiles} disabled={room <= 0} aria-label="Upload photos" />
        {uploading > 0 && <Spinner size="sm" />}
      </div>
      <InputGroup>
        <Form.Control
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addUrl()
            }
          }}
          placeholder="https://… (or upload files above)"
          disabled={room <= 0}
          aria-label="Photo link"
        />
        <Button variant="outline-secondary" onClick={addUrl} disabled={room <= 0 || !url.trim()}>Add link</Button>
      </InputGroup>
      <Form.Text className="text-muted">
        {uploading > 0
          ? `Uploading ${uploading} photo${uploading === 1 ? '' : 's'}…`
          : `${images.length} of ${MAX_EXPERIENCE_IMAGES} photos. The first is the cover shown on cards and in search. Images up to 10 MB each.`}
      </Form.Text>
    </Form.Group>
  )
}
