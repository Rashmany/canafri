import { prisma } from '../lib/prisma.js';
import { HashService } from '../lib/hash.js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function main() {
  const args = process.argv.slice(2);
  const idArg       = args.find(a => a.startsWith('--id='));
  const emailArg    = args.find(a => a.startsWith('--email='));
  const usernameArg = args.find(a => a.startsWith('--username='));
  const passwordArg = args.find(a => a.startsWith('--password='));

  if (!idArg) {
    // Find the placeholder admin first
    const admins = await prisma.user.findMany({
      where: { role: 'SUPER_ADMIN' },
      select: { id: true, email: true, username: true, displayName: true, createdAt: true },
    });

    if (admins.length === 0) {
      console.log('No SUPER_ADMIN found.');
      process.exit(1);
    }

    console.log('\n=== Current SUPER_ADMIN Accounts ===\n');
    admins.forEach((a, i) => {
      console.log(`[${i + 1}] ID:       ${a.id}`);
      console.log(`     Email:    ${a.email}`);
      console.log(`     Username: ${a.username}`);
      console.log(`     Created:  ${a.createdAt}`);
      console.log('');
    });

    console.log('Run with:');
    console.log('  npx tsx src/scripts/update-admin.ts --id=<ID> --email=<new-email> --username=<new-username> --password=<new-password>');
    process.exit(0);
  }

  const id = idArg.split('=')[1].trim();

  const admin = await prisma.user.findUnique({ where: { id } });
  if (!admin || admin.role !== 'SUPER_ADMIN') {
    console.error(`No SUPER_ADMIN found with ID: ${id}`);
    process.exit(1);
  }

  const updateData: Record<string, string | boolean> = {};

  if (emailArg) {
    const email = emailArg.split('=').slice(1).join('=').trim().toLowerCase();
    updateData.email = email;
    updateData.emailVerified = true;
    console.log(`  ✔ Email will be updated to: ${email}`);
  }

  if (usernameArg) {
    const username = usernameArg.split('=').slice(1).join('=').trim();
    updateData.username = username;
    updateData.displayName = username;
    console.log(`  ✔ Username will be updated to: ${username}`);
  }

  if (passwordArg) {
    const password = passwordArg.split('=').slice(1).join('=');
    updateData.passwordHash = await HashService.hashPassword(password);
    console.log(`  ✔ Password will be updated.`);
  }

  if (Object.keys(updateData).length === 0) {
    console.log('Nothing to update. Provide at least one of: --email, --username, --password');
    process.exit(0);
  }

  await prisma.user.update({ where: { id }, data: updateData as any });
  console.log('\n✅ SUPER_ADMIN updated successfully!');
}

main()
  .catch((err) => { console.error('Update failed:', err.message); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
