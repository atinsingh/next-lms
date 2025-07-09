'use client'

import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { Loader2, File as FileIcon, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const FileUploadBasic = ({
  onChange,
  accept = '.pdf,.zip',
  maxSizeMB = 128,
  label = 'Upload File',
}: {
  onChange: (file: File | null) => void
  accept?: string
  maxSizeMB?: number
  label?: string
}) => {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return
    
    const selectedFile = e.target.files[0]
    
    // Check file size
    if (selectedFile.size > maxSizeMB * 1024 * 1024) {
      toast.error(`File size exceeds ${maxSizeMB}MB`)
      return
    }
    
    setFile(selectedFile)
    onChange(selectedFile)
  }, [maxSizeMB, onChange])

  const removeFile = useCallback(() => {
    setFile(null)
    onChange(null)
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
              {accept} (max {maxSizeMB}MB)
            </p>
          </div>
          <input 
            type="file" 
            className="hidden" 
            onChange={handleFileChange}
            accept={accept}
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
    </div>
  )
}
