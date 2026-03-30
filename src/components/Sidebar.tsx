import React, { useRef } from 'react';
import { PlusCircle, FolderPlus, FolderOutput, PanelLeftClose } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { FileTree } from './FileTree';

export function Sidebar() {
  const { workspacePath, activeFilePath, toggleSidebar, setWorkspacePath, setCreatingNewItem, selectedItem, sidebarWidth, setSidebarWidth } = useAppStore();

  const sidebarRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  if (!workspacePath) return null;

  const handleNewItem = (type: 'file' | 'folder') => {
    let targetDir = workspacePath;
    if (selectedItem) {
      const sep = selectedItem.path.includes('\\') ? '\\' : '/';
      targetDir = selectedItem.isDirectory ? selectedItem.path : selectedItem.path.substring(0, selectedItem.path.lastIndexOf(sep));
    } else if (activeFilePath) {
      const sep = activeFilePath.includes('\\') ? '\\' : '/';
      targetDir = activeFilePath.substring(0, activeFilePath.lastIndexOf(sep));
    }
    setCreatingNewItem({ type, parentPath: targetDir || workspacePath });
  };

  const folderName = workspacePath.split(/[\\/]/).filter(Boolean).pop() ?? workspacePath;

  const onPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    const el = sidebarRef.current;
    if (!el) return;
    draggingRef.current = true;
    startXRef.current = e.clientX;
    startWidthRef.current = el.getBoundingClientRect().width;
    const pointerId = e.pointerId;
    (e.target as Element).setPointerCapture?.(pointerId);

    const onPointerMove = (ev: PointerEvent) => {
      if (!draggingRef.current) return;
      const delta = ev.clientX - startXRef.current;
      const newWidth = Math.round(startWidthRef.current + delta);
      const min = 120;
      const max = Math.max(420, window.innerWidth - 200);
      setSidebarWidth(Math.max(min, Math.min(newWidth, max)));
    };

    const onPointerUp = (ev: PointerEvent) => {
      draggingRef.current = false;
      try { (e.target as Element).releasePointerCapture?.(pointerId); } catch (err) {}
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  return (
    <div ref={sidebarRef} className="sidebar" style={{ width: sidebarWidth }}>
      <div className="sidebar-header">
        <span className="sidebar-label">Arquivos</span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="sidebar-btn" title="Nova Nota" onClick={() => handleNewItem('file')}><PlusCircle className="ui-icon" /></button>
          <button className="sidebar-btn" title="Nova Pasta" onClick={() => handleNewItem('folder')}><FolderPlus className="ui-icon" /></button>
          <button className="sidebar-btn" title="Fechar Pasta" onClick={() => setWorkspacePath(null)}><FolderOutput className="ui-icon" /></button>
          <button className="sidebar-btn" title="Fechar Explorer" onClick={toggleSidebar}><PanelLeftClose className="ui-icon" /></button>
        </div>
      </div>

      <div style={{ padding: '6px 12px', borderBottom: '1px solid var(--panel-border)' }}>
        <span className="file-meta" title={workspacePath}>📁 {folderName}</span>
      </div>

      <FileTree workspacePath={workspacePath} />

      <div
        className="sidebar-resizer"
        onPointerDown={onPointerDown}
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize sidebar"
      />
    </div>
  );
}
