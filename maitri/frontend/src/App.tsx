import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Dashboard } from '@/components/Dashboard';
import { ConversationView } from '@/components/ConversationView';
import { HistoryView } from '@/components/HistoryView';
import { SettingsView } from '@/components/SettingsView';
import { Layout } from '@/components/Layout';
import { useAppStore } from '@/store/appStore';
import { useEffect } from 'react';

function App() {
  const { setLoading, setError } = useAppStore();

  useEffect(() => {
    // Initialize app
    const initializeApp = async () => {
      try {
        setLoading(true);
        // Check for media permissions
        const hasCamera = await navigator.mediaDevices.getUserMedia({ video: true })
          .then(() => true)
          .catch(() => false);
        
        const hasMicrophone = await navigator.mediaDevices.getUserMedia({ audio: true })
          .then(() => true)
          .catch(() => false);

        const store = useAppStore.getState();
        store.setCameraPermission(hasCamera);
        store.setMicrophonePermission(hasMicrophone);
        
        setError(null);
      } catch (error) {
        console.error('App initialization error:', error);
        setError('Failed to initialize application');
      } finally {
        setLoading(false);
      }
    };

    initializeApp();
  }, [setLoading, setError]);

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/conversation" element={<ConversationView />} />
          <Route path="/history" element={<HistoryView />} />
          <Route path="/settings" element={<SettingsView />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;