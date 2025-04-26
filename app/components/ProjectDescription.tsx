'use client';

import { FormLabel } from '@mui/joy';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import TextStyle from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Extension } from '@tiptap/core';
import { Button, Select, Option } from '@mui/joy';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import FormatColorTextIcon from '@mui/icons-material/FormatColorText';
import FormatSizeIcon from '@mui/icons-material/FormatSize';
import DOMPurify from 'dompurify';

interface ProjectDescriptionProps {
  projectData: any;
  setProjectData: (data: any) => void;
}

const fontSizes = [
  { value: 'small', label: 'Small', class: 'text-sm' },
  { value: 'normal', label: 'Normal', class: 'text-base' },
  { value: 'large', label: 'Large', class: 'text-lg' },
  { value: 'xl', label: 'Extra Large', class: 'text-xl' },
  { value: '2xl', label: 'Huge', class: 'text-2xl' },
];

const colors = [
  { value: '#000000', label: 'Black' },
  { value: '#374151', label: 'Dark Gray' },
  { value: '#2563eb', label: 'Blue' },
  { value: '#059669', label: 'Green' },
  { value: '#dc2626', label: 'Red' },
  { value: '#7c3aed', label: 'Purple' },
];

// Custom extension for font size
const FontSizeExtension = Extension.create({
  name: 'fontSize',

  addGlobalAttributes() {
    return [
      {
        types: ['textStyle'],
        attributes: {
          fontSize: {
            default: 'normal',
            parseHTML: element => element.classList.toString(),
            renderHTML: attributes => {
              if (!attributes.fontSize) return {};
              return { class: attributes.fontSize };
            },
          },
        },
      },
    ];
  },
});

export default function ProjectDescription({ projectData, setProjectData }: ProjectDescriptionProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link,
      Image,
      TextStyle,
      Color,
      FontSizeExtension,
    ],
    content: DOMPurify.sanitize(projectData.description),
    onUpdate: ({ editor }) => {
      const sanitizedHtml = DOMPurify.sanitize(editor.getHTML());
      setProjectData({ ...projectData, description: sanitizedHtml });
    },
    editorProps: {
      attributes: {
        class: 'prose prose-neutral w-full focus:outline-none min-h-[400px] p-4 text-gray-900',
      },
    },
  });

  if (!editor) {
    return null;
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4">
      <FormLabel className="text-lg font-medium mb-2">Popis projektu</FormLabel>
      
      <div className="border rounded-lg overflow-hidden bg-white mt-2">
        {/* Toolbar */}
        <div className="border-b p-2 bg-gray-50 flex flex-wrap gap-2 items-center">
          {/* Text Style Controls */}
          <Button
            variant="soft"
            color="neutral"
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={editor.isActive('bold') ? 'bg-gray-200' : ''}
          >
            <FormatBoldIcon />
          </Button>
          
          <Button
            variant="soft"
            color="neutral"
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={editor.isActive('italic') ? 'bg-gray-200' : ''}
          >
            <FormatItalicIcon />
          </Button>

          <div className="w-px h-6 bg-gray-300 mx-1" />

          {/* Font Size Selector */}
          <div className="flex items-center gap-1">
            <FormatSizeIcon className="text-gray-600" />
            <Select
              size="sm"
              defaultValue="normal"
              onChange={(_, value) => {
                if (value) {
                  const fontSize = fontSizes.find(size => size.value === value);
                  if (fontSize) {
                    editor.chain().focus().setMark('textStyle', { fontSize: fontSize.class }).run();
                  }
                }
              }}
            >
              {fontSizes.map((size) => (
                <Option key={size.value} value={size.value}>
                  {size.label}
                </Option>
              ))}
            </Select>
          </div>

          {/* Color Selector */}
          <div className="flex items-center gap-1">
            <FormatColorTextIcon className="text-gray-600" />
            <Select
              size="sm"
              defaultValue="#000000"
              onChange={(_, value) => {
                if (value) {
                  editor.chain().focus().setColor(value as string).run();
                }
              }}
              slotProps={{
                button: {
                  sx: {
                    '&::before': {
                      content: '""',
                      display: 'block',
                      width: '16px',
                      height: '16px',
                      borderRadius: '4px',
                      backgroundColor: editor.getAttributes('textStyle').color || '#000000',
                    },
                  },
                },
              }}
            >
              {colors.map((color) => (
                <Option 
                  key={color.value} 
                  value={color.value}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    '&::before': {
                      content: '""',
                      display: 'block',
                      width: '16px',
                      height: '16px',
                      borderRadius: '4px',
                      backgroundColor: color.value,
                    },
                  }}
                >
                  {color.label}
                </Option>
              ))}
            </Select>
          </div>

          <div className="w-px h-6 bg-gray-300 mx-1" />

          {/* List Controls */}
          <Button
            variant="soft"
            color="neutral"
            size="sm"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={editor.isActive('bulletList') ? 'bg-gray-200' : ''}
          >
            <FormatListBulletedIcon />
          </Button>

          <Button
            variant="soft"
            color="neutral"
            size="sm"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={editor.isActive('orderedList') ? 'bg-gray-200' : ''}
          >
            <FormatListNumberedIcon />
          </Button>

          <div className="w-px h-6 bg-gray-300 mx-1" />

          {/* Undo/Redo Controls */}
          <Button
            variant="soft"
            color="neutral"
            size="sm"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
          >
            <UndoIcon />
          </Button>

          <Button
            variant="soft"
            color="neutral"
            size="sm"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
          >
            <RedoIcon />
          </Button>
        </div>

        {/* Editor Content */}
        <div className="text-gray-900">
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
} 