// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import { SubdomainRouter } from './components/SubdomainRouter';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <SubdomainRouter>
        <App />
      </SubdomainRouter>
    </BrowserRouter>
  </React.StrictMode>
);
