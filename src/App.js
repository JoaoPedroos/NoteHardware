// src/App.js - VERSÃO FINAL CORRIGIDA

import React, { useState, useEffect } from 'react';
import { Container } from 'react-bootstrap';

// Nossas importações de componentes e do Supabase
import { supabase } from './lib/supabaseClient';
import Header from './components/Header';
import ProfilePage from './components/ProfilePage';
import AdminPage from './components/AdminPage';
import AdminRoute from './components/AdminRoute';
import HomePage from './components/HomePage';
import NotebookDetailPage from './components/NotebookDetailPage';

// As importações do React Router foram movidas para o index.js
// Mas as importações dos componentes que serão usados nas rotas ficam aqui
import { Routes, Route } from 'react-router-dom';


function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    // Pega a sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session);
    });

    // Escuta por mudanças na autenticação
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        if (session) {
          fetchProfile(session);
        } else {
          setProfile(null);
        }
      }
    );

    async function fetchProfile(currentSession) {
      if (!currentSession?.user) return;
      const { data, error } = await supabase
        .from('profiles')
        .select(`username, role, full_name`)
        .eq('id', currentSession.user.id)
        .single();
      
      if (error) console.warn('Error fetching profile:', error);
      setProfile(data);
    }

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // O <BrowserRouter> foi movido para o index.js, então o retorno começa com a div
  return (
    <div className="App">
      <Header session={session} profile={profile} />

      <Container className="mt-3">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/notebook/:id" element={<NotebookDetailPage profile={profile} />} />
          <Route 
            path="/perfil" 
            element={session ? <ProfilePage /> : <p className="text-white">Você precisa estar logado para ver seu perfil.</p>} 
          />
          <Route
            path="/admin"
            element={
              <AdminRoute profile={profile}>
                <AdminPage />
              </AdminRoute>
            }
          />
        </Routes>
      </Container>
    </div>
  );
// ESTA CHAVE DE FECHAMENTO É ESSENCIAL
} 

export default App;