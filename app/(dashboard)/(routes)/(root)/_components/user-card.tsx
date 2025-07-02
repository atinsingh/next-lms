import { User } from '@clerk/nextjs/server'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { CalendarDays, Mail, GraduationCap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface UserCardProps {
  user: {
    id: string
    firstName: string | null
    lastName: string | null
    imageUrl: string
    emailAddresses: { emailAddress: string }[]
    primaryEmailAddress?: { emailAddress: string; verification: { status: string } } | null
    createdAt?: number | Date | null
  } | null
}

export function UserCard({ user }: UserCardProps) {
  if (!user) return null
  const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User'
  const email = user.primaryEmailAddress?.emailAddress || user.emailAddresses[0]?.emailAddress || 'No email'
  const createdAt = user.createdAt ? new Date(user.createdAt) : new Date()
  const memberSince = createdAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short'
  })
  
  const initials = fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()

  return (
    <div className="relative w-full group">
      {/* Gradient background overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-indigo-50/20 dark:from-blue-900/10 dark:to-indigo-900/5 rounded-xl" />
      
      {/* Decorative elements */}
      <div className="absolute -right-10 -top-10 h-56 w-56 rounded-full bg-blue-200/30 dark:bg-blue-900/10 blur-3xl" />
      <div className="absolute -left-8 -bottom-8 h-40 w-40 rounded-full bg-indigo-200/30 dark:bg-indigo-900/10 blur-2xl" />

      <Card className="relative w-full bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm border border-gray-100/80 dark:border-gray-800/30 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 hover:shadow-blue-100/30 dark:hover:shadow-blue-900/10">
        <div className="p-5">
          <div className="flex items-start space-x-5">
            <div className="relative flex-shrink-0">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-2xl opacity-30 blur-sm group-hover:opacity-50 transition-opacity duration-300" />
              <Avatar className="relative h-20 w-20 border-[3px] border-white dark:border-gray-900 shadow-lg group-hover:scale-105 transition-transform duration-300">
                <AvatarImage src={user.imageUrl} alt={fullName} />
                <AvatarFallback className="text-xl font-medium bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/80 dark:to-blue-800/80 text-blue-600 dark:text-blue-200">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-400 dark:bg-emerald-500 rounded-full border-2 border-white dark:border-gray-900 shadow-sm" />
              <div className="absolute -top-1 -right-1 bg-white dark:bg-gray-900/80 text-indigo-500 dark:text-indigo-400 rounded-full p-1.5 shadow-md">
                <GraduationCap className="h-3.5 w-3.5" />
              </div>
            </div>
            
            <div className="flex-1 min-w-0 pt-1">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white tracking-tight">
                    {fullName}
                  </h3>
                  <p className="mt-1 flex items-center text-sm text-gray-600 dark:text-gray-300">
                    <Mail className="mr-1.5 h-4 w-4 flex-shrink-0 text-gray-400 dark:text-gray-500" />
                    <span className="truncate">{email}</span>
                  </p>
                </div>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/20 text-blue-700 dark:text-blue-300 border border-blue-100/70 dark:border-blue-800/30 shadow-sm">
                {user?.primaryEmailAddress?.verification?.status}
                </span>
              </div>
              
              <div className="mt-4 flex items-center">
                <div className="flex items-center bg-white/70 dark:bg-gray-800/40 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-gray-100/50 dark:border-gray-700/50 shadow-sm">
                  <CalendarDays className="mr-1.5 h-4 w-4 text-blue-500 dark:text-blue-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Member since <span className="font-medium">{memberSince}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
