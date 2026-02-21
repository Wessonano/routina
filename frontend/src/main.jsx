import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ExternalChat from './components/ExternalChat.jsx'

const VALID_CONTACTS = ['erick', 'elisa', 'martine'];

function Router() {
  const path = window.location.pathname;
  const match = path.match(/^\/chat\/(\w+)$/);

  if (match && VALID_CONTACTS.includes(match[1])) {
    return <ExternalChat contact={match[1]} />;
  }

  return <App />;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Router />
  </StrictMode>,
)

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}
