// @ts-nocheck
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { isTeacher } from '@/lib/teacher';

// Using a handler object pattern to avoid TypeScript issues with route handlers
const handler = {
  async DELETE(_req: Request, { params }: { params: { 
    courseId: string;
    chapterId: string;
    assignmentId: string;
    attachmentId: string;
  }}) {
    try {
      const { userId } = await auth();
      
      if (!userId || !isTeacher(userId)) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { 
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          }
        );
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
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { 
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      const attachment = await db.attachment.delete({
        where: {
          id: params.attachmentId,
          assignmentId: params.assignmentId,
        },
      });

      return new Response(
        JSON.stringify(attachment),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    } catch (error) {
      console.error('[ASSIGNMENT_ATTACHMENT_DELETE]', error);
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  }
};

// Export the handler with type assertion
export const DELETE = handler.DELETE as any;
