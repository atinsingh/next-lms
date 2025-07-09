'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { UploadDropzone } from '@/lib/uploadthing'
import { ourFileRouter } from '@/app/api/uploadthing/core'
import { Loader2, FileArchive } from 'lucide-react'

interface FileUploadProps {
  onChange: (url?: string) => void
  endpoint: keyof typeof ourFileRouter
}

export const FileUpload = ({
  onChange,
  endpoint,
}: FileUploadProps) => {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  return (
    <div className="w-full">
      {endpoint === 'courseAttachment' && (
        <div className="mb-4 text-center">
          <div className="flex justify-center space-x-4 mb-2">
            <div className="flex flex-col items-center">
              <FileArchive className="h-8 w-8 text-gray-500 mb-1" />
              <span className="text-xs text-gray-500">ZIP</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mb-4">Max file size: 128MB</p>
        </div>
      )}
      
      <div className="relative">
        {isUploading && (
          <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center z-10 rounded-lg">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              Uploading... {Math.round(uploadProgress)}%
            </p>
          </div>
        )}
        
        <UploadDropzone
          endpoint={endpoint}
          onUploadBegin={() => {
            setIsUploading(true)
            setUploadProgress(0)
          }}
          onUploadProgress={(progress) => {
            setUploadProgress(progress)
          }}
          onClientUploadComplete={(res) => {
            setIsUploading(false)
            const fileUrl = res?.[0]?.url || res?.[0]?.ufsUrl
            onChange(fileUrl)
            toast.success('File uploaded successfully')
          }}
          onUploadError={(error: Error) => {
            setIsUploading(false)
            toast.error(error?.message || 'File upload failed. Please try again.')
          }}
          config={{
            mode: 'auto',
            appendOnPaste: true,
          }}
          className={`${isUploading ? 'opacity-50' : ''} border-2 border-dashed rounded-lg`}
        />
      </div>
    </div>
  )
}
