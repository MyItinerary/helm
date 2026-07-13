'use client'

import { Button } from 'react-bootstrap'

export interface TagPillOption {
  id: string
  label: string
}

interface TagPillSelectProps {
  options: TagPillOption[]
  value: string[]
  onChange: (next: string[]) => void
}

export default function TagPillSelect({ options, value, onChange }: TagPillSelectProps) {
  const toggle = (id: string) => {
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id])
  }

  const allSelected = options.length > 0 && options.every((o) => value.includes(o.id))

  return (
    <div className="border rounded p-2">
      <div className="d-flex flex-wrap gap-2 mb-2">
        {options.map((option) => {
          const selected = value.includes(option.id)
          return (
            <Button
              key={option.id}
              type="button"
              size="sm"
              variant={selected ? 'primary' : 'outline-secondary'}
              className="rounded-pill"
              onClick={() => toggle(option.id)}
            >
              {option.label}
            </Button>
          )
        })}
      </div>
      <Button
        type="button"
        size="sm"
        variant="link"
        className="p-0"
        onClick={() => onChange(allSelected ? [] : options.map((o) => o.id))}
      >
        {allSelected ? 'Clear all' : 'Select all'}
      </Button>
    </div>
  )
}
