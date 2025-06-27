// src/components/NotebookDetailPage.js - Página de Detalhes do Notebook (FINAL SEM TESTES EM JOGOS)

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Container, Row, Col, Spinner, Alert, Card, Button, Collapse } from 'react-bootstrap';
import '../globals/theme.css';

const NotebookDetailPage = () => {
  const { id } = useParams();
  const [notebook, setNotebook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentImage, setCurrentImage] = useState('');

  // Estados para controlar a expansão das seções
  const [showSpecsDetails, setShowSpecsDetails] = useState(false);
  const [showPerformanceDetails, setShowPerformanceDetails] = useState(false);

  useEffect(() => {
    async function fetchNotebookDetails() {
      setLoading(true);
      setError('');

      const { data, error: fetchError } = await supabase
        .from('notebooks')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) {
        console.error('Erro ao buscar detalhes do notebook:', fetchError);
        setError('Não foi possível carregar os detalhes do notebook.');
        setNotebook(null);
      } else if (data) {
        setNotebook(data);
        setCurrentImage(data.image_url || 'https://via.placeholder.com/600x450?text=Sem+Imagem');
      } else {
        setError('Notebook não encontrado.');
        setNotebook(null);
      }
      setLoading(false);
    }

    if (id) {
      fetchNotebookDetails();
    }
  }, [id]);

  // Funções auxiliares de formatação
  const formatNumber = (value) => {
    if (typeof value === 'number' && !isNaN(value)) {
      return value.toFixed(2);
    }
    return 'N/A';
  };
  const formatStorage = (gb) => {
    if (typeof gb === 'number' && !isNaN(gb)) {
      if (gb >= 1024 && gb % 1024 === 0) {
        return `${gb / 1024}TB`;
      }
      return `${gb}GB`;
    }
    return 'N/A';
  };
  const formatPrice = (price) => {
      if (typeof price === 'number' && !isNaN(price)) {
          return `R$ ${price.toFixed(2).replace('.', ',')}`;
      }
      return 'N/A';
  };

  // Funções para extrair a marca do nome (se não tiver coluna dedicada `brand`)
  const getBrandFromName = (name) => {
    if (!name) return 'N/A';
    const brand = name.split(' ')[0];
    return brand;
  };

  // PLACEHOLDER PARA OFERTAS (Para simular a imagem)
  const mockOffers = [
    { id: 1, retailer: 'Amazon', price: notebook?.price || 1000.00, url: 'https://www.amazon.com.br/', logo: 'https://via.placeholder.com/30x30?text=A' },
    { id: 2, retailer: 'Magazine Luiza', price: (notebook?.price ? notebook.price + 200 : 1200.00), url: 'https://www.magazineluiza.com.br/', logo: 'https://via.placeholder.com/30x30?text=ML' },
    { id: 3, retailer: 'Mercado Livre', price: (notebook?.price ? notebook.price + 300 : 1300.00), url: 'https://www.mercadolivre.com.br/', logo: 'https://via.placeholder.com/30x30?text=ML' },
  ];

  if (loading) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" variant="light" />
        <p className="mt-2">Carregando detalhes do notebook...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  if (!notebook) {
    return (
      <Container className="mt-5">
        <Alert variant="secondary">Notebook não encontrado ou não disponível.</Alert>
      </Container>
    );
  }

  return (
    <Container className="my-5 pt-5 pb-5 px-md-8" data-bs-theme="dark">
      <Card bg="dark" text="white" className="p-5 rounded-4 shadow-lg">
        <Row>
          {/* COLUNA ESQUERDA (IMAGEM E ESPECIFICAÇÕES) */}
          <Col md={7} lg={7} className="d-flex flex-column">
            {/* Seção da Imagem e Galeria */}
            <div className="main-image-container mb-4 text-center w-100">
              <img
                src={currentImage}
                alt={notebook.name}
                className="img-fluid rounded shadow-lg"
                style={{ maxHeight: '500px', objectFit: 'contain', width: '100%' }}
                onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/600x450?text=Imagem+Inv%C3%A1lida'; }}
              />
            </div>
            {/* Galeria de Miniaturas (abaixo da imagem principal) */}
            <div className="thumbnail-gallery d-flex justify-content-center flex-wrap gap-2 mt-3 w-100 mb-5">
              {notebook.image_url && (
                <img
                  src={notebook.image_url}
                  alt={`${notebook.name}`}
                  className={`img-thumbnail rounded ${currentImage === notebook.image_url ? 'border border-primary border-3' : ''}`}
                  style={{ width: '100px', height: '75px', objectFit: 'cover', cursor: 'pointer' }}
                  onClick={() => setCurrentImage(notebook.image_url)}
                  onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/100x75?text=Erro'; }}
                />
              )}
            </div>

            {/* SEÇÃO DE ESPECIFICAÇÕES (AGORA OCUPA TODA A COLUNA ESQUERDA ABAIXO DA IMAGEM) */}
            <h3 className="gradient-text mb-2 text-center fs-3">
                Especificações
                <Button
                    variant="outline-secondary"
                    size="sm"
                    className="ms-2 gpu-expand-button"
                    onClick={() => setShowSpecsDetails(prev => !prev)}
                >
                    {showSpecsDetails ? '-' : '+'}
                </Button>
            </h3>
            <Collapse in={showSpecsDetails}>
                <div> {/* Conteúdo da especificação dentro do Collapse */}
                    <ul className="list-unstyled detail-list px-3">
                        {/* PROCESSADOR */}
                        <li className="py-1">
                            <strong>PROCESSADOR:</strong> <span className="text-white text-end">{notebook.cpu_details || '...'}</span>
                            <ul className="list-unstyled ps-4 small"> {/* Sub-lista para detalhes aninhados */}
                                {notebook.cpu_cores && <li>Núcleos: <span className="text-white">{notebook.cpu_cores}</span></li>}
                                {notebook.cpu_threads && <li>Threads: <span className="text-white">{notebook.cpu_threads}</span></li>}
                                {notebook.cpu_base_ghz && <li>Frequência Base: <span className="text-white">{formatNumber(notebook.cpu_base_ghz)}GHz</span></li>}
                                {notebook.cpu_turbo_ghz && <li>Frequência Turbo: <span className="text-white">{formatNumber(notebook.cpu_turbo_ghz)}GHz</span></li>}
                            </ul>
                        </li>
                        <hr className="border-secondary mt-2 mb-5" />
                        {/* PLACA DE VÍDEO */}
                        <li className="py-1">
                            <strong>PLACA DE VIDEO:</strong> <span className="text-white text-end">{notebook.gpu_details || '...'}</span>
                            <ul className="list-unstyled ps-4 small"> {/* Sub-lista para detalhes aninhados */}
                                {notebook.gpu_brand && <li>Marca GPU: <span className="text-white">{notebook.gpu_brand}</span></li>}
                                {notebook.gpu_series && <li>Série GPU: <span className="text-white">{notebook.gpu_series}</span></li>}
                                {notebook.gpu_vram_gb && <li>VRAM: <span className="text-white">{notebook.gpu_vram_gb}GB GDDR</span></li>}
                                {notebook.tgp_detectado && <li>TGP: <span className="text-white">{notebook.tgp_detectado}W</span></li>}
                                {notebook.tgp_range && <li>TGP Range: <span className="text-white">{notebook.tgp_range}</span></li>}
                            </ul>
                        </li>
                        <hr className="border-secondary mt-2 mb-5" />
                        {/* MEMÓRIA RAM - AGORA COM SUB-LISTA */}
                        <li className="py-1">
                            <strong>MEMÓRIA RAM:</strong> <span className="text-white text-end">{notebook.ram_details || '...'}</span>
                            <ul className="list-unstyled ps-4 small">
                                {notebook.ram_size_gb && <li>Tamanho RAM: <span className="text-white">{notebook.ram_size_gb} GB</span></li>}
                            </ul>
                        </li>
                        <hr className="border-secondary mt-2 mb-5" />
                        {/* ARMAZENAMENTO - AGORA COM SUB-LISTA */}
                        <li className="py-1">
                            <strong>ARMAZENAMENTO:</strong> <span className="text-white text-end">{notebook.storage_details || '...'}</span>
                            <ul className="list-unstyled ps-4 small">
                                {notebook.storage_gb && <li>Tamanho Armazenamento: <span className="text-white">{formatStorage(notebook.storage_gb)}</span></li>}
                            </ul>
                        </li>
                      <hr className="border-secondary mt-2 mb-5" />
                        {/* TELA - AGORA COM SUB-LISTA */}
                        <li className="py-1">
                            <strong>TELA:</strong> <span className="text-white text-end">{notebook.screen_details || '...'}</span>
                            <ul className="list-unstyled ps-4 small">
                                {notebook.screen_size_inches && <li>Tamanho Tela: <span className="text-white">{formatNumber(notebook.screen_size_inches)}”</span></li>}
                                {notebook.screen_hz && <li>Taxa Hz: <span className="text-white">{notebook.screen_hz}Hz</span></li>}
                                {notebook.screen_nits && <li>Brilho (Nits): <span className="text-white">{notebook.screen_nits} Nits</span></li>}
                                {notebook.screen_panel_type && <li>Tipo Painel: <span className="text-white">{notebook.screen_panel_type}</span></li>}
                            </ul>
                        </li>
                        <hr className="border-secondary mt-2 mb-5" /> 
                        {/* TECLADO - AGORA COM SUB-LISTA */}
                        <li className="py-1">
                            <strong>TECLADO:</strong> <span className="text-white text-end">{notebook.keyboard_details || '...'}</span>
                            <ul className="list-unstyled ps-4 small">
                                {notebook.keyboard_type_feature && <li>Tipo Teclado: <span className="text-white">{notebook.keyboard_type_feature}</span></li>}
                            </ul>
                        </li>
                        <hr className="border-secondary mt-2 mb-5" />
                        {/* BATERIA */}
                        <li className="py-1">
                            <strong>BATERIA:</strong> <span className="text-white text-end">{notebook.battery_details || '...'}</span>
                        </li>
                        <hr className="border-secondary mt-2 mb-5" />
                        {/* CARREGADOR - AGORA COMO TÍTULO PRINCIPAL */}
                        <li className="py-1">
                            <strong>CARREGADOR:</strong> <span className="text-white text-end">{notebook.charger_wattage ? notebook.charger_wattage + 'W' : '...'}</span>
                        </li>
                    </ul>
                </div>
            </Collapse>
          </Col>

          {/* COLUNA DIREITA (DETALHES PRINCIPAIS, PREÇOS E DESEMPENHO) */}
          <Col md={5} lg={5} className="d-flex flex-column">
            <h1 className="gradient-text mb-2">{notebook.name}</h1>
            {/* Marca do Notebook como na imagem */}
            <p className="text-muted small mb-3">Marca: <span className="text-white">{getBrandFromName(notebook.name)}</span></p>
            {/* Avaliação (Placeholder) */}
            <div className="text-white-50 small mb-3">⭐⭐⭐⭐⭐ (0)</div>

            {/* Seção de Melhores Preços (topo da coluna direita) */}
            <h3 className="gradient-text mt-3 mb-3">MELHORES PREÇOS</h3>
            <div className="best-prices-section mb-5">
              {mockOffers.map(offer => (
                <Card key={offer.id} bg="secondary" text="white" className="mb-2 offer-card">
                  <Card.Body className="d-flex align-items-center">
                    <img src={offer.logo} alt={offer.retailer} className="me-3 rounded" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
                    <div className="flex-grow-1">
                      <h6 className="my-0 text-white">{notebook.name.split(',')[0]}</h6>
                      <p className="my-0 text-info">{formatPrice(offer.price)}</p>
                    </div>
                    <a href={offer.url} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-info">
                      {offer.retailer.includes('Amazon') ? 'amazon.com.br' : offer.retailer}
                    </a>
                  </Card.Body>
                </Card>
              ))}
            </div>
            <hr className="border-secondary mt-2 mb-5" />
            {/* Seção de Desempenho e Eficiência (AGORA NA COLUNA DIREITA, ALINHADA AO TOPO DA COLUNA DA ESQUERDA) */}
            <h3 className="gradient-text mt-5 mb-1 fs-3"> {/* Aumentado mt-5 para mais espaço */}
                Desempenho
                <Button
                    variant="outline-secondary"
                    size="sm"
                    className="ms-2 gpu-expand-button"
                    onClick={() => setShowPerformanceDetails(prev => !prev)}
                >
                    {showPerformanceDetails ? '-' : '+'}
                </Button>
            </h3>
            <Collapse in={showPerformanceDetails}>
                <div> {/* Conteúdo do desempenho dentro do Collapse */}
                    <ul className="list-unstyled detail-list px-3">
                        <li className="d-flex justify-content-between py-1"><strong>FPS Médio (1080p Ultra):</strong> <span className="text-white text-end">{notebook.fps_medio_1080p_ultra || 'N/A'}</span></li>
                        <li className="d-flex justify-content-between py-1"><strong>Performance/Watt:</strong> <span className="text-white text-end">{formatNumber(notebook.performance_por_watt)}</span></li>
                        <li className="d-flex justify-content-between py-1"><strong>Desempenho Relativo:</strong> <span className="text-white text-end">{formatNumber(notebook.desempenho_relativo)}%</span></li>
                        <li className="d-flex justify-content-between py-1"><strong>Perda Percentual:</strong> <span className="text-white text-end">{formatNumber(notebook.perda_percentual)}%</span></li>
                        <li className="d-flex justify-content-between py-1"><strong>Ganho Eficiência Percentual:</strong> <span className="text-white text-end">{formatNumber(notebook.ganho_eficiencia_percentual)}%</span></li>
                        <li className="d-flex justify-content-between py-1"><strong>TGP Range:</strong> <span className="text-white text-end">{notebook.tgp_range || 'N/A'}</span></li>
                    </ul>
                </div>
            </Collapse>
          </Col>
        </Row>
      </Card>
    </Container>
  );
};

export default NotebookDetailPage;