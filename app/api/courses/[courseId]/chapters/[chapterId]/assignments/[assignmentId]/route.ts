// @ts-nocheck
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { isTeacher } from '@/lib/teacher';

// Using a handler object pattern to avoid TypeScript issues with route handlers
const handler = {
  // GET a specific assignment
  async GET(_req: Request, { params }: { 
    params: { 
      courseId: string; 
      chapterId: string; 
      assignmentId: string; 
    } 
  }) {
    try {
      const { userId } = await auth();
      if (!userId) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { 
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      const assignment = await db.assignment.findUnique({
        where: {
          id: params.assignmentId,
          chapterId: params.chapterId,
          chapter: {
            courseId: params.courseId,
          },
        },
        include: {
          attachments: true,
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

      return new Response(
        JSON.stringify(assignment),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    } catch (error) {
      console.error('[ASSIGNMENT_GET]', error);
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  },

  // UPDATE an assignment
  async PATCH(req: Request, { params }: { 
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

      const values = await req.json();

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

      // Handle due date conversion if provided
      if (values.dueDate) {
        values.dueDate = new Date(values.dueDate);
      }

      const assignment = await db.assignment.update({
        where: {
          id: params.assignmentId,
          chapterId: params.chapterId,
        },
        data: {
          ...values,
        },
      });

      return new Response(
        JSON.stringify(assignment),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    } catch (error) {
      console.error('[ASSIGNMENT_UPDATE]', error);
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  },

  // DELETE an assignment
  async DELETE(_req: Request, { params }: { 
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

      await db.assignment.delete({
        where: {
          id: params.assignmentId,
          chapterId: params.chapterId,
        },
      });

      return new Response(
        null,
        { 
          status: 204,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    } catch (error) {
      console.error('[ASSIGNMENT_DELETE]', error);
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

// Export the handlers with type assertions
export const GET = handler.GET as any;
export const PATCH = handler.PATCH as any;
export const DELETE = handler.DELETE as any;
