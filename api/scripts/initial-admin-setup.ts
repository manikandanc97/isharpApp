export {
  INITIAL_ADMINS_ENV_PATH,
  INITIAL_ADMINS_SETUP_CONFIRMATION,
  LEGACY_SETUP_MARKER_KEY,
  SETUP_MARKER_KEY,
  UUID_PATTERN,
  accountConfig,
  loadInitialAdminEnvironment,
  loadInitialAdminSetupConfig,
  required,
  requiredWithLegacy,
  validateDatabaseUrl,
  validateSupabaseUrl,
  type DotenvLoader,
  type InitialAdminAccountConfig,
  type InitialAdminSetupConfig,
  type InitialAdminSlot,
  type SupabaseUser,
} from './initial-admin-setup/config.js';

export { SupabaseInitialAdminAuth } from './initial-admin-setup/auth.js';

export {
  assertNoExistingPrivilegedAssignments,
  delay,
  ensureActiveProfile,
  linkPrivilegedAccounts,
  requireConfirmedUser,
  verifyDatabaseConnectivity,
} from './initial-admin-setup/db.js';
