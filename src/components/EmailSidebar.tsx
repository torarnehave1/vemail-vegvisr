import {
  Sidebar,
  SidebarBody,
  SidebarHeader,
  SidebarItem,
  SidebarLabel,
  SidebarSection,
  SidebarSpacer,
  SidebarFooter,
} from './catalyst/sidebar';
import { Avatar } from './catalyst/avatar';
import { Button } from './catalyst/button';
import {
  Inbox,
  Send,
  FileEdit,
  Star,
  Archive,
  Trash2,
  Mail,
  Settings,
  HelpCircle,
  Plus,
  type LucideIcon,
} from 'lucide-react';
import type { Folder } from '../data/mockEmails';
import type { AuthUser } from '../lib/auth';

const iconMap: Record<string, LucideIcon> = {
  inbox: Inbox,
  send: Send,
  'file-edit': FileEdit,
  star: Star,
  archive: Archive,
  'trash-2': Trash2,
};

type Props = {
  folders: Folder[];
  activeFolder: string;
  onFolderChange: (key: string) => void;
  onCompose: () => void;
  onSettings: () => void;
  settingsActive?: boolean;
  user: AuthUser | null;
};

export function EmailSidebar({ folders, activeFolder, onFolderChange, onCompose, onSettings, settingsActive, user }: Props) {
  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarItem>
          <Mail className="size-5 text-sky-500" data-slot="icon" />
          <SidebarLabel>Vegvisr Email</SidebarLabel>
        </SidebarItem>
        <Button color="sky" className="mt-2 w-full" onClick={onCompose}>
          <Plus className="size-4" data-slot="icon" />
          Compose
        </Button>
      </SidebarHeader>

      <SidebarBody>
        <SidebarSection>
          {folders.map((folder) => {
            const Icon = iconMap[folder.icon] || Inbox;
            return (
              <SidebarItem
                key={folder.key}
                current={activeFolder === folder.key}
                onClick={() => onFolderChange(folder.key)}
              >
                <Icon data-slot="icon" />
                <SidebarLabel>{folder.label}</SidebarLabel>
                {folder.count != null && folder.count > 0 && (
                  <span className="ml-auto rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300">
                    {folder.count}
                  </span>
                )}
              </SidebarItem>
            );
          })}
        </SidebarSection>

        <SidebarSpacer />

        <SidebarSection>
          <SidebarItem>
            <HelpCircle data-slot="icon" />
            <SidebarLabel>Support</SidebarLabel>
          </SidebarItem>
          <SidebarItem current={settingsActive} onClick={onSettings}>
            <Settings data-slot="icon" />
            <SidebarLabel>Settings</SidebarLabel>
          </SidebarItem>
        </SidebarSection>
      </SidebarBody>

      {user && (
        <SidebarFooter>
          <SidebarItem>
            <Avatar
              initials={user.email.slice(0, 2).toUpperCase()}
              className="size-8 bg-zinc-900 text-white dark:bg-zinc-600"
              square
            />
            <span className="flex min-w-0 flex-col">
              <span className="block truncate text-sm/5 font-medium text-zinc-950 dark:text-white">
                {user.email.split('@')[0]}
              </span>
              <span className="block truncate text-xs/5 font-normal text-zinc-500 dark:text-zinc-400">
                {user.email}
              </span>
            </span>
          </SidebarItem>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
