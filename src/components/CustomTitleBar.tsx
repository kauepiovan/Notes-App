import React from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { Minus, Square, X, Menu } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

const btnBase: React.CSSProperties = {
  width: 44,
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  color: 'rgba(255,255,255,0.6)',
  transition: 'background 0.15s, color 0.15s',
};

export function CustomTitleBar() {
  const { isSidebarOpen, toggleSidebar } = useAppStore();

  return (
    <div
      style={{
        height: 36,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(0,0,0,0.15)',
        position: 'relative',
        zIndex: 50,
        userSelect: 'none',
        flexShrink: 0,
      }}
    >
      {/* Drag region — absolute background layer */}
      <div
        data-tauri-drag-region
        style={{ position: 'absolute', inset: 0, zIndex: 0 }}
      />

      {/* Left side */}
      <div style={{ display: 'flex', alignItems: 'center', height: '100%', padding: '0 10px', gap: 6, position: 'relative', zIndex: 10 }}>
        {!isSidebarOpen && (
          <button
            style={{ ...btnBase, width: 28, borderRadius: 6 }}
            title="Mostrar Sidebar"
            onClick={(e) => { e.stopPropagation(); toggleSidebar(); }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
          >
            <Menu size={15} />
          </button>
        )}
        <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, fontWeight: 500, letterSpacing: '0.02em' }}>
          Notes
        </span>
      </div>

      {/* Center spacer (also draggable via background layer) */}
      <div style={{ flex: 1, height: '100%' }} />

      {/* Right: window controls */}
      <div style={{ display: 'flex', height: '100%', position: 'relative', zIndex: 10 }}>
        <button
          style={btnBase}
          onClick={(e) => { e.stopPropagation(); getCurrentWindow().minimize(); }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
        >
          <Minus size={13} />
        </button>
        <button
          style={btnBase}
          onClick={(e) => { e.stopPropagation(); getCurrentWindow().toggleMaximize(); }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
        >
          <Square size={11} />
        </button>
        <button
          style={btnBase}
          onClick={(e) => { e.stopPropagation(); getCurrentWindow().close(); }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLButtonElement;
            el.style.background = 'rgba(239,68,68,0.85)';
            el.style.color = 'white';
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLButtonElement;
            el.style.background = 'transparent';
            el.style.color = 'rgba(255,255,255,0.6)';
          }}
        >
          <X size={13} />
        </button>
      </div>
    </div>
  );
}
