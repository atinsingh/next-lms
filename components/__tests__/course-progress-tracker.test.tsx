import React from 'react'
import ReactDOM from 'react-dom'
import { act } from 'react-dom/test-utils'
import axios from 'axios'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import CourseProgressTracker from '../course-progress-tracker'

vi.mock('axios')

const mockedGet = axios.get as unknown as ReturnType<typeof vi.fn>

describe('CourseProgressTracker', () => {
  let container: HTMLDivElement

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  it('shows not started message when no lessons completed', async () => {
    mockedGet.mockResolvedValueOnce({ data: { completed: 0, total: 5, progress: 0 } })

    await act(async () => {
      ReactDOM.render(<CourseProgressTracker courseId="1" />, container)
    })

    expect(container.textContent).toContain('Not started yet')
  })

  it('shows count when lessons are completed', async () => {
    mockedGet.mockResolvedValueOnce({ data: { completed: 3, total: 10, progress: 30 } })

    await act(async () => {
      ReactDOM.render(<CourseProgressTracker courseId="1" />, container)
    })

    expect(container.textContent).toContain('3 / 10 lessons completed')
  })
})
