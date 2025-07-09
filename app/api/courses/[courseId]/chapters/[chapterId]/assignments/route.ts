import { auth } from '@clerk/nextjs/server'
import type { RouteHandler } from '@/types/routes';
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isTeacher } from '@/lib/teacher'
import { currentUser } from '@clerk/nextjs/server'
import { getUserInfo } from '@/app/actions/users'

interface UserInfo {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  imageUrl: string | null;
  fullName: string;
}

// GET all assignments for a chapter
export async function GET(
  req: Request,
  { params }: { params: { courseId: string; chapterId: string } }
) {
  // console.log('--- START: GET /api/courses/[courseId]/chapters/[chapterId]/assignments ---')
  // console.log('Params:', { courseId: params.courseId, chapterId: params.chapterId })
  
  try {
    const { userId } = await auth()
    // console.log('Authenticated user ID:', userId)
    
    if (!userId) {
      console.log('Unauthorized: No user ID found')
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // console.log('Fetching assignments from database...')
    
    // First, verify the chapter exists and get basic assignment info
    const chapter = await db.chapter.findUnique({
      where: { id: params.chapterId },
      select: { id: true, title: true, courseId: true }
    })
    
    // console.log('Chapter data:', chapter)
    
    if (!chapter) {
      console.log('Chapter not found')
      return new NextResponse('Chapter not found', { status: 404 })
    }
    
    // Get all assignments for the chapter
    const assignments = await db.assignment.findMany({
      where: {
        chapterId: params.chapterId,
        chapter: {
          courseId: params.courseId,
        },
      },
      include: {
        attachments: true,
        _count: {
          select: {
            submissions: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
    
    // console.log(`Found ${assignments.length} assignments`)
    assignments.forEach((a, i) => {
      // console.log(`Assignment ${i + 1}:`, {
      //   id: a.id,
      //   title: a.title,
      //   submissionCount: a._count.submissions,
      //   hasAttachments: a.attachments.length > 0
      // })
    })

    // First, get all submissions for all assignments with attachments
    const allSubmissions = await db.submission.findMany({
      where: {
        assignmentId: { in: assignments.map(a => a.id) }
      },
      include: {
        attachments: true
      },
      orderBy: { submittedAt: 'desc' }
    });

    // Verify teacher status
    const user = await currentUser();
    if (!user || !isTeacher(user.id)) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Create a map to store user info
    const userMap = new Map<string, UserInfo>();
    
    // Get unique user IDs from submissions
    const userIds = Array.from(new Set(allSubmissions.map(s => s.userId)));
    
    // Fetch user info for each unique user
    for (const userId of userIds) {
      try {
        const userInfo = await getUserInfo(userId);
        userMap.set(userId, userInfo);
      } catch (error) {
        // console.error(`Error fetching user ${userId}:`, error);
        // Fallback to basic user info if there's an error
        userMap.set(userId, {
          id: userId,
          firstName: null,
          lastName: null,
          email: `${userId}@example.com`,
          imageUrl: null,
          fullName: `User ${userId.substring(0, 6)}`
        });
      }
    }
    
    // Add user info to each submission
    const submissionsWithUserInfo = allSubmissions.map(submission => ({
      ...submission,
      user: userMap.get(submission.userId)!
    }));

    // Group submissions by assignment ID
    const submissionsByAssignment = submissionsWithUserInfo.reduce<Record<string, any[]>>((acc, submission) => {
      if (!acc[submission.assignmentId]) {
        acc[submission.assignmentId] = [];
      }
      
      acc[submission.assignmentId].push(submission);
      return acc;
    }, {});

    // Combine assignments with their submissions
    const assignmentsWithSubmissions = assignments.map(assignment => ({
      ...assignment,
      _count: undefined,
      submissions: submissionsByAssignment[assignment.id] || []
    }));
    
    // console.log('Final response data prepared with', 
    //   assignmentsWithSubmissions.length, 'assignments and',
    //   assignmentsWithSubmissions.reduce((sum: number, a: any) => sum + (a.submissions?.length || 0), 0), 
    //   'total submissions'
    // )

    const response = NextResponse.json(assignmentsWithSubmissions || [])
    // console.log('--- END: GET /api/courses/[courseId]/chapters/[chapterId]/assignments ---')
    return response
  } catch (error: unknown) {
    // console.error('[ASSIGNMENTS_GET] Error:', error)
    
    if (error instanceof Error) {
      // console.error('Error details:', {
      //   name: error.name,
      //   message: error.message,
      //   stack: error.stack
      // })
    } else {
      // console.error('Unknown error type:', error)
    }
    
    return new NextResponse('Internal Error', { status: 500 })
  }
}

// CREATE a new assignment
export async function POST(
  req: Request,
  { params }: { params: { courseId: string; chapterId: string } }
) {
  try {
    const { userId } = await auth()
    if (!userId || !isTeacher(userId)) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { title, description, dueDate, points, isPublished, attachments } = await req.json()

    const chapterOwner = await db.chapter.findFirst({
      where: {
        id: params.chapterId,
        course: {
          createdById: userId,
        },
      },
    })

    if (!chapterOwner) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const lastAssignment = await db.assignment.findFirst({
      where: {
        chapterId: params.chapterId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    const newAssignment = await db.assignment.create({
      data: {
        title,
        description,
        dueDate: dueDate ? new Date(dueDate) : null,
        points: points || 100,
        isPublished: isPublished || false,
        chapterId: params.chapterId,
        attachments: {
          create: attachments?.map((attachment: { url: string, name: string }) => ({
            url: attachment.url,
            name: attachment.name,
          })) || [],
        },
      },
      include: {
        attachments: true,
      },
    })

    return NextResponse.json(newAssignment)
  } catch (error) {
    // console.error('[CHAPTER_ASSIGNMENT_CREATE]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
