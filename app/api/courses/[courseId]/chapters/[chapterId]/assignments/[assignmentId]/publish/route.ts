// @ts-nocheck
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { isTeacher } from '@/lib/teacher';

// Using a handler object pattern to avoid TypeScript issues with route handlers
const handler = {
  async PATCH(_req: Request, { params }: { 
    params: { 
      courseId: string; 
      chapterId: string; 
      assignmentId: string; 
    } 
  }) {
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

      // Get the current assignment
      const assignment = await db.assignment.findUnique({
        where: {
          id: params.assignmentId,
          chapterId: params.chapterId,
        },
      });

      if (!assignment) {
        return new Response(
          JSON.stringify({ error: 'Not found' }),
          { 
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      // Toggle the publish status
      const updatedAssignment = await db.assignment.update({
        where: {
          id: params.assignmentId,
        },
        data: {
          isPublished: !assignment.isPublished,
        },
      });

      return new Response(
        JSON.stringify(updatedAssignment),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    } catch (error) {
      console.error('[ASSIGNMENT_PUBLISH]', error);
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
export const PATCH = handler.PATCH as any;
