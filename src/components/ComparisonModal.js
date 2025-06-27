// src/components/ComparisonModal.js - VERSÃO COM TODOS OS NOVOS CAMPOS

import React, { useState, useEffect } from 'react';
import { Modal, Button, Spinner, Table } from 'react-bootstrap'; // Removido Container, Row, Col por não estarem em uso.
import { supabase } from '../lib/supabaseClient'; 

const ComparisonModal = ({ show, onHide, notebookIds, onRemoveFromComparison }) => {
  const [comparedNotebooksData, setComparedNotebooksData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedGpuDetails, setExpandedGpuDetails] = useState({});

  useEffect(() => {
    const fetchComparedNotebooks = async () => {
      if (notebookIds.length > 0) {
        setLoading(true);
        const { data, error } = await supabase
          .from('notebooks')
          .select('*') 
          .in('id', notebookIds);

        if (error) {
          console.error('Erro ao buscar notebooks para comparação:', error);
          setComparedNotebooksData([]);
        } else {
          const orderedData = notebookIds.map(id => data.find(nb => nb.id === id)).filter(Boolean);
          setComparedNotebooksData(orderedData);
          const initialExpandedState = orderedData.reduce((acc, notebook) => {
            acc[notebook.id] = false; 
            return acc;
          }, {});
          setExpandedGpuDetails(initialExpandedState);
        }
        setLoading(false);
      } else {
        setComparedNotebooksData([]);
        setLoading(false);
      }
    };

    if (show) {
      fetchComparedNotebooks();
    }
  }, [show, notebookIds]);

  // Função para alternar a expansão dos detalhes da GPU de um notebook específico (todos juntos)
  const toggleAllGpuDetails = () => {
    const allExpanded = Object.values(expandedGpuDetails).every(val => val);
    const newState = comparedNotebooksData.reduce((acc, nb) => {
      acc[nb.id] = !allExpanded; 
      return acc;
    }, {});
    setExpandedGpuDetails(newState);
  };


  // Função auxiliar para formatar valores numéricos com 2 casas decimais, ou 'N/A'
  const formatNumber = (value) => {
    if (typeof value === 'number' && !isNaN(value)) {
      return value.toFixed(2);
    }
    return 'N/A';
  };
  // Função para formatar GB para TB se for 1024 ou mais
  const formatStorage = (gb) => {
    if (typeof gb === 'number' && !isNaN(gb)) {
      if (gb >= 1024 && gb % 1024 === 0) {
        return `${gb / 1024}TB`;
      }
      return `${gb}GB`;
    }
    return 'N/A';
    };
    // Função para formatar preço
    const formatPrice = (price) => {
        if (typeof price === 'number' && !isNaN(price)) {
            return `R$ ${price.toFixed(2).replace('.', ',')}`;
        }
        return 'N/A';
    };

  return (
    <Modal show={show} onHide={onHide} size="xl" centered data-bs-theme="dark">
      <Modal.Header closeButton className="bg-dark text-white border-bottom border-secondary">
        <Modal.Title>Comparação de Notebooks</Modal.Title>
      </Modal.Header>
      <Modal.Body className="bg-dark text-white">
        {loading ? (
          <div className="text-center"><Spinner animation="border" variant="light" /><p className="mt-2">Carregando notebooks para comparação...</p></div>
        ) : comparedNotebooksData.length === 0 ? (
          <p className="text-center">Selecione notebooks para comparar.</p>
        ) : (
          <div className="table-responsive">
            <Table striped bordered hover variant="dark" className="comparison-table">
              <thead>
                <tr>
                  <th className="feature-column">Característica</th>
                  {comparedNotebooksData.map(notebook => (
                    <th key={notebook.id} className="text-center product-column">
                      <img 
                        src={notebook.image_url || 'https://via.placeholder.com/100x75?text=Sem+Imagem'} 
                        alt={notebook.name} 
                        className="img-fluid rounded mb-2" 
                        style={{ maxHeight: '75px' }}
                        onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/100x75?text=Imagem+Inv%C3%A1lida'; }}
                      /><br/>
                      <strong>{notebook.name}</strong>
                      <Button 
                        variant="outline-danger" 
                        size="sm" 
                        className="ms-2 mt-2" 
                        onClick={() => onRemoveFromComparison(notebook.id)}
                      >
                        Remover
                      </Button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Linhas de Comparação - Novos e Existentes */}
                <tr><th>Preço</th>
                    {comparedNotebooksData.map(nb => <td key={nb.id}>{formatPrice(nb.price)}</td>)}</tr>
                <tr><th>Descrição</th>
                    {comparedNotebooksData.map(nb => <td key={nb.id}>{nb.description || 'N/A'}</td>)}</tr>
                <tr><th>URL do Produto</th>
                    {comparedNotebooksData.map(nb => <td key={nb.id}>
                        {nb.product_url ? <a href={nb.product_url} target="_blank" rel="noopener noreferrer">Link</a> : 'N/A'}
                    </td>)}</tr>
                
                <tr><th>CPU</th>
                    {comparedNotebooksData.map(nb => <td key={nb.id}>{nb.cpu_details || 'N/A'}</td>)}</tr>
                <tr><th>CPU Base GHz</th>
                    {comparedNotebooksData.map(nb => <td key={nb.id}>{nb.cpu_base_ghz ? formatNumber(nb.cpu_base_ghz) + ' GHz' : 'N/A'}</td>)}</tr>
                <tr><th>CPU Intel Série</th>
                    {comparedNotebooksData.map(nb => <td key={nb.id}>{nb.cpu_intel_series || 'N/A'}</td>)}</tr>
                <tr><th>CPU Intel Geração</th>
                    {comparedNotebooksData.map(nb => <td key={nb.id}>{nb.cpu_intel_generation || 'N/A'}</td>)}</tr>
                <tr><th>CPU AMD Série</th>
                    {comparedNotebooksData.map(nb => <td key={nb.id}>{nb.cpu_amd_series || 'N/A'}</td>)}</tr>
                <tr><th>CPU AMD Geração</th>
                    {comparedNotebooksData.map(nb => <td key={nb.id}>{nb.cpu_amd_generation || 'N/A'}</td>)}</tr>

                {/* LINHA DA GPU COM BOTÃO DE EXPANSÃO */}
                <tr>
                  <th>
                    GPU 
                    <Button 
                      variant="outline-secondary" 
                      size="sm" 
                      className="ms-2 gpu-expand-button" 
                      onClick={toggleAllGpuDetails} 
                    >
                      {Object.values(expandedGpuDetails).every(val => val) ? '-' : '+'}
                    </Button>
                  </th>
                  {comparedNotebooksData.map(nb => (
                    <td key={nb.id}>
                      {nb.gpu_details || 'N/A'}
                      {expandedGpuDetails[nb.id] && ( 
                        <div className="gpu-expanded-details mt-2 border-top border-secondary pt-2">
                          <div><strong>Marca:</strong> {nb.gpu_brand || 'N/A'}</div>
                          <div><strong>Série:</strong> {nb.gpu_series || 'N/A'}</div>
                          <div><strong>TGP Detectado:</strong> {nb.tgp_detectado ? formatNumber(nb.tgp_detectado) + 'W' : 'N/A'}</div>
                          <div><strong>TGP Range:</strong> {nb.tgp_range || 'N/A'}</div>
                          <div><strong>FPS Médio (1080p Ultra):</strong> {nb.fps_medio_1080p_ultra ? formatNumber(nb.fps_medio_1080p_ultra) : 'N/A'}</div>
                          <div><strong>Performance/Watt:</strong> {nb.performance_por_watt ? formatNumber(nb.performance_por_watt) : 'N/A'}</div>
                          <div><strong>Desempenho Relativo:</strong> {nb.desempenho_relativo ? formatNumber(nb.desempenho_relativo) + '%' : 'N/A'}</div>
                          <div><strong>Perda Percentual:</strong> {nb.perda_percentual ? formatNumber(nb.perda_percentual) + '%' : 'N/A'}</div>
                          <div><strong>Ganho Eficiência Percentual:</strong> {nb.ganho_eficiencia_percentual ? formatNumber(nb.ganho_eficiencia_percentual) + '%' : 'N/A'}</div>
                        </div>
                      )}
                    </td>
                  ))}
                </tr>
                {/* FIM DA LINHA DA GPU */}

                <tr><th>RAM</th>
                    {comparedNotebooksData.map(nb => <td key={nb.id}>{nb.ram_details || 'N/A'}</td>)}</tr>
                <tr><th>RAM (GB)</th>
                    {comparedNotebooksData.map(nb => <td key={nb.id}>{nb.ram_size_gb ? nb.ram_size_gb + ' GB' : 'N/A'}</td>)}</tr>

                <tr><th>Armazenamento</th>
                    {comparedNotebooksData.map(nb => <td key={nb.id}>{nb.storage_details || 'N/A'}</td>)}</tr>
                <tr><th>Armazenamento (GB/TB)</th> 
                    {comparedNotebooksData.map(nb => <td key={nb.id}>{nb.storage_gb ? formatStorage(nb.storage_gb) : 'N/A'}</td>)}</tr>
                
                <tr><th>Tela</th>
                    {comparedNotebooksData.map(nb => <td key={nb.id}>{nb.screen_details || 'N/A'}</td>)}</tr>
                <tr><th>Tamanho da Tela (Pol.)</th>
                    {comparedNotebooksData.map(nb => <td key={nb.id}>{nb.screen_size_inches ? formatNumber(nb.screen_size_inches) + '”' : 'N/A'}</td>)}</tr>
                <tr><th>Tela Hz</th>
                    {comparedNotebooksData.map(nb => <td key={nb.id}>{nb.screen_hz ? nb.screen_hz + 'Hz' : 'N/A'}</td>)}</tr>
                <tr><th>Nits da Tela</th>
                    {comparedNotebooksData.map(nb => <td key={nb.id}>{nb.screen_nits ? nb.screen_nits + ' Nits' : 'N/A'}</td>)}</tr>
                <tr><th>Tipo de Painel da Tela</th>
                    {comparedNotebooksData.map(nb => <td key={nb.id}>{nb.screen_panel_type || 'N/A'}</td>)}</tr>

                <tr><th>Teclado</th>
                    {comparedNotebooksData.map(nb => <td key={nb.id}>{nb.keyboard_details || 'N/A'}</td>)}</tr>
                <tr><th>Tipo de Teclado</th>
                    {comparedNotebooksData.map(nb => <td key={nb.id}>{nb.keyboard_type_feature || 'N/A'}</td>)}</tr>
                
                <tr><th>Bateria</th>
                    {comparedNotebooksData.map(nb => <td key={nb.id}>{nb.battery_details || 'N/A'}</td>)}</tr>
              </tbody>
            </Table>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer className="bg-dark text-white border-top border-secondary">
        <Button variant="secondary" onClick={onHide}>Fechar</Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ComparisonModal;