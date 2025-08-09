import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import SimpleApp from './SimpleApp'
import './globals.css'

console.log('main.tsx loading...');
console.log('Root element:', document.getElementById('root'));

// Use SimpleApp for testing, then switch back to App
const TestMode = false;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {TestMode ? <SimpleApp /> : <App />}
  </React.StrictMode>,
)