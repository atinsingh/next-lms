import { NextRequest } from 'next/server';

// Base route parameters
type BaseRouteParams = {
  courseId: string;
  chapterId: string;
  assignmentId?: string;
  attachmentId?: string;
  submissionId?: string;
  [key: string]: string | undefined;
};

// Route handler context
export interface RouteContext<T extends BaseRouteParams = BaseRouteParams> {
  params: Promise<T>;
  searchParams: { [key: string]: string | string[] | undefined };
}

// Request handler type
export type RouteHandler<T extends BaseRouteParams = BaseRouteParams> = (
  req: NextRequest,
  context: RouteContext<T>
) => Promise<Response> | Response;

// Specific route parameter types
export type CourseRouteParams = {
  courseId: string;
};

export type ChapterRouteParams = CourseRouteParams & {
  chapterId: string;
};

export type AssignmentRouteParams = ChapterRouteParams & {
  assignmentId: string;
};

export type AttachmentRouteParams = AssignmentRouteParams & {
  attachmentId: string;
};

export type SubmissionRouteParams = AssignmentRouteParams & {
  submissionId: string;
};
