'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import { CourseProgress } from './course-progress'

interface CourseProgressTrackerProps {
  courseId: string
}

type ProgressResponse = {
  completed: number
  total: number
  progress: number
}

export default function CourseProgressTracker({ courseId }: CourseProgressTrackerProps) {
  const [data, setData] = useState<ProgressResponse | null>(null)

  useEffect(() => {
    axios.get(`/api/courses/${courseId}/progress`).then((res) => setData(res.data))
  }, [courseId])

  if (!data) {
    return null
  }

  return (
    <div>
      <CourseProgress
        value={data.progress}
        size="sm"
        variant={data.progress === 100 ? 'success' : 'default'}
      />
      <p className="mt-1 text-xs text-muted-foreground md:text-xs">
        {data.completed === 0
          ? 'Not started yet'
          : `${data.completed} / ${data.total} lessons completed`}
      </p>
    </div>
  )
}

