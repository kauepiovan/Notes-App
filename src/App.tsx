import { CustomTitleBar } from './components/CustomTitleBar';
import { WelcomeScreen } from './components/WelcomeScreen';
import { Sidebar } from './components/Sidebar';
import { Editor } from './components/Editor';
import { useAppStore } from './store/useAppStore';

function App() {
  const { workspacePath, isSidebarOpen } = useAppStore();

  return (
    <div className="app-shell">
      <CustomTitleBar />
      <main className="app-main">
        {!workspacePath ? (
          <WelcomeScreen />
        ) : (
          <>
            {isSidebarOpen && <Sidebar />}
            <Editor />
          </>
        )}
      </main>
    </div>
  );
}

export default App;
