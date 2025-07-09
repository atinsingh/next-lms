// @ts-nocheck
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';

// Using a handler object pattern to avoid TypeScript issues with route handlers
const handler = {
  // DELETE an attachment from a submission
  async DELETE(_req: Request, { params }: { 
    params: { 
      courseId: string; 
      chapterId: string; 
      assignmentId: string; 
      submissionId: string; 
      attachmentId: string; 
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

      // Verify the user is the submitter or the course owner
      const submission = await db.submission.findUnique({
        where: {
          id: params.submissionId,
          assignmentId: params.assignmentId,
        },
        include: {
          assignment: {
            include: {
              chapter: {
                select: {
                  course: {
                    select: {
                      createdById: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!submission) {
        return new Response(
          JSON.stringify({ error: 'Not found' }),
          { 
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      const isCourseOwner = submission.assignment.chapter.course.createdById === userId;
      const isSubmitter = submission.userId === userId;

      if (!isCourseOwner && !isSubmitter) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { 
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      // If not the course owner, check if the due date has passed
      if (!isCourseOwner) {
        const assignment = await db.assignment.findUnique({
          where: {
            id: params.assignmentId,
          },
          select: {
            dueDate: true,
          },
        });

        if (assignment?.dueDate && assignment.dueDate < new Date()) {
          return new Response(
            JSON.stringify({ error: 'Cannot modify submission after due date' }),
            { 
              status: 400,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        }
      }

      const attachment = await db.attachment.delete({
        where: {
          id: params.attachmentId,
          submissionId: params.submissionId,
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
      console.error('[SUBMISSION_ATTACHMENT_DELETE]', error);
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
