// src/components/AdminPage.js - VERSÃO FINAL COMPLETA E ATUALIZADA (COM TODOS OS NOVOS CAMPOS E EXPANSÕES)

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Table, Spinner, Alert, Card, Form, Button, ListGroup, Modal, Row, Col, Collapse } from 'react-bootstrap';
import '../globals/AdminPage.css';

const AdminPage = () => {
  // Estados para a lista de notebooks JÁ NO BANCO
  const [existingNotebooks, setExistingNotebooks] = useState([]);
  const [loadingNotebooks, setLoadingNotebooks] = useState(true);

  // Estados para a ferramenta de IA
  const [searchQuery, setSearchQuery] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [submittingId, setSubmittingId] = useState(null); 

  // Estados para o Modal de Adição (Sugestão da IA)
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedAISuggestion, setSelectedAISuggestion] = useState(null); 

  // Estados para o Modal de Edição (Notebooks Existentes)
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingNotebookId, setEditingNotebookId] = useState(null); 
  
  // Estado para controlar a expansão dos detalhes da GPU nos modais
  const [showAdvancedGpuDetails, setShowAdvancedGpuDetails] = useState(false);
  // Estado para controlar a expansão dos detalhes da CPU nos modais
  const [showCpuDetails, setShowCpuDetails] = useState(false);
  // NOVOS ESTADOS para controlar a expansão de outras seções
  const [showRamSection, setShowRamSection] = useState(false);
  const [showStorageSection, setShowStorageSection] = useState(false);
  const [showScreenSection, setShowScreenSection] = useState(false);
  const [showKeyboardSection, setShowKeyboardSection] = useState(false);
  const [showBatterySection, setShowBatterySection] = useState(false);


  // ESTADOS PARA TODOS OS CAMPOS EDITÁVEIS/VISUALIZÁVEIS NO MODAL (Reutilizados para Adição e Edição)
  const [modalName, setModalName] = useState('');
  const [modalImageUrl, setModalImageUrl] = useState('');
  const [modalPrice, setModalPrice] = useState(''); 
  const [modalDescription, setModalDescription] = useState(''); 
  const [modalProductUrl, setModalProductUrl] = useState(''); 

  const [modalCpuDetails, setModalCpuDetails] = useState('');
  const [modalCpuBaseGhZ, setModalCpuBaseGhZ] = useState(''); 
  const [modalCpuIntelSeries, setModalCpuIntelSeries] = useState(''); 
  const [modalCpuIntelGeneration, setModalCpuIntelGeneration] = useState(''); 
  const [modalCpuAmdSeries, setModalCpuAmdSeries] = useState(''); 
  const [modalCpuAmdGeneration, setModalCpuAmdGeneration] = useState(''); 
  const [modalCpuCores, setModalCpuCores] = useState(''); 
  const [modalCpuThreads, setModalCpuThreads] = useState(''); 
  const [modalCpuTurboGhZ, setModalCpuTurboGhZ] = useState(''); 

  const [modalGpuDetails, setModalGpuDetails] = useState('');
  const [modalGpuBrand, setModalGpuBrand] = useState(''); 
  const [modalGpuSeries, setModalGpuSeries] = useState(''); 
  const [modalTgpDetectado, setModalTgpDetectado] = useState('');
  const [modalFpsMedio1080pUltra, setModalFpsMedio1080pUltra] = useState('');
  const [modalPerformancePorWatt, setModalPerformancePorWatt] = useState('');
  const [modalDesempenhoRelativo, setModalDesempenhoRelativo] = useState('');
  const [modalPerdaPercentual, setModalPerdaPercentual] = useState('');
  const [modalGanhoEficienciaPercentual, setModalGanhoEficienciaPercentual] = useState('');
  const [modalTgpRange, setModalTgpRange] = useState('');
  const [modalGpuVramGb, setModalGpuVramGb] = useState(''); 

  const [modalRamDetails, setModalRamDetails] = useState('');
  const [modalRamSizeGb, setModalRamSizeGb] = useState(''); 

  const [modalStorageDetails, setModalStorageDetails] = useState(''); 
  const [modalStorageGb, setModalStorageGb] = useState(''); 

  const [modalScreenDetails, setModalScreenDetails] = useState('');
  const [modalScreenSizeInches, setModalScreenSizeInches] = useState(''); 
  const [modalScreenHz, setModalScreenHz] = useState(''); 
  const [modalScreenNits, setModalScreenNits] = useState(''); 
  const [modalScreenPanelType, setModalScreenPanelType] = useState(''); 

  const [modalKeyboardDetails, setModalKeyboardDetails] = useState('');
  const [modalKeyboardTypeFeature, setModalKeyboardTypeFeature] = useState(''); 

  const [modalBatteryDetails, setModalBatteryDetails] = useState('');
  const [modalChargerWattage, setModalChargerWattage] = useState(''); 

  // Estado unificado para mensagens de feedback
  const [message, setMessage] = useState({ type: '', text: '' });

  // Função para formatar a configuração completa do notebook para exibição na lista
  const formatFullSpecs = (product) => {
    const specs = [];
    if (product.cpu_details) specs.push(product.cpu_details);
    if (product.gpu_details) specs.push(product.gpu_details);
    if (product.ram_details) specs.push(product.ram_details);
    if (product.storage_details) specs.push(product.storage_details); 
    if (product.screen_details) specs.push(product.screen_details);
    if (product.keyboard_details) specs.push(product.keyboard_details);
    if (product.battery_details) specs.push(product.battery_details);

    return specs.filter(Boolean).join(' + ');
  };

  // Função para buscar os notebooks que já estão no nosso site
  const fetchExistingNotebooks = useCallback(async () => {
    setLoadingNotebooks(true);
    const { data, error } = await supabase
      .from('notebooks')
      .select('*') 
      .order('created_at', { ascending: false });

    if (error) {
      setMessage({ type: 'danger', text: 'Falha ao carregar notebooks existentes.' });
      console.error('Erro ao carregar notebooks existentes:', error);
    } else {
      setExistingNotebooks(data);
    }
    setLoadingNotebooks(false);
  }, []);

  useEffect(() => {
    fetchExistingNotebooks();
  }, [fetchExistingNotebooks]);

  // Função para chamar a IA (Sua Edge Function)
  const handleSearchWithAI = async (e) => {
    e.preventDefault();
    if (!searchQuery) {
      setMessage({ type: 'warning', text: 'Por favor, digite um termo de busca.' });
      return;
    }

    setLoadingAI(true);
    setMessage({ type: '', text: '' }); 
    setAiSuggestions([]); 
    // Colapsa todas as seções ao fazer nova busca
    setShowAdvancedGpuDetails(false); 
    setShowCpuDetails(false); 
    setShowRamSection(false);
    setShowStorageSection(false);
    setShowScreenSection(false);
    setShowKeyboardSection(false);
    setShowBatterySection(false);


    try {
      const { data, error } = await supabase.functions.invoke('enrich-product', {
        body: { productName: searchQuery },
      });

      if (error) throw error;
      
      console.log("Dados recebidos da IA (enrich-product):", data); 

      if (Array.isArray(data)) {
        setAiSuggestions(data);
        setMessage({ type: 'success', text: 'Sugestões da IA geradas com sucesso!' });
      } else {
        throw new Error("A resposta da IA não é um array de objetos.");
      }

    } catch (error) {
      console.error("Erro ao buscar dados da IA:", error);
      setMessage({ type: 'danger', text: 'Erro ao buscar dados da IA: ' + error.message });
    } finally {
      setLoadingAI(false);
    }
  };

  // --- Funções para PREENCHER ESTADOS DO MODAL ---
  // Esta função centraliza a lógica de preenchimento para ambos os modais
  const fillModalStates = (product) => {
    setModalName(product.name || '');
    setModalImageUrl(product.imageUrl || product.image_url || ''); 
    setModalPrice(typeof product.price === 'number' ? product.price.toFixed(2).toString() : ''); 
    setModalDescription(product.description || ''); 
    setModalProductUrl(product.product_url || ''); 

    setModalCpuDetails(product.cpu_details || '');
    setModalCpuBaseGhZ(typeof product.cpu_base_ghz === 'number' ? product.cpu_base_ghz.toString() : ''); 
    setModalCpuIntelSeries(product.cpu_intel_series || ''); 
    setModalCpuIntelGeneration(typeof product.cpu_intel_generation === 'number' ? product.cpu_intel_generation.toString() : ''); 
    setModalCpuAmdSeries(product.cpu_amd_series || ''); 
    setModalCpuAmdGeneration(typeof product.cpu_amd_generation === 'number' ? product.cpu_amd_generation.toString() : ''); 
    setModalCpuCores(typeof product.cpu_cores === 'number' ? product.cpu_cores.toString() : ''); 
    setModalCpuThreads(typeof product.cpu_threads === 'number' ? product.cpu_threads.toString() : ''); 
    setModalCpuTurboGhZ(typeof product.cpu_turbo_ghz === 'number' ? product.cpu_turbo_ghz.toString() : ''); 

    setModalGpuDetails(product.gpu_details || '');
    setModalGpuBrand(product.gpu_brand || ''); 
    setModalGpuSeries(product.gpu_series || ''); 
    setModalTgpDetectado(typeof product.tgp_detectado === 'number' ? product.tgp_detectado.toString() : '');
    setModalFpsMedio1080pUltra(typeof product.fps_medio_1080p_ultra === 'number' ? product.fps_medio_1080p_ultra.toString() : '');
    setModalPerformancePorWatt(typeof product.performance_por_watt === 'number' ? product.performance_por_watt.toFixed(2).toString() : '');
    setModalDesempenhoRelativo(typeof product.desempenho_relativo === 'number' ? product.desempenho_relativo.toFixed(2).toString() : '');
    setModalPerdaPercentual(typeof product.perda_percentual === 'number' ? product.perda_percentual.toFixed(2).toString() : '');
    setModalGanhoEficienciaPercentual(typeof product.ganho_eficiencia_percentual === 'number' ? product.ganho_eficiencia_percentual.toFixed(2).toString() : '');
    setModalTgpRange(product.tgp_range || '');
    setModalGpuVramGb(typeof product.gpu_vram_gb === 'number' ? product.gpu_vram_gb.toString() : ''); 

    setModalRamDetails(product.ram_details || '');
    setModalRamSizeGb(typeof product.ram_size_gb === 'number' ? product.ram_size_gb.toString() : ''); 

    setModalStorageDetails(product.storage_details || '');
    setModalStorageGb(typeof product.storage_gb === 'number' ? product.storage_gb.toString() : ''); 

    setModalScreenDetails(product.screen_details || '');
    setModalScreenSizeInches(typeof product.screen_size_inches === 'number' ? product.screen_size_inches.toString() : ''); 
    setModalScreenHz(typeof product.screen_hz === 'number' ? product.screen_hz.toString() : ''); 
    setModalScreenNits(typeof product.screen_nits === 'number' ? product.screen_nits.toString() : ''); 
    setModalScreenPanelType(product.screen_panel_type || ''); 

    setModalKeyboardDetails(product.keyboard_details || '');
    setModalKeyboardTypeFeature(product.keyboard_type_feature || ''); 

    setModalBatteryDetails(product.battery_details || '');
    setModalChargerWattage(typeof product.charger_wattage === 'number' ? product.charger_wattage.toString() : ''); 

    // Colapsa todas as seções ao preencher/abrir o modal
    setShowAdvancedGpuDetails(false); 
    setShowCpuDetails(false); 
    setShowRamSection(false);
    setShowStorageSection(false);
    setShowScreenSection(false);
    setShowKeyboardSection(false);
    setShowBatterySection(false);
  };


  // --- Funções para ADICIONAR NOTEBOOK (Modal de Adição de IA) ---
  const handleShowAddModal = (suggestion) => {
    setSelectedAISuggestion(suggestion);
    fillModalStates(suggestion); // Reutiliza a função de preenchimento
    setShowAddModal(true);
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
    setSelectedAISuggestion(null);
    setSubmittingId(null);
    setMessage({type: '', text: ''});
    // Colapsa todas as seções ao fechar o modal
    setShowAdvancedGpuDetails(false); 
    setShowCpuDetails(false); 
    setShowRamSection(false);
    setShowStorageSection(false);
    setShowScreenSection(false);
    setShowKeyboardSection(false);
    setShowBatterySection(false);
  };
  
  const handleAddNotebookFromAI = async () => {
    if (!selectedAISuggestion) return;

    setSubmittingId(modalName);
    setMessage({ type: '', text: '' });

    const notebookData = {
      name: modalName,
      image_url: modalImageUrl,
      price: modalPrice ? parseFloat(modalPrice) : null, 
      description: modalDescription || null, 
      product_url: modalProductUrl || null, 

      cpu_details: modalCpuDetails,
      cpu_base_ghz: modalCpuBaseGhZ ? parseFloat(modalCpuBaseGhZ) : null, 
      cpu_intel_series: modalCpuIntelSeries || null, 
      cpu_intel_generation: modalCpuIntelGeneration ? parseInt(modalCpuIntelGeneration, 10) : null, 
      cpu_amd_series: modalCpuAmdSeries || null, 
      cpu_amd_generation: modalCpuAmdGeneration ? parseInt(modalCpuAmdGeneration, 10) : null, 
      cpu_cores: modalCpuCores ? parseInt(modalCpuCores, 10) : null, 
      cpu_threads: modalCpuThreads ? parseInt(modalCpuThreads, 10) : null, 
      cpu_turbo_ghz: modalCpuTurboGhZ ? parseFloat(modalCpuTurboGhZ) : null, 

      gpu_details: modalGpuDetails,
      gpu_brand: modalGpuBrand || null, 
      gpu_series: modalGpuSeries || null, 
      tgp_detectado: modalTgpDetectado ? parseFloat(modalTgpDetectado) : null,
      fps_medio_1080p_ultra: modalFpsMedio1080pUltra ? parseFloat(modalFpsMedio1080pUltra) : null,
      performance_por_watt: modalPerformancePorWatt ? parseFloat(modalPerformancePorWatt) : null,
      desempenho_relativo: modalDesempenhoRelativo ? parseFloat(modalDesempenhoRelativo) : null,
      perda_percentual: modalPerdaPercentual ? parseFloat(modalPerdaPercentual) : null,
      ganho_eficiencia_percentual: modalGanhoEficienciaPercentual ? parseFloat(modalGanhoEficienciaPercentual) : null,
      tgp_range: modalTgpRange,
      gpu_vram_gb: modalGpuVramGb ? parseInt(modalGpuVramGb, 10) : null, 

      ram_details: modalRamDetails,
      ram_size_gb: modalRamSizeGb ? parseInt(modalRamSizeGb, 10) : null, 

      storage_details: modalStorageDetails, 
      storage_gb: modalStorageGb ? parseInt(modalStorageGb, 10) : null, 

      screen_details: modalScreenDetails,
      screen_size_inches: modalScreenSizeInches ? parseFloat(modalScreenSizeInches) : null, 
      screen_hz: modalScreenHz ? parseInt(modalScreenHz, 10) : null, 
      screen_nits: modalScreenNits ? parseInt(modalScreenNits, 10) : null, 
      screen_panel_type: modalScreenPanelType || null, 

      keyboard_details: modalKeyboardDetails,
      keyboard_type_feature: modalKeyboardTypeFeature || null, 

      battery_details: modalBatteryDetails,
      charger_wattage: modalChargerWattage ? parseInt(modalChargerWattage, 10) : null, 
    };

    if (!notebookData.name.trim()) {
      setMessage({ type: 'danger', text: 'O nome do notebook não pode estar vazio.' });
      setSubmittingId(null);
      return;
    }

    const { error } = await supabase.from('notebooks').insert([notebookData]);

    if (error) {
      console.error('Erro ao adicionar o notebook:', error);
      setMessage({ type: 'danger', text: 'Erro ao adicionar o notebook: ' + error.message });
    } else {
      setMessage({ type: 'success', text: `"${notebookData.name}" foi adicionado ao site!` });
      setAiSuggestions(currentSuggestions => currentSuggestions.filter(s => s.name !== selectedAISuggestion.name));
      fetchExistingNotebooks();
      handleCloseAddModal();
    }
    setSubmittingId(null);
  };

  // --- Funções para EDITAR NOTEBOOK EXISTENTE (Novo Modal de Edição) ---
  const handleShowEditModal = (notebook) => {
    setEditingNotebookId(notebook.id);
    fillModalStates(notebook); // Reutiliza a função de preenchimento
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingNotebookId(null);
    setSubmittingId(null);
    setMessage({type: '', text: ''});
    // Colapsa todas as seções ao fechar o modal
    setShowAdvancedGpuDetails(false); 
    setShowCpuDetails(false); 
    setShowRamSection(false);
    setShowStorageSection(false);
    setShowScreenSection(false);
    setShowKeyboardSection(false);
    setShowBatterySection(false);
  };

  const handleUpdateNotebook = async () => {
    if (!editingNotebookId) return;

    setSubmittingId(editingNotebookId);
    setMessage({ type: '', text: '' });

    const notebookData = {
      name: modalName,
      image_url: modalImageUrl,
      price: modalPrice ? parseFloat(modalPrice) : null, 
      description: modalDescription || null, 
      product_url: modalProductUrl || null, 

      cpu_details: modalCpuDetails,
      cpu_base_ghz: modalCpuBaseGhZ ? parseFloat(modalCpuBaseGhZ) : null, 
      cpu_intel_series: modalCpuIntelSeries || null, 
      cpu_intel_generation: modalCpuIntelGeneration ? parseInt(modalCpuIntelGeneration, 10) : null, 
      cpu_amd_series: modalCpuAmdSeries || null, 
      cpu_amd_generation: modalCpuAmdGeneration ? parseInt(modalCpuAmdGeneration, 10) : null, 
      cpu_cores: modalCpuCores ? parseInt(modalCpuCores, 10) : null, 
      cpu_threads: modalCpuThreads ? parseInt(modalCpuThreads, 10) : null, 
      cpu_turbo_ghz: modalCpuTurboGhZ ? parseFloat(modalCpuTurboGhZ) : null, 

      gpu_details: modalGpuDetails,
      gpu_brand: modalGpuBrand || null, 
      gpu_series: modalGpuSeries || null, 
      tgp_detectado: modalTgpDetectado ? parseFloat(modalTgpDetectado) : null,
      fps_medio_1080p_ultra: modalFpsMedio1080pUltra ? parseFloat(modalFpsMedio1080pUltra) : null,
      performance_por_watt: modalPerformancePorWatt ? parseFloat(modalPerformancePorWatt) : null,
      desempenho_relativo: modalDesempenhoRelativo ? parseFloat(modalDesempenhoRelativo) : null,
      perda_percentual: modalPerdaPercentual ? parseFloat(modalPerdaPercentual) : null,
      ganho_eficiencia_percentual: modalGanhoEficienciaPercentual ? parseFloat(modalGanhoEficienciaPercentual) : null,
      tgp_range: modalTgpRange,
      gpu_vram_gb: modalGpuVramGb ? parseInt(modalGpuVramGb, 10) : null, 

      ram_details: modalRamDetails,
      ram_size_gb: modalRamSizeGb ? parseInt(modalRamSizeGb, 10) : null, 

      storage_details: modalStorageDetails, 
      storage_gb: modalStorageGb ? parseInt(modalStorageGb, 10) : null, 

      screen_details: modalScreenDetails,
      screen_size_inches: modalScreenSizeInches ? parseFloat(modalScreenSizeInches) : null, 
      screen_hz: modalScreenHz ? parseInt(modalScreenHz, 10) : null, 
      screen_nits: modalScreenNits ? parseInt(modalScreenNits, 10) : null, 
      screen_panel_type: modalScreenPanelType || null, 

      keyboard_details: modalKeyboardDetails,
      keyboard_type_feature: modalKeyboardTypeFeature || null, 

      battery_details: modalBatteryDetails,
      charger_wattage: modalChargerWattage ? parseInt(modalChargerWattage, 10) : null, 
      updated_at: new Date().toISOString(), 
    };

    if (!notebookData.name.trim()) {
      setMessage({ type: 'danger', text: 'O nome do notebook não pode estar vazio.' });
      setSubmittingId(null);
      return;
    }

    const { error } = await supabase
      .from('notebooks')
      .update(notebookData)
      .eq('id', editingNotebookId);

    if (error) {
      console.error('Erro ao atualizar o notebook:', error);
      setMessage({ type: 'danger', text: 'Erro ao atualizar o notebook: ' + error.message });
    } else {
      setMessage({ type: 'success', text: `"${notebookData.name}" foi atualizado com sucesso!` });
      fetchExistingNotebooks();
      handleCloseEditModal();
    }
    setSubmittingId(null);
  };

  // --- Função para REMOVER NOTEBOOK EXISTENTE ---
  const handleRemoveNotebook = async (id, name) => {
    if (window.confirm(`Tem certeza que deseja remover o notebook "${name}"?`)) {
      setSubmittingId(id);
      setMessage({ type: '', text: '' });

      const { error } = await supabase
        .from('notebooks')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao remover o notebook:', error);
        setMessage({ type: 'danger', text: 'Erro ao remover o notebook: ' + error.message });
      } else {
        setMessage({ type: 'success', text: `"${name}" foi removido com sucesso!` });
        fetchExistingNotebooks();
      }
      setSubmittingId(null);
    }
  };

  return (
    <Card bg="dark" text="white" className="mb-4" data-bs-theme="dark">
      <Card.Header as="h2" className="text-center">Painel Administrativo</Card.Header>
      <Card.Body className="p-4">

        {message.text && <Alert variant={message.type} className="mb-4">{message.text}</Alert>}

        {/* SEÇÃO 1: NOTEBOOKS JÁ EXISTENTES NO SITE */}
        <div className="admin-section mb-5">
          <Card.Title as="h4" className="mb-3">Notebooks no Site ({existingNotebooks.length})</Card.Title>
          {loadingNotebooks ? (
            <div className="text-center"><Spinner animation="border" size="sm" variant="light" /><p className="mt-2">Carregando notebooks...</p></div>
          ) : (
            existingNotebooks.length > 0 ? (
              <Table striped bordered hover responsive size="sm" variant="dark">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Configuração Completa</th>
                    <th style={{ width: '150px' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {existingNotebooks.map(notebook => (
                    <tr key={notebook.id}>
                      <td>{notebook.name}</td>
                      <td>{formatFullSpecs(notebook)}</td>
                      <td>
                        <Button
                          variant="info"
                          size="sm"
                          className="me-2"
                          onClick={() => handleShowEditModal(notebook)}
                          disabled={submittingId === notebook.id}
                        >
                          {submittingId === notebook.id ? <Spinner as="span" animation="border" size="sm" /> : 'Editar'}
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleRemoveNotebook(notebook.id, notebook.name)}
                          disabled={submittingId === notebook.id}
                        >
                          {submittingId === notebook.id ? <Spinner as="span" animation="border" size="sm" /> : 'Remover'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            ) : <p>Nenhum notebook no site ainda.</p>
          )}
        </div>

        {/* SEÇÃO 2: FERRAMENTA DE ADIÇÃO COM IA */}
        <div className="admin-section">
          <Card.Title as="h4" className="mb-3">Adicionar Novo Notebook com IA</Card.Title>
          <Form onSubmit={handleSearchWithAI}>
            <Form.Group>
              <Form.Label>Pesquisar modelo de notebook</Form.Label>
              <div className="d-flex">
                <Form.Control
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ex: Dell G15 5530"
                  disabled={loadingAI}
                />
                <Button type="submit" className="ms-2" variant="primary" disabled={loadingAI}>
                  {loadingAI ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> : 'Buscar'}
                </Button>
              </div>
            </Form.Group>
          </Form>

          <div className="mt-4">
            {loadingAI && <div className="text-center"><p>IA pesquisando... isso pode levar um momento.</p><Spinner animation="border" variant="light" /></div>}

            {aiSuggestions.length > 0 && (
                <>
                    <h5 className="mt-4">Sugestões da IA:</h5>
                    <ListGroup>
                        {aiSuggestions.map((suggestion, index) => (
                            <ListGroup.Item key={index} className="d-flex justify-content-between align-items-center">
                                <div>
                                    <strong>{suggestion.name}</strong>
                                    <div className="text-muted small">{formatFullSpecs(suggestion)}</div>
                                </div>
                                <Button
                                    variant="success"
                                    size="sm"
                                    onClick={() => handleShowAddModal(suggestion)}
                                    disabled={submittingId === suggestion.name}
                                >
                                    {submittingId === suggestion.name ? <Spinner as="span" animation="border" size="sm" /> : 'Detalhes & Editar'}
                                </Button>
                            </ListGroup.Item>
                        ))}
                    </ListGroup>
                </>
            )}
          </div>
        </div>
      </Card.Body>

      {/* MODAL DE ADIÇÃO (DA IA) - AGORA COM TODOS OS NOVOS CAMPOS E EXPANSÕES */}
      <Modal show={showAddModal} onHide={handleCloseAddModal} centered size="lg" data-bs-theme="dark">
        <Modal.Header closeButton className="bg-dark text-white border-bottom border-secondary">
          <Modal.Title>Detalhes da Sugestão da IA e Adicionar</Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-dark text-white">
          {selectedAISuggestion && (
            <Form>
              <Row className="mb-3">
                <Col md={4} className="text-center">
                  <Form.Group controlId="modalAddImageUrl">
                    <img
                      src={modalImageUrl || 'https://via.placeholder.com/200x150?text=Sem+Imagem'}
                      alt={modalName}
                      className="img-fluid rounded mb-3"
                      style={{ maxWidth: '100%', height: 'auto', maxHeight: '150px', objectFit: 'cover' }}
                      onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/200x150?text=Imagem+Inv%C3%A1lida'; }}
                    />
                    <Form.Label>URL da Imagem</Form.Label>
                    <Form.Control type="text" value={modalImageUrl} onChange={(e) => setModalImageUrl(e.target.value)} />
                  </Form.Group>
                  <Form.Group controlId="modalAddName" className="mt-3">
                    <Form.Label>Nome</Form.Label>
                    <Form.Control type="text" value={modalName} onChange={(e) => setModalName(e.target.value)} />
                  </Form.Group>
                  <Form.Group controlId="modalAddPrice" className="mt-3">
                    <Form.Label>Preço (R$)</Form.Label>
                    <Form.Control type="number" step="0.01" value={modalPrice} onChange={(e) => setModalPrice(e.target.value)} />
                  </Form.Group>
                  <Form.Group controlId="modalAddProductUrl" className="mt-3">
                    <Form.Label>URL do Produto</Form.Label>
                    <Form.Control type="url" value={modalProductUrl} onChange={(e) => setModalProductUrl(e.target.value)} />
                  </Form.Group>
                </Col>
                <Col md={8}>
                  <Form.Group controlId="modalAddDescription" className="mb-3"><Form.Label>Descrição</Form.Label><Form.Control as="textarea" rows={3} value={modalDescription} onChange={(e) => setModalDescription(e.target.value)} /></Form.Group>

                  {/* Detalhes da CPU - Com Botão de Expansão */}
                  <h6 className="gradient-text mt-4 mb-2">
                      Detalhes da CPU
                      <Button
                          variant="outline-secondary"
                          size="sm"
                          className="ms-2 gpu-expand-button"
                          onClick={() => setShowCpuDetails(prev => !prev)}
                      >
                          {showCpuDetails ? '-' : '+'}
                      </Button>
                  </h6>
                  <Collapse in={showCpuDetails}>
                      <div>
                          <Form.Group controlId="modalAddCpuDetails" className="mb-3"><Form.Label>CPU Detalhada</Form.Label><Form.Control type="text" value={modalCpuDetails} onChange={(e) => setModalCpuDetails(e.target.value)} /></Form.Group>
                          <Form.Group controlId="modalAddCpuBaseGhZ" className="mb-3"><Form.Label>CPU Base GHz</Form.Label><Form.Control type="number" step="0.1" value={modalCpuBaseGhZ} onChange={(e) => setModalCpuBaseGhZ(e.target.value)} /></Form.Group>
                          <Form.Group controlId="modalAddCpuIntelSeries" className="mb-3"><Form.Label>CPU Intel Série</Form.Label><Form.Control type="text" value={modalCpuIntelSeries} onChange={(e) => setModalCpuIntelSeries(e.target.value)} /></Form.Group>
                          <Form.Group controlId="modalAddCpuIntelGeneration" className="mb-3"><Form.Label>CPU Intel Geração</Form.Label><Form.Control type="number" value={modalCpuIntelGeneration} onChange={(e) => setModalCpuIntelGeneration(e.target.value)} /></Form.Group>
                          <Form.Group controlId="modalAddCpuAmdSeries" className="mb-3"><Form.Label>CPU AMD Série</Form.Label><Form.Control type="text" value={modalCpuAmdSeries} onChange={(e) => setModalCpuAmdSeries(e.target.value)} /></Form.Group>
                          <Form.Group controlId="modalAddCpuAmdGeneration" className="mb-3"><Form.Label>CPU AMD Geração</Form.Label><Form.Control type="number" value={modalCpuAmdGeneration} onChange={(e) => setModalCpuAmdGeneration(e.target.value)} /></Form.Group>
                          <Form.Group controlId="modalAddCpuCores" className="mb-3"><Form.Label>Núcleos</Form.Label><Form.Control type="number" value={modalCpuCores} onChange={(e) => setModalCpuCores(e.target.value)} /></Form.Group>
                          <Form.Group controlId="modalAddCpuThreads" className="mb-3"><Form.Label>Threads</Form.Label><Form.Control type="number" value={modalCpuThreads} onChange={(e) => setModalCpuThreads(e.target.value)} /></Form.Group>
                          <Form.Group controlId="modalAddCpuTurboGhZ" className="mb-3"><Form.Label>Frequência Turbo (GHz)</Form.Label><Form.Control type="number" step="0.1" value={modalCpuTurboGhZ} onChange={(e) => setModalCpuTurboGhZ(e.target.value)} /></Form.Group>
                          <hr className="border-secondary"/>
                      </div>
                  </Collapse>

                  {/* Detalhes da GPU - Com Botão de Expansão */}
                  <h6 className="gradient-text mt-4 mb-2">
                      Detalhes da GPU
                      <Button
                          variant="outline-secondary"
                          size="sm"
                          className="ms-2 gpu-expand-button"
                          onClick={() => setShowAdvancedGpuDetails(prev => !prev)}
                      >
                          {showAdvancedGpuDetails ? '-' : '+'}
                      </Button>
                  </h6>
                  <Collapse in={showAdvancedGpuDetails}>
                      <div>
                          <Form.Group controlId="modalAddGpuDetails" className="mb-3"><Form.Label>GPU Detalhada</Form.Label><Form.Control type="text" value={modalGpuDetails} onChange={(e) => setModalGpuDetails(e.target.value)} /></Form.Group>
                          <Form.Group controlId="modalAddGpuBrand" className="mb-3"><Form.Label>Marca da GPU</Form.Label><Form.Control type="text" value={modalGpuBrand} onChange={(e) => setModalGpuBrand(e.target.value)} /></Form.Group>
                          <Form.Group controlId="modalAddGpuSeries" className="mb-3"><Form.Label>Série da GPU</Form.Label><Form.Control type="text" value={modalGpuSeries} onChange={(e) => setModalGpuSeries(e.target.value)} /></Form.Group>
                          <Form.Group controlId="modalAddGpuVramGb" className="mb-3"><Form.Label>VRAM (GB)</Form.Label><Form.Control type="number" value={modalGpuVramGb} onChange={(e) => setModalGpuVramGb(e.target.value)} /></Form.Group>
                          <Form.Group controlId="modalAddTgpDetectado" className="mb-3"><Form.Label>TGP Detectado (W)</Form.Label><Form.Control type="number" value={modalTgpDetectado} onChange={(e) => setModalTgpDetectado(e.target.value)} /></Form.Group>
                          <Form.Group controlId="modalAddTgpRange" className="mb-3"><Form.Label>TGP Range (Ex: 35W – 115W)</Form.Label><Form.Control type="text" value={modalTgpRange} onChange={(e) => setModalTgpRange(e.target.value)} /></Form.Group>
                          <hr className="border-secondary"/>
                          <Form.Group controlId="modalAddFpsMedio1080pUltra" className="mb-3"><Form.Label>FPS Médio (1080p Ultra)</Form.Label><Form.Control type="number" value={modalFpsMedio1080pUltra} onChange={(e) => setModalFpsMedio1080pUltra(e.target.value)} /></Form.Group>
                          <Form.Group controlId="modalAddPerformancePorWatt" className="mb-3"><Form.Label>Performance/Watt</Form.Label><Form.Control type="number" step="0.01" value={modalPerformancePorWatt} onChange={(e) => setModalPerformancePorWatt(e.target.value)} /></Form.Group>
                          <Form.Group controlId="modalAddDesempenhoRelativo" className="mb-3"><Form.Label>Desempenho Relativo (%)</Form.Label><Form.Control type="number" step="0.01" value={modalDesempenhoRelativo} onChange={(e) => setModalDesempenhoRelativo(e.target.value)} /></Form.Group>
                          <Form.Group controlId="modalAddPerdaPercentual" className="mb-3"><Form.Label>Perda Percentual (%)</Form.Label><Form.Control type="number" step="0.01" value={modalPerdaPercentual} onChange={(e) => setModalPerdaPercentual(e.target.value)} /></Form.Group>
                          <Form.Group controlId="modalAddGanhoEficienciaPercentual" className="mb-3"><Form.Label>Ganho Eficiência Percentual (%)</Form.Label><Form.Control type="number" step="0.01" value={modalGanhoEficienciaPercentual} onChange={(e) => setModalGanhoEficienciaPercentual(e.target.value)} /></Form.Group>
                      </div>
                  </Collapse>
                  <hr className="border-secondary"/>

                  {/* Outros Detalhes (RAM, Armazenamento, Tela, Teclado, Bateria) - CADA UM COM BOTÃO DE EXPANSÃO */}
                  <h6 className="gradient-text mt-4 mb-2">Outros Detalhes</h6>

                  {/* RAM Section */}
                  <h6 className="mb-2">
                    RAM
                    <Button variant="outline-secondary" size="sm" className="ms-2 gpu-expand-button" onClick={() => setShowRamSection(prev => !prev)}>
                      {showRamSection ? '-' : '+'}
                    </Button>
                  </h6>
                  <Collapse in={showRamSection}>
                    <div>
                      <Form.Group controlId="modalAddRamDetails" className="mb-3"><Form.Label>RAM Detalhada</Form.Label><Form.Control type="text" value={modalRamDetails} onChange={(e) => setModalRamDetails(e.target.value)} /></Form.Group>
                      <Form.Group controlId="modalAddRamSizeGb" className="mb-3"><Form.Label>RAM (GB)</Form.Label><Form.Control type="number" value={modalRamSizeGb} onChange={(e) => setModalRamSizeGb(e.target.value)} /></Form.Group>
                    </div>
                  </Collapse>
                  <hr className="border-secondary"/>

                  {/* Storage Section */}
                  <h6 className="mb-2">
                    Armazenamento
                    <Button variant="outline-secondary" size="sm" className="ms-2 gpu-expand-button" onClick={() => setShowStorageSection(prev => !prev)}>
                      {showStorageSection ? '-' : '+'}
                    </Button>
                  </h6>
                  <Collapse in={showStorageSection}>
                    <div>
                      <Form.Group controlId="modalAddStorageDetails" className="mb-3"><Form.Label>Armazenamento (Texto)</Form.Label><Form.Control type="text" value={modalStorageDetails} onChange={(e) => setModalStorageDetails(e.target.value)} /></Form.Group>
                      <Form.Group controlId="modalAddStorageGb" className="mb-3"><Form.Label>Armazenamento (GB)</Form.Label><Form.Control type="number" value={modalStorageGb} onChange={(e) => setModalStorageGb(e.target.value)} /></Form.Group>
                    </div>
                  </Collapse>
                  <hr className="border-secondary"/>

                  {/* Screen Section */}
                  <h6 className="mb-2">
                    Tela
                    <Button variant="outline-secondary" size="sm" className="ms-2 gpu-expand-button" onClick={() => setShowScreenSection(prev => !prev)}>
                      {showScreenSection ? '-' : '+'}
                    </Button>
                  </h6>
                  <Collapse in={showScreenSection}>
                    <div>
                      <Form.Group controlId="modalAddScreenDetails" className="mb-3"><Form.Label>Tela Detalhada</Form.Label><Form.Control type="text" value={modalScreenDetails} onChange={(e) => setModalScreenDetails(e.target.value)} /></Form.Group>
                      <Form.Group controlId="modalAddScreenSizeInches" className="mb-3"><Form.Label>Tamanho da Tela (Polegadas)</Form.Label><Form.Control type="number" step="0.1" value={modalScreenSizeInches} onChange={(e) => setModalScreenSizeInches(e.target.value)} /></Form.Group>
                      <Form.Group controlId="modalAddScreenHz" className="mb-3"><Form.Label>Tela Hz</Form.Label><Form.Control type="number" value={modalScreenHz} onChange={(e) => setModalScreenHz(e.target.value)} /></Form.Group>
                      <Form.Group controlId="modalAddScreenNits" className="mb-3"><Form.Label>Nits da Tela</Form.Label><Form.Control type="number" value={modalScreenNits} onChange={(e) => setModalScreenNits(e.target.value)} /></Form.Group>
                      <Form.Group controlId="modalAddScreenPanelType" className="mb-3"><Form.Label>Tipo de Painel da Tela</Form.Label><Form.Control type="text" value={modalScreenPanelType} onChange={(e) => setModalScreenPanelType(e.target.value)} /></Form.Group>
                    </div>
                  </Collapse>
                  <hr className="border-secondary"/>

                  {/* Keyboard Section */}
                  <h6 className="mb-2">
                    Teclado
                    <Button variant="outline-secondary" size="sm" className="ms-2 gpu-expand-button" onClick={() => setShowKeyboardSection(prev => !prev)}>
                      {showKeyboardSection ? '-' : '+'}
                    </Button>
                  </h6>
                  <Collapse in={showKeyboardSection}>
                    <div>
                      <Form.Group controlId="modalAddKeyboardDetails" className="mb-3"><Form.Label>Teclado Detalhado</Form.Label><Form.Control type="text" value={modalKeyboardDetails} onChange={(e) => setModalKeyboardDetails(e.target.value)} /></Form.Group>
                      <Form.Group controlId="modalAddKeyboardTypeFeature" className="mb-3"><Form.Label>Teclado Tipo</Form.Label><Form.Control type="text" value={modalKeyboardTypeFeature} onChange={(e) => setModalKeyboardTypeFeature(e.target.value)} /></Form.Group>
                    </div>
                  </Collapse>
                  <hr className="border-secondary"/>

                  {/* Battery Section */}
                  <h6 className="mb-2">
                    Bateria e Carregador
                    <Button variant="outline-secondary" size="sm" className="ms-2 gpu-expand-button" onClick={() => setShowBatterySection(prev => !prev)}>
                      {showBatterySection ? '-' : '+'}
                    </Button>
                  </h6>
                  <Collapse in={showBatterySection}>
                    <div>
                      <Form.Group controlId="modalAddBatteryDetails" className="mb-3"><Form.Label>Bateria Detalhada</Form.Label><Form.Control type="text" value={modalBatteryDetails} onChange={(e) => setModalBatteryDetails(e.target.value)} /></Form.Group>
                      <Form.Group controlId="modalAddChargerWattage" className="mb-3"><Form.Label>Carregador (Watts)</Form.Label><Form.Control type="number" value={modalChargerWattage} onChange={(e) => setModalChargerWattage(e.target.value)} /></Form.Group>
                    </div>
                  </Collapse>
                  <hr className="border-secondary"/>

                </Col>
              </Row>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer className="bg-dark text-white border-top border-secondary">
          <Button variant="secondary" onClick={handleCloseAddModal} disabled={submittingId}>
            Cancelar
          </Button>
          <Button variant="success" onClick={handleAddNotebookFromAI} disabled={submittingId}>
            {submittingId ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> : 'Confirmar Adição'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* NOVO MODAL DE EDIÇÃO DE NOTEBOOK EXISTENTE */}
      <Modal show={showEditModal} onHide={handleCloseEditModal} centered size="lg" data-bs-theme="dark">
        <Modal.Header closeButton className="bg-dark text-white border-bottom border-secondary">
          <Modal.Title>Editar Notebook Existente</Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-dark text-white">
          {editingNotebookId && (
            <Form>
              <Row className="mb-3">
                <Col md={4} className="text-center">
                  <Form.Group controlId="modalEditImageUrl">
                    <img
                      src={modalImageUrl || 'https://via.placeholder.com/200x150?text=Sem+Imagem'}
                      alt={modalName}
                      className="img-fluid rounded mb-3"
                      style={{ maxWidth: '100%', height: 'auto', maxHeight: '150px', objectFit: 'cover' }}
                      onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/200x150?text=Imagem+Inv%C3%A1lida'; }}
                    />
                    <Form.Label>URL da Imagem</Form.Label>
                    <Form.Control type="text" value={modalImageUrl} onChange={(e) => setModalImageUrl(e.target.value)} />
                  </Form.Group>
                  <Form.Group controlId="modalEditName" className="mt-3">
                    <Form.Label>Nome</Form.Label>
                    <Form.Control type="text" value={modalName} onChange={(e) => setModalName(e.target.value)} />
                  </Form.Group>
                  <Form.Group controlId="modalEditPrice" className="mt-3">
                    <Form.Label>Preço (R$)</Form.Label>
                    <Form.Control type="number" step="0.01" value={modalPrice} onChange={(e) => setModalPrice(e.target.value)} />
                  </Form.Group>
                  <Form.Group controlId="modalEditProductUrl" className="mt-3">
                    <Form.Label>URL do Produto</Form.Label>
                    <Form.Control type="url" value={modalProductUrl} onChange={(e) => setModalProductUrl(e.target.value)} />
                  </Form.Group>
                </Col>
                <Col md={8}>
                  <Form.Group controlId="modalEditDescription" className="mb-3"><Form.Label>Descrição</Form.Label><Form.Control as="textarea" rows={3} value={modalDescription} onChange={(e) => setModalDescription(e.target.value)} /></Form.Group>

                  {/* Detalhes da CPU - Com Botão de Expansão */}
                  <h6 className="gradient-text mt-4 mb-2">
                      Detalhes da CPU
                      <Button
                          variant="outline-secondary"
                          size="sm"
                          className="ms-2 gpu-expand-button"
                          onClick={() => setShowCpuDetails(prev => !prev)}
                      >
                          {showCpuDetails ? '-' : '+'}
                      </Button>
                  </h6>
                  <Collapse in={showCpuDetails}>
                      <div>
                          <Form.Group controlId="modalEditCpuDetails" className="mb-3"><Form.Label>CPU Detalhada</Form.Label><Form.Control type="text" value={modalCpuDetails} onChange={(e) => setModalCpuDetails(e.target.value)} /></Form.Group>
                          <Form.Group controlId="modalEditCpuBaseGhZ" className="mb-3"><Form.Label>CPU Base GHz</Form.Label><Form.Control type="number" step="0.1" value={modalCpuBaseGhZ} onChange={(e) => setModalCpuBaseGhZ(e.target.value)} /></Form.Group>
                          <Form.Group controlId="modalEditCpuIntelSeries" className="mb-3"><Form.Label>CPU Intel Série</Form.Label><Form.Control type="text" value={modalCpuIntelSeries} onChange={(e) => setModalCpuIntelSeries(e.target.value)} /></Form.Group>
                          <Form.Group controlId="modalEditCpuIntelGeneration" className="mb-3"><Form.Label>CPU Intel Geração</Form.Label><Form.Control type="number" value={modalCpuIntelGeneration} onChange={(e) => setModalCpuIntelGeneration(e.target.value)} /></Form.Group>
                          <Form.Group controlId="modalEditCpuAmdSeries" className="mb-3"><Form.Label>CPU AMD Série</Form.Label><Form.Control type="text" value={modalCpuAmdSeries} onChange={(e) => setModalCpuAmdSeries(e.target.value)} /></Form.Group>
                          <Form.Group controlId="modalEditCpuAmdGeneration" className="mb-3"><Form.Label>CPU AMD Geração</Form.Label><Form.Control type="number" value={modalCpuAmdGeneration} onChange={(e) => setModalCpuAmdGeneration(e.target.value)} /></Form.Group>
                          <Form.Group controlId="modalEditCpuCores" className="mb-3"><Form.Label>Núcleos</Form.Label><Form.Control type="number" value={modalCpuCores} onChange={(e) => setModalCpuCores(e.target.value)} /></Form.Group>
                          <Form.Group controlId="modalEditCpuThreads" className="mb-3"><Form.Label>Threads</Form.Label><Form.Control type="number" value={modalCpuThreads} onChange={(e) => setModalCpuThreads(e.target.value)} /></Form.Group>
                          <Form.Group controlId="modalEditCpuTurboGhZ" className="mb-3"><Form.Label>Frequência Turbo (GHz)</Form.Label><Form.Control type="number" step="0.1" value={modalCpuTurboGhZ} onChange={(e) => setModalCpuTurboGhZ(e.target.value)} /></Form.Group>
                          <hr className="border-secondary"/>
                      </div>
                  </Collapse>

                  {/* Detalhes da GPU - Com Botão de Expansão */}
                  <h6 className="gradient-text mt-4 mb-2">
                      Detalhes da GPU
                      <Button
                          variant="outline-secondary"
                          size="sm"
                          className="ms-2 gpu-expand-button"
                          onClick={() => setShowAdvancedGpuDetails(prev => !prev)}
                      >
                          {showAdvancedGpuDetails ? '-' : '+'}
                      </Button>
                  </h6>
                  <Collapse in={showAdvancedGpuDetails}>
                      <div>
                          <Form.Group controlId="modalEditGpuDetails" className="mb-3"><Form.Label>GPU Detalhada</Form.Label><Form.Control type="text" value={modalGpuDetails} onChange={(e) => setModalGpuDetails(e.target.value)} /></Form.Group>
                          <Form.Group controlId="modalEditGpuBrand" className="mb-3"><Form.Label>Marca da GPU</Form.Label><Form.Control type="text" value={modalGpuBrand} onChange={(e) => setModalGpuBrand(e.target.value)} /></Form.Group>
                          <Form.Group controlId="modalEditGpuSeries" className="mb-3"><Form.Label>Série da GPU</Form.Label><Form.Control type="text" value={modalGpuSeries} onChange={(e) => setModalGpuSeries(e.target.value)} /></Form.Group>
                          <Form.Group controlId="modalEditGpuVramGb" className="mb-3"><Form.Label>VRAM (GB)</Form.Label><Form.Control type="number" value={modalGpuVramGb} onChange={(e) => setModalGpuVramGb(e.target.value)} /></Form.Group>
                          <Form.Group controlId="modalEditTgpDetectado" className="mb-3"><Form.Label>TGP Detectado (W)</Form.Label><Form.Control type="number" value={modalTgpDetectado} onChange={(e) => setModalTgpDetectado(e.target.value)} /></Form.Group>
                          <Form.Group controlId="modalEditTgpRange" className="mb-3"><Form.Label>TGP Range (Ex: 35W – 115W)</Form.Label><Form.Control type="text" value={modalTgpRange} onChange={(e) => setModalTgpRange(e.target.value)} /></Form.Group>
                          <hr className="border-secondary"/>
                          <Form.Group controlId="modalEditFpsMedio1080pUltra" className="mb-3"><Form.Label>FPS Médio (1080p Ultra)</Form.Label><Form.Control type="number" value={modalFpsMedio1080pUltra} onChange={(e) => setModalFpsMedio1080pUltra(e.target.value)} /></Form.Group>
                          <Form.Group controlId="modalEditPerformancePorWatt" className="mb-3"><Form.Label>Performance/Watt</Form.Label><Form.Control type="number" step="0.01" value={modalPerformancePorWatt} onChange={(e) => setModalPerformancePorWatt(e.target.value)} /></Form.Group>
                          <Form.Group controlId="modalEditDesempenhoRelativo" className="mb-3"><Form.Label>Desempenho Relativo (%)</Form.Label><Form.Control type="number" step="0.01" value={modalDesempenhoRelativo} onChange={(e) => setModalDesempenhoRelativo(e.target.value)} /></Form.Group>
                          <Form.Group controlId="modalEditPerdaPercentual" className="mb-3"><Form.Label>Perda Percentual (%)</Form.Label><Form.Control type="number" step="0.01" value={modalPerdaPercentual} onChange={(e) => setModalPerdaPercentual(e.target.value)} /></Form.Group>
                          <Form.Group controlId="modalEditGanhoEficienciaPercentual" className="mb-3"><Form.Label>Ganho Eficiência Percentual (%)</Form.Label><Form.Control type="number" step="0.01" value={modalGanhoEficienciaPercentual} onChange={(e) => setModalGanhoEficienciaPercentual(e.target.value)} /></Form.Group>
                      </div>
                  </Collapse>
                  <hr className="border-secondary"/>

                  {/* Outros Detalhes (RAM, Armazenamento, Tela, Teclado, Bateria) - CADA UM COM BOTÃO DE EXPANSÃO */}
                  <h6 className="gradient-text mt-4 mb-2">Outros Detalhes</h6>

                  {/* RAM Section */}
                  <h6 className="mb-2">
                    RAM
                    <Button variant="outline-secondary" size="sm" className="ms-2 gpu-expand-button" onClick={() => setShowRamSection(prev => !prev)}>
                      {showRamSection ? '-' : '+'}
                    </Button>
                  </h6>
                  <Collapse in={showRamSection}>
                    <div>
                      <Form.Group controlId="modalEditRamDetails" className="mb-3"><Form.Label>RAM Detalhada</Form.Label><Form.Control type="text" value={modalRamDetails} onChange={(e) => setModalRamDetails(e.target.value)} /></Form.Group>
                      <Form.Group controlId="modalEditRamSizeGb" className="mb-3"><Form.Label>RAM (GB)</Form.Label><Form.Control type="number" value={modalRamSizeGb} onChange={(e) => setModalRamSizeGb(e.target.value)} /></Form.Group>
                    </div>
                  </Collapse>
                  <hr className="border-secondary"/>

                  {/* Storage Section */}
                  <h6 className="mb-2">
                    Armazenamento
                    <Button variant="outline-secondary" size="sm" className="ms-2 gpu-expand-button" onClick={() => setShowStorageSection(prev => !prev)}>
                      {showStorageSection ? '-' : '+'}
                    </Button>
                  </h6>
                  <Collapse in={showStorageSection}>
                    <div>
                      <Form.Group controlId="modalEditStorageDetails" className="mb-3"><Form.Label>Armazenamento (Texto)</Form.Label><Form.Control type="text" value={modalStorageDetails} onChange={(e) => setModalStorageDetails(e.target.value)} /></Form.Group>
                      <Form.Group controlId="modalEditStorageGb" className="mb-3"><Form.Label>Armazenamento (GB)</Form.Label><Form.Control type="number" value={modalStorageGb} onChange={(e) => setModalStorageGb(e.target.value)} /></Form.Group>
                    </div>
                  </Collapse>
                  <hr className="border-secondary"/>

                  {/* Screen Section */}
                  <h6 className="mb-2">
                    Tela
                    <Button variant="outline-secondary" size="sm" className="ms-2 gpu-expand-button" onClick={() => setShowScreenSection(prev => !prev)}>
                      {showScreenSection ? '-' : '+'}
                    </Button>
                  </h6>
                  <Collapse in={showScreenSection}>
                    <div>
                      <Form.Group controlId="modalEditScreenDetails" className="mb-3"><Form.Label>Tela Detalhada</Form.Label><Form.Control type="text" value={modalScreenDetails} onChange={(e) => setModalScreenDetails(e.target.value)} /></Form.Group>
                      <Form.Group controlId="modalEditScreenSizeInches" className="mb-3"><Form.Label>Tamanho da Tela (Polegadas)</Form.Label><Form.Control type="number" step="0.1" value={modalScreenSizeInches} onChange={(e) => setModalScreenSizeInches(e.target.value)} /></Form.Group>
                      <Form.Group controlId="modalEditScreenHz" className="mb-3"><Form.Label>Tela Hz</Form.Label><Form.Control type="number" value={modalScreenHz} onChange={(e) => setModalScreenHz(e.target.value)} /></Form.Group>
                      <Form.Group controlId="modalEditScreenNits" className="mb-3"><Form.Label>Nits da Tela</Form.Label><Form.Control type="number" value={modalScreenNits} onChange={(e) => setModalScreenNits(e.target.value)} /></Form.Group>
                      <Form.Group controlId="modalEditScreenPanelType" className="mb-3"><Form.Label>Tipo de Painel da Tela</Form.Label><Form.Control type="text" value={modalScreenPanelType} onChange={(e) => setModalScreenPanelType(e.target.value)} /></Form.Group>
                    </div>
                  </Collapse>
                  <hr className="border-secondary"/>

                  {/* Keyboard Section */}
                  <h6 className="mb-2">
                    Teclado
                    <Button variant="outline-secondary" size="sm" className="ms-2 gpu-expand-button" onClick={() => setShowKeyboardSection(prev => !prev)}>
                      {showKeyboardSection ? '-' : '+'}
                    </Button>
                  </h6>
                  <Collapse in={showKeyboardSection}>
                    <div>
                      <Form.Group controlId="modalEditKeyboardDetails" className="mb-3"><Form.Label>Teclado Detalhado</Form.Label><Form.Control type="text" value={modalKeyboardDetails} onChange={(e) => setModalKeyboardDetails(e.target.value)} /></Form.Group>
                      <Form.Group controlId="modalEditKeyboardTypeFeature" className="mb-3"><Form.Label>Teclado Tipo</Form.Label><Form.Control type="text" value={modalKeyboardTypeFeature} onChange={(e) => setModalKeyboardTypeFeature(e.target.value)} /></Form.Group>
                    </div>
                  </Collapse>
                  <hr className="border-secondary"/>

                  {/* Battery Section */}
                  <h6 className="mb-2">
                    Bateria e Carregador
                    <Button variant="outline-secondary" size="sm" className="ms-2 gpu-expand-button" onClick={() => setShowBatterySection(prev => !prev)}>
                      {showBatterySection ? '-' : '+'}
                    </Button>
                  </h6>
                  <Collapse in={showBatterySection}>
                    <div>
                      <Form.Group controlId="modalEditBatteryDetails" className="mb-3"><Form.Label>Bateria Detalhada</Form.Label><Form.Control type="text" value={modalBatteryDetails} onChange={(e) => setModalBatteryDetails(e.target.value)} /></Form.Group>
                      <Form.Group controlId="modalEditChargerWattage" className="mb-3"><Form.Label>Carregador (Watts)</Form.Label><Form.Control type="number" value={modalChargerWattage} onChange={(e) => setModalChargerWattage(e.target.value)} /></Form.Group>
                    </div>
                  </Collapse>
                  <hr className="border-secondary"/>

                </Col>
              </Row>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer className="bg-dark text-white border-top border-secondary">
          <Button variant="secondary" onClick={handleCloseEditModal} disabled={submittingId}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleUpdateNotebook} disabled={submittingId}>
            {submittingId ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> : 'Salvar Alterações'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Card>
  );
};

export default AdminPage;