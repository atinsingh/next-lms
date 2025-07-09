import { NextResponse } from 'next/server'
import type { RouteHandler } from '@/types/routes';
import { UTApi } from 'uploadthing/server'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Initialize UTApi with environment variables
    const utapi = new UTApi({
      apiKey: process.env.UPLOADTHING_TOKEN,
      fetch: globalThis.fetch,
    })

    // Upload the file
    const response = await utapi.uploadFiles(file)

    if (!response.data?.url) {
      throw new Error('Failed to upload file')
    }

    return NextResponse.json({
      success: true,
      url: response.data.url,
      name: file.name,
      size: file.size,
    })
  } catch (error) {
    // console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}
