import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/work-sans';
import './design/tokens.css';
import './design/global.css';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Elemento #root não encontrado.');

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
