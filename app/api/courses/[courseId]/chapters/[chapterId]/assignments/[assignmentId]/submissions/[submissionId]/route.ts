// @ts-nocheck
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Using a handler object pattern to avoid TypeScript issues with route handlers
const handler = {
  // GET a specific submission
  async GET(_req: Request, { params }: any) {
    try {
      const { userId } = await auth();
      if (!userId) {
        return new NextResponse('Unauthorized', { status: 401 });
      }

      // Check if the user is the submitter or the course owner
      const submission = await db.submission.findUnique({
        where: {
          id: params.submissionId,
          OR: [
            { userId }, // The user who submitted
            {
              assignment: {
                chapter: {
                  course: {
                    createdById: userId, // The course owner
                  },
                },
              },
            },
          ],
        },
        include: {
          attachments: true,
          assignment: {
            include: {
              attachments: true,
            },
          },
        },
      });

      if (!submission) {
        return new NextResponse('Not found', { status: 404 });
      }

      return NextResponse.json(submission);
    } catch (error) {
      console.error('[SUBMISSION_GET]', error);
      return new NextResponse('Internal Error', { status: 500 });
    }
  },

  // UPDATE a submission (for grading/feedback)
  async PATCH(req: Request, { params }: any) {
    try {
      const { userId } = await auth();
      if (!userId) {
        return new NextResponse('Unauthorized', { status: 401 });
      }

      const { grade, feedback } = await req.json();

      // Only the course owner can grade submissions
      const isCourseOwner = await db.course.findFirst({
        where: {
          id: params.courseId,
          createdById: userId,
        },
      });

      if (!isCourseOwner) {
        return new NextResponse('Unauthorized', { status: 401 });
      }

      const submission = await db.submission.update({
        where: {
          id: params.submissionId,
          assignmentId: params.assignmentId,
        },
        data: {
          grade,
          feedback,
          gradedAt: new Date(),
        },
      });

      return NextResponse.json(submission);
    } catch (error) {
      console.error('[SUBMISSION_UPDATE]', error);
      return new NextResponse('Internal Error', { status: 500 });
    }
  },

  // DELETE a submission (student can delete their own submission before due date)
  async DELETE(_req: Request, { params }: any) {
    try {
      const { userId } = await auth();
      if (!userId) {
        return new NextResponse('Unauthorized', { status: 401 });
      }

      // Get the submission with related data for permission checks
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
        return new NextResponse('Not found', { status: 404 });
      }

      const isCourseOwner = submission.assignment.chapter.course.createdById === userId;
      const isSubmitter = submission.userId === userId;

      // Only the submitter or course owner can delete
      if (!isSubmitter && !isCourseOwner) {
        return new NextResponse('Unauthorized', { status: 401 });
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
          return new NextResponse('Cannot delete submission after due date', { status: 400 });
        }
      }

      // Delete the submission and its attachments (cascade delete should handle this)
      await db.submission.delete({
        where: {
          id: params.submissionId,
        },
      });

      return new NextResponse(null, { status: 204 });
    } catch (error) {
      console.error('[SUBMISSION_DELETE]', error);
      return new NextResponse('Internal Error', { status: 500 });
    }
  },
};

// Export the handlers with type assertions
export const GET = handler.GET as any;
export const PATCH = handler.PATCH as any;
export const DELETE = handler.DELETE as any;
