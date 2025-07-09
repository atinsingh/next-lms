import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { getUserInfo } from '@/app/actions/users';

// Define the expected params type
type RouteParams = {
  params: {
    courseId: string;
    chapterId: string;
    assignmentId: string;
  };
};

// GET submissions for an assignment
// - Teacher/course owner: gets all submissions
// - Student: gets their own submission
export async function GET(_req: Request, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Check if the user is the course owner
    const isOwner = await db.course.findUnique({
      where: { 
        id: params.courseId, 
        createdById: userId 
      },
      select: { id: true },
    });

    if (isOwner) {
      // Get all submissions for this assignment with attachments
      const submissions = await db.submission.findMany({
        where: { 
          assignmentId: params.assignmentId,
          assignment: { chapterId: params.chapterId }
        },
        include: { attachments: true },
        orderBy: { submittedAt: 'desc' }
      });
      
      // Add user info to each submission
      const submissionsWithUserInfo = await Promise.all(
        submissions.map(async (submission) => {
          try {
            const userInfo = await getUserInfo(submission.userId);
            return { ...submission, user: userInfo };
          } catch (error) {
            console.error(`Error getting user info for submission ${submission.id}:`, error);
            return {
              ...submission,
              user: {
                id: submission.userId,
                firstName: null,
                lastName: null,
                email: `${submission.userId}@example.com`,
                imageUrl: null,
                fullName: `User ${submission.userId.substring(0, 6)}`
              }
            };
          }
        })
      );

      return NextResponse.json(submissionsWithUserInfo);
    }

    // For students, only return their own submission
    const user = await currentUser();
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    
    const submission = await db.submission.findFirst({
      where: {
        assignmentId: params.assignmentId,
        userId: user.id,
        assignment: { chapterId: params.chapterId }
      },
      include: { attachments: true },
      orderBy: { submittedAt: 'desc' },
    });

    if (!submission) {
      return NextResponse.json(null);
    }

    // Add user info to the submission
    const submissionWithUserInfo = {
      ...submission,
      user: {
        id: submission.userId,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.emailAddresses[0]?.emailAddress ?? `${submission.userId}@example.com`,
        imageUrl: user.imageUrl,
        fullName: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || `User ${submission.userId.substring(0, 6)}`
      }
    };

    return NextResponse.json(submissionWithUserInfo);
  } catch (error) {
    console.error('[SUBMISSIONS_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

// CREATE or UPDATE a submission (student)
export async function POST(_req: Request, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Verify enrollment
    const enrolled = await db.course.findFirst({
      where: {
        id: params.courseId,
        purchases: { some: { userId } },
      },
      select: { id: true },
    });

    if (!enrolled) {
      return new NextResponse('Unauthorized - Not enrolled', { status: 401 });
    }

    // Check if assignment exists in the specified chapter and course
    const assignment = await db.assignment.findUnique({
      where: {
        id: params.assignmentId,
        chapterId: params.chapterId,
        chapter: { courseId: params.courseId }
      },
      select: { id: true },
    });

    if (!assignment) {
      return new NextResponse('Assignment not found', { status: 404 });
    }

    const existing = await db.submission.findUnique({
      where: {
        userId_assignmentId: {
          userId,
          assignmentId: params.assignmentId,
        },
      },
    });

    const submission = existing
      ? await db.submission.update({
          where: { id: existing.id },
          data: { submittedAt: new Date() },
        })
      : await db.submission.create({
          data: { 
            userId, 
            assignmentId: params.assignmentId,
            submittedAt: new Date()
          },
        });

    return NextResponse.json(
      submission, 
      { status: existing ? 200 : 201 }
    );
  } catch (error) {
    console.error('[SUBMISSION_CREATE]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}