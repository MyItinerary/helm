'use client'

import { Button, Form } from 'react-bootstrap'

interface Props {
  label: string
  items: string[]
  onChange: (items: string[]) => void
  // Match itin's limits for the field.
  maxItems: number
  maxLength?: number
  placeholder?: string
  help?: string
}

/** One item per line, stored as a list: add, edit, reorder and remove. */
export default function ListItemsField({
  label, items, onChange, maxItems, maxLength = 140, placeholder, help,
}: Props) {
  const update = (index: number, value: string) => onChange(items.map((item, i) => (i === index ? value : item)))
  const remove = (index: number) => onChange(items.filter((_, i) => i !== index))
  const move = (index: number, by: -1 | 1) => {
    const next = [...items]
    ;[next[index], next[index + by]] = [next[index + by], next[index]]
    onChange(next)
  }

  return (
    <Form.Group className="mb-3">
      <Form.Label>{label}</Form.Label>
      {items.map((item, index) => (
        // Index keys: items have no identity beyond their position.
        // eslint-disable-next-line react/no-array-index-key
        <div key={index} className="d-flex align-items-center gap-2 mb-2">
          <Form.Control
            value={item}
            maxLength={maxLength}
            placeholder={placeholder}
            aria-label={`${label} ${index + 1}`}
            onChange={(e) => update(index, e.target.value)}
          />
          <Button type="button" variant="outline-secondary" size="sm" aria-label="Move up"
            disabled={index === 0} onClick={() => move(index, -1)}>↑</Button>
          <Button type="button" variant="outline-secondary" size="sm" aria-label="Move down"
            disabled={index === items.length - 1} onClick={() => move(index, 1)}>↓</Button>
          <Button type="button" variant="outline-danger" size="sm" onClick={() => remove(index)}>Remove</Button>
        </div>
      ))}
      {items.length < maxItems && (
        <Button type="button" variant="outline-secondary" size="sm" onClick={() => onChange([...items, ''])}>
          Add item
        </Button>
      )}
      <Form.Text className="text-muted d-block">
        {help ? `${help} ` : ''}Up to {maxItems} items, {maxLength} characters each. Empty items aren&apos;t saved.
      </Form.Text>
    </Form.Group>
  )
}

/** The items worth saving: trimmed, without blanks. */
export const cleanItems = (items: string[]) => items.map((item) => item.trim()).filter(Boolean)
