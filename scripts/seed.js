const { seedDatabase } = require('../src/lib/seed.ts')

seedDatabase()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    console.log('Seeding completed')
  })