// src/components/AdminRoute.js

import React from 'react';
import { Navigate } from 'react-router-dom';
import { Spinner } from 'react-bootstrap';

// Este componente age como um "porteiro"
const AdminRoute = ({ profile, children }) => {
  // Enquanto o perfil ainda está carregando, mostramos um spinner
  if (!profile) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" />
        <p>Verificando permissões...</p>
      </div>
    );
  }

  // Se o perfil carregou e o papel NÃO é 'admin', redireciona para a página inicial
  if (profile.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  // Se passou por todas as verificações, libera a passagem e renderiza a página filha (children)
  return children;
};

export default AdminRoute;