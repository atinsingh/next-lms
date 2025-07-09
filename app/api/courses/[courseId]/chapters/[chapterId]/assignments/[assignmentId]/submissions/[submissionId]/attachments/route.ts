// @ts-nocheck
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';

// Using a handler object pattern to avoid TypeScript issues with route handlers
const handler = {
  // GET all attachments for a submission
  async GET(_req: Request, { params }: { 
    params: { 
      courseId: string; 
      chapterId: string; 
      assignmentId: string; 
      submissionId: string; 
    } 
  }) {
    try {
      const { userId } = await auth();
      if (!userId) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized - Please sign in' }),
          { 
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      // First verify the assignment exists and belongs to the course/chapter
      const assignment = await db.assignment.findUnique({
        where: { 
          id: params.assignmentId,
          chapterId: params.chapterId,
          chapter: {
            courseId: params.courseId
          }
        },
        select: {
          id: true,
          chapter: {
            select: {
              course: {
                select: {
                  createdById: true
                }
              }
            }
          }
        }
      });

      if (!assignment) {
        return new Response(
          JSON.stringify({ error: 'Assignment not found' }),
          { 
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      const isCourseOwner = assignment.chapter.course.createdById === userId;
      
      // Check if the user is the submitter or the course owner
      const submission = await db.submission.findUnique({
        where: {
          id: params.submissionId,
          OR: [
            { userId }, // The user who submitted
            isCourseOwner ? { assignmentId: params.assignmentId } : { id: '' } // Course owner can see any submission
          ]
        },
        select: {
          attachments: true
        },
      });

      if (!submission) {
        return new Response(
          JSON.stringify({ error: 'Submission not found or access denied' }),
          { 
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      return new Response(
        JSON.stringify(submission.attachments || []),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    } catch (error) {
      console.error('[SUBMISSION_ATTACHMENTS_GET]', error);
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  },

  // CREATE an attachment for a submission
  async POST(req: Request, { params }: { 
    params: { 
      courseId: string; 
      chapterId: string; 
      assignmentId: string; 
      submissionId: string; 
    } 
  }) {
    try {
      const { userId } = await auth();
      
      if (!userId) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized - Please sign in' }),
          { 
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      const { url, name } = await req.json();
      
      if (!url || !name) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields' }),
          { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      // First, verify the assignment exists and get its course ID
      const assignmentDetails = await db.assignment.findUnique({
        where: { id: params.assignmentId },
        select: { 
          chapterId: true,
          dueDate: true,
          chapter: {
            select: {
              courseId: true
            }
          }
        },
      });

      if (!assignmentDetails) {
        return new Response(
          JSON.stringify({ error: 'Assignment not found' }),
          { 
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      // Check if the chapter and course IDs match
      if (assignmentDetails.chapterId !== params.chapterId || 
          assignmentDetails.chapter.courseId !== params.courseId) {
        return new Response(
          JSON.stringify({ error: 'Invalid course or chapter' }),
          { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      // Verify the submission exists and belongs to the user
      const submission = await db.submission.findUnique({
        where: {
          id: params.submissionId,
          assignmentId: params.assignmentId,
          userId,
        },
        select: {
          id: true,
          submittedAt: true,
        },
      });

      if (!submission) {
        return new Response(
          JSON.stringify({ error: 'Submission not found or access denied' }),
          { 
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      // Check if the due date has passed
      if (assignmentDetails.dueDate && assignmentDetails.dueDate < new Date()) {
        return new Response(
          JSON.stringify({ error: 'Cannot submit after due date' }),
          { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      const attachment = await db.attachment.create({
        data: {
          url,
          name,
          submissionId: params.submissionId,
        },
      });

      // Update submission timestamp
      await db.submission.update({
        where: {
          id: params.submissionId,
        },
        data: {
          submittedAt: new Date(),
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
      console.error('[SUBMISSION_ATTACHMENT_CREATE]', error);
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
