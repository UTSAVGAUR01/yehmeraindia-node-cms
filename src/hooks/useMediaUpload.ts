import { useState, useCallback } from 'react'

export interface UseMediaUploadReturn {
  image: string | null
  preview: string | null
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  clearImage: () => void
  isLoading: boolean
}

export function useMediaUpload(initialImage?: string): UseMediaUploadReturn {
  const [image, setImage] = useState<string | null>(initialImage || null)
  const [isLoading, setIsLoading] = useState(false)

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB')
      return
    }

    setIsLoading(true)

    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result as string
      setImage(result)
      setIsLoading(false)
    }
    reader.onerror = () => {
      setIsLoading(false)
      alert('Failed to read image')
    }
    reader.readAsDataURL(file)
  }, [])

  const clearImage = useCallback(() => {
    setImage(null)
  }, [])

  return {
    image,
    preview: image,
    handleFileChange,
    clearImage,
    isLoading,
  }
}
