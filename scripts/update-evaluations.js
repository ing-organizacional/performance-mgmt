const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('🎯 Updating evaluations with ratings and comments...')

  // Get all evaluations
  const evaluations = await prisma.evaluation.findMany({
    include: {
      employee: true
    }
  })

  console.log(`Found ${evaluations.length} evaluations to update`)

  // Leave Ron Weasley without ratings (he should be the one without evaluation)
  // But since he already doesn't have an evaluation, let's leave a different employee without ratings
  // Let's leave the last employee in our list without proper ratings

  for (let i = 0; i < evaluations.length; i++) {
    const evaluation = evaluations[i]
    
    // Parse existing evaluation data
    let evaluationItemsData = JSON.parse(evaluation.evaluationItemsData || '[]')
    
    // Skip the last evaluation (leave it incomplete for dashboard testing)
    if (i === evaluations.length - 1) {
      console.log(`⏭️  Leaving ${evaluation.employee.name} with incomplete evaluation for testing`)
      
      // Set all ratings to null and remove comments
      evaluationItemsData = evaluationItemsData.map(item => ({
        ...item,
        rating: null,
        comment: ''
      }))
      
      // Update with incomplete data
      await prisma.evaluation.update({
        where: { id: evaluation.id },
        data: {
          evaluationItemsData: JSON.stringify(evaluationItemsData),
          overallRating: null,
          managerComments: null,
          status: 'draft' // Mark as draft since it's incomplete
        }
      })
      
      continue
    }

    // Update all other evaluations with complete ratings and comments
    evaluationItemsData = evaluationItemsData.map(item => {
      // Generate rating if not present
      if (!item.rating) {
        item.rating = Math.floor(Math.random() * 5) + 1
      }
      
      // Generate comment if not present
      if (!item.comment) {
        item.comment = getRandomComment(item.type, item.title, item.rating)
      }
      
      return item
    })

    // Calculate overall rating if not present
    let overallRating = evaluation.overallRating
    if (!overallRating) {
      const ratings = evaluationItemsData.map(item => item.rating).filter(r => r)
      overallRating = Math.round(ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length)
    }

    // Generate manager comments if not present
    let managerComments = evaluation.managerComments
    if (!managerComments) {
      managerComments = getRandomOverallComment(overallRating, evaluation.employee.name)
    }

    // Update the evaluation
    await prisma.evaluation.update({
      where: { id: evaluation.id },
      data: {
        evaluationItemsData: JSON.stringify(evaluationItemsData),
        overallRating,
        managerComments,
        status: 'completed'
      }
    })

    console.log(`✅ Updated evaluation for ${evaluation.employee.name} (Overall: ${overallRating}/5)`)
  }

  console.log('✅ All evaluations updated!')
  console.log(`📊 Summary:`)
  console.log(`   - ${evaluations.length - 1} Complete evaluations with ratings and comments`)
  console.log(`   - 1 Incomplete evaluation (for dashboard testing)`)
  console.log(`   - 1 Employee with no evaluation at all (Ron Weasley)`)
}

