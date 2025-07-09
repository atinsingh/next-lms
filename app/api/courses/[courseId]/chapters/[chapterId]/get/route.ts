import { auth } from '@clerk/nextjs/server'
import type { RouteHandler } from '@/types/routes';
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  req: Request,
  { params }: { params: { courseId: string; chapterId: string } }
) {
  try {
    console.log('API Params:', params);
    const { courseId, chapterId } = params;
    const { userId } = await auth()
    
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const course = await db.course.findUnique({
      where: {
        id: courseId,
        isPublished: true,
      },
      select: {
        id: true,
        price: true,
        createdById: true,
      },
    })

    if (!course) {
      return new NextResponse("Course not found", { status: 404 })
    }

    const chapter = await db.chapter.findUnique({
      where: {
        id: chapterId,
        isPublished: true,
      },
    })

    if (!chapter) {
      return new NextResponse("Chapter not found", { status: 404 })
    }

    const purchase = await db.purchase.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId: courseId,
        },
      },
    })

    const isEnrolled = !!purchase
    const isTeacher = course.createdById === userId

    // Only include assignments if user is enrolled or is the teacher
    const assignments = isEnrolled || isTeacher
      ? await db.assignment.findMany({
          where: {
            chapterId: chapterId,
            isPublished: true,
          },
          include: {
            attachments: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        })
      : []

    const attachments = isEnrolled || isTeacher
      ? await (db as any).attachment.findMany({
          where: {
            courseId: courseId,
          },
        })
      : []

    const muxData = isEnrolled || isTeacher
      ? await db.muxData.findUnique({
          where: {
            chapterId: chapterId,
          },
        })
      : null

    const nextChapter = isEnrolled || isTeacher
      ? await db.chapter.findFirst({
          where: {
            courseId: courseId,
            isPublished: true,
            position: {
              gt: chapter.position,
            },
          },
          orderBy: {
            position: 'asc',
          },
        })
      : null

    const userProgress = await db.userProgress.findUnique({
      where: {
        userId_chapterId: {
          userId,
          chapterId: chapterId,
        },
      },
    })

    return NextResponse.json({
      chapter,
      course,
      muxData,
      attachments,
      nextChapter,
      userProgress,
      purchase,
      assignments,
      isEnrolled,
      isTeacher,
    })
  } catch (error) {
    console.error('[CHAPTER_GET]', error)
    return new NextResponse(JSON.stringify({ 
      error: 'Internal Server Error',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? (error as Error)?.stack : undefined
    }), { status: 500 })
  }
}
