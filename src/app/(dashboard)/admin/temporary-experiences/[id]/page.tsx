'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, Col, Row, Spinner } from 'react-bootstrap'
import { temporaryExperiencesService } from '@/services/temporaryExperiences.service'
import TemporaryExperienceForm from '@/components/experiences/TemporaryExperienceForm'
import { toast } from 'sonner'

export default function TemporaryExperienceDetailPage() {
  const { id } = useParams() as { id: string }
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data: experience, isLoading, error } = useQuery({
    queryKey: ['temporary-experience', id],
    queryFn: () => temporaryExperiencesService.get(id),
  })

  const saveMutation = useMutation({
    mutationFn: (data: any) => temporaryExperiencesService.update(id, data),
    onSuccess: () => {
      toast.success('Changes saved.')
      queryClient.invalidateQueries({ queryKey: ['temporary-experience', id] })
    },
  })

  const approveMutation = useMutation({
    mutationFn: () => temporaryExperiencesService.approve(id),
    onSuccess: () => {
      toast.success('Experience approved.')
      router.push('/admin/temporary-experiences')
    },
  })

  const rejectMutation = useMutation({
    mutationFn: (reason: string) => temporaryExperiencesService.reject(id, reason),
    onSuccess: () => {
      toast.success('Experience rejected.')
      router.push('/admin/temporary-experiences')
    },
  })

  if (isLoading) return <div className="text-center py-4"><Spinner animation="border" /></div>
  if (error || !experience) return <div className="text-center py-4">Error loading experience.</div>

  return (
    <div className="container-fluid py-4">
      <h1 className="h3 mb-4">Review Temporary Experience</h1>
      <Row>
        <Col md={8}>
          <TemporaryExperienceForm
            experience={experience}
            onSave={(data) => saveMutation.mutate(data)}
            onApprove={() => approveMutation.mutate()}
            onReject={() => {
              const reason = prompt('Reason for rejection:')
              if (reason) rejectMutation.mutate(reason)
            }}
            isSaving={saveMutation.isPending}
            isApproving={approveMutation.isPending}
            isRejecting={rejectMutation.isPending}
          />
        </Col>
        <Col md={4}>
          <Card>
            <Card.Header>Source Information</Card.Header>
            <Card.Body>
              <p><strong>Platform:</strong> {experience.social_media}</p>
              <p><strong>Author:</strong> {experience.social_media_author || 'N/A'}</p>
              <div className="small text-muted mb-3" style={{ whiteSpace: 'pre-wrap' }}>
                {experience.social_media_text}
              </div>
              {experience.social_media_url && (
                <a href={experience.social_media_url} target="_blank" rel="noopener noreferrer">Visit Original Post</a>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  )
}
