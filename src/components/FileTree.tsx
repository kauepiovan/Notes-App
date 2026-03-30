import { useState, useEffect, useRef, useCallback } from 'react';
import { readDir, writeTextFile, mkdir, rename, readTextFile, remove } from '@tauri-apps/plugin-fs';
import { confirm } from '@tauri-apps/plugin-dialog';
import { ChevronRight, ChevronDown, FileText, Folder, FolderOpen } from 'lucide-react';
import { useAppStore, ItemCreation } from '../store/useAppStore';

interface FileNode {
  name: string;
  path: string;
  isDirectory: boolean;
}

function joinPath(base: string, name: string): string {
  return base.replace(/[\\/]+$/, '') + '\\' + name;
}

// Computes the indentation for each level
const getIndent = (level: number) => level * 14 + 8;

function InlineInput({ itemCreation, level }: { itemCreation: ItemCreation; level: number }) {
  const { setCreatingNewItem, setActiveFile, triggerRefresh, setLastCreatedFolder } = useAppStore();
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const doneRef = useRef(false);
  
  const indent = getIndent(level);

  // Focus input automatically
  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  const commit = async (isCancel = false) => {
    if (doneRef.current) return;
    doneRef.current = true;

    if (isCancel) {
      setCreatingNewItem(null);
      return;
    }

    const trimmed = value.trim();
    if (!trimmed) {
      setCreatingNewItem(null);
      return;
    }
    
    let fileName = trimmed;
    if (itemCreation.type === 'file' && !fileName.toLowerCase().endsWith('.md')) {
      fileName += '.md';
    }
    
    const targetPath = joinPath(itemCreation.parentPath, fileName);
    try {
      if (itemCreation.type === 'file') {
        await writeTextFile(targetPath, `# ${fileName.replace(/\.md$/, '')}\n\n`);
        setActiveFile(fileName, targetPath);
      } else {
        await mkdir(targetPath);
        setLastCreatedFolder(targetPath);
      }
      triggerRefresh();
    } catch (err) {
      console.error('Erro ao criar item', err);
      alert('Erro ao criar item: ' + String(err));
    }
    setCreatingNewItem(null);
  };

  return (
    <div className="file-row inline-input" style={{ paddingLeft: indent, paddingRight: 8, paddingTop: 4, paddingBottom: 4 }}>
      {/* Spacer for chevron */}
      <span style={{ width: 16, height: 16, flexShrink: 0, marginRight: 2 }} />
      {/* File/Folder icon */}
      <span style={{ width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginRight: 6 }}>
        {itemCreation.type === 'folder' ? <Folder className="ui-icon" /> : <FileText className="ui-icon" />}
      </span>
      {/* Input Field */}
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') commit(true);
        }}
        onBlur={() => commit()}
        placeholder={itemCreation.type === 'folder' ? "Nome da pasta..." : "Nome do arquivo..."}
        style={{
          flex: 1,
          background: 'var(--panel-bg-acrylic, var(--panel-bg))',
          border: '1px solid var(--panel-border)',
          color: 'var(--text)',
          fontSize: 'var(--ui-font-size)',
          outline: 'none',
          padding: '6px 8px',
          borderRadius: 6,
          backdropFilter: 'var(--panel-backdrop)',
          WebkitBackdropFilter: 'var(--panel-backdrop)'
        }}
      />
    </div>
  );
}

