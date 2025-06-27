// src/components/Header.js - VERSÃO SEM A BARRA DE PESQUISA (WARNINGS CORRIGIDOS)

import React, { useState } from 'react';
import { Navbar, Nav, Container, Form, Button, Modal } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import '../globals/Header.css';

// O componente agora recebe 'session' e 'profile' como propriedades
const Header = ({ session, profile }) => {
    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);

    // Estados para os campos do formulário
    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Funções para controlar a visibilidade dos modais
    const handleCloseRegister = () => setShowRegisterModal(false);
    const handleShowRegister = () => {
        // Limpa os campos antes de abrir o modal
        setNome('');
        setEmail('');
        setPassword('');
        setShowRegisterModal(true);
    };

    const handleCloseLogin = () => setShowLoginModal(false);
    const handleShowLogin = () => {
        // Limpa os campos antes de abrir o modal
        setEmail('');
        setPassword('');
        setShowLoginModal(true);
    };

    // Função para lidar com o registro de um novo usuário
    async function handleRegister(e) {
        e.preventDefault();
        // Variável 'data' renomeada para '_data' para indicar que não será usada, resolvendo o warning
        const { data: _data, error } = await supabase.auth.signUp({ 
            email: email,
            password: password,
            options: {
                data: {
                    full_name: nome, // Armazena o nome nos metadados do usuário
                }
            }
        });

        if (error) {
            alert("Erro no registro: " + error.message);
        } else {
            alert("Registro realizado! Verifique seu e-mail para confirmação.");
            handleCloseRegister();
        }
    }

    // Função para lidar com o login do usuário
    async function handleLogin(e) {
        e.preventDefault();
        // Variável 'data' renomeada para '_data' para indicar que não será usada, resolvendo o warning
        const { data: _data, error } = await supabase.auth.signInWithPassword({ 
            email: email,
            password: password,
        });

        if (error) {
            alert("Erro no login: " + error.message);
        } else {
            // O App.js vai detectar a mudança de sessão e buscar o perfil
            handleCloseLogin();
        }
    }

    // Função para lidar com o logout
    async function handleLogout() {
        const { error } = await supabase.auth.signOut();
        if (error) {
            alert("Erro ao sair: " + error.message);
        }
        // O App.js vai detectar a mudança de sessão e limpar o perfil
    }

    return (
        <>
            <Navbar bg="dark" variant="dark" expand="lg" className="py-3">
                <Container>
                    <Navbar.Brand as={Link} to="/">
                        <span className="gradient-text fs-3">NoteComparer</span>
                    </Navbar.Brand>
                    <Navbar.Toggle aria-controls="basic-navbar-nav" />
                    <Navbar.Collapse id="basic-navbar-nav">
                        <Nav className="me-auto mb-2 mb-lg-0">
                            <Nav.Link href="#inicio">Início</Nav.Link>
                            <Nav.Link href="#comparar">Comparar</Nav.Link>
                            <Nav.Link href="#sobre">Sobre</Nav.Link>

                            {/* ===== NOVO LINK PARA ADMINS ===== */}
                            {profile?.role === 'admin' && (
                                <Nav.Link as={Link} to="/admin" className="fw-bold text-warning">
                                    Painel Admin
                                </Nav.Link>
                            )}
                        </Nav>

                        <div className="d-flex align-items-center ms-auto gap-3">
                            <Nav>
                                {/* Verifica se existe uma sessão e um usuário nela */}
                                {!session?.user ? (
                                    <>
                                        <Button variant="link" className="custom-button-dark btn-lg" onClick={handleShowRegister}>Registrar</Button>
                                        <Button variant="link" className="custom-button-dark btn-lg" onClick={handleShowLogin}>Logar</Button>
                                    </>
                                ) : (
                                    <>

                                        <Nav.Link as={Link} to="/perfil" className="text-white me-3">
                                            Olá,{' '}
                                            {
                                                profile ? (profile.full_name || profile.username) : 'Carregando...'
                                            }
                                        </Nav.Link>
                                        <Button variant="outline-light" size="lg" onClick={handleLogout}>Sair</Button>
                                    </>
                                )}
                            </Nav>
                        </div>
                    </Navbar.Collapse>
                </Container>
            </Navbar>

            {/* MODAL DE REGISTRO */}
            <Modal show={showRegisterModal} onHide={handleCloseRegister} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Criar Conta</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleRegister}>
                        <Form.Group className="mb-3" controlId="formBasicName">
                            <Form.Label>Nome Completo</Form.Label>
                            <Form.Control type="text" placeholder="Seu nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
                        </Form.Group>
                        <Form.Group className="mb-3" controlId="formBasicEmailRegister">
                            <Form.Label>Email</Form.Label>
                            <Form.Control type="email" placeholder="Seu email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                        </Form.Group>
                        <Form.Group className="mb-3" controlId="formBasicPasswordRegister">
                            <Form.Label>Senha</Form.Label>
                            <Form.Control type="password" placeholder="Crie uma senha" value={password} onChange={(e) => setPassword(e.target.value)} required />
                        </Form.Group>
                        <Button variant="primary" type="submit">
                            Registrar
                        </Button>
                    </Form>
                </Modal.Body>
            </Modal>

            {/* MODAL DE LOGIN */}
            <Modal show={showLoginModal} onHide={handleCloseLogin} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Entrar na sua Conta</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleLogin}>
                        <Form.Group className="mb-3" controlId="formBasicEmailLogin">
                            <Form.Label>Email</Form.Label>
                            <Form.Control type="email" placeholder="Seu email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                        </Form.Group>
                        <Form.Group className="mb-3" controlId="formBasicPasswordLogin">
                            <Form.Label>Senha</Form.Label>
                            <Form.Control type="password" placeholder="Sua senha" value={password} onChange={(e) => setPassword(e.target.value)} required />
                        </Form.Group>
                        <Button variant="primary" type="submit">
                            Logar
                        </Button>
                    </Form>
                </Modal.Body>
            </Modal>
        </>
    );
};

export default Header;