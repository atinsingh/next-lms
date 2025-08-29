import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  req: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const courseId = params.courseId

    const publishedChapters = await db.chapter.findMany({
      where: { courseId, isPublished: true },
      select: { id: true },
    })

    const chapterIds = publishedChapters.map((chapter) => chapter.id)
    const completedChapters = await db.userProgress.count({
      where: { userId, chapterId: { in: chapterIds }, isCompleted: true },
    })

    const total = chapterIds.length
    const progress = total ? (completedChapters / total) * 100 : 0

    return NextResponse.json({
      completed: completedChapters,
      total,
      progress,
    })
  } catch {
    return new NextResponse('Internal server error', { status: 500 })
  }
}

