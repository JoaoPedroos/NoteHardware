// src/index.js - VERSÃO CORRIGIDA E FINAL
import React from 'react';
import ReactDOM from 'react-dom/client';
// Importa o BrowserRouter aqui
import { BrowserRouter } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './globals/theme.css';

import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);