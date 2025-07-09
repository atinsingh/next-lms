'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { FileUpload } from '@/components/file-upload'
import { Upload, X, File as FileIcon, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { AssignmentWithAttachments, SubmissionWithAttachments } from '@/types/assignments'

// Custom Progress component to avoid dependency issues
const CustomProgress = ({ value, className = '' }: { value: number; className?: string }) => (
  <div className={`relative h-2 w-full overflow-hidden rounded-full bg-secondary/20 ${className}`}>
    <div
      className="h-full w-full flex-1 bg-primary transition-all"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </div>
)

type FileWithUrl = {
  url: string;
  name: string;
  type?: string;
}

type SubmissionAttachment = {
  url: string;
  name: string;
  type: string;
}

interface AssignmentSubmissionProps {
  assignment: AssignmentWithAttachments;
  courseId: string;
  chapterId: string;
  userId: string;
  isEnrolled: boolean;
}

export const AssignmentSubmission = ({
  assignment,
  courseId,
  chapterId,
  userId,
  isEnrolled,
}: AssignmentSubmissionProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [submission, setSubmission] = useState<SubmissionWithAttachments | null>(null);
  const router = useRouter();

  // Calculate status flags with useMemo to prevent redeclaration
  const { isPastDue, isSubmitted, isGraded } = useMemo(() => ({
    isPastDue: assignment.dueDate ? new Date(assignment.dueDate) < new Date() : false,
    isSubmitted: !!submission?.submittedAt,
    isGraded: submission?.grade !== null,
  }), [assignment.dueDate, submission?.submittedAt, submission?.grade]);

  // Fetch submission data on component mount
  useEffect(() => {
    const fetchSubmission = async () => {
      try {
        const res = await fetch(
          `/api/courses/${courseId}/chapters/${chapterId}/assignments/${assignment.id}/submissions?userId=${userId}`,
        );

        if (res.ok) {
          const data = await res.json();
          if (data) {
            setSubmission(data);
          }
        }
      } catch (error) {
        // console.error('Error fetching submission:', error)
        toast.error('Failed to load submission data');
      } finally {
        setIsLoading(false);
      }
    };

    if (isEnrolled) {
      fetchSubmission();
    } else {
      setIsLoading(false);
    }
  }, [assignment.id, chapterId, courseId, isEnrolled, userId]);

  const handleSubmit = async (files: SubmissionAttachment[]) => {
    if (!isEnrolled) {
      toast.error('You need to be enrolled to submit assignments');
      return false;
    }

    try {
      const response = await fetch(
        `/api/courses/${courseId}/chapters/${chapterId}/assignments/${assignment.id}/submissions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
            files: files.map((file) => ({
              url: file.url,
              name: file.name,
              type: file.type,
            })),
          }),
        },
      );

      if (!response.ok) {
        throw new Error('Failed to create submission');
      }

      const submissionData = await response.json();
      setSubmission(submissionData);
      toast.success('Assignment submitted successfully!');
      router.refresh();
    } catch (error) {
      // console.error('Error submitting assignment:', error)
      toast.error('Failed to submit assignment');
    } finally {
      setIsUploading(false);
    }
  };

  const onFileUpload = async (files: string | string[] | FileWithUrl | FileWithUrl[] | undefined) => {
    if (!files) return;
    const fileList = Array.isArray(files) ? files : [files];
    if (fileList.length === 0) return;

    try {
      setIsUploading(true);
      const attachments: SubmissionAttachment[] = fileList.map((file) => {
        if (typeof file === 'string') {
          return {
            url: file,
            name: file.split('/').pop() || 'file',
            type: file.split('.').pop()?.toLowerCase() || 'file',
          };
        } else if ('url' in file) {
          return {
            url: file.url,
            name: file.name || file.url.split('/').pop() || 'file',
            type: file.type || file.url.split('.').pop()?.toLowerCase() || 'file',
          };
        }
        return {
          url: '',
          name: 'file',
          type: 'file',
        };
      }).filter((file): file is SubmissionAttachment => !!file.url);

      await handleSubmit(attachments);
    } catch (error) {
      // console.error('Error submitting assignment:', error);
      toast.error('Failed to submit assignment');
    } finally {
      setIsUploading(false);
    }
  };

  const onDeleteAttachment = async (attachmentId: string) => {
    try {
      await fetch(
        `/api/courses/${courseId}/chapters/${chapterId}/assignments/${assignment.id}/submissions/${submission?.id}/attachments/${attachmentId}`,
        {
          method: 'DELETE',
        },
      );

      if (submission) {
        setSubmission({
          ...submission,
          attachments: submission.attachments.filter((a) => a.id !== attachmentId),
        });
      }

      toast.success('Attachment removed');
      router.refresh();
    } catch (error) {
      // console.error('Error deleting attachment:', error)
      toast.error('Failed to remove attachment');
    }
  };

  const handleAddMoreFiles = async (files: string | string[] | undefined) => {
    if (!files || !submission) {
      // console.error('No files or submission found');
      return;
    }

    const fileList = Array.isArray(files) ? files : [files];
    if (fileList.length === 0) return;

    try {
      setIsUploading(true);

      // First, ensure the submission exists on the server
      const submissionRes = await fetch(
        `/api/courses/${courseId}/chapters/${chapterId}/assignments/${assignment.id}/submissions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
          }),
        },
      );

      if (!submissionRes.ok) {
        throw new Error('Failed to create/update submission');
      }

      const submissionData = await submissionRes.json();
      const currentSubmission = submissionData.submission || submission;

      // Upload each file and create attachment
      const uploadPromises = (Array.isArray(files) ? files : [files]).map(async (file: string | FileWithUrl) => {
        const fileUrl = typeof file === 'string' ? file : file.url;
        const fileName = typeof file === 'string' ? file.split('/').pop() || 'file' : file.name || fileUrl.split('/').pop() || 'file';
        const fileType = (typeof file === 'string' ? file.split('.').pop()?.toLowerCase() : file.type || fileUrl.split('.').pop()?.toLowerCase()) || 'file';
        
        const attachmentRes = await fetch(
          `/api/courses/${courseId}/chapters/${chapterId}/assignments/${assignment.id}/submissions/${currentSubmission.id}/attachments`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              url: fileUrl,
              name: fileName,
              type: fileType,
              courseId,
            }),
          }
        );

        if (!attachmentRes.ok) {
          throw new Error(`Failed to upload attachment: ${await attachmentRes.text()}`);
        }

        return await attachmentRes.json();
      });

      const uploadedAttachments = await Promise.all(uploadPromises);

      // Update local state with new attachments
      setSubmission({
        ...currentSubmission,
        attachments: [
          ...(currentSubmission.attachments || []),
          ...uploadedAttachments.map(att => ({
            ...att,
            createdAt: new Date(att.createdAt),
            updatedAt: new Date(att.updatedAt),
          })),
        ],
      });

      toast.success('Files uploaded successfully');
      router.refresh();
    } catch (error) {
      // console.error('Error uploading files:', error);
      toast.error('Failed to upload files. Please try again.');
    } finally {
      setIsUploading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mt-6 border rounded-md p-6 bg-white shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold">{assignment.title}</h3>
        <div className="flex items-center space-x-2">
          {assignment.dueDate && (
            <span className="text-sm text-muted-foreground">
              Due: {new Date(assignment.dueDate).toLocaleString()}
              {isPastDue && ' (Past Due)'}
            </span>
          )}
          {isSubmitted && submission && (
            <Badge variant={isGraded ? 'default' : 'secondary'}>
              {isGraded ? `Graded: ${submission.grade}%` : 'Submitted'}
            </Badge>
          )}
        </div>
      </div>

      {assignment.description && (
        <div className="prose max-w-none mt-4">
          <div className="text-muted-foreground whitespace-pre-line">
            {assignment.description}
          </div>
          {assignment.points && (
            <p className="text-sm text-muted-foreground mt-2">
              Points: {assignment.points}
            </p>
          )}
        </div>
      )}

      {assignment.attachments.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium mb-2">Assignment Files</h4>
          <div className="space-y-2">
            {assignment.attachments.map((attachment) => (
              <a
                key={attachment.id}
                href={attachment.url}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center p-3 w-full border rounded-md hover:bg-slate-50"
              >
                <FileIcon className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{attachment.name}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 pt-6 border-t">
        {isSubmitted && submission ? (
          <div className="mt-6">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-medium">Your Submission</h4>
              <Badge variant={isGraded ? 'default' : 'secondary'}>
                {isGraded ? `Graded: ${submission.grade}%` : 'Submitted'}
              </Badge>
            </div>
            
            {submission.submittedAt && (
              <p className="text-sm text-muted-foreground mt-1">
                Submitted on {new Date(submission.submittedAt).toLocaleString()}
              </p>
            )}
          
          {submission.attachments && submission.attachments.length > 0 ? (
            <div className="mt-4 space-y-2">
              {submission.attachments.map((attachment) => (
                <div key={attachment.id} className="flex items-center justify-between p-3 border rounded-md">
                  <div className="flex items-center space-x-2">
                    <FileIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{attachment.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <a
                      href={attachment.url}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Download
                    </a>
                    {!isPastDue && !isGraded && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => onDeleteAttachment(attachment.id)}
                        disabled={isUploading}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4 text-sm text-muted-foreground">
              No files submitted
            </div>
          )}

          {!isPastDue && !isGraded && submission && (
            <div className="mt-4">
              <FileUpload
                endpoint="courseAttachment"
                onChange={handleAddMoreFiles}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => {
                  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
                  input?.click();
                }}
                disabled={isUploading}
              >
                <Upload className="mr-2 h-4 w-4" />
                Add more files
              </Button>
            </div>
          )}

          {isGraded && submission && (
            <div className="mt-6 p-4 bg-slate-50 rounded-md">
              <h5 className="font-medium mb-2">
                {submission.grade !== null ? `Grade: ${submission.grade}%` : 'Graded'}
              </h5>
              {submission.feedback && (
                <div className="mt-2">
                  <h6 className="font-medium mb-1">Instructor Feedback:</h6>
                  {submission.feedback}
                </div>
              )}
              {submission.gradedAt && (
                <p className="text-xs text-muted-foreground mt-2">
                  Graded on {new Date(submission.gradedAt).toLocaleString()}
                </p>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="mt-6">
          <h4 className="text-lg font-medium mb-4">Submit Your Work</h4>
            
          {isPastDue ? (
            <div className="text-sm text-muted-foreground">
              The due date has passed. Submissions are no longer accepted.
            </div>
          ) : !isEnrolled ? (
            <div className="text-sm text-muted-foreground">
              You need to be enrolled in this course to submit assignments.
            </div>
          ) : (
            <div className="mt-4">
              <FileUpload
                endpoint="courseAttachment"
                onChange={onFileUpload}
              />

                   
                  
                     
                  
                  
                    
                  
                
                {isUploading && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">Uploading files...</span>
                      <span className="text-xs text-muted-foreground">0%</span>
                    </div>
                    <CustomProgress value={0} className="h-2" />
                  </div>
                )}
              </div>
            )}

            {!isEnrolled && (
              <div className="mt-4">
                <Button variant="outline" disabled>
                  Enroll to submit
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
