import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { isTeacher } from '@/lib/teacher'

export async function DELETE(
  request: Request,
  { params }: { params: { courseId: string; attachmentId: string } }
): Promise<Response> {
  try {
    const { courseId, attachmentId } = params;
    const { userId } = await auth();

    if (!userId || !isTeacher(userId)) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const courseOwner = await db.course.findUnique({
      where: { id: courseId, createdById: userId }
    });
    
    if (!courseOwner) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const attachment = await db.attachment.delete({
      where: { courseId, id: attachmentId }
    });

    return new Response(JSON.stringify(attachment), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error deleting attachment:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
