const STORAGE_KEY = 'vemail_accounts';
const VEMAIL_WORKER = 'https://vemail-api.vegvisr.org';

export type EmailAccount = {
  id: string;
  name: string;
  email: string;
  aliases: string[];
  isDefault: boolean;
  hasPassword: boolean;
  storeUrl: string;
  accountType?: 'gmail' | 'vegvisr' | 'smtp'; // gmail = Gmail with app password, vegvisr = @vegvisr.org SMTP, smtp = generic SMTP
};

// --- localStorage: metadata only, never passwords ---

export function getAccounts(): EmailAccount[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as EmailAccount[];
  } catch {
    return [];
  }
}

function saveLocal(accounts: EmailAccount[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
}

export function addAccount(account: Omit<EmailAccount, 'id'>): EmailAccount[] {
  const accounts = getAccounts();
  const newAccount: EmailAccount = {
    ...account,
    id: crypto.randomUUID(),
  };
  if (newAccount.isDefault) {
    accounts.forEach((a) => (a.isDefault = false));
  }
  if (accounts.length === 0) {
    newAccount.isDefault = true;
  }
  accounts.push(newAccount);
  saveLocal(accounts);
  return accounts;
}

export function updateAccount(id: string, updates: Partial<EmailAccount>): EmailAccount[] {
  const accounts = getAccounts();
  const idx = accounts.findIndex((a) => a.id === id);
  if (idx === -1) return accounts;
  if (updates.isDefault) {
    accounts.forEach((a) => (a.isDefault = false));
  }
  accounts[idx] = { ...accounts[idx], ...updates };
  saveLocal(accounts);
  return accounts;
}

export function removeAccount(id: string): EmailAccount[] {
  const accounts = getAccounts().filter((a) => a.id !== id);
  if (accounts.length > 0 && !accounts.some((a) => a.isDefault)) {
    accounts[0].isDefault = true;
  }
  saveLocal(accounts);
  return accounts;
}

export function setDefaultAccount(id: string): EmailAccount[] {
  const accounts = getAccounts();
  accounts.forEach((a) => (a.isDefault = a.id === id));
  saveLocal(accounts);
  return accounts;
}

// --- Cloud: via email-worker D1 binding (cookie.vegvisr.org) ---

/**
 * Save account metadata + password to the email-worker.
 * Password is stored server-side in D1 (never returned to the browser).
 */
export async function saveAccountToCloud(
  userEmail: string,
  account: EmailAccount,
  appPassword: string | null
): Promise<void> {
  try {
    await fetch(`${VEMAIL_WORKER}/email-accounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userEmail,
        account,
        ...(appPassword ? { appPassword } : {}),
      }),
    });
  } catch {
    // Cloud sync failure is non-fatal
  }
}

/**
 * Remove an account from the cloud.
 */
export async function removeAccountFromCloud(
  userEmail: string,
  accountId: string
): Promise<void> {
  try {
    await fetch(
      `${VEMAIL_WORKER}/email-accounts?user=${encodeURIComponent(userEmail)}&id=${encodeURIComponent(accountId)}`,
      { method: 'DELETE' }
    );
  } catch {
    // Non-fatal
  }
}

/**
 * Load account metadata from cloud (passwords are never returned to client).
 */
export async function loadAccountsFromCloud(
  userEmail: string
): Promise<EmailAccount[] | null> {
  try {
    const res = await fetch(
      `${VEMAIL_WORKER}/email-accounts?user=${encodeURIComponent(userEmail)}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (Array.isArray(data.accounts) && data.accounts.length > 0) {
      return data.accounts as EmailAccount[];
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Send an email via the default (or specified) account through vemail-worker.
 * Credentials are resolved server-side from D1 — no passwords leave the server.
 */
export async function sendEmail(
  userEmail: string,
  opts: {
    accountId?: string;
    to: string;
    subject: string;
    html: string;
    fromEmail?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  const accounts = getAccounts();
  const account = opts.accountId
    ? accounts.find((a) => a.id === opts.accountId)
    : accounts.find((a) => a.isDefault) || accounts[0];

  if (!account) {
    return { success: false, error: 'No email account configured. Go to Settings to add one.' };
  }

  // Route to correct endpoint based on account type
  const accountType = account.accountType || 'gmail';
  const endpoint = accountType === 'gmail' ? '/send-gmail-email' : '/send-email';

  try {
    const res = await fetch(`${VEMAIL_WORKER}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userEmail,
        accountId: account.id,
        fromEmail: opts.fromEmail || account.email,
        toEmail: opts.to,
        subject: opts.subject,
        html: opts.html,
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || 'Failed to send email' };
    }
    return { success: true };
  } catch {
    return { success: false, error: 'Network error — could not reach email service' };
  }
}

/**
 * Sync all local account metadata to cloud (no passwords sent).
 */
export async function syncAllAccountsToCloud(
  userEmail: string,
  accounts: EmailAccount[]
): Promise<void> {
  try {
    await fetch(`${VEMAIL_WORKER}/email-accounts/sync`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userEmail,
        accounts: accounts.map((a) => ({
          id: a.id,
          name: a.name,
          email: a.email,
          aliases: a.aliases,
          isDefault: a.isDefault,
          hasPassword: a.hasPassword,
          accountType: a.accountType,
        })),
      }),
    });
  } catch {
    // Non-fatal
  }
}

/**
 * Trigger manual Gmail inbox sync for the current user.
 */
export async function triggerGmailSyncNow(
  userEmail: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${VEMAIL_WORKER}/gmail/sync-now`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userEmail }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || 'Failed to sync Gmail inbox' };
    }
    return { success: true };
  } catch {
    return { success: false, error: 'Network error — could not reach sync service' };
  }
}
