'use client'

import { Button, Spinner } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark } from '@fortawesome/free-solid-svg-icons'
import type { Category } from '@/types'

interface InterestTagsFieldProps {
  // Active categories of type "interest": parents and their subcategories.
  categories: Category[]
  loading: boolean
  value: string[]
  onChange: (next: string[]) => void
}

// The website's category and subcategory pages show an experience when its
// interest_tags include that category's slug, so tags are picked from the live
// interest categories (Categories admin page) rather than a fixed list.
export default function InterestTagsField({ categories, loading, value, onChange }: InterestTagsFieldProps) {
  const toggle = (slug: string) =>
    onChange(value.includes(slug) ? value.filter((v) => v !== slug) : [...value, slug])

  if (loading) return <Spinner size="sm" />

  const parents = categories.filter((c) => c.parent_id === null)
  const childrenOf = (id: number) => categories.filter((c) => c.parent_id === id)
  const known = new Set(categories.map((c) => c.slug))
  // Tags from before the interest categories existed (culture, food, ...).
  const older = value.filter((tag) => !known.has(tag))

  const pill = (slug: string, label: string, small = false) => {
    const selected = value.includes(slug)
    return (
      <Button
        key={slug}
        type="button"
        size="sm"
        variant={selected ? 'primary' : 'outline-secondary'}
        className={`rounded-pill d-inline-flex align-items-center gap-1${small ? ' py-0' : ''}`}
        aria-pressed={selected}
        onClick={() => toggle(slug)}
      >
        {label}
        {selected && <FontAwesomeIcon icon={faXmark} size="xs" />}
      </Button>
    )
  }

  return (
    <div className="border rounded p-2">
      {parents.length === 0 && (
        <p className="small text-muted mb-2">
          No interest categories yet. Add them on the Categories page (type &quot;interest&quot;).
        </p>
      )}
      {parents.map((parent) => (
        <div key={parent.id} className="mb-2">
          <div className="d-flex flex-wrap align-items-center gap-2">
            {pill(parent.slug, parent.text)}
            {childrenOf(parent.id).map((child) => pill(child.slug, child.text, true))}
          </div>
        </div>
      ))}
      {older.length > 0 && (
        <div className="mt-2 pt-2 border-top">
          <div className="small text-muted mb-1">
            Older tags. The website doesn&apos;t list these under a category; pick categories above, then remove them.
          </div>
          <div className="d-flex flex-wrap gap-2">
            {older.map((tag) => (
              <Button
                key={tag}
                type="button"
                size="sm"
                variant="outline-warning"
                className="rounded-pill d-inline-flex align-items-center gap-1"
                aria-label={`Remove ${tag}`}
                onClick={() => toggle(tag)}
              >
                {tag}
                <FontAwesomeIcon icon={faXmark} size="xs" />
              </Button>
            ))}
          </div>
        </div>
      )}
      <div className="small text-muted mt-1">
        Pick a category, and a subcategory where one fits: the website&apos;s subcategory pages only show experiences tagged with them.
      </div>
    </div>
  )
}
