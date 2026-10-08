'use client'

import { Button, Modal, Spinner } from 'react-bootstrap'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { apiErrorDetail } from '@/services/pricing.service'
import {
  affectedBookings, availabilityService, type BlackoutCreate,
} from '@/services/availability.service'

/**
 * Block dates or a session. If the block would hit bookings, the API refuses
 * (409); this asks the admin, then resends with cancel_bookings. Render
 * `confirmModal` once wherever the hook is used.
 */
export function useBlockDates(experienceId: string, onDone?: () => void) {
  const queryClient = useQueryClient()
  const [pending, setPending] = useState<{ data: BlackoutCreate; affected: number } | null>(null)

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['blackouts', experienceId] })
    queryClient.invalidateQueries({ queryKey: ['admin-sessions', experienceId] })
    queryClient.invalidateQueries({ queryKey: ['bookings'] })
  }

  const block = useMutation({
    mutationFn: (data: BlackoutCreate) => availabilityService.block(experienceId, data),
    onSuccess: (result) => {
      setPending(null)
      const cancelled = result.cancelled + result.refund_requests
      toast.success(cancelled
        ? `Blocked. ${result.cancelled} unpaid booking(s) cancelled, ${result.refund_requests} sent to Refunds.`
        : 'Blocked')
      refresh()
      onDone?.()
    },
    onError: (error, data) => {
      const affected = affectedBookings(error)
      if (affected != null) {
        setPending({ data, affected })
        return
      }
      toast.error(apiErrorDetail(error, "Couldn't block those dates"))
    },
  })

  const unblock = useMutation({
    mutationFn: (blackoutId: string) => availabilityService.unblock(experienceId, blackoutId),
    onSuccess: () => {
      toast.success('Unblocked')
      refresh()
    },
    onError: (error) => toast.error(apiErrorDetail(error, "Couldn't unblock")),
  })

  const confirmModal = (
    <Modal show={!!pending} onHide={() => setPending(null)} centered>
      <Modal.Header closeButton>
        <Modal.Title>Cancel bookings?</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {pending?.affected} upcoming booking{pending?.affected === 1 ? ' is' : 's are'} on what you&apos;re blocking.
        Blocking cancels {pending?.affected === 1 ? 'it' : 'them'}: unpaid bookings are cancelled straight away and
        paid ones go to the Refunds queue for a full refund.
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={() => setPending(null)}>Go back</Button>
        <Button
          variant="danger"
          disabled={block.isPending}
          onClick={() => pending && block.mutate({ ...pending.data, cancel_bookings: true })}
        >
          {block.isPending ? <Spinner size="sm" /> : 'Cancel bookings and block'}
        </Button>
      </Modal.Footer>
    </Modal>
  )

  return { block, unblock, confirmModal }
}
