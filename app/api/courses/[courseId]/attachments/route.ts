// @ts-nocheck
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { isTeacher } from '@/lib/teacher';

// Using a handler object pattern to avoid TypeScript issues with route handlers
const handler = {
  async POST(request: Request, { params }: { params: { courseId: string } }) {
    try {
      const { courseId } = params;
      const { userId } = await auth();
      const { url } = await request.json();

      if (!userId || !isTeacher(userId)) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { 
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      const courseOwner = await db.course.findUnique({
        where: {
          id: courseId,
          createdById: userId,
        },
      });

      if (!courseOwner) {
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
          name: url.split('/').pop(),
          courseId,
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
      console.error('Error creating attachment:', error);
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
export const POST = handler.POST as any;
