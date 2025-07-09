import { generateReactHelpers } from '@uploadthing/react'
import type { OurFileRouter } from '@/app/api/uploadthing/core'

export const { useUploadThing, uploadFiles } = generateReactHelpers<OurFileRouter>()

// Define FileWithPath type locally since it's not exported from @uploadthing/react
export interface FileWithPath extends File {
  path?: string;
}
