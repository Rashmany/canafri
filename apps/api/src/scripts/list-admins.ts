import { prisma } from '../lib/prisma.js';

async function main() {
  const admins = await prisma.user.findMany({
    where: { role: 'SUPER_ADMIN' },
    select: {
      id: true,
      email: true,
      username: true,
      displayName: true,
      status: true,
      createdAt: true,
    },
  });

  if (admins.length === 0) {
    console.log('No SUPER_ADMIN accounts found in the database.');
  } else {
    console.log('\n=== SUPER_ADMIN Accounts ===\n');
    admins.forEach((a, i) => {
      console.log(`[${i + 1}] ID:          ${a.id}`);
      console.log(`     Display Name: ${a.displayName}`);
      console.log(`     Email:        ${a.email}`);
      console.log(`     Username:     ${a.username}`);
      console.log(`     Status:       ${a.status}`);
      console.log(`     Created:      ${a.createdAt}`);
      console.log('');
    });
  }
}

main()
  .catch((err) => { console.error(err); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
