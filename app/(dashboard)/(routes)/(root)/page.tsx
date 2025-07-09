import { redirect } from 'next/navigation'
import { CheckCircle, Clock } from 'lucide-react'
import { auth, currentUser } from '@clerk/nextjs/server'
import CoursesList from '@/components/course-list'
import { getDashboardCourses } from '@/actions/get-dashboard-courses'
import { InfoCard } from './_components/info-card'
import { UserCard } from './_components/user-card'
import { CourseProgressChart } from '@/app/(dashboard)/_components/course-progress-chart'

export default async function Dashboard() {
  const { userId } = await auth()
  const user = await currentUser()

  if (!userId || !user) {
    return redirect('/')
  }

  const { completedCourses, coursesInProgress } = await getDashboardCourses(userId)

  // Prepare user data for the UserCard
  const userData = {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    imageUrl: user.imageUrl,
    emailAddresses: user.emailAddresses,
    primaryEmailAddress: user.primaryEmailAddress,
    createdAt: user.createdAt
  }

  return (
    <div className="space-y-6 p-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="md:col-span-1">
          <UserCard user={userData} />
        </div>
        <div className="md:col-span-2">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <InfoCard icon={Clock} label="In Progress" numberOfItems={coursesInProgress.length} />
            <InfoCard icon={CheckCircle} label="Completed" numberOfItems={completedCourses.length} variant="success" />
          </div>
        </div>
        
      </div>
      <div className="pt-2">
        <h2 className="mb-4 text-2xl font-semibold tracking-tight">Your Courses</h2>
        <CoursesList items={[...coursesInProgress, ...completedCourses]} />
      </div>
      
      {/* Course Progress Chart */}
      <CourseProgressChart courses={[...coursesInProgress, ...completedCourses]} />
    </div>
  )
}
