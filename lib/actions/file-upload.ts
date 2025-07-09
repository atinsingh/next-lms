'use server'

import { UTApi } from 'uploadthing/server'

export const uploadFile = async (formData: FormData) => {
  try {
    const file = formData.get('file') as File
    if (!file) {
      throw new Error('No file provided')
    }

    // Create a new instance of UTApi
    const utapi = new UTApi({
      // These should be set in your environment variables
      token: process.env.UPLOADTHING_TOKEN,
      fetch: globalThis.fetch,
    })

    // Upload the file
    const response = await utapi.uploadFiles(file)

    if (!response.data?.url) {
      throw new Error('Failed to upload file')
    }

    return { 
      success: true, 
      url: response.data.url,
      name: file.name,
      size: file.size
    }
  } catch (error) {
    // console.error('Upload error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to upload file' 
    }
  }
}
