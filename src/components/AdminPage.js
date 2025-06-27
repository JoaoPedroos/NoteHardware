// src/components/AdminPage.js - VERSÃO COMPLETA E REFATORADA

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Table, Spinner, Alert, Card, Form, Button, ListGroup, Modal, Row, Col, Collapse } from 'react-bootstrap';
import '../globals/AdminPage.css';

const AdminPage = () => {
  // Estados principais da página
  const [existingNotebooks, setExistingNotebooks] = useState([]);
  const [loadingNotebooks, setLoadingNotebooks] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Estados para a ferramenta de IA
  const [searchQuery, setSearchQuery] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [loadingAI, setLoadingAI] = useState(false);
  
  // Estados para o Modal unificado
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' ou 'edit'
  const [modalData, setModalData] = useState({}); // Um único objeto para todos os dados do formulário
  const [submitting, setSubmitting] = useState(false);

  // Estados para controlar os 'Collapses' (sanfonas) dentro do modal
  const [expandedSections, setExpandedSections] = useState({});

  // Função para buscar os notebooks que já estão no nosso site
  const fetchExistingNotebooks = useCallback(async () => {
    setLoadingNotebooks(true);
    const { data, error } = await supabase.from('notebooks').select('*').order('created_at', { ascending: false });
    if (error) {
      setMessage({ type: 'danger', text: 'Falha ao carregar notebooks existentes.' });
    } else {
      setExistingNotebooks(data);
    }
    setLoadingNotebooks(false);
  }, []);

  useEffect(() => {
    fetchExistingNotebooks();
  }, [fetchExistingNotebooks]);

  // Função para chamar a IA
  const handleSearchWithAI = async (e) => {
    e.preventDefault();
    if (!searchQuery) return;
    setLoadingAI(true);
    setMessage({ type: '', text: '' });
    setAiSuggestions([]);
    try {
      const { data, error } = await supabase.functions.invoke('enrich-product', { body: { productName: searchQuery } });
      if (error) throw error;
      setAiSuggestions(Array.isArray(data) ? data : []);
    } catch (error) {
      setMessage({ type: 'danger', text: 'Erro ao buscar dados da IA: ' + error.message });
    }
    setLoadingAI(false);
  };

  // Abre e configura o modal para ADICIONAR uma sugestão da IA
  const handleShowAddModal = (suggestion) => {
    setModalMode('add');
    // Renomeia imageUrl para image_url para consistência com o banco
    setModalData({ ...suggestion, image_url: suggestion.imageUrl }); 
    setShowModal(true);
  };

  // Abre e configura o modal para EDITAR um notebook existente
  const handleShowEditModal = (notebook) => {
    setModalMode('edit');
    setModalData(notebook);
    setShowModal(true);
  };

  // Fecha e reseta o modal
  const handleCloseModal = () => {
    setShowModal(false);
    setModalData({});
    setExpandedSections({});
    setMessage({type: '', text: ''});
  };

  // Lida com qualquer mudança nos campos do formulário do modal
  const handleModalFieldChange = (e) => {
    const { id, value } = e.target;
    setModalData(prev => ({ ...prev, [id]: value }));
  };

  // Função ÚNICA para salvar (ou Adiciona ou Atualiza)
  const handleSaveFromModal = async () => {
    setSubmitting(true);
    setMessage({ type: '', text: '' });

    // Converte campos numéricos de string para número antes de salvar
    const dataToSave = {
        ...modalData,
        price: modalData.price ? parseFloat(modalData.price) : null,
        cpu_base_ghz: modalData.cpu_base_ghz ? parseFloat(modalData.cpu_base_ghz) : null,
        // ... adicione outras conversões de parseFloat ou parseInt aqui conforme necessário
    };
    
    let error;
    if (modalMode === 'add') {
      // Lógica de Inserir
      const { error: insertError } = await supabase.from('notebooks').insert([dataToSave]);
      error = insertError;
    } else {
      // Lógica de Atualizar
      const { error: updateError } = await supabase.from('notebooks').update(dataToSave).eq('id', modalData.id);
      error = updateError;
    }

    if (error) {
      setMessage({ type: 'danger', text: `Erro ao salvar: ${error.message}` });
    } else {
      setMessage({ type: 'success', text: `Notebook "${dataToSave.name}" salvo com sucesso!` });
      if(modalMode === 'add') {
        setAiSuggestions(prev => prev.filter(s => s.name !== dataToSave.name));
      }
      fetchExistingNotebooks();
      handleCloseModal();
    }
    setSubmitting(false);
  };

  // Função para remover um notebook
  const handleRemoveNotebook = async (id, name) => {
    if (window.confirm(`Tem certeza que deseja remover o notebook "${name}"?`)) {
      const { error } = await supabase.from('notebooks').delete().eq('id', id);
      if (error) {
        setMessage({ type: 'danger', text: `Erro ao remover: ${error.message}` });
      } else {
        setMessage({ type: 'success', text: `"${name}" foi removido.` });
        fetchExistingNotebooks();
      }
    }
  };
  
  // Função para formatar as especificações para a lista principal
  const formatFullSpecs = (product) => {
    const specs = [product.cpu_details, product.gpu_details, product.ram_details];
    return specs.filter(Boolean).join(' | ');
  };
  
  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <Card bg="dark" text="white" className="mb-4" data-bs-theme="dark">
      <Card.Header as="h2" className="text-center">Painel Administrativo</Card.Header>
      <Card.Body className="p-4">

        {message.text && <Alert variant={message.type} className="mb-4">{message.text}</Alert>}

        {/* SEÇÃO 1: NOTEBOOKS NO SITE */}
        <div className="admin-section mb-5">
          <Card.Title as="h4" className="mb-3">Notebooks no Site ({existingNotebooks.length})</Card.Title>
          {loadingNotebooks ? <div className="text-center"><Spinner animation="border" size="sm" variant="light" /></div> : (
            existingNotebooks.length > 0 ? (
              <Table striped bordered hover responsive size="sm" variant="dark">
                <thead><tr><th>Nome</th><th>Configuração Resumida</th><th style={{ width: '150px' }}>Ações</th></tr></thead>
                <tbody>
                  {existingNotebooks.map(notebook => (
                    <tr key={notebook.id}>
                      <td>{notebook.name}</td>
                      <td>{formatFullSpecs(notebook)}</td>
                      <td>
                        <Button variant="info" size="sm" className="me-2" onClick={() => handleShowEditModal(notebook)}>Editar</Button>
                        <Button variant="danger" size="sm" onClick={() => handleRemoveNotebook(notebook.id, notebook.name)}>Remover</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            ) : <p>Nenhum notebook no site ainda.</p>
          )}
        </div>

        {/* SEÇÃO 2: FERRAMENTA DE IA */}
        <div className="admin-section">
          <Card.Title as="h4" className="mb-3">Adicionar Novo Notebook com IA</Card.Title>
          <Form onSubmit={handleSearchWithAI}>
            <Form.Group><Form.Label>Pesquisar modelo de notebook</Form.Label>
              <div className="d-flex">
                <Form.Control type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Ex: Dell G15 5530" disabled={loadingAI}/>
                <Button type="submit" className="ms-2" variant="primary" disabled={loadingAI}>
                  {loadingAI ? <Spinner as="span" animation="border" size="sm"/> : 'Buscar'}
                </Button>
              </div>
            </Form.Group>
          </Form>

          <div className="mt-4">
            {loadingAI && <div className="text-center"><p>IA pesquisando...</p><Spinner animation="border" variant="light" /></div>}
            {aiSuggestions.length > 0 && <>
              <h5 className="mt-4">Sugestões da IA:</h5>
              <ListGroup>
                {aiSuggestions.map((suggestion, index) => (
                  <ListGroup.Item key={index} className="d-flex justify-content-between align-items-center">
                    <div><strong>{suggestion.name}</strong><div className="text-muted small">{formatFullSpecs(suggestion)}</div></div>
                    <Button variant="success" size="sm" onClick={() => handleShowAddModal(suggestion)}>Revisar & Adicionar</Button>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </>}
          </div>
        </div>
      </Card.Body>

      {/* MODAL UNIFICADO PARA ADICIONAR E EDITAR */}
      <Modal show={showModal} onHide={handleCloseModal} centered size="lg" data-bs-theme="dark">
        <Modal.Header closeButton className="bg-dark text-white border-bottom border-secondary">
          <Modal.Title>{modalMode === 'add' ? 'Revisar Sugestão e Adicionar' : 'Editar Notebook'}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-dark text-white">
          <Form>
            <Row>
              {/* Coluna da Imagem e Campos Principais */}
              <Col md={4} className="text-center">
                <img src={modalData.image_url || ''} alt={modalData.name} className="img-fluid rounded mb-3" style={{ maxHeight: '150px' }} />
                <Form.Group className="mb-2"><Form.Label>URL da Imagem</Form.Label><Form.Control id="image_url" type="text" value={modalData.image_url || ''} onChange={handleModalFieldChange} /></Form.Group>
                <Form.Group className="mb-2"><Form.Label>Nome</Form.Label><Form.Control id="name" type="text" value={modalData.name || ''} onChange={handleModalFieldChange} /></Form.Group>
                <Form.Group className="mb-2"><Form.Label>Preço (R$)</Form.Label><Form.Control id="price" type="number" step="0.01" value={modalData.price || ''} onChange={handleModalFieldChange} /></Form.Group>
              </Col>
              {/* Coluna das Especificações Detalhadas */}
              <Col md={8}>
                <Form.Group className="mb-3"><Form.Label>Descrição</Form.Label><Form.Control id="description" as="textarea" rows={3} value={modalData.description || ''} onChange={handleModalFieldChange} /></Form.Group>
                
                {/* Seção CPU */}
                <h6 className="gradient-text mt-3 mb-2" onClick={() => toggleSection('cpu')} style={{cursor: 'pointer'}}>
                  Detalhes da CPU {expandedSections.cpu ? '−' : '+'}
                </h6>
                <Collapse in={expandedSections.cpu}><div>
                  <Form.Group className="mb-2"><Form.Label>CPU Detalhes</Form.Label><Form.Control id="cpu_details" type="text" value={modalData.cpu_details || ''} onChange={handleModalFieldChange} /></Form.Group>
                  {/* Adicione outros campos da CPU aqui da mesma forma */}
                </div></Collapse>
                <hr className="border-secondary"/>

                {/* Seção GPU */}
                <h6 className="gradient-text mt-3 mb-2" onClick={() => toggleSection('gpu')} style={{cursor: 'pointer'}}>
                  Detalhes da GPU {expandedSections.gpu ? '−' : '+'}
                </h6>
                <Collapse in={expandedSections.gpu}><div>
                    <Form.Group className="mb-2"><Form.Label>GPU Detalhes</Form.Label><Form.Control id="gpu_details" type="text" value={modalData.gpu_details || ''} onChange={handleModalFieldChange} /></Form.Group>
                    <Form.Group className="mb-2"><Form.Label>TGP Detectado (W)</Form.Label><Form.Control id="tgp_detectado" type="number" value={modalData.tgp_detectado || ''} onChange={handleModalFieldChange} /></Form.Group>
                    <Form.Group className="mb-2"><Form.Label>TGP Range</Form.Label><Form.Control id="tgp_range" type="text" value={modalData.tgp_range || ''} onChange={handleModalFieldChange} /></Form.Group>
                </div></Collapse>
                <hr className="border-secondary"/>

                {/* Adicione outras seções (RAM, Tela, etc.) aqui seguindo o mesmo padrão de Collapse */}

              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer className="bg-dark text-white border-top border-secondary">
          <Button variant="secondary" onClick={handleCloseModal}>Cancelar</Button>
          <Button variant="primary" className="btn-gemini" onClick={handleSaveFromModal} disabled={submitting}>
            {submitting ? <Spinner size="sm"/> : (modalMode === 'add' ? 'Adicionar ao Site' : 'Salvar Alterações')}
          </Button>
        </Modal.Footer>
      </Modal>
    </Card>
  );
};

export default AdminPage;