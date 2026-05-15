import React from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { cn } from '../../lib/utils';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  minHeight?: string;
  className?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Įveskite tekstą...',
  disabled = false,
  minHeight = '150px',
  className
}) => {
  const modules = {
    toolbar: [
      ['bold', 'italic', 'underline'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link'],
      ['clean']
    ],
  };

  const formats = [
    'bold',
    'italic',
    'underline',
    'list',
    'link',
  ];

  return (
    <div className={cn("quill-editor-container", className)}>
      <style>{`
        .quill-editor-container .ql-editor {
          min-height: ${minHeight};
          font-size: 14px;
          line-height: 1.6;
        }
        .quill-editor-container .ql-toolbar {
          border-top-left-radius: 8px;
          border-top-right-radius: 8px;
          background: #f8fafc;
          padding: 8px;
          border-color: #e2e8f0;
        }
        .quill-editor-container .ql-container {
          border-bottom-left-radius: 8px;
          border-bottom-right-radius: 8px;
          background: white;
          border-color: #e2e8f0;
          font-family: inherit;
        }
        .quill-editor-container .ql-snow.ql-toolbar button:hover,
        .quill-editor-container .ql-snow .ql-toolbar button:hover {
          color: #84cc16;
        }
        .quill-editor-container .ql-snow.ql-toolbar button.ql-active,
        .quill-editor-container .ql-snow .ql-toolbar button.ql-active {
          color: #84cc16;
        }
      `}</style>
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        readOnly={disabled}
      />
    </div>
  );
};
