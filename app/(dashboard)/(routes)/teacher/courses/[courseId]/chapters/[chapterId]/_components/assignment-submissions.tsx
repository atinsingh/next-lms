'use client'

import { useEffect, useState } from 'react'
import { FileIcon, Loader2, User } from 'lucide-react'
import { useUser } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface Attachment {
  id: string
  name: string
  url: string
  createdAt: string
  updatedAt: string
}

interface UserInfo {
  id: string
  firstName: string | null
  lastName: string | null
  email: string
  fullName: string
  imageUrl: string | null
}

interface Submission {
  id: string
  userId: string
  submittedAt: string
  feedback?: string | null
  grade?: number | null
  attachments: Attachment[]
  user: UserInfo
}

interface Assignment {
  id: string
  title: string
  description: string | null
  dueDate: string | null
  points: number
  submissions: Submission[]
}

export function AssignmentSubmissions({
  courseId,
  chapterId,
}: {
  courseId: string
  chapterId: string
}) {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { user: currentUser } = useUser()

  // console.log('AssignmentSubmissions mounted with:', { courseId, chapterId })



  const fetchAssignments = async () => {
    try {
      // console.log('Fetching assignments for:', { courseId, chapterId })
      const response = await fetch(
        `/api/courses/${courseId}/chapters/${chapterId}/assignments`,
        {
          cache: 'no-store',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      // console.log('Response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        // console.error('Error response:', errorText)
        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch (e) {
          errorData = { message: errorText }
        }
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        )
      }

      const assignmentsData = await response.json()
      // console.log('Assignments data received:', assignmentsData)
      setAssignments(assignmentsData)
      setError(null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred'
      // console.error('Error fetching assignments:', errorMessage, err)
      setError(`Failed to load assignments: ${errorMessage}`)
      toast.error('Failed to load assignments')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAssignments()
  }, [courseId, chapterId])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <h3 className="text-lg font-medium text-red-800">Error Loading Submissions</h3>
          <p className="mt-1 text-sm text-red-700">{error}</p>
          <div className="mt-4 flex space-x-3">
            <Button
              variant="outline"
              onClick={() => {
                setError(null)
                setIsLoading(true)
                fetchAssignments()
              }}
            >
              <Loader2 className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Try Again
            </Button>
            <Button
              variant="ghost"
              onClick={() => window.location.reload()}
            >
              Reload Page
            </Button>
          </div>
        </div>
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <h4 className="text-sm font-medium text-yellow-800">Troubleshooting Tips:</h4>
          <ul className="mt-2 text-sm text-yellow-700 list-disc pl-5 space-y-1">
            <li>Check your internet connection</li>
            <li>Verify you have the correct permissions</li>
            <li>Contact support if the issue persists</li>
          </ul>
        </div>
      </div>
    )
  }

  if (assignments.length === 0) {
    return (
      <div className="p-4 bg-blue-50 text-blue-700 rounded-md">
        <p>No assignments found for this chapter.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Assignment Submissions</h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => {
            setIsLoading(true)
            fetchAssignments()
          }}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Refreshing...
            </>
          ) : (
            'Refresh Data'
          )}
        </Button>
      </div>
      
      {assignments.map((assignment) => (
        <div key={assignment.id} className="border rounded-lg overflow-hidden">
          <div className="bg-gray-50 p-4 border-b">
            <h3 className="text-lg font-medium">{assignment.title}</h3>
            {assignment.description && (
              <p className="text-sm text-gray-600 mt-1">{assignment.description}</p>
            )}
            <div className="mt-2 flex items-center text-sm text-gray-500">
              <span>
                {assignment.submissions?.length} submission
                {assignment.submissions?.length !== 1 ? 's' : ''}
              </span>
              {assignment.dueDate && (
                <span className="ml-4">
                  Due: {new Date(assignment.dueDate).toLocaleDateString()}
                </span>
              )}
              <span className="ml-4">{assignment.points} points</span>
            </div>
          </div>

          {assignment.submissions?.length > 0 ? (
            <div className="divide-y">
              {assignment.submissions.map((submission) => (
                <div key={submission.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-medium">
                          {submission.user.firstName?.[0] || 
                           submission.user.lastName?.[0] || 
                           submission.userId.substring(0, 1).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium">
                            {submission.user.fullName || `User ${submission.userId.substring(0, 6)}`}
                          </div>
                          <div className="text-sm text-gray-500">
                            {submission.user.email}
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Submitted: {new Date(submission.submittedAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="ml-4">
                      <h5 className="text-sm font-medium text-gray-700 mb-1">Attachments:</h5>
                      <ul className="space-y-1">
                        {submission.attachments?.map((file) => (
                          <li key={file.id}>
                            <a
                              href={file.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center text-blue-600 hover:underline text-sm"
                            >
                              <FileIcon className="h-4 w-4 mr-1 flex-shrink-0" />
                              {file.name}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500">
              No submissions yet for this assignment.
            </div>
          )}
        </div>
      ))}
    </div>
  )
}