import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';
import {
  assertNoExistingPrivilegedAssignments,
  linkPrivilegedAccounts,
  loadInitialAdminSetupConfig,
  loadInitialAdminEnvironment,
  SupabaseInitialAdminAuth,
  verifyDatabaseConnectivity,
} from './initial-admin-setup.js';

async function main(): Promise<void> {
  const databaseCheckOnly = process.argv.includes('--check-database-only');
  loadInitialAdminEnvironment();
  const config = loadInitialAdminSetupConfig();
  const prisma = new PrismaClient({
    adapter: new PrismaPg({
      connectionString: config.databaseUrl,
      connectionTimeoutMillis: 15_000,
    }),
  });

  try {
    await verifyDatabaseConnectivity(prisma);
    if (databaseCheckOnly) {
      console.log('PostgreSQL connectivity verified for initial-admin setup.');
      return;
    }
    const auth = new SupabaseInitialAdminAuth(config);
    await auth.assertSecureSignupSettings();
    const users = await auth.listUsers();
    const configuredUsers = auth.resolveConfiguredUsers(users);

    if (configuredUsers.size < 2) {
      await assertNoExistingPrivilegedAssignments(prisma);
    }

    let created = false;
    for (const account of config.accounts) {
      if (!configuredUsers.has(account.slot)) {
        configuredUsers.set(account.slot, await auth.createAccount(account));
        created = true;
      }
    }

    const awaitingConfirmation = [...configuredUsers.values()].some(
      (user) => !user.email_confirmed_at,
    );
    if (awaitingConfirmation) {
      console.log(
        created
          ? 'Initial admin Auth accounts created. Confirm both emails, then rerun the same command.'
          : 'Initial admin setup is waiting for both email confirmations. Rerun the same command afterward.',
      );
      process.exitCode = 2;
      return;
    }

    await linkPrivilegedAccounts(prisma, config, configuredUsers);
    console.log(
      'Initial SUPERADMIN and ADMIN profiles and role assignments are present.',
    );
  } finally {
    await prisma.$disconnect();
  }
}

try {
  await main();
} catch (error: unknown) {
  const message = redactSecrets(
    error instanceof Error ? error.message : 'Unknown error',
  );
  console.error(`Initial admin setup failed: ${message}`);
  process.exitCode = 1;
}

function redactSecrets(message: string): string {
  const secretNames = [
    'DATABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'INITIAL_SUPERADMIN_PASSWORD',
    'INITIAL_ADMIN_PASSWORD',
    'BOOTSTRAP_SUPERADMIN_INITIAL_PASSWORD',
    'BOOTSTRAP_ADMIN_INITIAL_PASSWORD',
  ];
  let redacted = message;
  for (const name of secretNames) {
    const value = process.env[name];
    if (value) redacted = redacted.replaceAll(value, '[REDACTED]');
  }
  return redacted
    .replace(/postgres(?:ql)?:\/\/[^@\s]+@/gi, 'postgresql://[REDACTED]@')
    .replace(
      /\b[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\b/g,
      '[REDACTED_TOKEN]',
    );
}