function TreeNode({ node, level, onContextMenu }: { node: FileNode; level: number; onContextMenu?: (e: React.MouseEvent, node: FileNode) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [children, setChildren] = useState<FileNode[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  
  const { setActiveFile, activeFilePath, creatingNewItem, refreshCounter, lastCreatedFolder, setLastCreatedFolder, selectedItem, setSelectedItem, triggerRefresh } = useAppStore();

  const isActiveFile = activeFilePath === node.path;
  const isSelected = selectedItem?.path === node.path;
  const isCreatingInside = creatingNewItem?.parentPath === node.path;
  const indent = getIndent(level);

  const loadChildren = useCallback(async () => {
    try {
      const entries = await readDir(node.path);
      const formatted: FileNode[] = entries
        .filter((e) => e.isDirectory || (e.isFile && e.name?.endsWith('.md')))
        .map((e) => ({
          name: e.name ?? 'Unknown',
          path: joinPath(node.path, e.name ?? ''),
          isDirectory: !!e.isDirectory,
        }))
        .sort((a, b) => {
          if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
          return a.name.localeCompare(b.name);
        });
      setChildren(formatted);
    } catch (err) {
      console.error('Error reading dir', err);
    }
  }, [node.path]);

  // Open automatically if we request to create a file inside
  useEffect(() => {
    if (isCreatingInside && !isOpen && node.isDirectory) {
      setIsOpen(true);
      loadChildren();
    }
  }, [isCreatingInside, isOpen, node.isDirectory, loadChildren]);

  // If this folder was just created, open it automatically
  useEffect(() => {
    if (node.path === lastCreatedFolder && !isOpen && node.isDirectory) {
      setIsOpen(true);
      loadChildren();
      setLastCreatedFolder(null); // consume the event
    }
  }, [lastCreatedFolder, node.path, isOpen, node.isDirectory, loadChildren, setLastCreatedFolder]);

  // Reload children if something changes globally (like a file delete or create)
  useEffect(() => {
    if (isOpen && node.isDirectory) {
      loadChildren();
    }
  }, [refreshCounter, isOpen, node.isDirectory, loadChildren]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedItem({ path: node.path, isDirectory: node.isDirectory });
    
    if (node.isDirectory) {
      if (!isOpen) loadChildren();
      setIsOpen((o) => !o);
    } else {
      setActiveFile(node.name, node.path);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedItem({ path: node.path, isDirectory: node.isDirectory });
    onContextMenu?.(e, node);
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.stopPropagation();
    e.dataTransfer.setData('application/x-notes-file-path', node.path);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!node.isDirectory) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    if (!node.isDirectory) return;

    const sourcePath = e.dataTransfer.getData('application/x-notes-file-path');
    if (!sourcePath || sourcePath === node.path) return;

    const sep = sourcePath.includes('\\') ? '\\' : '/';
    const sourceName = sourcePath.split(sep).filter(Boolean).pop();
    if (!sourceName) return;

    const targetPath = joinPath(node.path, sourceName);
    
    if (sourcePath === targetPath) return;

    try {
      await rename(sourcePath, targetPath);
      if (activeFilePath === sourcePath) {
        setActiveFile(sourceName, targetPath);
      }
      triggerRefresh();
    } catch (err) {
      console.error('Erro ao mover arquivo:', err);
      alert('Erro ao mover arquivo: ' + String(err));
    }
  };

  return (
    <div>
      <div
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        draggable={!node.isDirectory}
        onDragStart={!node.isDirectory ? handleDragStart : undefined}
        onDragOver={node.isDirectory ? handleDragOver : undefined}
        onDragLeave={node.isDirectory ? handleDragLeave : undefined}
        onDrop={node.isDirectory ? handleDrop : undefined}
        className={`file-row ${isSelected ? 'selected' : isActiveFile ? 'active' : ''}`}
        style={{ paddingLeft: indent, paddingRight: 8, paddingTop: 4, paddingBottom: 4, fontSize: 'var(--ui-font-size)' }}
        title={node.path}
      >
        <span style={{ width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity: 0.6, marginRight: 2 }}>
          {node.isDirectory ? (isOpen ? <ChevronDown className="ui-icon" /> : <ChevronRight className="ui-icon" />) : null}
        </span>
        <span style={{ width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--accent-2)', marginRight: 6 }}>
          {node.isDirectory
            ? isOpen ? <FolderOpen className="ui-icon" /> : <Folder className="ui-icon" />
            : <FileText className="ui-icon" />}
        </span>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {node.name.replace(/\.md$/, '')}
        </span>
      </div>

      {node.isDirectory && isOpen && (
        <div>
          {isCreatingInside && creatingNewItem && <InlineInput itemCreation={creatingNewItem} level={level + 1} />}
          
          {children.length > 0 ? (
            children.map((child) => (
              <TreeNode key={child.path} node={child} level={level + 1} onContextMenu={onContextMenu} />
            ))
          ) : (
            // Show "Vazio" only if we are NOT currently trying to create a file inside
            !isCreatingInside && (
              <p className="file-meta" style={{ fontStyle: 'italic', margin: 0, padding: `4px 0 4px ${getIndent(level + 1) + 18}px` }}>
                  Vazio
                </p>
            )
          )}
        </div>
      )}
    </div>
  );
}

export function FileTree({ workspacePath }: { workspacePath: string }) {
  const [rootNodes, setRootNodes] = useState<FileNode[]>([]);
  const { refreshCounter, creatingNewItem, setSelectedItem, clipboard, setClipboard, triggerRefresh } = useAppStore();
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; node: FileNode | null } | null>(null);

  const isCreatingInRoot = creatingNewItem?.parentPath === workspacePath;

  const load = useCallback(async () => {
    try {
      const entries = await readDir(workspacePath);
      const formatted: FileNode[] = entries
        .filter((e) => e.isDirectory || (e.isFile && e.name?.endsWith('.md')))
        .map((e) => ({
          name: e.name ?? 'Unknown',
          path: joinPath(workspacePath, e.name ?? ''),
          isDirectory: !!e.isDirectory,
        }))
        .sort((a, b) => {
          if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
          return a.name.localeCompare(b.name);
        });
      setRootNodes(formatted);
    } catch (err) {
      console.error('Error loading workspace', err);
    }
  }, [workspacePath]);

  useEffect(() => {
    load();
  }, [load, refreshCounter]);

  useEffect(() => {
    if (!contextMenu) return;
    const onWindowClick = () => setContextMenu(null);
    const onResize = () => setContextMenu(null);
    window.addEventListener('click', onWindowClick);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('click', onWindowClick);
      window.removeEventListener('resize', onResize);
    };
  }, [contextMenu]);

  const showMenuForNode = (e: React.MouseEvent, node: FileNode | null) => {
    setContextMenu({ x: e.clientX, y: e.clientY, node });
  };

  // path helpers
  const pathSep = (p: string) => (p.includes('\\') ? '\\' : '/');
  const basename = (p: string) => p.split(pathSep(p)).filter(Boolean).pop() ?? p;
  const parentDir = (p: string) => {
    const sep = pathSep(p);
    const parts = p.split(sep).filter(Boolean);
    parts.pop();
    if (p.startsWith('\\') || p.startsWith('/')) {
      return sep + parts.join(sep);
    }
    return parts.join(sep) || (p.startsWith('\\') ? '\\' : '');
  };
  const joinPathLocal = (base: string, name: string) => base.replace(/[\\/]+$/, '') + (base.includes('\\') ? '\\' : '/') + name;

  async function generateNonCollidingName(dir: string, name: string) {
    const baseMatch = name.match(/^(.*?)(\.[^.]*)?$/);
    const base = baseMatch ? baseMatch[1] : name;
    const ext = baseMatch && baseMatch[2] ? baseMatch[2] : '';
    let candidate = name;
    let i = 1;
    while (i < 50) {
      let exists = false;
      try {
        // try directory
        await readDir(joinPathLocal(dir, candidate));
        exists = true;
      } catch (errDir) {
        try {
          // try file
          await readTextFile(joinPathLocal(dir, candidate));
          exists = true;
        } catch (errFile) {
          exists = false;
        }
      }
      if (!exists) return candidate;
      candidate = `${base}-copy${i}${ext}`;
      i++;
    }
    return candidate;
  }

  async function copyFileToDir(src: string, targetDir: string) {
    const content = await readTextFile(src);
    const name = basename(src);
    const newName = await generateNonCollidingName(targetDir, name);
    const targetPath = joinPathLocal(targetDir, newName);
    await writeTextFile(targetPath, content);
  }

  async function copyDirRecursive(srcDir: string, targetDir: string) {
    const name = basename(srcDir);
    const newName = await generateNonCollidingName(targetDir, name);
    const destDir = joinPathLocal(targetDir, newName);
    await mkdir(destDir);
    const entries = await readDir(srcDir);
    for (const e of entries) {
      const childPath = joinPathLocal(srcDir, e.name ?? '');
      if (e.isDirectory) {
        await copyDirRecursive(childPath, destDir);
      } else if (e.isFile) {
        if ((e.name ?? '').toLowerCase().endsWith('.md')) {
          const text = await readTextFile(childPath);
          const destChild = joinPathLocal(destDir, e.name ?? 'file.md');
          await writeTextFile(destChild, text);
        }
      }
    }
  }

  async function removeRecursive(targetPath: string, isDir: boolean) {
    if (!isDir) {
      await remove(targetPath);
      return;
    }
    const entries = await readDir(targetPath);
    for (const e of entries) {
      const childPath = joinPathLocal(targetPath, e.name ?? '');
      if (e.isDirectory) await removeRecursive(childPath, true);
      else await remove(childPath);
    }
    await remove(targetPath);
  }

  const handleCopy = async (node: FileNode | null) => {
    if (!node) return;
    setClipboard({ path: node.path, isDirectory: node.isDirectory });
    setContextMenu(null);
  };

  const handlePaste = async (targetNode: FileNode | null) => {
    if (!clipboard) return;
    const targetDir = targetNode ? (targetNode.isDirectory ? targetNode.path : parentDir(targetNode.path)) : workspacePath;
    try {
      if (clipboard.isDirectory) await copyDirRecursive(clipboard.path, targetDir);
      else await copyFileToDir(clipboard.path, targetDir);
      triggerRefresh();
      setContextMenu(null);
    } catch (err) {
      alert('Erro ao colar: ' + String(err));
    }
  };

  const handleDeleteNode = async (node: FileNode | null) => {
    if (!node) return;
    const ok = await confirm(
      `Apagar "${node.name}" permanentemente?`,
      { title: 'Confirmar exclusão', kind: 'warning' }
    );
    if (!ok) { setContextMenu(null); return; }
    try {
      await removeRecursive(node.path, node.isDirectory);
      setContextMenu(null);
      triggerRefresh();
    } catch (err) {
      alert('Erro ao excluir: ' + String(err));
    }
  };

  return (
    <div 
      style={{ flex: 1, overflowY: 'auto', padding: '4px 0', minHeight: 100 }}
      onClick={() => setSelectedItem({ path: workspacePath, isDirectory: true })}
      onContextMenu={(e) => { e.preventDefault(); setSelectedItem({ path: workspacePath, isDirectory: true }); showMenuForNode(e, { name: workspacePath.split(/[\\/]/).filter(Boolean).pop() ?? workspacePath, path: workspacePath, isDirectory: true }); }}
    >
      
      {/* If targeting the root directory, render input at the top level */}
      {isCreatingInRoot && creatingNewItem && <InlineInput itemCreation={creatingNewItem} level={0} />}

      {rootNodes.length === 0 && !isCreatingInRoot ? (
        <p style={{ color: 'var(--muted)', fontSize: '0.95rem', fontStyle: 'italic', padding: '12px 14px', margin: 0 }}>
          Nenhum arquivo .md encontrado.
        </p>
      ) : (
        rootNodes.map((node) => (
          <TreeNode key={node.path} node={node} level={0} onContextMenu={showMenuForNode} />
        ))
      )}

      {/* Context menu */}
      {contextMenu && (
        <div
          className="context-menu"
          style={{ position: 'fixed', left: contextMenu.x, top: contextMenu.y, zIndex: 9999 }}
          onClick={(e) => { e.stopPropagation(); }}
        >
          <div className="context-menu-item" onClick={() => handleCopy(contextMenu.node)}>Copiar</div>
          <div className={`context-menu-item ${!clipboard ? 'disabled' : ''}`} onClick={() => handlePaste(contextMenu.node)}>Colar</div>
          <div className="context-menu-item danger" onClick={() => handleDeleteNode(contextMenu.node)}>Excluir</div>
        </div>
      )}
    </div>
  );
}
