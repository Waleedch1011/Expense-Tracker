import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// Service worker is auto-registered by vite-plugin-pwa via index.html injection
// (configured with injectRegister: 'auto' in vite.config.js)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
