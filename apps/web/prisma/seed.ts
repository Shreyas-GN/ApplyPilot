import { neonConfig } from '@neondatabase/serverless'
import { PrismaNeon } from '@prisma/adapter-neon'
import { PrismaClient } from '@prisma/client'

if (typeof WebSocket === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  neonConfig.webSocketConstructor = require('ws')
}

const connectionString = process.env.DATABASE_URL
if (!connectionString) throw new Error('DATABASE_URL is not set')
const adapter = new PrismaNeon({ connectionString })
const prisma = new PrismaClient({ adapter })

const JOB_BOARDS = [
  // 4 enabled
  { provider: 'greenhouse', slug: 'vercel', companyName: 'Vercel', enabled: true },
  { provider: 'greenhouse', slug: 'anthropic', companyName: 'Anthropic', enabled: true },
  { provider: 'greenhouse', slug: 'stripe', companyName: 'Stripe', enabled: true },
  { provider: 'greenhouse', slug: 'figma', companyName: 'Figma', enabled: true },
  // 6 disabled
  { provider: 'greenhouse', slug: 'notion', companyName: 'Notion', enabled: false },
  { provider: 'greenhouse', slug: 'linear', companyName: 'Linear', enabled: false },
  { provider: 'lever', slug: 'supabase', companyName: 'Supabase', enabled: false },
  { provider: 'lever', slug: 'planetscale', companyName: 'PlanetScale', enabled: false },
  { provider: 'greenhouse', slug: 'retool', companyName: 'Retool', enabled: false },
  { provider: 'greenhouse', slug: 'brex', companyName: 'Brex', enabled: false },
]

async function main() {
  console.log('Seeding job boards...')
  for (const board of JOB_BOARDS) {
    await prisma.jobBoard.upsert({
      where: { job_boards_provider_slug_idx: { provider: board.provider, slug: board.slug } },
      create: board,
      update: {
        companyName: board.companyName,
        enabled: board.enabled,
      },
    })
  }
  const enabled = JOB_BOARDS.filter((b) => b.enabled).length
  const disabled = JOB_BOARDS.filter((b) => !b.enabled).length
  console.log(`Seeded ${JOB_BOARDS.length} job boards (${enabled} enabled, ${disabled} disabled).`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
