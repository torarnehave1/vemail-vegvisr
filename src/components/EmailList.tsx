import { useEffect, useRef } from 'react';
import { RotateCcw, Star, Trash2 } from 'lucide-react';
import { Avatar } from './catalyst/avatar';
import { Badge } from './catalyst/badge';
import type { Email } from '../data/mockEmails';

type Props = {
  emails: Email[];
  activeFolder: string;
  selectedId: string | null;
  selectedIds: string[];
  onSelect: (id: string) => void;
  onToggleSelect: (id: string, checked: boolean) => void;
  onQuickDelete: (id: string) => void;
  onQuickRestore: (id: string) => void;
  loading?: boolean;
  hasMore?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
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

export function EmailList({
  emails,
  activeFolder,
  selectedId,
  selectedIds,
  onSelect,
  onToggleSelect,
  onQuickDelete,
  onQuickRestore,
  loading,
  hasMore = false,
  loadingMore = false,
  onLoadMore,
}: Props) {
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (!selectedId) return;
    const node = itemRefs.current[selectedId];
    if (!node) return;
    node.scrollIntoView({ block: 'nearest' });
    node.focus({ preventScroll: true });
  }, [selectedId]);

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
        <div
          ref={(el) => {
            itemRefs.current[email.id] = el;
          }}
          key={email.id}
          onClick={() => onSelect(email.id)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              onSelect(email.id);
            }
          }}
          aria-selected={selectedId === email.id}
          role="button"
          tabIndex={0}
          className={`group flex w-full cursor-pointer flex-col gap-1 border-b border-zinc-950/5 px-4 py-3 text-left transition-colors dark:border-white/5 ${
            selectedId === email.id
              ? 'bg-sky-50 ring-1 ring-sky-300 dark:bg-sky-950/30 dark:ring-sky-700'
              : 'hover:bg-zinc-950/2.5 dark:hover:bg-white/2.5'
          }`}
        >
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={selectedIds.includes(email.id)}
              onChange={(event) => onToggleSelect(email.id, event.target.checked)}
              onClick={(event) => event.stopPropagation()}
              aria-label={`Select email ${email.subject}`}
              className="size-4 rounded border-zinc-300 text-sky-600 focus:ring-sky-500"
            />
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
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      if (activeFolder === 'trash') {
                        onQuickRestore(email.id);
                      } else {
                        onQuickDelete(email.id);
                      }
                    }}
                    aria-label={activeFolder === 'trash' ? 'Restore email' : 'Move email to Trash'}
                    title={activeFolder === 'trash' ? 'Restore to Inbox' : 'Move to Trash'}
                    className="invisible rounded p-1 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-800 group-hover:visible dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-zinc-100"
                  >
                    {activeFolder === 'trash' ? (
                      <RotateCcw className="size-3.5" />
                    ) : (
                      <Trash2 className="size-3.5" />
                    )}
                  </button>
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
        </div>
      ))}
      {hasMore && (
        <div className="border-t border-zinc-950/5 p-3">
          <button
            type="button"
            onClick={onLoadMore}
            disabled={loadingMore}
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loadingMore ? 'Loading more...' : 'Load more'}
          </button>
        </div>
      )}
    </div>
  );
}
