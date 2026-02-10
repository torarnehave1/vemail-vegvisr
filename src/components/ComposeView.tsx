import { useState, useRef, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import UnderlineExt from '@tiptap/extension-underline';
import LinkExt from '@tiptap/extension-link';
import ImageExt from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { InputRule } from '@tiptap/core';
import { Button } from './catalyst/button';
import { Divider } from './catalyst/divider';
import {
  Send,
  Paperclip,
  X,
  ChevronDown,
  ChevronUp,
  Trash2,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link,
  Code,
  Heading2,
  Quote,
  Undo2,
  Redo2,
  FileCode2,
  Eye,
  ImageIcon,
} from 'lucide-react';

type Props = {
  onClose: () => void;
  onSend: (email: {
    to: string;
    cc: string;
    bcc: string;
    subject: string;
    body: string;
    bodyHtml: string;
    attachments: File[];
  }) => void;
};

export function ComposeView({ onClose, onSend }: Props) {
  const [to, setTo] = useState('');
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [subject, setSubject] = useState('');
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [viewMode, setViewMode] = useState<'rich' | 'html'>('rich');
  const [htmlSource, setHtmlSource] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Custom input rule: ![alt](url) → image node
  const markdownImageRule = new InputRule({
    find: /!\[([^\]]*)\]\(([^)]+)\)\s$/,
    handler: ({ state, range, match }) => {
      const alt = match[1] ?? '';
      const src = match[2] ?? '';
      const { tr } = state;
      const node = state.schema.nodes.image.create({ src, alt });
      tr.replaceWith(range.from, range.to, node);
    },
  });

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      UnderlineExt,
      LinkExt.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'text-sky-600 underline' },
      }),
      ImageExt.configure({
        inline: false,
        allowBase64: true,
        HTMLAttributes: { class: 'compose-img' },
      }).extend({
        addInputRules() {
          return [markdownImageRule];
        },
      }),
      Placeholder.configure({
        placeholder: 'Write your message... (supports markdown shortcuts)',
      }),
    ],
    editorProps: {
      attributes: {
        class:
          'prose prose-sm prose-zinc max-w-none h-full focus:outline-none',
      },
    },
  });

  const handleAttach = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
    e.target.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSend = () => {
    const bodyHtml = editor?.getHTML() ?? '';
    const body = editor?.getText() ?? '';
    onSend({ to, cc, bcc, subject, body, bodyHtml, attachments });
  };

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const insertImage = useCallback(() => {
    if (!editor) return;
    const url = window.prompt('Enter image URL:');
    if (url) {
      const alt = window.prompt('Alt text (optional):') ?? '';
      editor.chain().focus().setImage({ src: url, alt }).run();
    }
  }, [editor]);

  const toggleLink = useCallback(() => {
    if (!editor) return;
    if (editor.isActive('link')) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    const url = window.prompt('Enter URL:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  }, [editor]);

  const switchToHtml = () => {
    if (editor) {
      setHtmlSource(editor.getHTML());
    }
    setViewMode('html');
  };

  const switchToRich = () => {
    if (editor && htmlSource) {
      editor.commands.setContent(htmlSource);
    }
    setViewMode('rich');
  };

  const ToolbarBtn = ({
    onClick,
    active,
    children,
    title,
  }: {
    onClick: () => void;
    active?: boolean;
    children: React.ReactNode;
    title?: string;
  }) => (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`rounded p-1.5 transition-colors ${
        active
          ? 'bg-zinc-200 text-zinc-900'
          : 'text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600'
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3">
        <h2 className="text-base font-semibold text-zinc-950">New Message</h2>
        <div className="flex items-center gap-1">
          <Button plain onClick={onClose}>
            <X className="size-4" data-slot="icon" />
          </Button>
        </div>
      </div>

      <Divider />

      {/* Recipient fields */}
      <div className="space-y-0 px-6">
        {/* To */}
        <div className="flex items-center border-b border-zinc-950/5 py-2">
          <label className="w-12 shrink-0 text-sm text-zinc-500">To</label>
          <input
            type="text"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="recipient@example.com"
            className="flex-1 bg-transparent text-sm text-zinc-950 placeholder:text-zinc-400 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setShowCcBcc(!showCcBcc)}
            className="ml-2 flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-600"
          >
            CC/BCC
            {showCcBcc ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
          </button>
        </div>

        {/* CC / BCC */}
        {showCcBcc && (
          <>
            <div className="flex items-center border-b border-zinc-950/5 py-2">
              <label className="w-12 shrink-0 text-sm text-zinc-500">CC</label>
              <input
                type="text"
                value={cc}
                onChange={(e) => setCc(e.target.value)}
                placeholder="cc@example.com"
                className="flex-1 bg-transparent text-sm text-zinc-950 placeholder:text-zinc-400 focus:outline-none"
              />
            </div>

            <div className="flex items-center border-b border-zinc-950/5 py-2">
              <label className="w-12 shrink-0 text-sm text-zinc-500">BCC</label>
              <input
                type="text"
                value={bcc}
                onChange={(e) => setBcc(e.target.value)}
                placeholder="bcc@example.com"
                className="flex-1 bg-transparent text-sm text-zinc-950 placeholder:text-zinc-400 focus:outline-none"
              />
            </div>
          </>
        )}

        {/* Subject */}
        <div className="flex items-center border-b border-zinc-950/5 py-2">
          <label className="w-12 shrink-0 text-sm text-zinc-500">Subj</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject"
            className="flex-1 bg-transparent text-sm font-medium text-zinc-950 placeholder:text-zinc-400 focus:outline-none"
          />
        </div>
      </div>

      {/* Formatting toolbar */}
      <div className="flex items-center gap-0.5 border-b border-zinc-950/5 px-6 py-1.5">
        <ToolbarBtn
          title="Bold (Ctrl+B)"
          onClick={() => editor?.chain().focus().toggleBold().run()}
          active={editor?.isActive('bold')}
        >
          <Bold className="size-4" />
        </ToolbarBtn>
        <ToolbarBtn
          title="Italic (Ctrl+I)"
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          active={editor?.isActive('italic')}
        >
          <Italic className="size-4" />
        </ToolbarBtn>
        <ToolbarBtn
          title="Underline (Ctrl+U)"
          onClick={() => editor?.chain().focus().toggleUnderline().run()}
          active={editor?.isActive('underline')}
        >
          <Underline className="size-4" />
        </ToolbarBtn>

        <div className="mx-1 h-4 w-px bg-zinc-200" />

        <ToolbarBtn
          title="Heading"
          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor?.isActive('heading', { level: 2 })}
        >
          <Heading2 className="size-4" />
        </ToolbarBtn>
        <ToolbarBtn
          title="Blockquote"
          onClick={() => editor?.chain().focus().toggleBlockquote().run()}
          active={editor?.isActive('blockquote')}
        >
          <Quote className="size-4" />
        </ToolbarBtn>
        <ToolbarBtn
          title="Inline code"
          onClick={() => editor?.chain().focus().toggleCode().run()}
          active={editor?.isActive('code')}
        >
          <Code className="size-4" />
        </ToolbarBtn>

        <div className="mx-1 h-4 w-px bg-zinc-200" />

        <ToolbarBtn
          title="Bullet list"
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          active={editor?.isActive('bulletList')}
        >
          <List className="size-4" />
        </ToolbarBtn>
        <ToolbarBtn
          title="Ordered list"
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          active={editor?.isActive('orderedList')}
        >
          <ListOrdered className="size-4" />
        </ToolbarBtn>
        <ToolbarBtn
          title="Link"
          onClick={toggleLink}
          active={editor?.isActive('link')}
        >
          <Link className="size-4" />
        </ToolbarBtn>
        <ToolbarBtn
          title="Insert image (or type ![alt](url) )"
          onClick={insertImage}
        >
          <ImageIcon className="size-4" />
        </ToolbarBtn>

        <div className="mx-1 h-4 w-px bg-zinc-200" />

        <ToolbarBtn
          title="Undo"
          onClick={() => editor?.chain().focus().undo().run()}
        >
          <Undo2 className="size-4" />
        </ToolbarBtn>
        <ToolbarBtn
          title="Redo"
          onClick={() => editor?.chain().focus().redo().run()}
        >
          <Redo2 className="size-4" />
        </ToolbarBtn>

        <div className="mx-1 h-4 w-px bg-zinc-200" />

        {viewMode === 'rich' ? (
          <ToolbarBtn title="View HTML source" onClick={switchToHtml}>
            <FileCode2 className="size-4" />
          </ToolbarBtn>
        ) : (
          <ToolbarBtn title="Back to rich editor" onClick={switchToRich} active>
            <Eye className="size-4" />
          </ToolbarBtn>
        )}
      </div>

      {/* Editor body */}
      <div className="flex-1 overflow-y-auto px-6 py-3">
        {viewMode === 'rich' ? (
          <EditorContent editor={editor} className="compose-editor h-full" />
        ) : (
          <textarea
            value={htmlSource}
            onChange={(e) => setHtmlSource(e.target.value)}
            spellCheck={false}
            title="HTML source editor"
            placeholder="<p>Write HTML here...</p>"
            className="h-full w-full resize-none rounded-lg border border-zinc-200 bg-zinc-50 p-3 font-mono text-xs leading-relaxed text-zinc-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        )}
      </div>

      {/* Attachments */}
      {attachments.length > 0 && (
        <div className="border-t border-zinc-950/5 px-6 py-2">
          <div className="flex flex-wrap gap-2">
            {attachments.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs"
              >
                <Paperclip className="size-3 text-zinc-400" />
                <span className="max-w-[150px] truncate text-zinc-700">{file.name}</span>
                <span className="text-zinc-400">{formatSize(file.size)}</span>
                <button
                  type="button"
                  onClick={() => removeAttachment(index)}
                  className="ml-1 text-zinc-400 hover:text-zinc-600"
                >
                  <X className="size-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <Divider />

      {/* Action bar */}
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-2">
          <Button color="sky" onClick={handleSend}>
            <Send className="size-4" data-slot="icon" />
            Send
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
          <Button outline onClick={handleAttach}>
            <Paperclip className="size-4" data-slot="icon" />
            Attach
          </Button>
        </div>
        <Button plain onClick={onClose}>
          <Trash2 className="size-4" data-slot="icon" />
        </Button>
      </div>
    </div>
  );
}
