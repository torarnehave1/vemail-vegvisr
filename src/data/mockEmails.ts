export type Email = {
  id: string;
  from: { name: string; email: string; avatar?: string };
  to: { name: string; email: string }[];
  subject: string;
  preview: string;
  body: string;
  date: string;
  read: boolean;
  starred: boolean;
  folder: string;
  labels?: string[];
};

export type Folder = {
  key: string;
  label: string;
  icon: string;
  count?: number;
};

export const folders: Folder[] = [
  { key: 'inbox', label: 'Inbox', icon: 'inbox', count: 3 },
  { key: 'sent', label: 'Sent', icon: 'send' },
  { key: 'drafts', label: 'Drafts', icon: 'file-edit', count: 1 },
  { key: 'starred', label: 'Starred', icon: 'star' },
  { key: 'archive', label: 'Archive', icon: 'archive' },
  { key: 'trash', label: 'Trash', icon: 'trash-2' },
];

export const emails: Email[] = [
  {
    id: '1',
    from: { name: 'Tor Arne Have', email: 'tor@vegvisr.org' },
    to: [{ name: 'Team', email: 'team@vegvisr.org' }],
    subject: 'Knowledge Graph v2 Release',
    preview: 'Hi team, the new knowledge graph version is ready for testing. We have added version history...',
    body: `Hi team,

The new knowledge graph version is ready for testing. We have added version history support, which allows users to browse and restore previous versions of their graphs.

Key changes:
- Version dropdown in the status bar
- History API integration
- Restore functionality for previous versions

Please test and let me know if you find any issues.

Best regards,
Tor Arne`,
    date: '2026-02-09T10:30:00Z',
    read: false,
    starred: true,
    folder: 'inbox',
    labels: ['product'],
  },
  {
    id: '2',
    from: { name: 'Erica Svensson', email: 'erica@vegvisr.org' },
    to: [{ name: 'Tor Arne Have', email: 'tor@vegvisr.org' }],
    subject: 'Design review for vemail UI',
    preview: 'I reviewed the Catalyst components and think the sidebar layout works well for the email client...',
    body: `Hi Tor Arne,

I reviewed the Catalyst components and think the sidebar layout works well for the email client. Here are my notes:

1. The three-panel layout (sidebar, list, content) is the right approach
2. We should keep the dark mode option from the start
3. Badge colors work great for labels

Let me know when you have a prototype ready for review.

Cheers,
Erica`,
    date: '2026-02-09T09:15:00Z',
    read: false,
    starred: false,
    folder: 'inbox',
    labels: ['design'],
  },
  {
    id: '3',
    from: { name: 'GitHub', email: 'noreply@github.com' },
    to: [{ name: 'Tor Arne Have', email: 'tor@vegvisr.org' }],
    subject: '[vegvisr-frontend] Pull request #42: Fix role loading',
    preview: 'torarnehave merged pull request #42 into main. The role loading fix has been deployed...',
    body: `torarnehave merged pull request #42 into main.

Fix role loading after cross-domain login

The role loading fix has been deployed to production. Users should now correctly see their admin dashboard after logging in through login.vegvisr.org.

Changes:
- Added /get-role fallback in userStore.js
- Fixed cross-domain localStorage isolation issue

View on GitHub: https://github.com/vegvisr/vegvisr-frontend/pull/42`,
    date: '2026-02-08T16:45:00Z',
    read: true,
    starred: false,
    folder: 'inbox',
    labels: ['github'],
  },
  {
    id: '4',
    from: { name: 'Cloudflare', email: 'notifications@cloudflare.com' },
    to: [{ name: 'Tor Arne Have', email: 'tor@vegvisr.org' }],
    subject: 'Pages deployment successful: vemail-vegvisr',
    preview: 'Your Cloudflare Pages project vemail-vegvisr has been deployed successfully to vemail.vegvisr.org...',
    body: `Your Cloudflare Pages project vemail-vegvisr has been deployed successfully.

Project: vemail-vegvisr
Branch: main
URL: https://vemail.vegvisr.org
Status: Success
Build time: 12s

View deployment details in the Cloudflare Dashboard.`,
    date: '2026-02-08T14:20:00Z',
    read: true,
    starred: false,
    folder: 'inbox',
  },
  {
    id: '5',
    from: { name: 'Tor Arne Have', email: 'tor@vegvisr.org' },
    to: [{ name: 'Erica Svensson', email: 'erica@vegvisr.org' }],
    subject: 'Re: Design review for vemail UI',
    preview: 'Thanks for the review Erica. I agree with all your points. Starting the implementation now...',
    body: `Thanks for the review Erica. I agree with all your points. Starting the implementation now with the Catalyst components as a base.

Will share a prototype by end of day.

- Tor Arne`,
    date: '2026-02-09T11:00:00Z',
    read: true,
    starred: false,
    folder: 'sent',
  },
  {
    id: '6',
    from: { name: 'Tor Arne Have', email: 'tor@vegvisr.org' },
    to: [{ name: 'Team', email: 'team@vegvisr.org' }],
    subject: 'Weekly standup notes',
    preview: 'Draft of this week\'s standup notes...',
    body: `Weekly standup notes - Week 6

Done:
- Knowledge graph version history
- Login role fix
- vemail-vegvisr scaffolded

In progress:
- Email client UI
- Yext template imports`,
    date: '2026-02-09T08:00:00Z',
    read: true,
    starred: false,
    folder: 'drafts',
  },
];
