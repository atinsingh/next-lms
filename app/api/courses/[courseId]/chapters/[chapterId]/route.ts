import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import Mux from '@mux/mux-node'
import { db } from '@/lib/db'

type Params = Promise<{ chapterId: string; courseId: string }>

const { Video } = new Mux(process.env.MUX_TOKEN_ID!, process.env.MUX_TOKEN_SECRET!)

export async function PATCH(req: NextRequest, { params }: { params: Params }) {
  try {
    const resolvedParams = await params
    const { userId } = await auth()
    // eslint-disable-next-line
    const { isPublished, ...values } = await req.json()

    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const ownCourse = await db.course.findUnique({ where: { id: resolvedParams.courseId, createdById: userId } })
    if (!ownCourse) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const chapter = await db.chapter.update({ where: { id: resolvedParams.chapterId }, data: { ...values } })

    if (values.videoUrl) {
      try {
        // Clean up existing Mux data if any
        const existingMuxData = await db.muxData.findFirst({ 
          where: { chapterId: resolvedParams.chapterId } 
        });
        
        if (existingMuxData) {
          try {
            await Video.Assets.del(existingMuxData.assetId);
          } catch {
            // Continue even if deletion fails
          }
          await db.muxData.delete({ where: { id: existingMuxData.id } });
        }

        // Create new Mux asset
        const asset = await Video.Assets.create({
          input: values.videoUrl,
          playback_policy: 'public',
          test: false,
        });

        if (!asset.playback_ids?.[0]?.id) {
          throw new Error('No playback ID received from Mux');
        }

        // Save Mux data to database
        await db.muxData.create({
          data: {
            chapterId: resolvedParams.chapterId,
            assetId: asset.id,
            playbackId: asset.playback_ids[0].id,
          },
        });
      } catch {
        // Log error in production using a proper logging service
        // For now, we'll fail silently to not block the chapter update
      }
    }

    return NextResponse.json(chapter)
  } catch {
    return new NextResponse('Internal server error', { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Params }) {
  try {
    const resolvedParams = await params
    const { userId } = await auth()

    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const ownCourse = await db.course.findUnique({ where: { id: resolvedParams.courseId, createdById: userId } })
    if (!ownCourse) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const chapter = await db.chapter.findUnique({
      where: { id: resolvedParams.chapterId, courseId: resolvedParams.courseId },
    })
    if (!chapter) {
      return new NextResponse('Chapter not found', { status: 404 })
    }

    if (chapter.videoUrl) {
      const existingMuxData = await db.muxData.findFirst({ where: { chapterId: resolvedParams.chapterId } })

      if (existingMuxData) {
        await Video.Assets.del(existingMuxData.assetId)
        await db.muxData.delete({ where: { id: existingMuxData.id } })
      }
    }

    const deletedChapter = await db.chapter.delete({ where: { id: resolvedParams.chapterId } })

    const publishedChaptersInCourse = await db.chapter.count({
      where: { courseId: resolvedParams.courseId, isPublished: true },
    })

    if (!publishedChaptersInCourse) {
      await db.course.update({ where: { id: resolvedParams.courseId }, data: { isPublished: false } })
    }

    return NextResponse.json(deletedChapter)
  } catch {
    return new NextResponse('Internal server error', { status: 500 })
  }
}
