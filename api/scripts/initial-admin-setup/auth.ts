import {
  type InitialAdminAccountConfig,
  type InitialAdminSetupConfig,
  type InitialAdminSlot,
  LEGACY_SETUP_MARKER_KEY,
  SETUP_MARKER_KEY,
  type SupabaseUser,
  UUID_PATTERN,
} from './config.js';

export class SupabaseInitialAdminAuth {
  constructor(
    private readonly config: InitialAdminSetupConfig,
    private readonly fetchImplementation: typeof fetch = fetch,
  ) {}

  async assertSecureSignupSettings(): Promise<void> {
    const response = await this.fetchImplementation(
      `${this.config.supabaseUrl}/auth/v1/settings`,
      { headers: { apikey: this.config.anonKey } },
    );
    const settings = await this.readJson<Record<string, unknown>>(
      response,
      'read Supabase Auth settings',
    );
    if (settings.disable_signup === true) {
      throw new Error('Supabase email signup is disabled');
    }
    if (settings.mailer_autoconfirm !== false) {
      throw new Error(
        'Supabase email confirmation must be enabled before initial-admin setup',
      );
    }
  }

  async listUsers(): Promise<SupabaseUser[]> {
    const users: SupabaseUser[] = [];
    const perPage = 1000;
    for (let page = 1; page <= 100; page += 1) {
      const response = await this.fetchImplementation(
        `${this.config.supabaseUrl}/auth/v1/admin/users?page=${page}&per_page=${perPage}`,
        { headers: this.adminHeaders() },
      );
      const result = await this.readJson<{ users?: SupabaseUser[] }>(
        response,
        'list Supabase Auth users',
      );
      if (!Array.isArray(result.users)) {
        throw new Error('Supabase Auth returned an invalid user list');
      }
      users.push(...result.users);
      if (result.users.length < perPage) return users;
    }
    throw new Error('Supabase Auth user scan exceeded the safety limit');
  }

  resolveConfiguredUsers(
    users: SupabaseUser[],
  ): Map<InitialAdminSlot, SupabaseUser> {
    const resolved = new Map<InitialAdminSlot, SupabaseUser>();
    for (const account of this.config.accounts) {
      const byEmail = users.find(
        (user) => user.email?.trim().toLowerCase() === account.email,
      );
      const marked = users.filter(
        (user) => this.markerSlot(user) === account.slot,
      );
      if (marked.length > 1) {
        throw new Error(`Multiple Auth users carry the ${account.slot} marker`);
      }
      if (marked[0] && marked[0].id !== byEmail?.id) {
        throw new Error(
          `${account.slot} setup marker does not match the configured email`,
        );
      }
      if (byEmail && this.markerSlot(byEmail) !== account.slot) {
        throw new Error(
          `The configured ${account.slot} email already belongs to an account not created by this setup`,
        );
      }
      if (byEmail) resolved.set(account.slot, byEmail);
    }

    const superadmin = resolved.get('SUPERADMIN');
    const admin = resolved.get('ADMIN');
    if (superadmin && admin && superadmin.id === admin.id) {
      throw new Error(
        'Initial-admin roles must reference different Auth users',
      );
    }
    return resolved;
  }

  async createAccount(
    account: InitialAdminAccountConfig,
  ): Promise<SupabaseUser> {
    const response = await this.fetchImplementation(
      `${this.config.supabaseUrl}/auth/v1/signup`,
      {
        method: 'POST',
        headers: {
          apikey: this.config.anonKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: account.email,
          password: account.password,
        }),
      },
    );
    const result = await this.readJson<
      SupabaseUser & {
        user?: SupabaseUser;
        session?: unknown;
      }
    >(response, `create the ${account.slot} Auth account`);
    const createdUser = result.user ?? (result.id ? result : undefined);
    if (!createdUser || !UUID_PATTERN.test(createdUser.id)) {
      throw new Error('Supabase Auth did not return a valid created user');
    }
    if (result.session || createdUser.email_confirmed_at) {
      await this.deleteUnexpectedAutoConfirmedUser(createdUser.id);
      throw new Error(
        'Supabase unexpectedly auto-confirmed an initial-admin account; the new account was removed',
      );
    }

    try {
      await this.setSetupMarker(
        createdUser.id,
        account.slot,
        createdUser.app_metadata,
      );
    } catch {
      await this.deleteNewUserAfterPartialFailure(createdUser.id);
      throw new Error(
        `The ${account.slot} account could not be safely marked and was removed; verify service-role permissions before retrying`,
      );
    }
    return {
      ...createdUser,
      app_metadata: {
        ...createdUser.app_metadata,
        [SETUP_MARKER_KEY]: { version: 1, slot: account.slot },
      },
    };
  }

  private markerSlot(user: SupabaseUser): InitialAdminSlot | null {
    const marker =
      user.app_metadata?.[SETUP_MARKER_KEY] ??
      user.app_metadata?.[LEGACY_SETUP_MARKER_KEY];
    if (!marker || typeof marker !== 'object' || Array.isArray(marker)) {
      return null;
    }
    const value = (marker as Record<string, unknown>).slot;
    return value === 'SUPERADMIN' || value === 'ADMIN' ? value : null;
  }

  private async setSetupMarker(
    userId: string,
    slot: InitialAdminSlot,
    existingMetadata: Record<string, unknown> = {},
  ): Promise<void> {
    const response = await this.fetchImplementation(
      `${this.config.supabaseUrl}/auth/v1/admin/users/${userId}`,
      {
        method: 'PUT',
        headers: {
          ...this.adminHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          app_metadata: {
            ...existingMetadata,
            [SETUP_MARKER_KEY]: { version: 1, slot },
          },
        }),
      },
    );
    await this.readJson(response, `mark the ${slot} setup account`);
  }

  private async deleteUnexpectedAutoConfirmedUser(userId: string) {
    const response = await this.fetchImplementation(
      `${this.config.supabaseUrl}/auth/v1/admin/users/${userId}`,
      { method: 'DELETE', headers: this.adminHeaders() },
    );
    if (!response.ok) {
      throw new Error(
        'Supabase auto-confirmed a new account and automatic cleanup failed; remove it manually before retrying',
      );
    }
  }

  private async deleteNewUserAfterPartialFailure(userId: string) {
    const response = await this.fetchImplementation(
      `${this.config.supabaseUrl}/auth/v1/admin/users/${userId}`,
      { method: 'DELETE', headers: this.adminHeaders() },
    );
    if (!response.ok) {
      throw new Error(
        'A partially created unmarked Auth account could not be removed; delete the configured account in Supabase before retrying',
      );
    }
  }

  private adminHeaders(): Record<string, string> {
    return {
      apikey: this.config.serviceRoleKey,
      Authorization: `Bearer ${this.config.serviceRoleKey}`,
    };
  }

  private async readJson<T = Record<string, unknown>>(
    response: Response,
    operation: string,
  ): Promise<T> {
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error(
          `Insufficient Supabase permissions to ${operation} (HTTP ${response.status})`,
        );
      }
      throw new Error(`Failed to ${operation} (HTTP ${response.status})`);
    }
    try {
      return (await response.json()) as T;
    } catch {
      throw new Error(
        `Supabase returned an invalid response while trying to ${operation}`,
      );
    }
  }
}

