// src/components/HomePage.js - VERSÃO FINAL COMPLETA COM TODOS OS FILTROS

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Row, Col, Spinner, Alert, Form, Button } from 'react-bootstrap';
import ProductCard from './ProductCard';
import ComparisonModal from './ComparisonModal';
import FilterModal from './FilterModal';

const HomePage = () => {
  const [notebooks, setNotebooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Estados para a Comparação
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [notebooksToCompare, setNotebooksToCompare] = useState([]);
  const MAX_COMPARISON_ITEMS = 3; 
  const MIN_COMPARISON_ITEMS = 2; 
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [comparisonMessage, setComparisonMessage] = useState({ type: '', text: '' });

  // --- ESTADOS PARA FILTROS ---
  const [showFilterModal, setShowFilterModal] = useState(false); 
  const [filters, setFilters] = useState({
    cpuBrand: [], 
    cpuIntelSeries: [], 
    cpuIntelGeneration: [], 
    cpuAmdSeries: [], 
    cpuAmdGeneration: [], 
    cpuGhZ: [2.0, 6.0], 
    gpuBrand: [], 
    gpuSeries: [], 
    ramSizeGb: [], 
    storageGb: [], 
    screenSizeInches: [], 
    screenHz: [], 
    screenNits: [200, 1600], 
    screenPanelType: [], 
    keyboardTypeFeature: [], 
  });

  // Função de busca de notebooks, AGORA COM LÓGICA DE FILTRAGEM COMPLETA
  const fetchNotebooks = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('notebooks').select('*'); 

    // --- LÓGICA DE FILTRAGEM COM OS NOVOS CAMPOS ---

    // 1. Filtros de CPU
    // Combina as condições de marca do CPU (Intel ou AMD)
    if (filters.cpuBrand.length > 0) {
        let brandConditions = [];
        if (filters.cpuBrand.includes('intel')) {
            let intelSubConditions = [];
            if (filters.cpuIntelSeries.length > 0) {
                intelSubConditions.push(`cpu_intel_series.in.("${filters.cpuIntelSeries.join('","')}")`);
            }
            if (filters.cpuIntelGeneration.length > 0) {
                intelSubConditions.push(`cpu_intel_generation.in.(${filters.cpuIntelGeneration.join(',')})`);
            }
            brandConditions.push(`and(cpu_brand.eq.Intel, ${intelSubConditions.join(',')})`); // Assumindo 'cpu_brand' existe
        }
        if (filters.cpuBrand.includes('amd')) {
            let amdSubConditions = [];
            if (filters.cpuAmdSeries.length > 0) {
                amdSubConditions.push(`cpu_amd_series.in.("${filters.cpuAmdSeries.join('","')}")`);
            }
            if (filters.cpuAmdGeneration.length > 0) {
                amdSubConditions.push(`cpu_amd_generation.in.(${filters.cpuAmdGeneration.join(',')})`);
            }
            brandConditions.push(`and(cpu_brand.eq.AMD, ${amdSubConditions.join(',')})`); // Assumindo 'cpu_brand' existe
        }
        if (brandConditions.length > 0) {
            query = query.or(`(${brandConditions.join(',')})`);
        } else if (filters.cpuBrand.length > 0) {
            // Se as marcas foram selecionadas mas nenhuma subcondição, apenas filtra pela marca
            query = query.in('cpu_brand', filters.cpuBrand);
        }
    }


    // Filtro por GHz do CPU - usando cpu_base_ghz (coluna numérica)
    if (filters.cpuGhZ[0] > 2.0 || filters.cpuGhZ[1] < 6.0) { // Verifica se o slider foi movido do padrão
        query = query.gte('cpu_base_ghz', filters.cpuGhZ[0]).lte('cpu_base_ghz', filters.cpuGhZ[1]);
    }

    // 2. Filtros de GPU
    if (filters.gpuBrand.length > 0) {
        query = query.in('gpu_brand', filters.gpuBrand); // 'gpu_brand' agora é uma coluna direta
    }
    if (filters.gpuSeries.length > 0) {
        query = query.in('gpu_series', filters.gpuSeries); // 'gpu_series' agora é uma coluna direta
    }

    // 3. Filtro por Memória RAM (ram_size_gb - coluna numérica)
    if (filters.ramSizeGb.length > 0) {
        query = query.in('ram_size_gb', filters.ramSizeGb);
    }

    // 4. Filtro por Armazenamento (storage_gb - coluna numérica)
    if (filters.storageGb.length > 0) {
        query = query.in('storage_gb', filters.storageGb);
    }

    // 5. Filtros de Tela
    if (filters.screenSizeInches.length > 0) {
        query = query.in('screen_size_inches', filters.screenSizeInches);
    }
    if (filters.screenHz.length > 0) {
        query = query.in('screen_hz', filters.screenHz);
    }
    if (filters.screenNits[0] > 200 || filters.screenNits[1] < 1600) {
        query = query.gte('screen_nits', filters.screenNits[0]).lte('screen_nits', filters.screenNits[1]);
    }
    if (filters.screenPanelType.length > 0) {
        query = query.in('screen_panel_type', filters.screenPanelType);
    }

    // 6. Filtro por Teclado
    if (filters.keyboardTypeFeature.length > 0) {
        query = query.in('keyboard_type_feature', filters.keyboardTypeFeature);
    }


    const { data, error: fetchError } = await query.order('created_at', { ascending: false });

    if (fetchError) {
      setError('Falha ao carregar os notebooks com os filtros aplicados.');
      console.error(fetchError);
    } else {
      setNotebooks(data);
    }
    setLoading(false);
  }, [filters]); 

  useEffect(() => {
    fetchNotebooks();
  }, [fetchNotebooks]);


  // --- Funções de Manipulação do Modo de Comparação (já existentes) ---
  const handleToggleSelectionMode = () => {
    setIsSelectionMode(prevMode => !prevMode);
    if (isSelectionMode) { 
      setNotebooksToCompare([]);
      setComparisonMessage({ type: '', text: '' });
    }
  };

  const handleCardClick = useCallback((notebookId) => {
    if (!isSelectionMode) {
      console.log(`Navegar para a página de detalhes do notebook: ${notebookId}`);
      return;
    }

    setNotebooksToCompare(prevSelected => {
      if (prevSelected.includes(notebookId)) {
        setComparisonMessage({ type: 'info', text: 'Notebook removido da comparação.' });
        return prevSelected.filter(id => id !== notebookId);
      } else if (prevSelected.length < MAX_COMPARISON_ITEMS) {
        setComparisonMessage({ type: 'success', text: 'Notebook adicionado para comparação.' });
        return [...prevSelected, notebookId];
      } else {
        setComparisonMessage({ type: 'warning', text: `Você pode selecionar no máximo ${MAX_COMPARISON_ITEMS} notebooks.` });
        return prevSelected;
      }
    });
  }, [isSelectionMode, MAX_COMPARISON_ITEMS]);

  const openComparisonModal = () => {
    if (notebooksToCompare.length >= MIN_COMPARISON_ITEMS) {
      setShowComparisonModal(true);
      setComparisonMessage({ type: '', text: '' });
    } else {
      setComparisonMessage({ type: 'warning', text: `Selecione pelo menos ${MIN_COMPARISON_ITEMS} notebooks para comparar.` });
    }
  };

  if (loading) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" />
        <p className="mt-2">Carregando notebooks...</p>
      </div>
    );
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  return (
    <div>
      <h2 className="mb-4 gradient-text">Notebooks em Destaque</h2>

      {/* Seção de Controles (Filtro e Comparação) */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        {/* Botão para abrir o Modal de Filtros */}
        <Button variant="outline-light" className="btn-gemini" onClick={() => setShowFilterModal(true)}>
          <i className="bi bi-funnel me-2"></i> Filtros
        </Button> 

        {/* Checkbox Global para Ativar/Desativar Modo de Seleção */}
        <Form.Check
          type="checkbox"
          id="toggleCompareMode"
          label="Ativar Modo de Comparação"
          checked={isSelectionMode}
          onChange={handleToggleSelectionMode}
          className="text-white" 
        />
        {/* Mensagem de feedback para o modo de comparação */}
        {comparisonMessage.text && (
          <Alert variant={comparisonMessage.type} className="ms-3 my-0 py-1 px-3">
            {comparisonMessage.text}
          </Alert>
        )}
      </div>

      {notebooks.length > 0 ? (
        <Row xs={1} md={2} lg={3} xl={4} className="g-4">
          {notebooks.map((notebook) => (
            <Col key={notebook.id}>
              <ProductCard
                product={notebook}
                isSelectionMode={isSelectionMode}
                isCompared={notebooksToCompare.includes(notebook.id)}
                onCardClick={handleCardClick}
              />
            </Col>
          ))}
        </Row>
      ) : (
        <Alert variant='secondary'>
          Nenhum notebook encontrado com os filtros selecionados. Tente ajustar suas opções.
        </Alert>
      )}

      {/* Botão Flutuante de Comparação (Visível apenas no modo de seleção) */}
      {isSelectionMode && (
        <div className="comparison-float-button"> 
          <Button
            variant="primary"
            className="btn-gemini"
            onClick={openComparisonModal}
            disabled={notebooksToCompare.length < MIN_COMPARISON_ITEMS}
          >
            Comparar ({notebooksToCompare.length}/{MAX_COMPARISON_ITEMS})
          </Button>
          {notebooksToCompare.length > 0 && (
            <Button 
              variant="outline-secondary" 
              size="sm" 
              className="ms-2" 
              onClick={() => {
                setNotebooksToCompare([]);
                setComparisonMessage({ type: 'info', text: 'Seleção limpa.' });
              }}
            >
              Limpar Seleção
            </Button>
          )}
        </div>
      )}

      {/* Modal de Comparação */}
      <ComparisonModal
        show={showComparisonModal}
        onHide={() => setShowComparisonModal(false)}
        notebookIds={notebooksToCompare}
        onRemoveFromComparison={handleCardClick} 
      />

      {/* Modal de Filtro */}
      <FilterModal
        show={showFilterModal}
        onHide={() => setShowFilterModal(false)}
        filters={filters}
        setFilters={setFilters}
      />
    </div>
  );
};

export default HomePage;