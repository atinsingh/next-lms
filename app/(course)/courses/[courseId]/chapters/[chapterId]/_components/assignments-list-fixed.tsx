'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { File, Loader2, PlusCircle, Trash2, X } from 'lucide-react'
import { FileUpload } from '@/components/file-upload'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { AssignmentWithAttachments } from '@/types/assignments'
import { FileUploadBasic } from '@/components/file-upload-basic'

interface AssignmentsListProps {
  items: AssignmentWithAttachments[]
  courseId: string
  chapterId: string
  isTeacher: boolean
}

export const AssignmentsListFixed = ({
  items,
  courseId,
  chapterId,
  isTeacher,
}: AssignmentsListProps) => {
  const [isCreating, setIsCreating] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [assignments, setAssignments] = useState<AssignmentWithAttachments[]>(items)
  const [uploadedFiles, setUploadedFiles] = useState<{url: string, name: string}[]>([])
  const [isUploading, setIsUploading] = useState(false)
  
  const router = useRouter()

  const toggleCreate = () => {
    setIsCreating((current) => !current)
    setUploadedFiles([])
  }

  const handleFileUpload = (url?: string) => {
    if (!url) {
      setUploadedFiles([])
      return
    }
    setUploadedFiles([{ url, name: url.split('/').pop() || 'file' }])
  }

  const onSubmit = async (data: { title: string; description?: string; dueDate?: string; points?: number }) => {
    try {
      setIsUploading(true)
      
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
          attachments: uploadedFiles,
        })
      })

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
    } finally {
      setIsUploading(false)
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
        { method: 'PATCH' }
      )

      if (!response.ok) {
        throw new Error('Failed to update assignment')
      }

      const updatedAssignment = await response.json()
      setAssignments(assignments.map((item) => (item.id === id ? updatedAssignment : item)))
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
        {isTeacher && !isCreating && (
          <Button onClick={toggleCreate} variant="ghost">
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Assignment
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
                disabled={isUploading}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description (optional)</label>
              <textarea
                name="description"
                rows={3}
                className="w-full p-2 border rounded-md"
                placeholder="Provide assignment details and instructions..."
                disabled={isUploading}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Due Date (optional)</label>
                <input
                  name="dueDate"
                  type="datetime-local"
                  className="w-full p-2 border rounded-md"
                  disabled={isUploading}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Points (default: 100)</label>
                <input
                  name="points"
                  type="number"
                  min="0"
                  className="w-full p-2 border rounded-md"
                  placeholder="100"
                  disabled={isUploading}
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="text-sm font-medium">Attachments (optional)</label>
              <FileUpload
                onChange={handleFileUpload}
                endpoint="courseAttachment"
              />
              {uploadedFiles.length > 0 && (
                <div className="mt-2 space-y-2">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                      <div className="flex items-center space-x-2">
                        <File className="h-4 w-4 text-gray-500" />
                        <span className="text-sm truncate max-w-xs">{file.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setUploadedFiles([])}
                        className="text-gray-400 hover:text-destructive"
                        disabled={isUploading}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={toggleCreate}
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isUploading || !uploadedFiles.length}>
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
          </form>
        </div>
      )}

      {!isCreating && assignments.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No assignments yet</p>
          {isTeacher && (
            <Button
              variant="ghost"
              className="mt-2"
              onClick={toggleCreate}
              disabled={isUploading}
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Create your first assignment
            </Button>
          )}
        </div>
      )}

      {!isCreating && assignments.length > 0 && (
        <div className="mt-4 space-y-4">
          {assignments.map((assignment) => (
            <div
              key={assignment.id}
              className="flex items-center justify-between p-4 bg-white border rounded-md hover:shadow-sm transition-shadow"
            >
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{assignment.title}</h4>
                  <div className="flex items-center space-x-2">
                    {assignment.attachments && assignment.attachments.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {assignment.attachments.length} attachment
                        {assignment.attachments.length !== 1 ? 's' : ''}
                      </Badge>
                    )}
                    {assignment.points && (
                      <Badge variant="secondary" className="text-xs">
                        {assignment.points} points
                      </Badge>
                    )}
                  </div>
                </div>
                {assignment.description && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {assignment.description}
                  </p>
                )}
                {assignment.dueDate && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Due {formatDistanceToNow(new Date(assignment.dueDate), { addSuffix: true })}
                  </p>
                )}
              </div>
              {isTeacher && (
                <div className="flex items-center space-x-2 ml-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onTogglePublish(assignment.id, assignment.isPublished)}
                  >
                    {assignment.isPublished ? 'Unpublish' : 'Publish'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(assignment.id)}
                    disabled={deletingId === assignment.id}
                  >
                    {deletingId === assignment.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 text-destructive" />
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
