import api from '@/lib/api'

interface CloudinarySignature {
  signature: string
  timestamp: number
  api_key: string
  cloud_name: string
  folder?: string
}

const getUploadSignature = () => api.get<CloudinarySignature>('/admin/uploads/cloudinary-signature').then((r) => r.data)

async function uploadToCloudinary(file: File): Promise<string> {
  const sig = await getUploadSignature()

  const formData = new FormData()
  formData.append('file', file)
  formData.append('api_key', sig.api_key)
  formData.append('timestamp', String(sig.timestamp))
  formData.append('signature', sig.signature)
  if (sig.folder) formData.append('folder', sig.folder)

  const response = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloud_name}/image/upload`, {
    method: 'POST',
    body: formData,
  })
  if (!response.ok) throw new Error('Image upload failed')

  const data = (await response.json()) as { secure_url: string }
  return data.secure_url
}

export const uploadService = { uploadToCloudinary }
