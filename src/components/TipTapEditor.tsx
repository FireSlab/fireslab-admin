'use client';

import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import DOMPurify from 'dompurify';
import {
  Bold,
  Italic,
  Strikethrough,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Link2,
  Unlink,
  Undo,
  Redo,
} from 'lucide-react';

interface TipTapEditorProps {
  value: string;
  onChange: (sanitizedHtml: string) => void;
  placeholder?: string;
}

export default function TipTapEditor({ value, onChange, placeholder }: TipTapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-[#e07b2a] underline hover:text-[#f3954a] transition',
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
    ],
    content: value || '',
    editorProps: {
      attributes: {
        class:
          'min-h-[180px] p-4 text-sm text-neutral-200 focus:outline-none leading-relaxed prose-invert max-w-none',
      },
    },
    onUpdate: ({ editor }) => {
      const rawHtml = editor.getHTML();
      // Sanitize before emitting to parent component
      const cleanHtml = DOMPurify.sanitize(rawHtml, {
        ALLOWED_TAGS: [
          'p',
          'b',
          'i',
          'em',
          'strong',
          'a',
          'h2',
          'h3',
          'ul',
          'ol',
          'li',
          'blockquote',
          'code',
          'pre',
          'hr',
          'br',
          's',
        ],
        ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
      });
      onChange(cleanHtml);
    },
    immediatelyRender: false,
  });

  // Sync external value changes if needed (e.g. initial edit load)
  useEffect(() => {
    if (editor && value !== editor.getHTML() && !editor.isFocused) {
      editor.commands.setContent(value || '', { emitUpdate: false });
    }
  }, [value, editor]);

  if (!editor) {
    return (
      <div className="h-44 border border-neutral-800 rounded-lg bg-neutral-900/40 flex items-center justify-center text-xs text-neutral-500">
        Loading editor...
      </div>
    );
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Enter URL:', previousUrl);

    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <div className="border border-neutral-800 rounded-lg bg-neutral-900/60 overflow-hidden focus-within:border-[#2d6a35] focus-within:ring-1 focus-within:ring-[#2d6a35] transition">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-[#0c100e] border-b border-neutral-800/80 text-neutral-300">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          className={`p-1.5 rounded text-xs transition ${
            editor.isActive('bold')
              ? 'bg-[#2d6a35] text-white'
              : 'hover:bg-neutral-800 hover:text-white text-neutral-400'
          }`}
          title="Bold"
        >
          <Bold className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded text-xs transition ${
            editor.isActive('italic')
              ? 'bg-[#2d6a35] text-white'
              : 'hover:bg-neutral-800 hover:text-white text-neutral-400'
          }`}
          title="Italic"
        >
          <Italic className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          disabled={!editor.can().chain().focus().toggleStrike().run()}
          className={`p-1.5 rounded text-xs transition ${
            editor.isActive('strike')
              ? 'bg-[#2d6a35] text-white'
              : 'hover:bg-neutral-800 hover:text-white text-neutral-400'
          }`}
          title="Strike"
        >
          <Strikethrough className="w-3.5 h-3.5" />
        </button>

        <div className="w-px h-4 bg-neutral-800 mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`px-2 py-1 rounded text-xs font-semibold transition ${
            editor.isActive('heading', { level: 2 })
              ? 'bg-[#2d6a35] text-white'
              : 'hover:bg-neutral-800 hover:text-white text-neutral-400'
          }`}
          title="Heading 2"
        >
          <Heading2 className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`px-2 py-1 rounded text-xs font-semibold transition ${
            editor.isActive('heading', { level: 3 })
              ? 'bg-[#2d6a35] text-white'
              : 'hover:bg-neutral-800 hover:text-white text-neutral-400'
          }`}
          title="Heading 3"
        >
          <Heading3 className="w-3.5 h-3.5" />
        </button>

        <div className="w-px h-4 bg-neutral-800 mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded text-xs transition ${
            editor.isActive('bulletList')
              ? 'bg-[#2d6a35] text-white'
              : 'hover:bg-neutral-800 hover:text-white text-neutral-400'
          }`}
          title="Bullet List"
        >
          <List className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 rounded text-xs transition ${
            editor.isActive('orderedList')
              ? 'bg-[#2d6a35] text-white'
              : 'hover:bg-neutral-800 hover:text-white text-neutral-400'
          }`}
          title="Numbered List"
        >
          <ListOrdered className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-1.5 rounded text-xs transition ${
            editor.isActive('blockquote')
              ? 'bg-[#2d6a35] text-white'
              : 'hover:bg-neutral-800 hover:text-white text-neutral-400'
          }`}
          title="Blockquote"
        >
          <Quote className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={`p-1.5 rounded text-xs transition ${
            editor.isActive('code')
              ? 'bg-[#2d6a35] text-white'
              : 'hover:bg-neutral-800 hover:text-white text-neutral-400'
          }`}
          title="Inline Code"
        >
          <Code className="w-3.5 h-3.5" />
        </button>

        <div className="w-px h-4 bg-neutral-800 mx-1" />

        <button
          type="button"
          onClick={setLink}
          className={`p-1.5 rounded text-xs transition ${
            editor.isActive('link')
              ? 'bg-[#2d6a35] text-white'
              : 'hover:bg-neutral-800 hover:text-white text-neutral-400'
          }`}
          title="Insert Link"
        >
          <Link2 className="w-3.5 h-3.5" />
        </button>

        {editor.isActive('link') && (
          <button
            type="button"
            onClick={() => editor.chain().focus().unsetLink().run()}
            className="p-1.5 rounded text-xs hover:bg-neutral-800 text-neutral-400 hover:text-white transition"
            title="Remove Link"
          >
            <Unlink className="w-3.5 h-3.5" />
          </button>
        )}

        <div className="w-px h-4 bg-neutral-800 mx-1 ml-auto" />

        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="p-1.5 rounded text-xs hover:bg-neutral-800 text-neutral-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
          title="Undo"
        >
          <Undo className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="p-1.5 rounded text-xs hover:bg-neutral-800 text-neutral-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
          title="Redo"
        >
          <Redo className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Editor Body */}
      <EditorContent editor={editor} />
    </div>
  );
}
