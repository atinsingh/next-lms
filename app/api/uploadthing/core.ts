import { auth } from '@clerk/nextjs/server'
import { createUploadthing, type FileRouter } from 'uploadthing/next'
import { isTeacher } from '@/lib/teacher'

const f = createUploadthing()

const handleAuth = async () => {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')
  return { userId }
}

const handleTeacherAuth = async () => {
  const { userId } = await auth()
  const isAuthorized = isTeacher(userId)

  if (!userId || !isAuthorized) throw new Error('Unauthorized')
  return { userId }
}

export const ourFileRouter = {
  courseImage: f({ image: { maxFileSize: '4MB', maxFileCount: 1 } })
    .middleware(() => handleTeacherAuth())
    .onUploadComplete(() => {}),
  courseAttachment: f({
    pdf: { maxFileSize: '16MB', maxFileCount: 10 },
    image: { maxFileSize: '8MB', maxFileCount: 10 },
    video: { maxFileSize: '512MB', maxFileCount: 5 },
    audio: { maxFileSize: '32MB', maxFileCount: 10 },
    text: { maxFileSize: '4MB', maxFileCount: 10 },
    blob: { maxFileSize: '128MB', maxFileCount: 5 },

  })
    .middleware(() => handleAuth())
    .onUploadComplete(() => {}),
  chapterVideo: f({ video: { maxFileCount: 1, maxFileSize: '512GB' } })
    .middleware(() => handleTeacherAuth())
    .onUploadComplete(() => {}),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
