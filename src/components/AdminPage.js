// src/components/AdminPage.js - VERSÃO COMPLETA E REFATORADA

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Table, Spinner, Alert, Card, Form, Button, ListGroup, Modal, Row, Col } from 'react-bootstrap';
import '../globals/AdminPage.css';

const AdminPage = () => {
  const [existingNotebooks, setExistingNotebooks] = useState([]);
  const [loadingNotebooks, setLoadingNotebooks] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [loadingAI, setLoadingAI] = useState(false);
  
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [modalData, setModalData] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const fetchExistingNotebooks = useCallback(async () => {
    setLoadingNotebooks(true);
    const { data, error } = await supabase.from('notebooks').select('*').order('created_at', { ascending: false });
    if (error) setMessage({ type: 'danger', text: 'Falha ao carregar notebooks existentes.' });
    else setExistingNotebooks(data);
    setLoadingNotebooks(false);
  }, []);

  useEffect(() => { fetchExistingNotebooks(); }, [fetchExistingNotebooks]);

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
      setMessage({ type: 'danger', text: `Erro ao buscar dados da IA: ${error.message}` });
    }
    setLoadingAI(false);
  };
  
  const openModal = (mode, data) => {
    setModalMode(mode);
    setModalData(data);
    setShowModal(true);
  };

  const handleCloseModal = () => setShowModal(false);

  const handleModalFieldChange = (e) => {
    const { id, value } = e.target;
    setModalData(prev => ({ ...prev, [id]: value }));
  };

  const handleSaveFromModal = async () => {
    setSubmitting(true);
    setMessage({ type: '', text: '' });

    // Converte campos para os tipos corretos antes de salvar
    const dataToSave = Object.keys(modalData).reduce((acc, key) => {
        const numericFields = ['price', 'cpu_base_ghz', 'cpu_intel_generation', 'cpu_amd_generation', 'cpu_cores', 'cpu_threads', 'cpu_turbo_ghz', 'tgp_detectado', 'gpu_vram_gb', 'ram_size_gb', 'storage_gb', 'screen_size_inches', 'screen_hz', 'screen_nits', 'charger_wattage'];
        if (numericFields.includes(key) && modalData[key]) {
            acc[key] = parseFloat(modalData[key]);
        } else {
            acc[key] = modalData[key] || null;
        }
        return acc;
    }, {});
    
    // Remove o campo imageUrl que não existe na tabela (usamos image_url)
    delete dataToSave.imageUrl; 

    const { error } = modalMode === 'add'
      ? await supabase.from('notebooks').insert([dataToSave])
      : await supabase.from('notebooks').update(dataToSave).eq('id', modalData.id);

    if (error) {
      setMessage({ type: 'danger', text: `Erro ao salvar: ${error.message}` });
    } else {
      setMessage({ type: 'success', text: `Notebook "${dataToSave.name}" salvo com sucesso!` });
      if (modalMode === 'add') {
        setAiSuggestions(prev => prev.filter(s => s.name !== dataToSave.name));
      }
      fetchExistingNotebooks();
      handleCloseModal();
    }
    setSubmitting(false);
  };

  const handleRemoveNotebook = async (id, name) => {
    if (window.confirm(`Tem certeza de que deseja remover "${name}"?`)) {
      const { error } = await supabase.from('notebooks').delete().eq('id', id);
      if (error) setMessage({ type: 'danger', text: `Erro ao remover: ${error.message}` });
      else {
        setMessage({ type: 'success', text: `"${name}" foi removido.` });
        fetchExistingNotebooks();
      }
    }
  };

  const formatBriefSpecs = (product) => [product.cpu_details, product.gpu_details, product.ram_details].filter(Boolean).join(' | ');
  
  const renderFormField = (label, id, type = 'text', options = {}) => (
    <Form.Group as={Row} className="mb-2" controlId={id}>
      <Form.Label column sm="4" className="text-white-50 small">{label}</Form.Label>
      <Col sm="8"><Form.Control size="sm" type={type} value={modalData[id] || ''} onChange={handleModalFieldChange} {...options} /></Col>
    </Form.Group>
  );

  return (
    <Card bg="dark" text="white" className="mb-4" data-bs-theme="dark">
      <Card.Header as="h2" className="text-center">Painel Administrativo</Card.Header>
      <Card.Body className="p-4">
        {message.text && <Alert variant={message.type} className="mb-4" onClose={() => setMessage({type:'', text:''})} dismissible>{message.text}</Alert>}
        
        {/* SEÇÃO NOTEBOOKS EXISTENTES */}
        <div className="admin-section mb-5">
          <Card.Title as="h4" className="mb-3">Notebooks no Site ({existingNotebooks.length})</Card.Title>
          {loadingNotebooks ? <div className="text-center"><Spinner animation="border" variant="light" /></div> : (
            <Table striped bordered hover responsive size="sm" variant="dark">
              <thead><tr><th>Nome</th><th>Especificações Resumidas</th><th>Ações</th></tr></thead>
              <tbody>
                {existingNotebooks.map(notebook => (
                  <tr key={notebook.id}>
                    <td>{notebook.name}</td><td>{formatBriefSpecs(notebook)}</td>
                    <td>
                      <Button variant="info" size="sm" className="me-2" onClick={() => openModal('edit', notebook)}>Editar</Button>
                      <Button variant="danger" size="sm" onClick={() => handleRemoveNotebook(notebook.id, notebook.name)}>Remover</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </div>

        {/* SEÇÃO FERRAMENTA DE IA */}
        <div className="admin-section">
          <Card.Title as="h4" className="mb-3">Adicionar Novo Notebook com IA</Card.Title>
          <Form onSubmit={handleSearchWithAI}>
            <div className="d-flex"><Form.Control type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Ex: Asus ROG Strix G16" /><Button type="submit" className="ms-2" variant="primary" disabled={loadingAI}>{loadingAI ? <Spinner size="sm"/> : 'Buscar'}</Button></div>
          </Form>
          <div className="mt-4">
            {loadingAI && <div className="text-center"><p>IA pesquisando...</p><Spinner variant="light" /></div>}
            {aiSuggestions.length > 0 && <>
              <h5 className="mt-4">Sugestões da IA:</h5>
              <ListGroup>
                {aiSuggestions.map((suggestion, index) => (
                  <ListGroup.Item key={index} className="d-flex justify-content-between align-items-center">
                    <div><strong>{suggestion.name}</strong><div className="text-muted small">{suggestion.gpu_details}</div></div>
                    <Button variant="success" size="sm" onClick={() => openModal('add', suggestion)}>Revisar & Adicionar</Button>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </>}
          </div>
        </div>
      </Card.Body>

      {/* MODAL UNIFICADO */}
      <Modal show={showModal} onHide={handleCloseModal} size="xl" centered data-bs-theme="dark">
        <Modal.Header closeButton><Modal.Title>{modalMode === 'add' ? 'Revisar e Adicionar Notebook' : 'Editar Notebook'}</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col lg={4} className="text-center">
                <img src={modalData.image_url || modalData.imageUrl || ''} alt={modalData.name} className="img-fluid rounded mb-3" style={{maxHeight: '200px'}}/>
                {renderFormField('URL da Imagem', 'image_url')}
                {renderFormField('Nome do Modelo', 'name')}
                {renderFormField('Preço (BRL)', 'price', 'number', { step: "0.01" })}
                {renderFormField('URL do Produto', 'product_url', 'url')}
              </Col>
              <Col lg={8}>
                {renderFormField('Descrição', 'description', 'textarea', { rows: 4 })}
                <hr/>
                <h5 className="gradient-text">Especificações Técnicas</h5>
                {renderFormField('CPU Detalhes', 'cpu_details')}
                {renderFormField('GPU Detalhes', 'gpu_details')}
                {renderFormField('RAM Detalhes', 'ram_details')}
                {renderFormField('Tela Detalhes', 'screen_details')}
                {/* Adicione mais campos aqui conforme necessário usando a função renderFormField */}
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
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