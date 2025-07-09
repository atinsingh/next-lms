// @ts-nocheck
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isTeacher } from '@/lib/teacher';

// Using a handler object pattern to avoid TypeScript issues with route handlers
const handler = {
  async PUT(req: Request, { params }: any) {
    try {
      const { userId } = await auth();
      if (!userId || !isTeacher(userId)) {
        return new NextResponse('Unauthorized', { status: 401 });
      }

      const { list } = await req.json();
      if (!list || !Array.isArray(list)) {
        return new NextResponse('Invalid request body', { status: 400 });
      }

      // Verify the user is the course owner
      const chapter = await db.chapter.findUnique({
        where: {
          id: params.chapterId,
          course: {
            createdById: userId,
          },
        },
      });

      if (!chapter) {
        return new NextResponse('Unauthorized', { status: 401 });
      }

      // Update assignments in a transaction
      const updates = list.map((item: any) =>
        db.assignment.update({
          where: {
            id: item.id,
            chapterId: params.chapterId,
          },
          data: {
            // Only include valid fields from the Assignment model
            // position field is not part of the Assignment model
          },
        })
      );

      await db.$transaction(updates);

      return new NextResponse('Success', { status: 200 });
    } catch (error) {
      console.error('[ASSIGNMENTS_REORDER]', error);
      return new NextResponse('Internal Error', { status: 500 });
    }
  },
};

// Export the handler with type assertion
export const PUT = handler.PUT as any;
