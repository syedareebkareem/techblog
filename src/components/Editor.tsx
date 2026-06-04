// src/components/Editor.tsx
"use client";

import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";

import { Editor as TiptapEditor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { TextAlign } from "@tiptap/extension-text-align";

// 1. New Typography Imports
import { FontFamily } from "@tiptap/extension-font-family";
import { Highlight } from "@tiptap/extension-highlight";
import { Subscript } from "@tiptap/extension-subscript";
import { Superscript } from "@tiptap/extension-superscript";

// Custom Engines
import { FontSize } from "./FontSize";
import { LineHeight } from "./LineHeight";
import styles from "./Editor.module.css";

interface EditorProps {
  content: string;
  onChange: (content: string) => void;
}

export default function Editor({ content, onChange }: EditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      FontSize,
      LineHeight,
      // 2. Register the new plugins
      FontFamily,
      Highlight.configure({ multicolor: true }),
      Subscript,
      Superscript,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Link.configure({ openOnClick: false }),
    ],
    content: content,
    immediatelyRender: false,
    onUpdate: ({ editor }: { editor: TiptapEditor }) => {
      onChange(editor.getHTML());
    },
  });

  // NEW: Force the editor to update if the parent component changes the content (e.g., clicking "Edit" on a post)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) {
    return (
      <div className={styles.editorContainer} style={{ padding: "1.5rem" }}>
        Loading Editor Engine...
      </div>
    );
  }

  const getBtnClass = (isActive: boolean) =>
    isActive ? `${styles.toolbarBtn} ${styles.activeBtn}` : styles.toolbarBtn;

  return (
    <div className={styles.editorContainer}>
      {/* TOOLBAR */}
      <div className={styles.toolbar}>
        {/* FONT FAMILY DROPDOWN */}
        <select
          onChange={(e) =>
            editor.chain().focus().setFontFamily(e.target.value).run()
          }
          value={editor.getAttributes("textStyle").fontFamily || ""}
          className="border border-slate-300 rounded-md px-2 py-1 text-sm bg-white text-slate-700 cursor-pointer focus:outline-none focus:border-emerald-500"
        >
          <option value="">Font</option>
          <option value="Inter">Inter</option>
          <option value="Arial">Arial</option>
          <option value="Georgia">Georgia</option>
          <option value="Courier New">Courier</option>
        </select>

        {/* FONT SIZE DROPDOWN */}
        <select
          onChange={(e) =>
            editor.chain().focus().setFontSize(e.target.value).run()
          }
          value={editor.getAttributes("textStyle").fontSize || ""}
          className="border border-slate-300 rounded-md px-2 py-1 text-sm bg-white text-slate-700 cursor-pointer focus:outline-none focus:border-emerald-500"
        >
          <option value="">Size</option>
          <option value="12px">12px</option>
          <option value="14px">14px</option>
          <option value="16px">16px</option>
          <option value="18px">18px</option>
          <option value="24px">24px</option>
          <option value="32px">32px</option>
        </select>

        <div className={styles.divider}></div>

        {/* TEXT STYLES */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={getBtnClass(editor.isActive("bold"))}
          style={{ fontWeight: "bold" }}
        >
          B
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={getBtnClass(editor.isActive("italic"))}
          style={{ fontStyle: "italic" }}
        >
          I
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={getBtnClass(editor.isActive("underline"))}
          style={{ textDecoration: "underline" }}
        >
          U
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={getBtnClass(editor.isActive("strike"))}
          style={{ textDecoration: "line-through" }}
        >
          S
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          className={getBtnClass(editor.isActive("highlight"))}
          style={{ backgroundColor: "#FEF08A" }}
        >
          Hi
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleSubscript().run()}
          className={getBtnClass(editor.isActive("subscript"))}
        >
          X₂
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleSuperscript().run()}
          className={getBtnClass(editor.isActive("superscript"))}
        >
          X²
        </button>

        <div className={styles.divider}></div>

        {/* TEXT COLOR PICKER */}
        <input
          type="color"
          onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
            editor.chain().focus().setColor(event.target.value).run()
          }
          value={editor.getAttributes("textStyle").color || "#0F172A"}
          className={styles.colorPicker}
          title="Text Color"
        />

        {/* HIGHLIGHT COLOR PICKER */}
        <input
          type="color"
          onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
            editor
              .chain()
              .focus()
              .toggleHighlight({ color: event.target.value })
              .run()
          }
          value={editor.getAttributes("highlight").color || "#FEF08A"}
          className={styles.colorPicker}
          title="Highlight Color"
        />

        <div className={styles.divider}></div>

        {/* HEADINGS */}
        <button
          type="button"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          className={getBtnClass(editor.isActive("heading", { level: 1 }))}
        >
          H1
        </button>
        <button
          type="button"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          className={getBtnClass(editor.isActive("heading", { level: 2 }))}
        >
          H2
        </button>
        <button
          type="button"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          className={getBtnClass(editor.isActive("heading", { level: 3 }))}
        >
          H3
        </button>

        <div className={styles.divider}></div>

        {/* ALIGNMENT */}
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          className={getBtnClass(editor.isActive({ textAlign: "left" }))}
        >
          Left
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          className={getBtnClass(editor.isActive({ textAlign: "center" }))}
        >
          Center
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          className={getBtnClass(editor.isActive({ textAlign: "right" }))}
        >
          Right
        </button>

        <div className={styles.divider}></div>

        {/* LINE SPACING DROPDOWN */}
        <select
          onChange={(e) =>
            editor.chain().focus().setLineHeight(e.target.value).run()
          }
          className="border border-slate-300 rounded-md px-2 py-1 text-sm bg-white text-slate-700 cursor-pointer focus:outline-none focus:border-emerald-500"
          title="Line Spacing"
        >
          <option value="">Spacing</option>
          <option value="1">1.0</option>
          <option value="1.15">1.15</option>
          <option value="1.5">1.5</option>
          <option value="2">2.0</option>
        </select>

        <div className={styles.divider}></div>

        {/* LISTS & QUOTES */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={getBtnClass(editor.isActive("bulletList"))}
        >
          • List
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={getBtnClass(editor.isActive("orderedList"))}
        >
          1. List
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={getBtnClass(editor.isActive("blockquote"))}
        >
          &quot; Quote
        </button>
      </div>

      {/* TEXT AREA */}
      <div className={styles.textArea} onClick={() => editor.commands.focus()}>
        <EditorContent editor={editor} />
      </div>

      {/* TIPTAP BASE STYLES */}
      <style jsx global>{`
        .ProseMirror:focus {
          outline: none;
        }
        .ProseMirror h1 {
          font-size: 2.25rem;
          font-weight: 800;
          margin-top: 1.5rem;
          margin-bottom: 1rem;
          color: #0f172a;
          line-height: 1.2;
        }
        .ProseMirror h2 {
          font-size: 1.5rem;
          font-weight: 700;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
          color: #0f172a;
          line-height: 1.3;
        }
        .ProseMirror h3 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-top: 1.25rem;
          margin-bottom: 0.5rem;
          color: #1e293b;
        }
        .ProseMirror p {
          margin-top: 0;
          margin-bottom: 0.75rem;
          line-height: 1.6;
          color: #334155;
        }
        .ProseMirror ul {
          list-style-type: disc;
          padding-left: 1.5rem;
          margin-bottom: 1rem;
        }
        .ProseMirror ol {
          list-style-type: decimal;
          padding-left: 1.5rem;
          margin-bottom: 1rem;
        }
        .ProseMirror blockquote {
          border-left: 4px solid #10b981;
          padding-left: 1rem;
          font-style: italic;
          color: #475569;
          margin: 1.5rem 0;
          background: #f8fafc;
          padding: 1rem;
          border-radius: 0 0.375rem 0.375rem 0;
        }
        .ProseMirror mark {
          background-color: #fef08a;
          border-radius: 0.25rem;
          padding: 0.125rem 0;
        }
      `}</style>
    </div>
  );
}
