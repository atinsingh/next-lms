'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { UploadDropzone } from '@/lib/uploadthing'
import { ourFileRouter } from '@/app/api/uploadthing/core'

interface FileUploadProps {
  onChange: (url?: string) => void
  endpoint: keyof typeof ourFileRouter
}

export const FileUpload = ({
  onChange,
  endpoint,
}: FileUploadProps) => {
  const [isUploading, setIsUploading] = useState(false)

  return (
    <div className="w-full">
      <UploadDropzone
        endpoint={endpoint}
        onClientUploadComplete={(res) => {
          setIsUploading(false)
          onChange(res?.[0].url || undefined)
          toast.success('File uploaded successfully')
        }}
        onUploadError={(error: Error) => {
          setIsUploading(false)
          toast.error(error?.message || 'File upload failed')
        }}
        onUploadBegin={() => {
          setIsUploading(true)
        }}
      />
      {isUploading && (
        <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10">
          <div className="bg-white p-4 rounded-lg shadow-lg flex items-center space-x-2">
            <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span>Uploading file...</span>
          </div>
        </div>
      )}
    </div>
  )
}
