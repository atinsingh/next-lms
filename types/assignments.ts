import { Attachment } from '@prisma/client'

export interface AssignmentAttachment {
  id: string
  name: string
  url: string
  courseId: string
  createdAt: Date
  updatedAt: Date
}

export interface AssignmentWithAttachments {
  id: string
  title: string
  description: string | null
  dueDate: Date | null
  points: number
  isPublished: boolean
  position: number
  attachments: AssignmentAttachment[]
}

export interface SubmissionWithAttachments {
  id: string
  assignmentId: string
  userId: string
  submittedAt: Date | null
  gradedAt: Date | null
  grade: number | null
  feedback: string | null
  attachments: AssignmentAttachment[]
}

export interface CreateAssignmentData {
  title: string
  description?: string
  dueDate?: string
  points?: number
  isPublished?: boolean
  attachments?: string[]
}

export interface UpdateAssignmentData extends Partial<CreateAssignmentData> {
  id: string
}

export interface SubmitAssignmentData {
  assignmentId: string
  attachments: string[]
}

export interface GradeSubmissionData {
  submissionId: string
  grade: number
  feedback?: string
}
