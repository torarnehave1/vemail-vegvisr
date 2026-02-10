import type { Email } from '../data/mockEmails';

const DEFAULT_STORE_WORKER = 'https://vemail-store-worker.post-e91.workers.dev';

/** Convert a StoredEmail from the API into the UI Email type */
export function toEmail(s: StoredEmail, bodyHtml?: string | null, bodyText?: string | null): Email {
  return {
    id: s.id,
    from: { name: s.from_name || s.from_address, email: s.from_address },
    to: [{ name: s.to_address, email: s.to_address }],
    subject: s.subject || '(no subject)',
    preview: s.snippet || '',
    body: bodyHtml || bodyText || s.snippet || '',
    date: s.received_at,
    read: !!s.read,
    starred: !!s.starred,
    folder: s.folder,
  };
}

export type StoredEmail = {
  id: string;
  user_email: string;
  message_id: string | null;
  folder: string;
  from_address: string;
  from_name: string | null;
  to_address: string;
  cc: string | null;
  bcc: string | null;
  subject: string | null;
  snippet: string | null;
  has_attachments: number;
  read: number;
  starred: number;
  received_at: string;
  created_at: string;
};

export type StoredEmailFull = StoredEmail & {
  body_r2_key: string | null;
  body_text_r2_key: string | null;
  raw_r2_key: string | null;
};

export async function fetchEmails(
  userEmail: string,
  folder: string,
  limit = 50,
  offset = 0,
  storeUrl?: string
): Promise<StoredEmail[]> {
  try {
    const base = storeUrl || DEFAULT_STORE_WORKER;
    const params = new URLSearchParams({
      user: userEmail,
      folder,
      limit: String(limit),
      offset: String(offset),
    });
    const res = await fetch(`${base}/emails?${params}`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data as { emails: StoredEmail[] }).emails || [];
  } catch {
    return [];
  }
}

export async function fetchEmail(
  userEmail: string,
  emailId: string,
  storeUrl?: string
): Promise<{ email: StoredEmailFull; bodyHtml: string | null; bodyText: string | null } | null> {
  try {
    const base = storeUrl || DEFAULT_STORE_WORKER;
    const res = await fetch(
      `${base}/emails/${encodeURIComponent(emailId)}?user=${encodeURIComponent(userEmail)}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    const typed = data as { email: StoredEmailFull; bodyHtml: string | null; bodyText: string | null };
    return typed;
  } catch {
    return null;
  }
}

export async function updateEmail(
  userEmail: string,
  emailId: string,
  updates: { read?: boolean; starred?: boolean; folder?: string },
  storeUrl?: string
): Promise<boolean> {
  try {
    const base = storeUrl || DEFAULT_STORE_WORKER;
    const res = await fetch(
      `${base}/emails/${encodeURIComponent(emailId)}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail, ...updates }),
      }
    );
    return res.ok;
  } catch {
    return false;
  }
}

export async function deleteEmail(
  userEmail: string,
  emailId: string,
  storeUrl?: string
): Promise<boolean> {
  try {
    const base = storeUrl || DEFAULT_STORE_WORKER;
    const res = await fetch(
      `${base}/emails/${encodeURIComponent(emailId)}?user=${encodeURIComponent(userEmail)}`,
      { method: 'DELETE' }
    );
    return res.ok;
  } catch {
    return false;
  }
}
