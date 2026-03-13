'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';

// Cargar Monaco Editor dinámicamente (solo en cliente)
const Editor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-gray-900 rounded-lg">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    </div>
  )
});

export default function PromptEditor({
  value,
  onChange,
  campos = [],
  height = '400px',
  placeholder = 'Escribe aquí el prompt...'
}) {
  const editorRef = useRef(null);
  const [isEditorReady, setIsEditorReady] = useState(false);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    setIsEditorReady(true);

    // Registrar lenguaje personalizado para resaltar variables {{campo}}
    monaco.languages.register({ id: 'prompt' });

    monaco.languages.setMonarchTokensProvider('prompt', {
      tokenizer: {
        root: [
          [/\{\{[^}]+\}\}/, 'variable'],
          [/[A-Z][A-Z0-9_]+:/, 'keyword'],
          [/#.*$/, 'comment'],
          [/"[^"]*"/, 'string'],
          [/'[^']*'/, 'string'],
        ]
      }
    });

    // Definir tema personalizado estilo VS Code Dark
    monaco.editor.defineTheme('promptTheme', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'variable', foreground: '4FC1FF', fontStyle: 'bold' },
        { token: 'keyword', foreground: 'C586C0' },
        { token: 'comment', foreground: '6A9955' },
        { token: 'string', foreground: 'CE9178' },
      ],
      colors: {
        'editor.background': '#1e1e1e',
        'editor.foreground': '#d4d4d4',
        'editorLineNumber.foreground': '#858585',
        'editorLineNumber.activeForeground': '#c6c6c6',
        'editor.lineHighlightBackground': '#2a2d2e',
        'editorCursor.foreground': '#ffffff',
        'editor.selectionBackground': '#264f78',
      }
    });

    monaco.editor.setTheme('promptTheme');

    // Autocompletado para variables
    monaco.languages.registerCompletionItemProvider('prompt', {
      triggerCharacters: ['{'],
      provideCompletionItems: (model, position) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn
        };

        const suggestions = campos.map(campo => ({
          label: `{{${campo.nombre_campo}}}`,
          kind: monaco.languages.CompletionItemKind.Variable,
          insertText: `{{${campo.nombre_campo}}}`,
          detail: campo.etiqueta || campo.nombre_campo,
          range: range
        }));

        return { suggestions };
      }
    });
  };

  // Insertar campo en la posición actual del cursor
  const insertCampo = (campo) => {
    if (!editorRef.current) return;

    const editor = editorRef.current;
    const position = editor.getPosition();
    const variable = `{{${campo.nombre_campo}}}`;

    editor.executeEdits('insert-variable', [{
      range: {
        startLineNumber: position.lineNumber,
        startColumn: position.column,
        endLineNumber: position.lineNumber,
        endColumn: position.column
      },
      text: variable
    }]);

    // Mover cursor después de la variable insertada
    editor.setPosition({
      lineNumber: position.lineNumber,
      column: position.column + variable.length
    });
    editor.focus();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Barra de herramientas con campos disponibles */}
      {campos.length > 0 && (
        <div className="bg-gray-800 border border-gray-700 rounded-t-lg p-2 flex flex-wrap gap-1">
          <span className="text-xs text-gray-400 mr-2 self-center">Insertar variable:</span>
          {campos.map((campo) => (
            <button
              key={campo.nombre_campo || campo.id}
              type="button"
              onClick={() => insertCampo(campo)}
              className="px-2 py-1 text-xs rounded bg-blue-600/30 border border-blue-500/50 text-blue-300 hover:bg-blue-600/50 transition-colors"
              title={campo.etiqueta || campo.nombre_campo}
            >
              {`{{${campo.nombre_campo}}}`}
            </button>
          ))}
        </div>
      )}

      {/* Editor Monaco */}
      <div
        className={`flex-1 border border-gray-700 ${campos.length > 0 ? 'rounded-b-lg border-t-0' : 'rounded-lg'} overflow-hidden`}
        style={{ minHeight: height }}
      >
        <Editor
          height="100%"
          language="prompt"
          theme="promptTheme"
          value={value}
          onChange={onChange}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            wordWrap: 'on',
            automaticLayout: true,
            scrollBeyondLastLine: false,
            padding: { top: 10, bottom: 10 },
            renderLineHighlight: 'all',
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            smoothScrolling: true,
            tabSize: 2,
            fontFamily: "'Fira Code', 'Cascadia Code', 'JetBrains Mono', Consolas, monospace",
            fontLigatures: true,
            bracketPairColorization: { enabled: true },
            guides: {
              bracketPairs: true,
              indentation: true
            },
            placeholder: placeholder,
          }}
          onMount={handleEditorDidMount}
        />
      </div>

      {/* Barra de estado inferior */}
      <div className="bg-gray-800 border border-gray-700 border-t-0 rounded-b-lg px-3 py-1 flex justify-between text-xs text-gray-500">
        <span>Prompt Editor</span>
        <span>{value?.length || 0} caracteres</span>
      </div>
    </div>
  );
}
