import { auth, currentUser } from '@clerk/nextjs/server'
import type { RouteHandler } from '@/types/routes';
import { NextResponse } from 'next/server'

export async function GET(
  req: Request,
  { params }: { params: { userId: string } }
) {
  try {
    // Get the user ID from the route parameters
    const userId = params.userId
    
    // Get the current user
    const user = await currentUser()
    
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // For now, we'll only return the current user's info
    // This is a security measure to prevent unauthorized access to other users' data
    if (user.id !== userId) {
      return new NextResponse('Forbidden', { status: 403 })
    }

    // Return the user's information
    return NextResponse.json({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.emailAddresses[0]?.emailAddress,
      imageUrl: user.imageUrl,
    })
    
  } catch (error) {
    // console.error('[USER_GET]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
