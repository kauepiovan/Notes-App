import { open } from '@tauri-apps/plugin-dialog';
import { FolderOpen, Sparkles } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export function WelcomeScreen() {
  const setWorkspacePath = useAppStore((s) => s.setWorkspacePath);

  const handleOpenFolder = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: 'Selecione a pasta das suas anotações',
      });
      if (selected && typeof selected === 'string') {
        setWorkspacePath(selected);
      }
    } catch (err) {
      console.error('Erro ao selecionar pasta:', err);
    }
  };

  return (
    <div className="welcome-container">
      <div className="welcome-card">
        <div className="welcome-icon">
          <Sparkles className="welcome-sparkle" />
        </div>

        <div className="welcome-text">
          <h1 className="welcome-title">
            Bem-vindo ao <span className="welcome-accent">Notes</span>
          </h1>
          <p className="welcome-sub">Escolha uma pasta para começar.</p>
        </div>

        <button className="welcome-btn" onClick={handleOpenFolder}>
          <FolderOpen className="ui-icon" />
          Escolher Pasta
        </button>
      </div>
    </div>
  );
}
