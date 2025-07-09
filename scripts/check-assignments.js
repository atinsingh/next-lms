const { PrismaClient } = require('@prisma/client')
const { Clerk } = require('@clerk/backend')

const prisma = new PrismaClient()
const clerk = Clerk({
  secretKey: process.env.CLERK_SECRET_KEY
})

async function checkAssignments() {
  const chapterId = 'cmcdcu0ss0003tcush5xbjpk2'
  
  // Check chapter exists with assignments and submissions
  const chapter = await prisma.chapter.findUnique({
    where: { id: chapterId },
    include: {
      assignments: {
        include: {
          submissions: {
            include: {
              attachments: true
            }
          }
        }
      }
    }
  })

  // console.log('Chapter:', chapter?.title || 'Not found')
  // console.log('Assignments:', chapter?.assignments?.length || 0)
  
  if (chapter?.assignments) {
    for (const assignment of chapter.assignments) {
      // console.log(`\nAssignment: ${assignment.title} (ID: ${assignment.id})`)
      // console.log('Submissions:', assignment.submissions?.length || 0)
      
      for (const submission of assignment.submissions || []) {
        // Get user info from Clerk
        let userInfo = { id: submission.userId, email: 'Unknown', name: 'Unknown User' }
        try {
          const user = await clerk.users.getUser(submission.userId)
          userInfo = {
            id: user.id,
            email: user.emailAddresses[0]?.emailAddress || 'No email',
            name: [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Unknown User'
          }
        } catch (error) {
          // console.error('Error fetching user:', error.message)
        }
        
        // console.log(`\n  Submission by: ${userInfo.name} (${userInfo.email})`)
        // console.log('  Submitted:', submission.submittedAt)
        // console.log('  Attachments:', submission.attachments?.length || 0)
        
        for (const [index, attachment] of (submission.attachments || []).entries()) {
          // console.log(`  - Attachment ${index + 1}: ${attachment.name}`)
          // console.log(`    URL: ${attachment.url}`)
        }
      }
    }
  }

  await prisma.$disconnect()
}

checkAssignments().catch(
  // console.error
)