function getRandomComment(type, title, rating) {
  const okrComments = {
    5: [
      'Exceptional achievement! Consistently exceeded all key results and set new performance standards.',
      'Outstanding execution of this OKR. Results far surpassed expectations with innovative approaches.',
      'Remarkable performance. Achieved all objectives ahead of schedule with excellent quality.',
      'Exceptional work on this OKR. Demonstrated leadership and drove significant business impact.'
    ],
    4: [
      'Strong performance on this OKR. Met all key results with some exceeding expectations.',
      'Very good execution. Achieved objectives with solid methodology and consistent effort.',
      'Impressive results. Overcame challenges effectively and delivered quality outcomes.',
      'Strong achievement of this OKR with good strategic thinking and execution.'
    ],
    3: [
      'Good progress on this OKR. Met most key results with satisfactory performance.',
      'Solid execution of objectives. Consistent effort with room for optimization in some areas.',
      'Acceptable achievement of this OKR. Met core requirements with steady progress.',
      'Good work overall. Achieved main objectives with standard methodology.'
    ],
    2: [
      'Partial achievement of this OKR. Some key results met but others need improvement.',
      'Below expectations. Made progress but missed several important milestones.',
      'Limited success on this OKR. Requires more focus and strategic approach.',
      'Needs improvement. Achieved some objectives but overall performance was lacking.'
    ],
    1: [
      'Significant challenges with this OKR. Most key results were not achieved.',
      'Well below expectations. Requires immediate attention and support.',
      'Major gaps in achievement. Needs focused development plan and close monitoring.',
      'Unsatisfactory performance. Fundamental issues need to be addressed.'
    ]
  }
  
  const competencyComments = {
    5: [
      'Exceptional competency level. Consistently demonstrates mastery and mentors others.',
      'Outstanding skills in this area. Sets the standard for the entire team.',
      'Exceptional performance. Goes above and beyond in demonstrating this competency.',
      'Mastery level competency. Regularly shares expertise and supports team development.'
    ],
    4: [
      'Strong competency demonstrated. Consistently reliable with occasional excellence.',
      'Very good skills shown. Handles complex situations effectively.',
      'Strong performance in this competency with consistent quality delivery.',
      'Well-developed skills. Demonstrates competency reliably across various situations.'
    ],
    3: [
      'Good competency level. Meets expectations consistently with room for growth.',
      'Solid skills demonstrated. Handles most situations effectively.',
      'Competent performance. Shows understanding and applies skills appropriately.',
      'Good foundation in this competency with opportunities for further development.'
    ],
    2: [
      'Developing competency. Shows potential but needs more experience and practice.',
      'Below expectations. Requires focused development in this area.',
      'Limited demonstration of this competency. Needs additional training and support.',
      'Developing skills but not yet meeting full expectations for the role.'
    ],
    1: [
      'Significant development needed in this competency area.',
      'Major gaps identified. Requires immediate attention and structured development plan.',
      'Well below expectations. Fundamental skills need development.',
      'Critical improvement needed. Requires intensive coaching and support.'
    ]
  }
  
  const comments = type === 'okr' ? okrComments[rating] : competencyComments[rating]
  return comments[Math.floor(Math.random() * comments.length)]
}

function getRandomOverallComment(rating, employeeName) {
  const comments = {
    5: [
      `${employeeName} has delivered exceptional performance throughout this evaluation period. Consistently exceeds expectations and demonstrates outstanding leadership qualities. A true asset to the team who regularly inspires others and drives innovation.`,
      `Outstanding performance by ${employeeName}. Shows mastery in all key areas with exceptional results that significantly impact business objectives. Demonstrates strong initiative and serves as a role model for colleagues.`,
      `${employeeName} has achieved excellence across all evaluation criteria. Exceptional problem-solving abilities, strong leadership, and consistent delivery of high-quality results. Highly recommend for advancement opportunities.`
    ],
    4: [
      `${employeeName} has shown strong performance with excellent results in most areas. Demonstrates reliability, initiative, and good problem-solving skills. Shows great potential for continued growth and increased responsibilities.`,
      `Very good performance by ${employeeName}. Consistently meets and often exceeds expectations with quality work delivery. Shows strong collaboration skills and contributes positively to team dynamics.`,
      `${employeeName} delivers strong results consistently. Good technical skills combined with effective communication and teamwork. Ready for new challenges and expanded role responsibilities.`
    ],
    3: [
      `${employeeName} provides solid, reliable performance meeting expectations consistently. Shows good understanding of role requirements and delivers quality work. Some opportunities identified for continued professional development.`,
      `Good steady performance by ${employeeName}. Meets job requirements consistently with occasional standout achievements. Shows willingness to learn and adapt to new challenges.`,
      `${employeeName} demonstrates competent performance across key areas. Reliable team member who contributes positively to departmental goals. Focus on identified development areas will enhance future performance.`
    ],
    2: [
      `${employeeName} shows acceptable performance with room for improvement in several key areas. Has potential but needs focused development and additional support to meet full expectations of the role.`,
      `Performance by ${employeeName} is below expectations in some areas. Shows understanding of basic requirements but needs to develop stronger skills and more consistent delivery. Improvement plan recommended.`,
      `${employeeName} demonstrates developing performance with mixed results. Some strengths identified but requires focused attention on areas needing improvement. Additional training and mentoring recommended.`
    ],
    1: [
      `${employeeName}'s performance requires significant improvement across multiple areas. Immediate attention needed with structured development plan and regular check-ins to address performance gaps.`,
      `Performance well below expectations. ${employeeName} requires immediate support and intensive development to meet basic job requirements. Recommend performance improvement plan with clear milestones.`,
      `Significant performance concerns identified for ${employeeName}. Requires immediate intervention with comprehensive development plan and close monitoring to achieve acceptable performance levels.`
    ]
  }
  
  const ratingComments = comments[rating] || comments[3]
  return ratingComments[Math.floor(Math.random() * ratingComments.length)]
}

main()
  .catch((e) => {
    console.error('❌ Error updating evaluations:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })