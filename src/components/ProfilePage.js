// src/components/ProfilePage.js

import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { supabase } from '../lib/supabaseClient';
import '../globals/ProfilePage.css'; 

const ProfilePage = () => {
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState(null);
  const [fullName, setFullName] = useState(null);
  
  // Estado para mensagens de sucesso ou erro
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    async function getProfile() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('profiles')
        .select(`username, full_name`)
        .eq('id', user.id)
        .single();

      if (error) {
        console.warn(error);
        setError('Não foi possível carregar o perfil.');
      } else if (data) {
        setUsername(data.username);
        setFullName(data.full_name);
      }
      setLoading(false);
    }

    getProfile();
  }, []);

  async function handleUpdateProfile(e) {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    const { data: { user } } = await supabase.auth.getUser();

    const updates = {
      id: user.id,
      username: username,
      full_name: fullName,
      updated_at: new Date(),
    };

    const { error } = await supabase.from('profiles').upsert(updates);
    
    if (error) {
      setError('Erro ao atualizar o perfil. O nome de usuário já pode estar em uso.');
    } else {
      setMessage('Perfil salvo com sucesso!');
    }
    setLoading(false);
  }

  return (
    <div className="profile-page-container">
      <Container>
        <Row className="justify-content-md-center">
          <Col md={8} lg={6}>
            <Card bg="dark" text="white" className="rounded-4 profile-card">
              <Card.Body className="p-4 p-md-5">
                <Card.Title as="h2" className="text-center mb-4">
                  Meu Perfil
                </Card.Title>

                {/* Mostra mensagens de erro ou sucesso */}
                {error && <Alert variant="danger">{error}</Alert>}
                {message && <Alert variant="success">{message}</Alert>}

                {loading ? (
                  <div className="text-center">
                    <Spinner animation="border" variant="light" />
                    <p className="mt-2">Carregando...</p>
                  </div>
                ) : (
                  <Form onSubmit={handleUpdateProfile}>
                    <Form.Group className="mb-3" controlId="formFullName">
                      <Form.Label>Nome Completo</Form.Label>
                      <Form.Control
                        type="text"
                        value={fullName || ''}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Seu nome completo"
                      />
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="formUsername">
                      <Form.Label>Nome de Usuário</Form.Label>
                      <Form.Control
                        type="text"
                        value={username || ''}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Seu @ de usuário"
                      />
                    </Form.Group>

                    <div className="d-grid mt-4">
                      <Button variant="primary" type="submit" disabled={loading}>
                        {loading ? 'Salvando...' : 'Salvar Alterações'}
                      </Button>
                    </div>
                  </Form>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default ProfilePage;