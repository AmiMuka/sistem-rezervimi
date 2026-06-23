require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const sallat = ['A', 'B'];
  for (const salla of sallat) {
    for (let i = 1; i <= 10; i++) {
      const kodi = `${salla}-${String(i).padStart(2, '0')}`;
      await prisma.vend.upsert({
        where: { kodi },
        update: {},
        create: { kodi, salla, status: 'i_lire' },
      });
    }
  }
  console.log('20 vende u krijuan me sukses (Salla A + Salla B)');
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());