// ARQUIVO: src/components/AdminPage.js - VERSÃO COM A SINTAXE CORRIGIDA

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Table, Spinner, Alert, Card, Form, Button, ListGroup, Modal, Row, Col, Collapse, InputGroup } from 'react-bootstrap';
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
  const [modalData, setModalData] = useState({ offers: [] });
  const [submitting, setSubmitting] = useState(false);
  const [expandedSections, setExpandedSections] = useState({});

  const fetchExistingNotebooks = useCallback(async () => {
    setLoadingNotebooks(true);
    const { data, error } = await supabase.from('notebooks').select('*, ofertas(*)').order('created_at', { ascending: false });
    if (error) {
      setMessage({ type: 'danger', text: 'Falha ao carregar notebooks existentes.' });
    } else {
      setExistingNotebooks(data);
    }
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
    let initialData;
    if (mode === 'add') {
      initialData = { ...data, image_url: data.imageUrl, offers: data.offers || [] };
    } else {
      initialData = { ...data, offers: data.ofertas || [] };
    }
    setModalData(initialData);
    setShowModal(true);
    setExpandedSections({ general: true });
  };

  const handleCloseModal = () => setShowModal(false);

  const handleModalFieldChange = (e) => {
    const { id, value } = e.target;
    setModalData(prev => ({ ...prev, [id]: value }));
  };

  const handleOfferChange = (index, field, value) => {
    const updatedOffers = [...modalData.offers];
    updatedOffers[index][field] = value;
    setModalData(prev => ({ ...prev, offers: updatedOffers }));
  };

  const handleAddOfferField = () => {
    const newOffers = [...(modalData.offers || []), { store_name: '', price: '', url: '' }];
    setModalData(prev => ({ ...prev, offers: newOffers }));
  };

  const handleRemoveOfferField = (index) => {
    const updatedOffers = modalData.offers.filter((_, i) => i !== index);
    setModalData(prev => ({ ...prev, offers: updatedOffers }));
  };

  const handleSaveFromModal = async () => {
    setSubmitting(true);
    setMessage({ type: '', text: '' });

    const { offers, ofertas, ...notebookDataToSave } = modalData;

    let notebookId = notebookDataToSave.id;
    let error;

    if (modalMode === 'add') {
      delete notebookDataToSave.id;
      const { data: newNotebook, error: insertError } = await supabase.from('notebooks').insert(notebookDataToSave).select().single();
      if (insertError) error = insertError;
      else notebookId = newNotebook.id;
    } else {
      const { error: updateError } = await supabase.from('notebooks').update(notebookDataToSave).eq('id', notebookId);
      if (updateError) error = updateError;
    }

    if (error) {
      setMessage({ type: 'danger', text: `Erro ao salvar notebook: ${error.message}` });
      setSubmitting(false);
      return;
    }

    const { error: deleteError } = await supabase.from('ofertas').delete().eq('notebook_id', notebookId);
    if (deleteError) {
      setMessage({ type: 'warning', text: `Notebook salvo, mas erro ao limpar ofertas antigas: ${deleteError.message}` });
    }

    if (offers && offers.length > 0) {
      const offersToInsert = offers
        .filter(o => o.store_name && o.price && o.url)
        .map(offer => ({
          notebook_id: notebookId,
          store_name: offer.store_name,
          price: parseFloat(offer.price) || 0,
          url: offer.url
        }));

      if (offersToInsert.length > 0) {
        const { error: offersError } = await supabase.from('ofertas').insert(offersToInsert);
        if (offersError) {
          setMessage({ type: 'danger', text: `Notebook salvo, mas falha ao salvar preços: ${offersError.message}` });
          setSubmitting(false);
          return;
        }
      }
    }

    setMessage({ type: 'success', text: `Notebook "${notebookDataToSave.name}" e suas ofertas foram salvos com sucesso!` });
    fetchExistingNotebooks();
    handleCloseModal();
    setSubmitting(false);
  };

  const handleRemoveNotebook = async (id, name) => {
    if (window.confirm(`Tem certeza que deseja remover o notebook "${name}"? Esta ação não pode ser desfeita.`)) {
      const { error } = await supabase.from('notebooks').delete().eq('id', id);

      if (error) {
        setMessage({ type: 'danger', text: `Erro ao remover: ${error.message}` });
      } else {
        setMessage({ type: 'success', text: `"${name}" foi removido com sucesso.` });
        fetchExistingNotebooks();
      }
    }
  };

  const formatBriefSpecs = (product) => [product.cpu_details, product.gpu_details, product.ram_details].filter(Boolean).join(' | ');

  const renderFormField = (label, id, type = 'text', options = {}) => (
    <Form.Group as={Row} className="mb-2 align-items-center" controlId={id}>
      <Form.Label column sm={4} className="text-white-50 small">{label}</Form.Label>
      <Col sm={8}>
        <Form.Control size="sm" type={type} value={modalData[id] || ''} onChange={handleModalFieldChange} {...options} />
      </Col>
    </Form.Group>
  );

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };
  // --- NOVAS FUNÇÕES INTELIGENTES PARA OS CAMPOS DE CPU ---
  const handleCpuSeriesChange = (e) => {
    const { value } = e.target;
    // Checa a marca e atualiza o campo correto
    if (modalData.cpu_brand?.toLowerCase() === 'intel') {
      setModalData(prev => ({ ...prev, cpu_intel_series: value, cpu_amd_series: null }));
    } else if (modalData.cpu_brand?.toLowerCase() === 'amd') {
      setModalData(prev => ({ ...prev, cpu_amd_series: value, cpu_intel_series: null }));
    }
  };

  const handleCpuGenerationChange = (e) => {
    const { value } = e.target;
    if (modalData.cpu_brand?.toLowerCase() === 'intel') {
      setModalData(prev => ({ ...prev, cpu_intel_generation: value, cpu_amd_generation: null }));
    } else if (modalData.cpu_brand?.toLowerCase() === 'amd') {
      setModalData(prev => ({ ...prev, cpu_amd_generation: value, cpu_intel_generation: null }));
    }
  };

  return (
    <Card bg="dark" text="white" className="mb-4" data-bs-theme="dark">
      <Card.Header as="h2" className="text-center">Painel Administrativo</Card.Header>
      <Card.Body className="p-4">
        {message.text && <Alert variant={message.type} className="mb-4" onClose={() => setMessage({ type: '', text: '' })} dismissible>{message.text}</Alert>}

        <div className="admin-section mb-5">
          <Card.Title as="h4" className="mb-3">Notebooks no Site ({existingNotebooks.length})</Card.Title>
          {loadingNotebooks ? <div className="text-center"><Spinner animation="border" variant="light" /></div> : (
            <Table striped bordered hover responsive size="sm" variant="dark">
              <thead><tr><th>Nome</th><th>Especificações Resumidas</th><th style={{ width: '150px' }}>Ações</th></tr></thead>
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

        <div className="admin-section">
          <Card.Title as="h4" className="mb-3">Adicionar Novo Notebook com IA</Card.Title>
          <Form onSubmit={handleSearchWithAI}>
            <div className="d-flex"><Form.Control type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Ex: Asus ROG Strix G16" /><Button type="submit" className="ms-2" variant="primary" disabled={loadingAI}>{loadingAI ? <Spinner size="sm" /> : 'Buscar'}</Button></div>
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

      <Modal show={showModal} onHide={handleCloseModal} size="xl" centered data-bs-theme="dark" scrollable>
        <Modal.Header closeButton><Modal.Title>{modalMode === 'add' ? 'Revisar e Adicionar Notebook' : 'Editar Notebook'}</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form>
            <h5 className="gradient-text">Informações Gerais</h5>
            {renderFormField('Nome do Modelo', 'name')}
            {renderFormField('Descrição', 'description', 'textarea', { rows: 3 })}
            {renderFormField('URL da Imagem', 'image_url')}
             <hr className="my-3 border-secondary " />
            {/* --- SEÇÃO DE CPU ATUALIZADA --- */}
            <h5 className="gradient-text mb-2" onClick={() => toggleSection('cpu')} style={{ cursor: 'pointer' }}>
              Processador (CPU) {expandedSections.cpu ? '−' : '+'}
            </h5>
            <Collapse in={expandedSections.cpu}><div>
              {renderFormField('CPU Detalhes', 'cpu_details')}
              {renderFormField('Marca CPU', 'cpu_brand')}

              {/* Campo unificado para Série */}
              <Form.Group as={Row} className="mb-2 align-items-center" controlId="cpu_series_unified">
                <Form.Label column sm={4} className="text-white-50 small">Série da CPU</Form.Label>
                <Col sm={8}>
                  <Form.Control
                    size="sm"
                    type="text"
                    value={modalData.cpu_intel_series || modalData.cpu_amd_series || ''}
                    onChange={handleCpuSeriesChange}
                    placeholder="Ex: Core i7 ou Ryzen 7"
                  />
                </Col>
              </Form.Group>

              {/* Campo unificado para Geração */}
              <Form.Group as={Row} className="mb-2 align-items-center" controlId="cpu_generation_unified">
                <Form.Label column sm={4} className="text-white-50 small">Geração da CPU</Form.Label>
                <Col sm={8}>
                  <Form.Control
                    size="sm"
                    type="number"
                    value={modalData.cpu_intel_generation || modalData.cpu_amd_generation || ''}
                    onChange={handleCpuGenerationChange}
                    placeholder="Ex: 13 ou 7000"
                  />
                </Col>
              </Form.Group>

              {renderFormField('Frequência Turbo (GHz)', 'cpu_turbo_ghz', 'number', { step: "0.1" })}
              {renderFormField('Núcleos', 'cpu_cores', 'number')}
              {renderFormField('Threads', 'cpu_threads', 'number')}
            </div></Collapse>
            <hr className="my-3 border-secondary" />

            <h5 className="gradient-text mb-2" onClick={() => toggleSection('gpu')} style={{ cursor: 'pointer' }}>
              Placa de Vídeo (GPU) {expandedSections.gpu ? '−' : '+'}
            </h5>
            <Collapse in={expandedSections.gpu}><div>
              {renderFormField('GPU Detalhes', 'gpu_details')}
              {renderFormField('Marca GPU', 'gpu_brand')}
              {renderFormField('Série GPU', 'gpu_series')}
              {renderFormField('VRAM (GB)', 'gpu_vram', 'string')}
              {renderFormField('TGP Detectado (W)', 'tgp_detectado', 'number')}
              {renderFormField('Intervalo de TGP', 'tgp_range')}
            </div></Collapse>
            <hr className="my-3 border-secondary" />

            <h5 className="gradient-text mb-2" onClick={() => toggleSection('memory')} style={{ cursor: 'pointer' }}>
              Memória e Armazenamento {expandedSections.memory ? '−' : '+'}
            </h5>
            <Collapse in={expandedSections.memory}><div>
              {renderFormField('RAM Detalhes', 'ram_details')}
              {renderFormField('Armazenamento Detalhes', 'storage_details')}

            </div></Collapse>
            <hr className="my-3 border-secondary" />

            <h5 className="gradient-text mb-2" onClick={() => toggleSection('screen')} style={{ cursor: 'pointer' }}>
              Tela {expandedSections.screen ? '−' : '+'}
            </h5>
            <Collapse in={expandedSections.screen}><div>
              {renderFormField('Tela Detalhes', 'screen_details')}
              {renderFormField('Tamanho (Polegadas)', 'screen_size_inches', 'number', { step: "0.1" })}
              {renderFormField('Taxa de Atualização (Hz)', 'screen_hz', 'number')}
              {renderFormField('Brilho (Nits)', 'screen_nits', 'number')}
              {renderFormField('Tipo de Painel', 'screen_panel_type')}
            </div></Collapse>
            <hr className="my-3 border-secondary" />

            <h5 className="gradient-text mb-2" onClick={() => toggleSection('others')} style={{ cursor: 'pointer' }}>
              Outros {expandedSections.others ? '−' : '+'}
            </h5>
            <Collapse in={expandedSections.others}><div>
              {renderFormField('Iluminação do Teclado', 'keyboard_backlight')}
              {renderFormField('Bateria Detalhes', 'battery_details')}
              {renderFormField('Carregador (W)', 'charger_wattage', 'string')}
            </div></Collapse>
            <hr className="my-4 border-secondary" />
            <h5 className="gradient-text mb-2" onClick={() => toggleSection('offers')} style={{ cursor: 'pointer' }}>
              Ofertas de Preço {expandedSections.offers ? '−' : '+'}
            </h5>
            <Collapse in={expandedSections.offers}>
              <div>
                {modalData.offers && modalData.offers.map((offer, index) => (
                  <Row key={index} className="mb-2 align-items-center">
                    <Col><Form.Control size="sm" type="text" placeholder="Nome da Loja" value={offer.store_name || ''} onChange={(e) => handleOfferChange(index, 'store_name', e.target.value)} /></Col>
                    <Col><InputGroup size="sm"><InputGroup.Text>R$</InputGroup.Text><Form.Control type="number" step="0.01" placeholder="Preço" value={offer.price || ''} onChange={(e) => handleOfferChange(index, 'price', e.target.value)} /></InputGroup></Col>
                    <Col><Form.Control size="sm" type="url" placeholder="URL do Produto" value={offer.url || ''} onChange={(e) => handleOfferChange(index, 'url', e.target.value)} /></Col>
                    <Col xs="auto"><Button variant="outline-danger" size="sm" onClick={() => handleRemoveOfferField(index)}>Remover</Button></Col>
                  </Row>
                ))}
                <Button variant="outline-success" size="sm" className="mt-2" onClick={handleAddOfferField}>+ Adicionar Nova Oferta</Button>
              </div>
            </Collapse>
            <hr className="my-3 border-secondary" />
            {/* O resto do modal com as especificações de hardware continua aqui... */}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>Cancelar</Button>
          <Button variant="primary" className="btn-gemini" onClick={handleSaveFromModal} disabled={submitting}>
            {submitting ? <Spinner size="sm" /> : (modalMode === 'add' ? 'Adicionar ao Site' : 'Salvar Alterações')}
          </Button>
        </Modal.Footer>
      </Modal>
    </Card>
  );
};

export default AdminPage;