const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkData() {
  const chapterId = 'cmcdcu0ss0003tcush5xbjpk2'
  
  // 1. Check chapter exists
  const chapter = await prisma.chapter.findUnique({
    where: { id: chapterId },
    include: {
      assignments: {
        include: {
          _count: {
            select: { submissions: true }
          },
          submissions: {
            take: 1,
            include: {
              _count: {
                select: { attachments: true }
              }
            }
          }
        }
      }
    }
  })

  // console.log('\n=== Chapter ===')
  // console.log('Title:', chapter?.title || 'Not found')
  // console.log('Assignments count:', chapter?.assignments?.length || 0)
  
  if (chapter?.assignments?.length > 0) {
    // console.log('\n=== Assignments ===')
    for (const assignment of chapter.assignments) {
      // console.log(`\n- ${assignment.title} (ID: ${assignment.id})`)
      // console.log(`  Submissions: ${assignment._count.submissions}`)
      
      if (assignment.submissions?.length > 0) {
        const sub = assignment.submissions[0]
        // console.log(`  Latest submission:`)
        // console.log(`    User ID: ${sub.userId}`)
        // console.log(`    Submitted: ${sub.submittedAt}`)
        // console.log(`    Attachments: ${sub._count.attachments}`)
      }
    }
  }

  // 2. Check all submissions for this chapter's assignments
  const submissions = await prisma.submission.findMany({
    where: {
      assignment: {
        chapterId: chapterId
      }
    },
    include: {
      _count: {
        select: { attachments: true }
      },
      assignment: {
        select: {
          title: true
        }
      }
    },
    orderBy: {
      submittedAt: 'desc'
    },
    take: 5
  })

  // console.log('\n=== Latest Submissions ===')
  if (submissions.length === 0) {
    // console.log('No submissions found for any assignments in this chapter')
  } else {
    submissions.forEach((sub, i) => {
      // console.log(`\n${i + 1}. ${sub.assignment.title}`)
      // console.log(`   User: ${sub.userId}`)
      // console.log(`   Submitted: ${sub.submittedAt}`)
      // console.log(`   Attachments: ${sub._count.attachments}`)
    })
  }

  await prisma.$disconnect()
}

checkData().catch(
  // console.error
)
