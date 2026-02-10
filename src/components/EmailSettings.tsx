import { useState, useEffect } from 'react';
import { Heading, Subheading } from './catalyst/heading';
import { Text } from './catalyst/text';
import { Divider } from './catalyst/divider';
import { Button } from './catalyst/button';
import { Badge } from './catalyst/badge';
import { Input } from './catalyst/input';
import { Field, Label, Description } from './catalyst/fieldset';
import {
  Plus,
  Trash2,
  Pencil,
  Star,
  X,
  Save,
  ArrowLeft,
} from 'lucide-react';
import {
  getAccounts,
  addAccount,
  updateAccount,
  removeAccount,
  setDefaultAccount,
  saveAccountToCloud,
  removeAccountFromCloud,
  loadAccountsFromCloud,
  syncAllAccountsToCloud,
  type EmailAccount,
} from '../lib/emailAccounts';

type Props = {
  userEmail: string | null;
  onClose: () => void;
};

const emptyForm = {
  name: '',
  email: '',
  appPassword: '',
  storeUrl: '',
};

export function EmailSettings({ userEmail, onClose }: Props) {
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [aliasInput, setAliasInput] = useState('');
  const [aliasAccountId, setAliasAccountId] = useState<string | null>(null);
  const [status, setStatus] = useState('');

  useEffect(() => {
    const local = getAccounts();
    if (local.length > 0) {
      setAccounts(local);
    } else if (userEmail) {
      loadAccountsFromCloud(userEmail).then((cloud) => {
        if (cloud && cloud.length > 0) {
          setAccounts(cloud);
        }
      });
    }
  }, [userEmail]);

  const syncMetadata = (updated: EmailAccount[]) => {
    setAccounts(updated);
    if (userEmail) {
      syncAllAccountsToCloud(userEmail, updated);
    }
  };

  const handleAdd = () => {
    setAdding(true);
    setEditing(null);
    setForm(emptyForm);
  };

  const handleEdit = (account: EmailAccount) => {
    setEditing(account.id);
    setAdding(false);
    setForm({
      name: account.name,
      email: account.email,
      appPassword: '',
      storeUrl: account.storeUrl || '',
    });
  };

  const handleSave = () => {
    if (!form.email.trim()) return;
    const password = form.appPassword.trim() || null;

    if (adding) {
      const updated = addAccount({
        name: form.name,
        email: form.email,
        aliases: [],
        isDefault: false,
        hasPassword: !!password,
        storeUrl: form.storeUrl.trim(),
      });
      setAccounts(updated);
      const newAccount = updated[updated.length - 1];
      if (userEmail) {
        saveAccountToCloud(userEmail, newAccount, password);
      }
      setStatus('Account added.');
    } else if (editing) {
      const updated = updateAccount(editing, {
        name: form.name,
        email: form.email,
        storeUrl: form.storeUrl.trim(),
        ...(password ? { hasPassword: true } : {}),
      });
      setAccounts(updated);
      const account = updated.find((a) => a.id === editing);
      if (userEmail && account) {
        saveAccountToCloud(userEmail, account, password);
      }
      setStatus('Account updated.');
    }
    setAdding(false);
    setEditing(null);
    setForm(emptyForm);
    setTimeout(() => setStatus(''), 3000);
  };

  const handleCancel = () => {
    setAdding(false);
    setEditing(null);
    setForm(emptyForm);
  };

  const handleRemove = (id: string) => {
    const updated = removeAccount(id);
    syncMetadata(updated);
    if (userEmail) {
      removeAccountFromCloud(userEmail, id);
    }
    if (editing === id) {
      setEditing(null);
      setForm(emptyForm);
    }
  };

  const handleSetDefault = (id: string) => {
    const updated = setDefaultAccount(id);
    syncMetadata(updated);
  };

  const handleAddAlias = (accountId: string) => {
    if (!aliasInput.trim()) return;
    const account = accounts.find((a) => a.id === accountId);
    if (!account) return;
    if (account.aliases.includes(aliasInput.trim())) {
      setAliasInput('');
      return;
    }
    const updated = updateAccount(accountId, {
      aliases: [...account.aliases, aliasInput.trim()],
    });
    syncMetadata(updated);
    setAliasInput('');
    setAliasAccountId(null);
  };

  const handleRemoveAlias = (accountId: string, alias: string) => {
    const account = accounts.find((a) => a.id === accountId);
    if (!account) return;
    const updated = updateAccount(accountId, {
      aliases: account.aliases.filter((a) => a !== alias),
    });
    syncMetadata(updated);
  };

  const isEditing = adding || editing !== null;

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-3xl px-6 py-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button plain onClick={onClose}>
            <ArrowLeft className="size-4" data-slot="icon" />
          </Button>
          <Heading>Settings</Heading>
        </div>

        <Divider className="my-6" />

        {/* Section: Email Accounts */}
        <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
          <div className="space-y-1">
            <Subheading>Email Accounts</Subheading>
            <Text>
              Add your Gmail accounts to send emails. Each account needs a
              Google App Password.
            </Text>
          </div>
          <div className="space-y-3">
            {accounts.length === 0 && !isEditing && (
              <Text>No email accounts configured yet.</Text>
            )}

            {accounts.map((account) => (
              <div
                key={account.id}
                className="flex items-start justify-between rounded-lg border border-zinc-200 p-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-zinc-950">
                      {account.name || account.email}
                    </span>
                    {account.isDefault && <Badge color="sky">Default</Badge>}
                  </div>
                  <span className="text-xs text-zinc-500">{account.email}</span>
                  {account.hasPassword && (
                    <span className="ml-2 text-xs text-emerald-600">
                      Password saved
                    </span>
                  )}

                  {/* Aliases */}
                  {account.aliases.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {account.aliases.map((alias) => (
                        <span
                          key={alias}
                          className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600"
                        >
                          {alias}
                          <button
                            type="button"
                            onClick={() =>
                              handleRemoveAlias(account.id, alias)
                            }
                            className="text-zinc-400 hover:text-zinc-600"
                          >
                            <X className="size-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Add alias */}
                  {aliasAccountId === account.id ? (
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="email"
                        value={aliasInput}
                        onChange={(e) => setAliasInput(e.target.value)}
                        placeholder="alias@example.com"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddAlias(account.id);
                          if (e.key === 'Escape') {
                            setAliasAccountId(null);
                            setAliasInput('');
                          }
                        }}
                        className="rounded border border-zinc-200 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-sky-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddAlias(account.id)}
                        className="text-xs text-sky-600 hover:text-sky-700"
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAliasAccountId(null);
                          setAliasInput('');
                        }}
                        className="text-xs text-zinc-400 hover:text-zinc-600"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setAliasAccountId(account.id);
                        setAliasInput('');
                      }}
                      className="mt-1 text-xs text-zinc-400 hover:text-zinc-600"
                    >
                      + Add alias
                    </button>
                  )}
                </div>

                {/* Actions */}
                <div className="ml-3 flex items-center gap-1">
                  {!account.isDefault && (
                    <button
                      type="button"
                      title="Set as default"
                      onClick={() => handleSetDefault(account.id)}
                      className="rounded p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
                    >
                      <Star className="size-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    title="Edit"
                    onClick={() => handleEdit(account)}
                    className="rounded p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    title="Remove"
                    onClick={() => handleRemove(account.id)}
                    className="rounded p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-rose-600"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            ))}

            {!isEditing && (
              <Button outline onClick={handleAdd}>
                <Plus className="size-4" data-slot="icon" />
                Add Account
              </Button>
            )}
          </div>
        </section>

        {/* Add/Edit Form */}
        {isEditing && (
          <>
            <Divider className="my-6" soft />

            <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
              <div className="space-y-1">
                <Subheading>
                  {adding ? 'Add Account' : 'Edit Account'}
                </Subheading>
                <Text>
                  Enter your Gmail address and a Google App Password. You can
                  generate an App Password at{' '}
                  <a
                    href="https://myaccount.google.com/apppasswords"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sky-600 underline"
                  >
                    myaccount.google.com/apppasswords
                  </a>
                  .
                </Text>
              </div>
              <div className="space-y-4">
                <Field>
                  <Label>Display Name</Label>
                  <Description>
                    A friendly name for this account (e.g. "Work", "Personal").
                  </Description>
                  <Input
                    type="text"
                    value={form.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setForm((f) => ({ ...f, name: e.target.value }))
                    }
                    placeholder="My Work Email"
                  />
                </Field>

                <Field>
                  <Label>Email Address</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setForm((f) => ({ ...f, email: e.target.value }))
                    }
                    placeholder="you@gmail.com"
                  />
                </Field>

                <Field>
                  <Label>App Password</Label>
                  <Description>
                    {editing
                      ? 'Leave blank to keep the existing password, or enter a new one.'
                      : '16-character password from Google (not your regular password).'}
                  </Description>
                  <Input
                    type="password"
                    value={form.appPassword}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setForm((f) => ({ ...f, appPassword: e.target.value }))
                    }
                    placeholder="xxxx xxxx xxxx xxxx"
                  />
                </Field>

                <Field>
                  <Label>Store Worker URL</Label>
                  <Description>
                    The vemail-store-worker URL for this account&apos;s email
                    storage (e.g. https://vemail-store-worker.example.workers.dev).
                  </Description>
                  <Input
                    type="url"
                    value={form.storeUrl}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setForm((f) => ({ ...f, storeUrl: e.target.value }))
                    }
                    placeholder="https://vemail-store-worker.xxx.workers.dev"
                  />
                </Field>

                <div className="flex gap-3">
                  <Button color="sky" onClick={handleSave}>
                    <Save className="size-4" data-slot="icon" />
                    {adding ? 'Add Account' : 'Save Changes'}
                  </Button>
                  <Button plain onClick={handleCancel}>
                    Cancel
                  </Button>
                </div>
              </div>
            </section>
          </>
        )}

        {status && (
          <p className="mt-4 text-center text-sm text-emerald-600">{status}</p>
        )}

        <Divider className="my-6" soft />

        {/* Info section */}
        <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
          <div className="space-y-1">
            <Subheading>How It Works</Subheading>
            <Text>
              Emails are sent through your Gmail account using Google App
              Passwords. Your app passwords are stored securely on the server
              — they are never kept in your browser. Aliases must be configured
              in your Gmail &ldquo;Send mail as&rdquo; settings first.
            </Text>
          </div>
          <div />
        </section>
      </div>
    </div>
  );
}
