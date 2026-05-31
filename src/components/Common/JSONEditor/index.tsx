'use client';
import dynamic from 'next/dynamic';
import { useId } from 'react';

const AceEditor = dynamic(
  async () => {
    await import('ace-builds/src-noconflict/ace');
    await import('ace-builds/src-noconflict/ext-language_tools');
    await import('ace-builds/src-noconflict/mode-json');
    await import('ace-builds/src-noconflict/theme-twilight');
    return import('react-ace');
  },
  {
    ssr: false,
    loading: () => (
      <div className="h-60 w-full animate-pulse rounded-md bg-base-100" />
    ),
  }
);

type JSONEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  minLines?: number;
  maxLines?: number;
  fontSize?: number;
};

const JSON_EDITOR_OPTIONS = {
  enableBasicAutocompletion: true,
  tabSize: 2,
  useWorker: false,
  showLineNumbers: true,
};

const JSONEditor = ({
  value,
  onChange,
  placeholder,
  readOnly = false,
  minLines = 16,
  maxLines = 40,
  fontSize = 14,
}: JSONEditorProps) => {
  const id = useId();
  return (
    <AceEditor
      name={id}
      mode="json"
      theme="twilight"
      value={value}
      placeholder={placeholder}
      onChange={onChange}
      readOnly={readOnly}
      width="100%"
      minLines={minLines}
      maxLines={maxLines}
      fontSize={fontSize}
      showPrintMargin={false}
      setOptions={JSON_EDITOR_OPTIONS}
      className="rounded-md border border-primary "
    />
  );
};

export default JSONEditor;
