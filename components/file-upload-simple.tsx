'use client'

import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { useUploadThing } from '@/lib/uploadthing/client'
import { ourFileRouter } from '@/app/api/uploadthing/core'
import { Loader2, FileArchive, File as FileIcon, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface FileUploadSimpleProps {
  onChange: (url?: string) => void
  endpoint: keyof typeof ourFileRouter
}

export const FileUploadSimple = ({
  onChange,
  endpoint,
}: FileUploadSimpleProps) => {
  const [isUploading, setIsUploading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  
  const { startUpload } = useUploadThing(endpoint, {
    onClientUploadComplete: (res: Array<{ url: string }>) => {
      setIsUploading(false)
      if (res && res[0]?.url) {
        onChange(res[0].url)
        toast.success('File uploaded successfully')
      }
    },
    onUploadError: (error: Error) => {
      setIsUploading(false)
      toast.error(`Upload failed: ${error.message}`)
    },
  })

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }, [])

  const handleUpload = useCallback(async () => {
    if (!file) return
    
    setIsUploading(true)
    try {
      await startUpload([file])
    } catch (error) {
      // console.error('Upload error:', error)
      toast.error('Upload failed. Please try again.')
      setIsUploading(false)
    }
  }, [file, startUpload])

  const removeFile = useCallback(() => {
    setFile(null)
    onChange(undefined)
  }, [onChange])

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-center w-full">
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <FileIcon className="w-8 h-8 mb-2 text-gray-500" />
            <p className="mb-2 text-sm text-gray-500">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500">
              {endpoint === 'courseAttachment' ? 'PDF, ZIP (max 128MB)' : 'Upload your file'}
            </p>
          </div>
          <input 
            type="file" 
            className="hidden" 
            onChange={handleFileChange}
            accept={endpoint === 'courseAttachment' ? '.pdf,.zip' : '*/*'}
            disabled={isUploading}
          />
        </label>
      </div>

      {file && (
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
          <div className="flex items-center space-x-2">
            <FileIcon className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-700 truncate max-w-xs">
              {file.name}
            </span>
            <span className="text-xs text-gray-500">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={removeFile}
            disabled={isUploading}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <Button
        type="button"
        onClick={handleUpload}
        disabled={!file || isUploading}
        className="w-full"
      >
        {isUploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Uploading...
          </>
        ) : (
          'Upload File'
        )}
      </Button>
    </div>
  )
}
