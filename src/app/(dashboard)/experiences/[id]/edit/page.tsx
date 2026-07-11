'use client'

import { useQuery } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import { Spinner } from 'react-bootstrap'
import ExperienceForm from '@/components/experiences/ExperienceForm'
import { experienceService } from '@/services/experience.service'

export default function EditExperiencePage() {
  const params = useParams<{ id: string }>()
  const { data, isLoading } = useQuery({
    queryKey: ['experience', params.id],
    queryFn: () => experienceService.get(params.id),
  })

  if (isLoading) {
    return <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
  }

  if (!data) {
    return <p className="text-muted">Experience not found.</p>
  }

  return <ExperienceForm mode="edit" experienceId={params.id} initialValues={data} />
}
