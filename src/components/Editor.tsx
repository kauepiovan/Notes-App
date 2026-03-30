import React, { useEffect, useState, useRef } from 'react';
import MDEditor from '@uiw/react-md-editor';
import { readTextFile, writeTextFile, remove } from '@tauri-apps/plugin-fs';
import { confirm } from '@tauri-apps/plugin-dialog';
import { useAppStore } from '../store/useAppStore';
import { FileEdit, CheckCircle2, Loader2 } from 'lucide-react';

type SaveState = 'saved' | 'saving' | 'unsaved';

export function Editor() {
  const { activeFilePath, activeFile, setActiveFile, triggerRefresh } = useAppStore();
  const [content, setContent] = useState('');
  const [saveState, setSaveState] = useState<SaveState>('saved');
  const saveTimeout = useRef<number | null>(null);
  const pathRef = useRef<string | null>(null);

  useEffect(() => { pathRef.current = activeFilePath; }, [activeFilePath]);

  // Load file when selection changes
  useEffect(() => {
    if (!activeFilePath) {
      setContent('');
      setSaveState('saved');
      return;
    }
    readTextFile(activeFilePath)
      .then((text) => { setContent(text); setSaveState('saved'); })
      .catch((err) => { console.error('Failed to read file:', err); setContent(''); });
  }, [activeFilePath]);

  const handleChange = (value?: string) => {
    const val = value ?? '';
    setContent(val);
    setSaveState('unsaved');

    if (saveTimeout.current) window.clearTimeout(saveTimeout.current);
    saveTimeout.current = window.setTimeout(async () => {
      const path = pathRef.current;
      if (!path) return;
      setSaveState('saving');
      try {
        await writeTextFile(path, val);
        setSaveState('saved');
      } catch (err) {
        console.error('Failed to save file:', err);
        setSaveState('unsaved');
      }
    }, 800);
  };

  const handleDelete = async () => {
    if (!activeFilePath) return;
    const ok = await confirm(
      `Apagar "${activeFile?.replace(/\.md$/, '')}" permanentemente?`,
      { title: 'Confirmar exclusão', kind: 'warning' }
    );
    if (ok) {
      try {
        await remove(activeFilePath);
        setActiveFile(null, null);
        triggerRefresh();
      } catch (err) {
        console.error('Failed to delete file:', err);
      }
    }
  };

  if (!activeFilePath) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', gap: 12 }}>
        <div style={{ fontSize: '2.6rem' }}><FileEdit className="ui-icon" strokeWidth={1.2} /></div>
        <p style={{ margin: 0, fontSize: '1rem' }}>Selecione ou crie uma nota</p>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', minWidth: 0 } as React.CSSProperties}>
      {/* Toolbar */}
      <div className="editor-toolbar">
        <span className="editor-title">{activeFile?.replace(/\.md$/, '') ?? 'Sem título'}</span>

        <div className="toolbar-actions">
          <span className="save-indicator">
            {saveState === 'saving' && (
              <span className="saving"><Loader2 className="ui-icon" style={{ width: '0.85em', animation: 'spin 1s linear infinite' }} /> Salvando...</span>
            )}
            {saveState === 'saved' && (
              <span className="saved"><CheckCircle2 className="ui-icon" style={{ width: '0.9em' }} /> Salvo</span>
            )}
            {saveState === 'unsaved' && (
              <span className="unsaved">● Não salvo</span>
            )}
          </span>

          {/* Delete moved to file tree context menu; toolbar button removed */}
        </div>
      </div>

      {/* MD Editor */}
      <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
        <MDEditor
          value={content}
          onChange={handleChange}
          height="100%"
          visibleDragbar={false}
          preview="live"
        />
      </div>
    </div>
  );
}
