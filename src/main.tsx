import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { registerSW, handleInstallPrompt } from './utils/serviceWorker'

// Register service worker for PWA
registerSW({
  onSuccess: () => console.log('App cached for offline use'),
  onUpdate: () => console.log('New app version available')
});

// Handle install prompt
handleInstallPrompt();

createRoot(document.getElementById("root")!).render(<App />);
