'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { File, Loader2, PlusCircle, Trash2, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { AssignmentWithAttachments } from '@/types/assignments'
import { FileUpload } from '@/components/file-upload'

interface AssignmentsListProps {
  items: AssignmentWithAttachments[]
  courseId: string
  chapterId: string
  isTeacher: boolean
}

export const AssignmentsList = ({
  items,
  courseId,
  chapterId,
  isTeacher,
}: AssignmentsListProps) => {
  const [isCreating, setIsCreating] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [assignments, setAssignments] = useState<AssignmentWithAttachments[]>(items)
  const [uploadedFiles, setUploadedFiles] = useState<{url: string, name: string}[]>([])
  const [isUploading, setIsUploading] = useState(false)
  
  const router = useRouter()

  const toggleCreate = () => {
    setIsCreating((current) => !current)
    setUploadedFiles([]) // Reset uploaded files when toggling
  }

  const onSubmit = async (data: { title: string; description?: string; dueDate?: string; points?: number }) => {
    try {
      setIsUploading(true)
      
      // First upload any files if present
      const attachments = uploadedFiles.length > 0 
        ? await Promise.all(
            uploadedFiles.map(async (file) => {
              try {
                const response = await fetch('/api/upload', {
                  method: 'POST',
                  body: JSON.stringify({ url: file.url, name: file.name }),
                  headers: {
                    'Content-Type': 'application/json',
                  },
                });
                if (!response.ok) throw new Error('File upload failed')
                return response.json();
              } catch (error) {
                // console.error('Error uploading file:', error);
                return null;
              }
            })
          ).then(results => results.filter(Boolean))
        : [];

      const response = await fetch(`/api/courses/${courseId}/chapters/${chapterId}/assignments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: data.title,
          description: data.description,
          dueDate: data.dueDate,
          points: data.points || 100,
          isPublished: true,
          attachments,
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create assignment')
      }

      const newAssignment = await response.json()
      setAssignments([...assignments, newAssignment])
      toast.success('Assignment created')
      toggleCreate()
      router.refresh()
    } catch (error) {
      // console.error(error)
      toast.error('Something went wrong')
    }
  }

  const onDelete = async (id: string) => {
    try {
      setDeletingId(id)
      const response = await fetch(`/api/courses/${courseId}/chapters/${chapterId}/assignments/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete assignment')
      }

      setAssignments(assignments.filter((item) => item.id !== id))
      toast.success('Assignment deleted')
      router.refresh()
    } catch (error) {
      // console.error(error)
      toast.error('Something went wrong')
    } finally {
      setDeletingId(null)
    }
  }

  const onTogglePublish = async (id: string, isPublished: boolean) => {
    try {
      const response = await fetch(
        `/api/courses/${courseId}/chapters/${chapterId}/assignments/${id}/${isPublished ? 'unpublish' : 'publish'}`,
        {
          method: 'PATCH',
        }
      )

      if (!response.ok) {
        throw new Error('Failed to update assignment')
      }

      const updatedAssignment = await response.json()
      setAssignments(
        assignments.map((item) => (item.id === id ? updatedAssignment : item))
      )
      toast.success(`Assignment ${isPublished ? 'unpublished' : 'published'}`)
      router.refresh()
    } catch (error) {
      // console.error(error)
      toast.error('Something went wrong')
    }
  }

  return (
    <div className="mt-6 border bg-slate-100 rounded-md p-4">
      <div className="font-medium flex items-center justify-between">
        <h3 className="text-lg font-medium">Chapter Assignments</h3>
        {isTeacher && (
          <Button onClick={toggleCreate} variant="ghost">
            {isCreating ? (
              <span className="text-destructive">Cancel</span>
            ) : (
              <>
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Assignment
              </>
            )}
          </Button>
        )}
      </div>

      {isCreating && (
        <div className="mt-4 p-4 bg-white rounded-md border">
          <h4 className="font-medium mb-4">Create New Assignment</h4>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              onSubmit({
                title: formData.get('title') as string,
                description: formData.get('description') as string,
                dueDate: formData.get('dueDate') as string,
                points: Number(formData.get('points')),
              })
            }}
            className="space-y-4"
          >
            <div>
              <label className="text-sm font-medium">Title</label>
              <input
                name="title"
                type="text"
                required
                className="w-full p-2 border rounded-md"
                placeholder="e.g. Essay on Topic X"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description (optional)</label>
              <textarea
                name="description"
                rows={3}
                className="w-full p-2 border rounded-md"
                placeholder="Provide assignment details and instructions..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Due Date (optional)</label>
                <input
                  name="dueDate"
                  type="datetime-local"
                  className="w-full p-2 border rounded-md"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Points (default: 100)</label>
                <input
                  name="points"
                  type="number"
                  min="1"
                  max="1000"
                  defaultValue={100}
                  className="w-full p-2 border rounded-md"
                />
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Attachments (optional)</label>
                <FileUpload
                  endpoint="courseAttachment"
                  onChange={(url) => {
                    if (url) {
                      setUploadedFiles([...uploadedFiles, { url, name: url.split('/').pop() || 'file' }])
                    }
                  }}
                />
                {uploadedFiles.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-slate-50 rounded-md">
                        <div className="flex items-center">
                          <File className="h-4 w-4 mr-2 text-slate-500" />
                          <span className="text-sm truncate max-w-xs">{file.name}</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const newFiles = [...uploadedFiles]
                            newFiles.splice(index, 1)
                            setUploadedFiles(newFiles)
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="flex justify-end space-x-2 pt-2">
                <Button type="button" variant="ghost" onClick={toggleCreate}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isUploading}>
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Assignment'
                  )}
                </Button>
              </div>
            </div>
          </form>
        </div>
      )}

      {!isCreating && assignments.length === 0 && (
        <div className="text-sm mt-2 italic text-muted-foreground">
          {isTeacher ? 'No assignments yet' : 'No assignments have been posted yet'}
        </div>
      )}

      {assignments.length > 0 && (
        <div className="mt-4 space-y-4">
          {assignments.map((assignment) => (
            <div
              key={assignment.id}
              className="flex items-center p-4 w-full bg-white border rounded-md hover:shadow-sm transition-shadow"
            >
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{assignment.title}</div>
                  <div className="flex items-center space-x-2">
                    {assignment.dueDate && (
                      <span className="text-xs text-muted-foreground">
                        Due: {formatDistanceToNow(new Date(assignment.dueDate), { addSuffix: true })}
                      </span>
                    )}
                    <Badge variant="secondary">{assignment.points} points</Badge>
                  </div>
                </div>
                {assignment.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {assignment.description}
                  </p>
                )}
                {assignment.attachments?.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {assignment.attachments?.map((attachment) => (
                      <a
                        key={attachment.id}
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center p-2 w-full bg-slate-100 border rounded-md text-sm hover:bg-slate-200"
                      >
                        <File className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="truncate">{attachment.name}</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
              {isTeacher && (
                <div className="flex items-center space-x-2 ml-4">
                  <Button
                    onClick={() => onTogglePublish(assignment.id, assignment.isPublished)}
                    variant={assignment.isPublished ? 'outline' : 'default'}
                    size="sm"
                  >
                    {assignment.isPublished ? 'Unpublish' : 'Publish'}
                  </Button>
                  <Button
                    onClick={() => onDelete(assignment.id)}
                    variant="ghost"
                    size="sm"
                    disabled={deletingId === assignment.id}
                  >
                    {deletingId === assignment.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
