import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const newPassword = args[0];

  if (!newPassword || newPassword.length < 12) {
    console.error('Usage: npx ts-node scripts/reset-super-admin.ts <NewSuperAdminPassword123!>');
    console.error('Error: Password must be at least 12 characters.');
    process.exit(1);
  }

  console.log('🔍 Locating root SUPER_ADMIN account...');

  const superAdmin = await prisma.user.findFirst({
    where: { role: 'SUPER_ADMIN' },
  });

  if (!superAdmin) {
    console.error('❌ Error: No SUPER_ADMIN account found in database.');
    process.exit(1);
  }

  console.log(`👤 Found SUPER_ADMIN: ${superAdmin.email} (${superAdmin.username})`);

  const passwordHash = await bcrypt.hash(newPassword, 12);

  // Generate 10 new emergency recovery codes
  const plainRecoveryCodes: string[] = [];
  const recoveryHashes: string[] = [];

  for (let i = 0; i < 10; i++) {
    const code = `${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;
    plainRecoveryCodes.push(code);
    const hash = await bcrypt.hash(code.replace('-', '').trim(), 12);
    recoveryHashes.push(hash);
  }

  // Update SUPER_ADMIN credentials and reset TOTP
  await prisma.user.update({
    where: { id: superAdmin.id },
    data: {
      passwordHash,
      totpEnabled: false,
      totpSecret: null,
      totpRecoveryHashes: recoveryHashes,
      status: 'ACTIVE',
    },
  });

  // Revoke all active sessions for SUPER_ADMIN
  await prisma.session.deleteMany({
    where: { userId: superAdmin.id },
  });

  console.log('\n==================================================');
  console.log('✅ EMERGENCY SUPER_ADMIN RESET SUCCESSFUL');
  console.log('==================================================');
  console.log(`Email:          ${superAdmin.email}`);
  console.log(`Password:       Updated successfully`);
  console.log(`TOTP Status:    Reset (Enforced on next login)`);
  console.log(`Active Sessions: Revoked`);
  console.log('\n🔑 10 New Emergency Recovery Codes (Save Securely):');
  plainRecoveryCodes.forEach((code, idx) => console.log(`   ${idx + 1}. ${code}`));
  console.log('==================================================\n');
}

main()
  .catch((e) => {
    console.error('❌ Reset failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
