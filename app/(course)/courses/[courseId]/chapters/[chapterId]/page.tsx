'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import axios from 'axios'
import { Banner } from '@/components/banner'
import { Preview } from '@/components/preview'
import { VideoPlayer } from './_components/video-player'
import CourseEnrollButton from './_components/course-enroll-button'
import { Separator } from '@/components/ui/separator'
import { CourseProgressButton } from './_components/course-progress-button'
import { AssignmentsListFixed as AssignmentsList } from './_components/assignments-list-fixed'
import { AssignmentSubmission } from './_components/assignment-submission'
import { Button } from '@/components/ui/button'
import { File } from 'lucide-react'
import { AssignmentWithAttachments } from '@/types/assignments'

interface ChapterPageParams {
  courseId: string
  chapterId: string
}

export default function ChapterDetails({ params }: { params: Promise<ChapterPageParams> }) {
  const router = useRouter()
  const { userId } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  
  // Unwrap the params promise using React.use()
  const { courseId, chapterId } = use(params)
  
  // Debug logging
  // console.log('Page params:', { courseId, chapterId })
  const [chapter, setChapter] = useState<{
    id: string
    title: string
    description: string | null
    isFree: boolean
    position: number
  } | null>(null)
  const [course, setCourse] = useState<{
    id: string
    price: number | null
    createdById: string
  } | null>(null)
  const [muxData, setMuxData] = useState<{
    id: string
    assetId: string
    playbackId: string | null
  } | null>(null)
  const [attachments, setAttachments] = useState<Array<{
    id: string
    name: string
    url: string
    createdAt: string
  }>>([])
  const [nextChapter, setNextChapter] = useState<{
    id: string
    title: string
    position: number
  } | null>(null)
  const [userProgress, setUserProgress] = useState<{
    id: string
    isCompleted: boolean
  } | null>(null)
  const [purchase, setPurchase] = useState<{
    id: string
  } | null>(null)
  const [assignments, setAssignments] = useState<AssignmentWithAttachments[]>([])
  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentWithAttachments | null>(null)
  const [isTeacher, setIsTeacher] = useState(false)
  const [isEnrolled, setIsEnrolled] = useState(false)



  useEffect(() => {
    const fetchData = async () => {
      // console.log('Fetching data for:', { courseId, chapterId, userId })
      if (!courseId || !chapterId) {
        // console.error('Missing courseId or chapterId')
        return
      }

      try {
        const url = `/api/courses/${courseId}/chapters/${chapterId}/get`
        // console.log('Making request to:', url, { userId })
        
        const response = await axios.get(url, { 
          params: { userId },
          validateStatus: () => true // Don't throw for any status code
        })
        
        // console.log('API Response:', {
        //   status: response.status,
        //   statusText: response.statusText,
        //   data: response.data
        // })
        
        if (response.status === 404) {
          // console.error('Chapter or course not found')
          return
        }
        
        if (response.status === 401) {
          // console.error('Unauthorized - User not authenticated')
          return
        }
        
        if (response.status >= 400) {
          // console.error(`API Error (${response.status}):`, response.data)
          return
        }
        
        if (response.status !== 200) {
          // console.error('Unexpected response status:', response.status)
          return
        }
        
        const { data } = response
        
        if (!data) {
          // console.error('No data received in response')
          return
        }

        setChapter(data.chapter)
        setCourse(data.course)
        setMuxData(data.muxData)
        setAttachments(data.attachments || [])
        setNextChapter(data.nextChapter)
        setUserProgress(data.userProgress)
        setPurchase(data.purchase)
        setAssignments(data.assignments || [])
        setIsTeacher(data.isTeacher)
        setIsEnrolled(data.isEnrolled)
      } catch (error) {
        // console.error('Error fetching chapter data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [courseId, chapterId, userId, router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
      </div>
    )
  }



  const isLocked = Boolean(chapter && !chapter.isFree && !purchase)
  const completedOnEnd = Boolean(purchase && !userProgress?.isCompleted)
  
  if (!chapter || !course) {
    return null
  }
  
  // Transform assignments to match the expected type
  const transformedAssignments = assignments.map(assignment => ({
    ...assignment,
    attachments: assignment.attachments.map(attachment => ({
      ...attachment,
      courseId: course.id,
      createdAt: new Date(),
      updatedAt: new Date()
    }))
  }))

  return (
    <div>
      {userProgress?.isCompleted ? <Banner label="You already completed this chapter" variant="success" /> : null}
      {isLocked ? <Banner label="You need to purchase this course to watch this chapter" /> : null}

      <div className="mx-auto flex max-w-4xl flex-col pb-20">
        <div className="p-4">
          <VideoPlayer
            chapterId={chapter.id}
            title={chapter.title}
            courseId={courseId}
            nextChapterId={nextChapter?.id}
            playbackId={muxData?.playbackId ?? ''}
            isLocked={isLocked}
            completeOnEnd={completedOnEnd}
          />
        </div>

        <div>
          <div className="flex flex-col items-start justify-between p-4 md:flex-row md:items-center">
            <div>
              <h2 className="text-2xl font-semibold">{chapter.title}</h2>
              {chapter.description && (
                <div className="mt-2">
                  <Preview value={chapter.description} />
                </div>
              )}
            </div>
            {purchase ? (
              <CourseProgressButton
                chapterId={chapterId}
                courseId={courseId}
                nextChapterId={nextChapter?.id}
                isCompleted={!!userProgress?.isCompleted}
              />
            ) : (
              <CourseEnrollButton courseId={courseId} price={course.price!} />
            )}
          </div>

          {attachments.length > 0 && (
            <>
              <Separator />
              <div className="p-4">
                <h3 className="text-lg font-medium mb-3">Chapter Resources</h3>
                <div className="space-y-2">
                  {attachments.map((attachment) => (
                    <a
                      className="flex w-full items-center rounded-md border bg-sky-100 p-3 text-sky-700 hover:bg-sky-50 transition-colors"
                      key={attachment.id}
                      target="_blank"
                      href={attachment.url}
                      rel="noreferrer"
                    >
                      <File className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{attachment.name}</span>
                    </a>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Assignments Section */}
          <div className="mt-8">
            {isTeacher ? (
              <AssignmentsList
                items={transformedAssignments}
                courseId={courseId}
                chapterId={chapterId}
                isTeacher={isTeacher}
              />
            ) : selectedAssignment ? (
              <div className="mb-6">
                <Button
                  variant="ghost"
                  onClick={() => setSelectedAssignment(null)}
                  className="mb-4"
                >
                  ← Back to all assignments
                </Button>
                {selectedAssignment && (
                  <AssignmentSubmission
                    assignment={{
                      ...selectedAssignment,
                      attachments: selectedAssignment.attachments.map(attachment => ({
                        ...attachment,
                        courseId: course.id,
                        createdAt: new Date(),
                        updatedAt: new Date()
                      }))
                    }}
                    courseId={courseId}
                    chapterId={chapterId}
                    userId={userId!}
                    isEnrolled={!!purchase}
                  />
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold">Chapter Assignments</h3>
                {assignments.length > 0 ? (
                  <div className="space-y-4">
                    {assignments.map((assignment) => (
                      <div
                        key={assignment.id}
                        className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => setSelectedAssignment(assignment)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{assignment.title}</h4>
                            {assignment.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                {assignment.description}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button variant="outline" size="sm">
                              {purchase ? 'View Assignment' : 'View Details'}
                            </Button>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-muted-foreground">
                          {assignment.dueDate && (
                            <span className="flex items-center">
                              Due: {new Date(assignment.dueDate).toLocaleDateString()}
                            </span>
                          )}
                          <span className="mx-2">•</span>
                          <span>{assignment.points} points</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 border rounded-lg">
                    <p className="text-muted-foreground">No assignments have been posted yet.</p>
                    {isTeacher && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Create an assignment to get started.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
