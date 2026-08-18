'use client'

import {
  Badge, Button, Card, CardBody, Form, Modal, Spinner, Table,
} from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus, faPen, faBan, faCheck } from '@fortawesome/free-solid-svg-icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { categoryService } from '@/services/category.service'
import type { Category } from '@/types'

interface CategoryModalProps {
  show: boolean
  onClose: () => void
  category: Category | null
  categoryTypes: string[]
  siblingOptions: Category[]
  defaultType?: string
}

function CategoryModal({
  show, onClose, category, categoryTypes, siblingOptions, defaultType,
}: CategoryModalProps) {
  const isEdit = !!category
  const [categoryType, setCategoryType] = useState(category?.category_type ?? defaultType ?? '')
  const [slug, setSlug] = useState(category?.slug ?? '')
  const [text, setText] = useState(category?.text ?? '')
  const [weight, setWeight] = useState(String(category?.weight ?? 0))
  const [parentId, setParentId] = useState(category?.parent_id != null ? String(category.parent_id) : '')
  const [isActive, setIsActive] = useState(category?.is_active ?? true)
  const queryClient = useQueryClient()

  const { mutate, isPending } = useMutation({
    mutationFn: () => {
      const payload = {
        category_type: categoryType.trim(),
        slug: slug.trim(),
        text: text.trim(),
        weight: Number(weight) || 0,
        parent_id: parentId ? Number(parentId) : null,
        is_active: isActive,
      }
      return isEdit ? categoryService.update(category.id, payload) : categoryService.create(payload)
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Category updated' : 'Category created')
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      onClose()
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail ?? 'Failed to save category')
    },
  })

  const validParents = siblingOptions.filter((c) => c.category_type === categoryType && c.id !== category?.id)

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>{isEdit ? 'Edit Category' : 'New Category'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Group className="mb-3">
          <Form.Label>Type</Form.Label>
          <Form.Control
            list="category-types"
            value={categoryType}
            onChange={(e) => setCategoryType(e.target.value)}
            placeholder="energy_level"
          />
          <datalist id="category-types">
            {categoryTypes.map((t) => <option key={t} value={t} />)}
          </datalist>
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Slug</Form.Label>
          <Form.Control value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="chill" />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Display text</Form.Label>
          <Form.Control value={text} onChange={(e) => setText(e.target.value)} placeholder="Chill" />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Weight</Form.Label>
          <Form.Control type="number" value={weight} onChange={(e) => setWeight(e.target.value)} />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Parent (optional)</Form.Label>
          <Form.Select value={parentId} onChange={(e) => setParentId(e.target.value)}>
            <option value="">None</option>
            {validParents.map((p) => <option key={p.id} value={p.id}>{p.text}</option>)}
          </Form.Select>
        </Form.Group>
        {isEdit && (
          <Form.Check
            type="checkbox"
            label="Active"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onClose}>Cancel</Button>
        <Button
          variant="primary"
          disabled={!categoryType.trim() || !slug.trim() || !text.trim() || isPending}
          onClick={() => mutate()}
        >
          {isPending ? <Spinner size="sm" /> : 'Save'}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

export default function CategoriesPage() {
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [modalCategory, setModalCategory] = useState<Category | null | undefined>(undefined)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.list(),
  })

  const categoryTypes = useMemo(
    () => Array.from(new Set((data ?? []).map((c) => c.category_type))).sort(),
    [data],
  )

  const visible = useMemo(() => {
    const list = data ?? []
    const filtered = typeFilter === 'all' ? list : list.filter((c) => c.category_type === typeFilter)
    return [...filtered].sort((a, b) => a.category_type.localeCompare(b.category_type) || a.weight - b.weight || a.id - b.id)
  }, [data, typeFilter])

  const { mutate: deactivate } = useMutation({
    mutationFn: (id: number) => categoryService.deactivate(id),
    onSuccess: () => {
      toast.success('Category deactivated')
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
    onError: () => toast.error('Failed to deactivate category'),
  })

  const { mutate: reactivate } = useMutation({
    mutationFn: (category: Category) => categoryService.update(category.id, { is_active: true }),
    onSuccess: () => {
      toast.success('Category reactivated')
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
    onError: () => toast.error('Failed to reactivate category'),
  })

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">Categories</h4>
        <Button variant="primary" size="sm" onClick={() => setModalCategory(null)}>
          <FontAwesomeIcon icon={faPlus} className="me-1" />
          New Category
        </Button>
      </div>

      <Form.Select
        className="mb-3"
        style={{ maxWidth: 260 }}
        value={typeFilter}
        onChange={(e) => setTypeFilter(e.target.value)}
      >
        <option value="all">All types</option>
        {categoryTypes.map((t) => <option key={t} value={t}>{t}</option>)}
      </Form.Select>

      <Card>
        <CardBody className="p-0">
          {isLoading ? (
            <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
          ) : (
            <Table hover responsive className="mb-0">
              <thead className="table-light">
                <tr>
                  <th>Type</th>
                  <th>Slug</th>
                  <th>Text</th>
                  <th>Weight</th>
                  <th>Parent</th>
                  <th>Status</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {visible.length === 0 && (
                  <tr><td colSpan={7} className="text-center text-muted py-4">No categories found</td></tr>
                )}
                {visible.map((category) => (
                  <tr key={category.id} className="align-middle">
                    <td className="text-muted small">{category.category_type}</td>
                    <td><code>{category.slug}</code></td>
                    <td>{category.text}</td>
                    <td>{category.weight}</td>
                    <td className="text-muted small">
                      {category.parent_id != null
                        ? (data ?? []).find((c) => c.id === category.parent_id)?.text ?? category.parent_id
                        : '—'}
                    </td>
                    <td>
                      <Badge bg={category.is_active ? 'success' : 'secondary'}>
                        {category.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary"
                          title="Edit"
                          onClick={() => setModalCategory(category)}
                        >
                          <FontAwesomeIcon icon={faPen} />
                        </button>
                        {category.is_active ? (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            title="Deactivate"
                            onClick={() => {
                              if (confirm(`Deactivate "${category.text}"?`)) deactivate(category.id)
                            }}
                          >
                            <FontAwesomeIcon icon={faBan} />
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-success"
                            title="Reactivate"
                            onClick={() => reactivate(category)}
                          >
                            <FontAwesomeIcon icon={faCheck} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </CardBody>
      </Card>

      {modalCategory !== undefined && (
        <CategoryModal
          show
          onClose={() => setModalCategory(undefined)}
          category={modalCategory}
          categoryTypes={categoryTypes}
          siblingOptions={data ?? []}
          defaultType={typeFilter !== 'all' ? typeFilter : undefined}
        />
      )}
    </div>
  )
}
