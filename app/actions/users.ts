'use server'

import { clerkClient } from '@clerk/nextjs/server'

export interface UserInfo {
  id: string
  firstName: string | null
  lastName: string | null
  email: string
  imageUrl: string | null
  fullName: string
}

export async function getUserInfo(userId: string): Promise<UserInfo> {
  try {
    // Get the Clerk client
    const clerk = await clerkClient();
    // Use the client to get user info
    const user = await clerk.users.getUser(userId)
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.emailAddresses[0]?.emailAddress || `${user.id}@example.com`,
      imageUrl: user.imageUrl,
      fullName: [user.firstName, user.lastName].filter(Boolean).join(' ') || 
               user.username || 
               `User ${user.id.substring(0, 6)}`
    }
  } catch (error) {
    // console.error(`Error fetching user ${userId}:`, error)
    return {
      id: userId,
      firstName: null,
      lastName: null,
      email: `${userId}@example.com`,
      imageUrl: null,
      fullName: `User ${userId.substring(0, 6)}`
    }
  }
}
