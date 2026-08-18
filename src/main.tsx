import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './assets/css/index.css';
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import 'bootstrap-icons/font/bootstrap-icons.css'
import 'animate.css/animate.min.css'
import '@fortawesome/fontawesome-free/css/all.min.css'
import 'react-responsive-carousel/lib/styles/carousel.min.css'
import { BrowserRouter } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import { LanguageProvider } from './context/LanguageContext';
import axios from 'axios';

// Allow the API to point at a deployed backend (e.g. Vercel) via VITE_API_URL.
// When unset, requests go to the same origin (dev server proxy / relative path).
axios.defaults.baseURL = import.meta.env.VITE_API_URL || '';

// Attach the session token to every API request.
axios.interceptors.request.use((config) => {
  try {
    const raw = localStorage.getItem('ra_current_user');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.token) {
        config.headers.Authorization = `Bearer ${parsed.token}`;
      }
    }
  } catch (e) {
    // ignore malformed storage
  }
  return config;
});

// Register the base-aware service worker for offline support.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(import.meta.env.BASE_URL + 'service-worker.js')
      .then((registration) => {
        console.log('Service Worker registered successfully:', registration.scope);
      })
      .catch((error) => {
        console.log('Service Worker registration failed:', error);
      });
  });
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <LanguageProvider>
      <BrowserRouter basename="/RA-Masala">
          <ScrollToTop />
          <App />
        </BrowserRouter>
    </LanguageProvider>
  </React.StrictMode>,
)

