import { Star } from 'lucide-react';
import { Avatar } from './catalyst/avatar';
import { Badge } from './catalyst/badge';
import type { Email } from '../data/mockEmails';

type Props = {
  emails: Email[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  loading?: boolean;
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

const labelColorMap: Record<string, 'violet' | 'emerald' | 'zinc' | 'sky' | 'amber' | 'rose'> = {
  product: 'violet',
  design: 'emerald',
  github: 'zinc',
  urgent: 'rose',
  meeting: 'sky',
};

export function EmailList({ emails, selectedId, onSelect, loading }: Props) {
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-sm text-zinc-400">
        Loading...
      </div>
    );
  }

  if (emails.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-sm text-zinc-500 dark:text-zinc-400">
        No messages in this folder
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      {emails.map((email) => (
        <button
          type="button"
          key={email.id}
          onClick={() => onSelect(email.id)}
          className={`flex w-full flex-col gap-1 border-b border-zinc-950/5 px-4 py-3 text-left transition-colors dark:border-white/5 ${
            selectedId === email.id
              ? 'bg-zinc-950/5 dark:bg-white/5'
              : 'hover:bg-zinc-950/2.5 dark:hover:bg-white/2.5'
          }`}
        >
          <div className="flex items-center gap-3">
            <Avatar
              initials={getInitials(email.from.name)}
              className="size-8 bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`truncate text-sm ${
                    !email.read
                      ? 'font-semibold text-zinc-950 dark:text-white'
                      : 'text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  {email.from.name}
                </span>
                <div className="flex shrink-0 items-center gap-1">
                  {email.starred && <Star className="size-3 fill-amber-400 text-amber-400" />}
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    {formatDate(email.date)}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="pl-11">
            <p
              className={`truncate text-sm ${
                !email.read
                  ? 'font-medium text-zinc-800 dark:text-zinc-200'
                  : 'text-zinc-600 dark:text-zinc-400'
              }`}
            >
              {email.subject}
            </p>
            <p className="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400">
              {email.preview}
            </p>
            {email.labels && email.labels.length > 0 && (
              <div className="mt-1.5 flex gap-1">
                {email.labels.map((label) => (
                  <Badge key={label} color={labelColorMap[label] || 'zinc'}>
                    {label}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}
