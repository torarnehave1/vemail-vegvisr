import { Reply, Forward, Archive, Trash2, MoreHorizontal, Paperclip } from 'lucide-react';
import { Avatar } from './catalyst/avatar';
import { Button } from './catalyst/button';
import { Heading } from './catalyst/heading';
import { Text } from './catalyst/text';
import { Divider } from './catalyst/divider';
import type { Email } from '../data/mockEmails';

type Props = {
  email: Email | null;
};

function formatFullDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString([], {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }) + ' at ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function EmailView({ email }: Props) {
  if (!email) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-zinc-400 dark:text-zinc-500">
        <Paperclip className="size-10" />
        <Text>Select a message to read</Text>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-6 py-2">
        <Button plain>
          <Reply className="size-4" data-slot="icon" />
        </Button>
        <Button plain>
          <Forward className="size-4" data-slot="icon" />
        </Button>
        <Button plain>
          <Archive className="size-4" data-slot="icon" />
        </Button>
        <Button plain>
          <Trash2 className="size-4" data-slot="icon" />
        </Button>
        <div className="flex-1" />
        <Button plain>
          <MoreHorizontal className="size-4" data-slot="icon" />
        </Button>
      </div>

      <Divider />

      {/* Email content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <Heading level={2}>{email.subject}</Heading>

        <div className="mt-6 flex items-start gap-3">
          <Avatar
            initials={getInitials(email.from.name)}
            className="size-10 bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <div>
                <span className="text-sm font-semibold text-zinc-950 dark:text-white">
                  {email.from.name}
                </span>
                <span className="ml-2 text-xs text-zinc-500 dark:text-zinc-400">
                  &lt;{email.from.email}&gt;
                </span>
              </div>
              <span className="shrink-0 text-xs text-zinc-500 dark:text-zinc-400">
                {formatFullDate(email.date)}
              </span>
            </div>
            <Text className="mt-0.5 !text-xs">
              To: {email.to.map((r) => r.name || r.email).join(', ')}
            </Text>
          </div>
        </div>

        <Divider soft className="my-6" />

        <div className="whitespace-pre-wrap text-sm/6 text-zinc-700 dark:text-zinc-300">
          {email.body}
        </div>
      </div>

      <Divider />

      {/* Quick reply */}
      <div className="px-6 py-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Reply to this message..."
            className="flex-1 rounded-lg border border-zinc-950/10 bg-transparent px-3 py-2 text-sm text-zinc-950 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-white/10 dark:text-white dark:placeholder:text-zinc-400"
          />
          <Button color="sky">Send</Button>
        </div>
      </div>
    </div>
  );
}
