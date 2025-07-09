// @ts-nocheck
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { isTeacher } from '@/lib/teacher';

// Using a handler object pattern to avoid TypeScript issues with route handlers
const handler = {
  // GET all attachments for an assignment
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
        JSON.stringify(assignment.attachments),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    } catch (error) {
      console.error('[ASSIGNMENT_ATTACHMENTS_GET]', error);
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  },

  // CREATE an attachment for an assignment
  async POST(req: Request, { params }: { 
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

      const { url, name } = await req.json();

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

      const attachment = await db.attachment.create({
        data: {
          url,
          name,
          assignmentId: params.assignmentId,
        },
      });

      return new Response(
        JSON.stringify(attachment),
        { 
          status: 201,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    } catch (error) {
      console.error('[ASSIGNMENT_ATTACHMENT_CREATE]', error);
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
export const POST = handler.POST as any;
