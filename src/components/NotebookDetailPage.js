// src/components/NotebookDetailPage.js - VERSÃO FINAL E LIMPA

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
// As importações de 'Button' e 'Collapse' foram removidas
import { Container, Row, Col, Spinner, Alert, Card } from 'react-bootstrap';
import '../globals/theme.css';

const NotebookDetailPage = () => {
  const { id } = useParams();
  const [notebook, setNotebook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentImage, setCurrentImage] = useState('');

  // Os estados para 'showSpecsDetails' e 'showPerformanceDetails' foram removidos

  useEffect(() => {
    async function fetchNotebookDetails() {
      if (!id) return;
      setLoading(true);
      setError('');

      const { data, error: fetchError } = await supabase
        .from('notebooks')
        .select('*, ofertas(*, stores(*))') // Busca o notebook, suas ofertas e os detalhes das lojas
        .eq('id', id)
        .single();

      if (fetchError) {
        console.error('Erro ao buscar detalhes do notebook:', fetchError);
        setError('Não foi possível carregar os detalhes do notebook.');
      } else if (data) {
        setNotebook(data);
        setCurrentImage(data.image_url || 'https://via.placeholder.com/600x450?text=Sem+Imagem');
      } else {
        setError('Notebook não encontrado.');
      }
      setLoading(false);
    }

    fetchNotebookDetails();
  }, [id]);

  const formatPrice = (price) => {
    return typeof price === 'number' && !isNaN(price) ? `R$ ${price.toFixed(2).replace('.', ',')}` : 'N/A';
  };

  const getBrandFromName = (name) => {
    return name ? name.split(' ')[0] : 'N/A';
  };

  if (loading) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" variant="light" />
        <p className="mt-2">Carregando detalhes do notebook...</p>
      </Container>
    );
  }

  if (error) {
    return <Container className="mt-5"><Alert variant="danger">{error}</Alert></Container>;
  }

  if (!notebook) {
    return <Container className="mt-5"><Alert variant="secondary">Notebook não encontrado.</Alert></Container>;
  }

  return (
    <Container className="my-5" data-bs-theme="dark">
      <Card bg="dark" text="white" className="p-md-4 rounded-4 shadow-lg">
        <Row>
          {/* COLUNA ESQUERDA (IMAGEM E ESPECIFICAÇÕES) */}
          <Col md={7} className="d-flex flex-column">
            <div className="main-image-container mb-4 text-center">
              <img
                src={currentImage}
                alt={notebook.name}
                className="img-fluid rounded shadow-lg"
                style={{ maxHeight: '450px', objectFit: 'contain' }}
                onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/600x450?text=Imagem+Inválida'; }}
              />
            </div>
            
            <hr className="border-secondary my-4" />

            <h3 className="gradient-text mb-3">
                Especificações Técnicas
            </h3>
            <ul className="list-unstyled detail-list">
              <li className="py-2"><strong>PROCESSADOR:</strong> <span className="text-white-50">{notebook.cpu_details || 'N/A'}</span></li>
              <li className="py-2"><strong>MEMÓRIA RAM:</strong> <span className="text-white-50">{notebook.ram_details || 'N/A'}</span></li>
              <li className="py-2"><strong>ARMAZENAMENTO:</strong> <span className="text-white-50">{notebook.storage_details || 'N/A'}</span></li>
              <li className="py-2"><strong>TELA:</strong> <span className="text-white-50">{notebook.screen_details || 'N/A'}</span></li>
              <li className="py-2"><strong>ILUMINAÇÃO DO TECLADO:</strong> <span className="text-white-50">{notebook.keyboard_backlight || 'N/A'}</span></li>
              <li className="py-2"><strong>BATERIA:</strong> <span className="text-white-50">{notebook.battery_details || 'N/A'}</span></li>
            </ul>
            <h3 className="gradient-text mb-3">
            Desempenho da GPU
            </h3>
            <ul className="list-unstyled detail-list">
              <li className="d-flex justify-content-between py-2"><strong>Modelo da GPU:</strong> <span className="text-white-50 text-end">{notebook.gpu_details || 'N/A'}</span></li>
              <li className="d-flex justify-content-between py-2"><strong>TGP (Potência):</strong> <span className="text-warning fw-bold text-end">{notebook.tgp_detectado ? `${notebook.tgp_detectado}W` : 'N/A'}</span></li>
              <li className="d-flex justify-content-between py-2"><strong>Intervalo de TGP:</strong> <span className="text-white-50 text-end">{notebook.tgp_range || 'N/A'}</span></li>
            </ul>
          </Col>

          {/* COLUNA DIREITA (NOME, PREÇOS E DESEMPENHO DA GPU) */}
          <Col md={5} className="d-flex flex-column">
            <h1 className="gradient-text mb-2">{notebook.name}</h1>
            <p className="text-muted mb-3">Marca: <span className="text-white">{notebook.cpu_brand || getBrandFromName(notebook.name)}</span></p>

            <h3 className="gradient-text mt-3 mb-3">Onde Comprar</h3>
            <div className="onde-comprar-container p-3 border border-secondary rounded-3">
              {notebook.ofertas && notebook.ofertas.length > 0 ? (
                notebook.ofertas.map(offer => (
                  <Card key={offer.id} bg="secondary" text="white" className="mb-2 offer-card">
                    <Card.Body className="d-flex align-items-center p-2">
                      {offer.stores && offer.stores.logo_url && (
                        <img 
                          src={offer.stores.logo_url} 
                          alt={offer.store_name} 
                          style={{ width: '80px', height: '40px', objectFit: 'contain', marginRight: '15px' }}
                        />
                      )}
                      <div className="flex-grow-1">
                        {!offer.stores?.logo_url && <h6 className="my-0 text-white-50">{offer.store_name}</h6>}
                        <p className="my-0 text-info fw-bold fs-5">{formatPrice(offer.price)}</p>
                      </div>
                      <a href={offer.url} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-primary btn-gemini">
                        Ir à Loja
                      </a>
                    </Card.Body>
                  </Card>
                ))
              ) : (
                <p className="text-muted text-center mb-0">Nenhuma oferta encontrada no momento.</p>
              )}
            </div>

            <hr className="border-secondary my-4" />
          </Col>
        </Row>
      </Card>
    </Container>
  );
};

export default NotebookDetailPage;