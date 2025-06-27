// src/components/FilterModal.js - VERSÃO FINAL OTIMIZADA E COMPLETA COM LÓGICA "APLICAR FILTROS"

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Modal, Button, Form, Row, Col, Collapse } from 'react-bootstrap';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';

const FilterModal = ({ show, onHide, filters, setFilters }) => {
  // ESTADO TEMPORÁRIO PARA OS FILTROS DENTRO DO MODAL
  const [localFilters, setLocalFilters] = useState(filters);

  // Estados para controlar a expansão das seções de CPU
  const [expandIntelCpu, setExpandIntelCpu] = useState(false);
  const [expandAmdCpu, setExpandAmdCpu] = useState(false);
  
  // NOVOS ESTADOS para controlar a expansão das seções de GPU por marca
  const [expandNvidiaGpu, setExpandNvidiaGpu] = useState(false);
  const [expandAmdGpu, setExpandAmdGpu] = useState(false);
  const [expandIntelGpu, setExpandIntelGpu] = useState(false);

  // Opções para os filtros (AGORA MEMOIZADAS COM useMemo)
  const cpuIntelSeriesOptions = useMemo(() => ['i3', 'i5', 'i7', 'i9'], []);
  const cpuIntelGenerationOptions = useMemo(() => [11, 12, 13, 14], []);
  const cpuAmdSeriesOptions = useMemo(() => ['Ryzen 3', 'Ryzen 5', 'Ryzen 7', 'Ryzen 9'], []);
  const cpuAmdGenerationOptions = useMemo(() => [6000, 7000, 8000, 9000], []);
  
  const allGpuSeriesOptions = useMemo(() => [
    // NVIDIA
    { brand: 'NVIDIA', value: 'RTX 3050', label: 'RTX 3050' },
    { brand: 'NVIDIA', value: 'RTX 3050 Ti', label: 'RTX 3050 Ti' },
    { brand: 'NVIDIA', value: 'RTX 3060', label: 'RTX 3060' },
    { brand: 'NVIDIA', value: 'RTX 4050', label: 'RTX 4050' },
    { brand: 'NVIDIA', value: 'RTX 4060', label: 'RTX 4060' },
    { brand: 'NVIDIA', value: 'RTX 4070', label: 'RTX 4070' },
    { brand: 'NVIDIA', value: 'RTX 4080', label: 'RTX 4080' },
    { brand: 'NVIDIA', value: 'RTX 4090', label: 'RTX 4090' },
    { brand: 'NVIDIA', value: 'GTX 1650', label: 'GTX 1650' },
    // AMD - Adicionado GPUs integradas
    { brand: 'AMD', value: 'Radeon Graphics', label: 'Radeon Graphics (Integrada)' },
    { brand: 'AMD', value: 'RX 6600M', label: 'RX 6600M' },
    { brand: 'AMD', value: 'RX 6700M', label: 'RX 6700M' },
    { brand: 'AMD', value: 'RX 6800M', label: 'RX 6800M' },
    { brand: 'AMD', value: 'RX 7600M', label: 'RX 7600M' },
    { brand: 'AMD', value: 'RX 7700S', label: 'RX 7700S' },
    // Intel - Adicionado GPUs integradas e dedicadas
    { brand: 'Intel', value: 'UHD Graphics', label: 'UHD Graphics (Integrada)' },
    { brand: 'Intel', value: 'Iris Xe', label: 'Iris Xe Graphics (Integrada)' },
    { brand: 'Intel', value: 'Arc A350M', label: 'Arc A350M' },
    { brand: 'Intel', value: 'Arc A370M', label: 'Arc A370M' },
    { brand: 'Intel', value: 'Arc A550M', label: 'Arc A550M' },
    { brand: 'Intel', value: 'Arc A770M', label: 'Arc A770M' },
  ], []); // Array de dependências vazio, pois as opções são estáticas

  const ramSizeGbOptions = useMemo(() => [8, 16, 32, 64], []);
  const storageGbOptions = useMemo(() => [512, 1024, 2048, 4096], []);

  const screenSizeInchesOptions = useMemo(() => [14.0, 15.6, 16.0, 17.3], []);
  const screenHzOptions = useMemo(() => [60, 90, 120, 144, 165, 240, 300], []);
  const screenPanelTypeOptions = useMemo(() => ['TN', 'IPS', 'VA', 'mini-LED', 'OLED'], []);
  const keyboardTypeFeatureOptions = useMemo(() => ['RGB', 'Branco'], []);


  // Sincroniza o localFilters com os filters recebidos da HomePage ao abrir o modal
  // E também sincroniza os estados de expansão
  useEffect(() => {
    if (show) {
      setLocalFilters(filters); // Carrega os filtros atuais da HomePage para o estado local do modal
      // Sincroniza os estados de expansão com base nos filtros carregados
      setExpandIntelCpu(filters.cpuIntelSeries.length > 0 || filters.cpuIntelGeneration.length > 0);
      setExpandAmdCpu(filters.cpuAmdSeries.length > 0 || filters.cpuAmdGeneration.length > 0);
      
      // Sincroniza estados de expansão da GPU
      setExpandNvidiaGpu(filters.gpuBrand.includes('NVIDIA') || filters.gpuSeries.some(s => allGpuSeriesOptions.find(opt => opt.value === s && opt.brand === 'NVIDIA')));
      setExpandAmdGpu(filters.gpuBrand.includes('AMD') || filters.gpuSeries.some(s => allGpuSeriesOptions.find(opt => opt.value === s && opt.brand === 'AMD')));
      setExpandIntelGpu(filters.gpuBrand.includes('Intel') || filters.gpuSeries.some(s => allGpuSeriesOptions.find(opt => opt.value === s && opt.brand === 'Intel')));

    } else {
      // Colapsa tudo ao fechar o modal (independentemente de ter aplicado ou não)
      setExpandIntelCpu(false);
      setExpandAmdCpu(false);
      setExpandNvidiaGpu(false);
      setExpandAmdGpu(false);
      setExpandIntelGpu(false);
    }
  }, [show, filters, allGpuSeriesOptions]); // allGpuSeriesOptions agora é uma dependência estável

  // Função genérica para lidar com checkboxes (múltipla seleção) - AGORA ATUALIZA localFilters
  const handleCheckboxChange = useCallback((filterName, value) => { // Memoizado com useCallback
    setLocalFilters(prevLocalFilters => {
      const currentValues = prevLocalFilters[filterName];
      if (currentValues.includes(value)) {
        return { ...prevLocalFilters, [filterName]: currentValues.filter(item => item !== value) };
      } else {
        return { ...prevLocalFilters, [filterName]: [...currentValues, value] };
      }
    });
  }, []); // Dependências vazias, pois setLocalFilters é estável

  // Função para lidar com sliders (range) - AGORA ATUALIZA localFilters
  const handleSliderChange = useCallback((filterName, value) => { // Memoizado com useCallback
    setLocalFilters(prevLocalFilters => ({
      ...prevLocalFilters,
      [filterName]: value
    }));
  }, []); // Dependências vazias, pois setLocalFilters é estável

  // Função para lidar com a seleção da marca de CPU (Intel/AMD) via botão de expansão
  const handleCpuBrandToggle = useCallback((brand, isExpanded) => { // Memoizado com useCallback
    setLocalFilters(prevLocalFilters => {
        let newCpuBrand = [...prevLocalFilters.cpuBrand];
        if (isExpanded) { // Se está expandindo, significa que o usuário quer incluir a marca
            if (!newCpuBrand.includes(brand)) {
                newCpuBrand.push(brand);
            }
        } else { // Se está colapsando, o usuário pode não querer mais a marca
            newCpuBrand = newCpuBrand.filter(b => b !== brand);
            // Opcional: Limpar as séries/gerações se a marca é desmarcada ao colapsar
            if (brand === 'intel') {
                prevLocalFilters.cpuIntelSeries = [];
                prevLocalFilters.cpuIntelGeneration = [];
            } else if (brand === 'amd') {
                prevLocalFilters.cpuAmdSeries = [];
                prevLocalFilters.cpuAmdGeneration = [];
            }
        }
        return { ...prevLocalFilters, cpuBrand: newCpuBrand };
    });
  }, []); // Dependências vazias, pois setLocalFilters é estável

  // Função para lidar com a seleção da marca de GPU (NVIDIA/AMD/Intel) via botão de expansão
  const handleGpuBrandToggle = useCallback((brand, isExpanded) => { // Memoizado com useCallback
    setLocalFilters(prevLocalFilters => {
        let newGpuBrand = [...prevLocalFilters.gpuBrand];
        if (isExpanded) {
            if (!newGpuBrand.includes(brand)) {
                newGpuBrand.push(brand);
            }
        } else {
            newGpuBrand = newGpuBrand.filter(b => b !== brand);
            // Ao colapsar/desmarcar a marca, limpa as séries de GPU daquela marca
            const remainingGpuSeries = prevLocalFilters.gpuSeries.filter(selectedSeries => 
                !allGpuSeriesOptions.find(opt => opt.value === selectedSeries && opt.brand === brand)
            );
            prevLocalFilters.gpuSeries = remainingGpuSeries;
        }
        return { ...prevLocalFilters, gpuBrand: newGpuBrand };
    });
  }, [allGpuSeriesOptions]); // allGpuSeriesOptions é uma dependência aqui

  // Função para limpar todos os filtros - AGORA LIMPA localFilters
  const handleClearFilters = useCallback(() => { // Memoizado com useCallback
    setLocalFilters({
      cpuBrand: [], cpuIntelSeries: [], cpuIntelGeneration: [], cpuAmdSeries: [], cpuAmdGeneration: [], cpuGhZ: [2.0, 6.0],
      gpuBrand: [], gpuSeries: [],
      ramSizeGb: [], storageGb: [],
      screenSizeInches: [], screenHz: [], screenNits: [200, 1600], screenPanelType: [],
      keyboardTypeFeature: [],
    });
    // Colapsa todas as seções visuais
    setExpandIntelCpu(false);
    setExpandAmdCpu(false);
    setExpandNvidiaGpu(false);
    setExpandAmdGpu(false);
    setExpandIntelGpu(false);
  }, []); // Dependências vazias

  // Função para aplicar filtros - AGORA PASSA localFilters para setFilters da HomePage
  const handleApplyFilters = useCallback(() => { // Memoizado com useCallback
    setFilters(localFilters); // ATUALIZA O ESTADO GLOBAL DOS FILTROS NA HOMEPAGE
    onHide(); // Fecha o modal
  }, [localFilters, setFilters, onHide]); // Dependências


  // Funções auxiliares para renderizar grupos de checkboxes (memoizado também)
  const renderCheckboxGroup = useCallback((title, filterName, options, isNumeric = false) => (
    <Form.Group className="mb-3">
      <Form.Label className="fw-bold">{title}</Form.Label>
      {options.map(option => (
        <Form.Check
          key={option.value || option}
          type="checkbox"
          id={`${filterName}-${option.value || option}`}
          label={option.label || option}
          checked={localFilters[filterName].includes(isNumeric ? (option.value || option) : (option.value || option))}
          onChange={() => handleCheckboxChange(filterName, isNumeric ? (option.value || option) : (option.value || option))}
          className="text-white-50"
        />
      ))}
    </Form.Group>
  ), [localFilters, handleCheckboxChange]); // Dependências de useCallback


  return (
    <Modal show={show} onHide={onHide} size="lg" centered scrollable data-bs-theme="dark">
      <Modal.Header closeButton className="bg-dark text-white border-bottom border-secondary">
        <Modal.Title>Filtros de Notebooks</Modal.Title>
      </Modal.Header>
      <Modal.Body className="bg-dark text-white">
        <Form>
          {/* Seção Processador (CPU) */}
          <h5 className="gradient-text mb-3">Processador (CPU)</h5>

          {/* Filtros Intel (Botão de Expansão Compacto) */}
          <div className="mb-3 p-3 border rounded-3 border-secondary">
              <div className="d-flex align-items-center mb-2">
                <Form.Label className="fw-bold my-0">Intel</Form.Label>
                <Button
                  variant="outline-info"
                  size="sm"
                  className="ms-2 gpu-expand-button"
                  onClick={() => {
                      const newState = !expandIntelCpu;
                      setExpandIntelCpu(newState);
                      handleCpuBrandToggle('intel', newState);
                  }}
                >
                  {expandIntelCpu ? '-' : '+'}
                </Button>
              </div>
              <Collapse in={expandIntelCpu}>
                  <div id="intel-cpu-collapse">
                      {renderCheckboxGroup('Série Intel', 'cpuIntelSeries', cpuIntelSeriesOptions)}
                      {renderCheckboxGroup('Geração Intel', 'cpuIntelGeneration', cpuIntelGenerationOptions, true)}
                  </div>
              </Collapse>
          </div>

          {/* Filtros AMD (Botão de Expansão Compacto) */}
          <div className="mb-3 p-3 border rounded-3 border-secondary">
              <div className="d-flex align-items-center mb-2">
                <Form.Label className="fw-bold my-0">AMD</Form.Label>
                <Button
                  variant="outline-info"
                  size="sm"
                  className="ms-2 gpu-expand-button"
                  onClick={() => {
                      const newState = !expandAmdCpu;
                      setExpandAmdCpu(newState);
                      handleCpuBrandToggle('amd', newState);
                  }}
                >
                  {expandAmdCpu ? '-' : '+'}
                </Button>
              </div>
              <Collapse in={expandAmdCpu}>
                  <div id="amd-cpu-collapse">
                      {renderCheckboxGroup('Série AMD', 'cpuAmdSeries', cpuAmdSeriesOptions)}
                      {renderCheckboxGroup('Geração AMD', 'cpuAmdGeneration', cpuAmdGenerationOptions, true)}
                  </div>
              </Collapse>
          </div>

          {/* Frequência (GHz) - Slider */}
          <Col md={12} className="mb-4">
            <Form.Label className="fw-bold">Frequência (GHz): {localFilters.cpuGhZ[0]} - {localFilters.cpuGhZ[1]}</Form.Label>
            <Slider
              range
              min={2.0}
              max={6.0}
              step={0.1}
              value={localFilters.cpuGhZ}
              onChange={(value) => handleSliderChange('cpuGhZ', value)}
              trackStyle={{ backgroundColor: '#7434fe' }}
              handleStyle={[{ borderColor: '#7434fe' }, { borderColor: '#7434fe' }]}
              railStyle={{ backgroundColor: '#495057' }}
            />
          </Col>

          <hr className="border-secondary my-4" />

          {/* Seção Placa de Vídeo (GPU) - AGORA COM BOTÕES DE EXPANSÃO POR MARCA */}
          <h5 className="gradient-text mb-3">Placa de Vídeo (GPU)</h5>
          
          {/* Filtros NVIDIA (Botão de Expansão Compacto) */}
          <div className="mb-3 p-3 border rounded-3 border-secondary">
              <div className="d-flex align-items-center mb-2">
                <Form.Label className="fw-bold my-0">NVIDIA</Form.Label>
                <Button
                  variant="outline-info"
                  size="sm"
                  className="ms-2 gpu-expand-button"
                  onClick={() => {
                      const newState = !expandNvidiaGpu;
                      setExpandNvidiaGpu(newState);
                      handleGpuBrandToggle('NVIDIA', newState);
                  }}
                >
                  {expandNvidiaGpu ? '-' : '+'}
                </Button>
              </div>
              <Collapse in={expandNvidiaGpu}>
                  <div id="nvidia-gpu-collapse">
                      {renderCheckboxGroup('Séries NVIDIA', 'gpuSeries', allGpuSeriesOptions.filter(opt => opt.brand === 'NVIDIA'))}
                  </div>
              </Collapse>
          </div>

          {/* Filtros AMD (Botão de Expansão Compacto) */}
          <div className="mb-3 p-3 border rounded-3 border-secondary">
              <div className="d-flex align-items-center mb-2">
                <Form.Label className="fw-bold my-0">AMD</Form.Label>
                <Button
                  variant="outline-info"
                  size="sm"
                  className="ms-2 gpu-expand-button"
                  onClick={() => {
                      const newState = !expandAmdGpu;
                      setExpandAmdGpu(newState);
                      handleGpuBrandToggle('AMD', newState);
                  }}
                >
                  {expandAmdGpu ? '-' : '+'}
                </Button>
              </div>
              <Collapse in={expandAmdGpu}>
                  <div id="amd-gpu-collapse">
                      {renderCheckboxGroup('Séries AMD', 'gpuSeries', allGpuSeriesOptions.filter(opt => opt.brand === 'AMD'))}
                  </div>
              </Collapse>
          </div>

          {/* Filtros Intel (Botão de Expansão Compacto) */}
          <div className="mb-3 p-3 border rounded-3 border-secondary">
              <div className="d-flex align-items-center mb-2">
                <Form.Label className="fw-bold my-0">Intel</Form.Label>
                <Button
                  variant="outline-info"
                  size="sm"
                  className="ms-2 gpu-expand-button"
                  onClick={() => {
                      const newState = !expandIntelGpu;
                      setExpandIntelGpu(newState);
                      handleGpuBrandToggle('Intel', newState);
                  }}
                >
                  {expandIntelGpu ? '-' : '+'}
                </Button>
              </div>
              <Collapse in={expandIntelGpu}>
                  <div id="intel-gpu-collapse">
                      {renderCheckboxGroup('Séries Intel', 'gpuSeries', allGpuSeriesOptions.filter(opt => opt.brand === 'Intel'))}
                  </div>
              </Collapse>
          </div>

          <hr className="border-secondary my-4" />

          {/* Seção Memória RAM */}
          <h5 className="gradient-text mb-3">Memória RAM</h5>
          {renderCheckboxGroup('Tamanho (GB)', 'ramSizeGb', ramSizeGbOptions, true)}

          <hr className="border-secondary my-4" />

          {/* Seção Armazenamento */}
          <h5 className="gradient-text mb-3">Armazenamento</h5>
          {renderCheckboxGroup('Tamanho (GB/TB)', 'storageGb', storageGbOptions.map(gb => ({ value: gb, label: gb >= 1024 ? `${gb / 1024}TB` : `${gb}GB` })), true)}

          <hr className="border-secondary my-4" />

          {/* Seção Tela */}
          <h5 className="gradient-text mb-3">Tela</h5>
          <Row>
            <Col md={6}>
              {renderCheckboxGroup('Tamanho (Polegadas)', 'screenSizeInches', screenSizeInchesOptions, true)}
            </Col>
            <Col md={6}>
              {renderCheckboxGroup('Taxa de Atualização (Hz)', 'screenHz', screenHzOptions, true)}
            </Col>
            <Col md={12} className="mb-4">
              <Form.Label className="fw-bold">Brilho (Nits): {localFilters.screenNits[0]} - {localFilters.screenNits[1]}</Form.Label>
              <Slider
                range
                min={200}
                max={1600}
                step={50}
                value={localFilters.screenNits}
                onChange={(value) => handleSliderChange('screenNits', value)}
                trackStyle={{ backgroundColor: '#7434fe' }}
                handleStyle={[{ borderColor: '#7434fe' }, { borderColor: '#7434fe' }]}
                railStyle={{ backgroundColor: '#495057' }}
              />
            </Col>
            <Col md={12}>
              {renderCheckboxGroup('Tipo de Painel', 'screenPanelType', screenPanelTypeOptions)}
            </Col>
          </Row>

          <hr className="border-secondary my-4" />

          {/* Seção Teclado */}
          <h5 className="gradient-text mb-3">Teclado</h5>
          {renderCheckboxGroup('Tipo', 'keyboardTypeFeature', keyboardTypeFeatureOptions)}

        </Form>
      </Modal.Body>
      <Modal.Footer className="bg-dark text-white border-top border-secondary">
        <Button variant="outline-light" onClick={handleClearFilters} className="me-2">Limpar Filtros</Button>
        <Button variant="primary" className="btn-gemini" onClick={handleApplyFilters}>Aplicar Filtros</Button>
      </Modal.Footer>
    </Modal>
  );
};

export default FilterModal;