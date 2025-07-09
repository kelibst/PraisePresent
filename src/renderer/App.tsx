import React, { useEffect, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from '../lib/store';
import { ThemeProvider } from '../lib/theme';
import LiveDisplayRenderer from '../components/rendering/LiveDisplayRenderer';
import '../index.css';
import AppRoutes from '../routes';

const App: React.FC = () => {
  const [isLiveDisplayMode, setIsLiveDisplayMode] = useState(false);
  const [displayId, setDisplayId] = useState<number | undefined>();

  useEffect(() => {
    // Check if we're in live display mode
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');
    
    if (mode === 'live-display') {
      setIsLiveDisplayMode(true);
      const displayIdParam = urlParams.get('displayId');
      if (displayIdParam) {
        setDisplayId(parseInt(displayIdParam, 10));
      }
    }
  }, []);

  // If we're in live display mode, render the live display component with Redux Provider
  if (isLiveDisplayMode) {
    return (
      <Provider store={store}>
        <ThemeProvider>
          <div className="live-display-app">
            <LiveDisplayRenderer displayId={displayId} />
          </div>
        </ThemeProvider>
      </Provider>
    );
  }

  // Otherwise, render the normal app
  return (
    <Provider store={store}>
      <ThemeProvider>
        <BrowserRouter>
          <div className="app">
            <AppRoutes />
          </div>
        </BrowserRouter>
      </ThemeProvider>
    </Provider>
  );
};

export default App;