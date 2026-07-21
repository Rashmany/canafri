import { prisma } from '../lib/prisma.js';
import { HashService } from '../lib/hash.js';
import dotenv from 'dotenv';
import path from 'path';

// Load env variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function main() {
  const args = process.argv.slice(2);
  const emailArg = args.find(a => a.startsWith('--email='));
  const usernameArg = args.find(a => a.startsWith('--username='));
  const passwordArg = args.find(a => a.startsWith('--password='));

  if (!emailArg || !usernameArg || !passwordArg) {
    console.error('Usage: npx tsx src/scripts/seed-admin.ts --email=<email> --username=<username> --password=<password>');
    process.exit(1);
  }

  const email = emailArg.split('=')[1].trim().toLowerCase();
  const username = usernameArg.split('=')[1].trim();
  const password = passwordArg.split('=')[1];

  if (!email || !username || !password) {
    console.error('Error: Email, username, and password cannot be empty.');
    process.exit(1);
  }

  console.log(`Seeding SUPER_ADMIN: ${username} (${email})...`);

  // Check if user already exists
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { email },
        { username }
      ]
    }
  });

  if (existingUser) {
    if (existingUser.role === 'SUPER_ADMIN') {
      console.log(`User with email or username already exists and is a SUPER_ADMIN. Updating password...`);
      const passwordHash = await HashService.hashPassword(password);
      await prisma.user.update({
        where: { id: existingUser.id },
        data: { passwordHash }
      });
      console.log('Password updated successfully.');
      process.exit(0);
    } else {
      console.log(`User with email or username already exists as role: ${existingUser.role}. Promoting to SUPER_ADMIN...`);
      const passwordHash = await HashService.hashPassword(password);
      await prisma.user.update({
        where: { id: existingUser.id },
        data: { role: 'SUPER_ADMIN', passwordHash }
      });
      console.log('User promoted and password updated successfully.');
      process.exit(0);
    }
  }

  const passwordHash = await HashService.hashPassword(password);
  const user = await prisma.user.create({
    data: {
      displayName: 'Super Admin',
      username,
      email,
      passwordHash,
      emailVerified: true,
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      trustScore: 100,
    }
  });

  console.log(`SUPER_ADMIN seeded successfully! User ID: ${user.id}`);
}

main()
  .catch((err) => {
    console.error('Seeding failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
