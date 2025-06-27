// src/components/ProductCard.js - VERSÃO COM MODO DE SELEÇÃO E NAVEGAÇÃO PARA DETALHES

import React from 'react';
import { Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom'; // Importado Link
import '../globals/ProductCard.css'; 

// Recebe as props: isSelectionMode, isCompared, onCardClick
const ProductCard = ({ product, isSelectionMode, isCompared, onCardClick }) => {

  // Função auxiliar para formatar a configuração completa para a descrição do card
  const formatFullSpecs = (productData) => {
    const specs = [];
    if (productData.cpu_details) specs.push(productData.cpu_details);
    if (productData.gpu_details) specs.push(productData.gpu_details);
    if (productData.ram_details) specs.push(productData.ram_details);
    if (productData.storage_details) specs.push(productData.storage_details); 
    if (productData.screen_details) specs.push(productData.screen_details);
    if (productData.keyboard_details) specs.push(productData.keyboard_details);
    
    return specs.length > 0 ? specs.filter(Boolean).join(' + ') : productData.description || 'Nenhuma descrição disponível.';
  };

  // Função para formatar preço
  const formatPrice = (price) => {
      if (typeof price === 'number' && !isNaN(price)) {
          return `R$ ${price.toFixed(2).replace('.', ',')}`;
      }
      return 'N/A';
  };

  return (
    <Card
      // Adiciona classes condicionais para o modo de seleção e card selecionado
      className={`h-100 product-card ${isSelectionMode ? 'selection-mode' : ''} ${isCompared ? 'selected-for-comparison' : ''}`}
      // O onClick do Card só fará a seleção se estiver no modo de seleção.
      // A navegação agora é feita pelo botão "Ver Detalhes"
      onClick={isSelectionMode ? () => onCardClick(product.id) : undefined} // Só clica para selecionar se no modo seleção
      style={{ cursor: isSelectionMode ? 'pointer' : 'default' }} // Muda o cursor apenas no modo de seleção
    >
      <Card.Img 
        variant="top" 
        src={product.image_url || 'https://via.placeholder.com/400x300?text=Sem+Imagem'} 
        className="product-card-img"
        // Adicionando um fallback para imagem quebrada
        onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/400x300?text=Imagem+Inv%C3%A1lida'; }}
      />
      <Card.Body className="d-flex flex-column">
        <Card.Title className="product-card-title">{product.name}</Card.Title>
        <Card.Text className="flex-grow-1 product-card-desc">
          {formatFullSpecs(product)}
        </Card.Text>
        
        {/* Preço e botão "Ver Detalhes" aparecem apenas se NÃO estiver no modo de seleção */}
        {!isSelectionMode && (
          <div className="mt-auto">
            {product.price && <h4 className="product-card-price">{formatPrice(product.price)}</h4>}
            {product.product_url ? (
                <Button 
                    as={Link} // Usa o Link do react-router-dom
                    to={`/notebook/${product.id}`} // Navega para a página de detalhes
                    className="w-100 btn-gemini" 
                    // No Link, target="_blank" e rel="noopener noreferrer" geralmente vão no próprio Link/<a>, não no Button.
                    // Para abrir em nova aba com Link, o ideal é usar onClick e window.open ou passar a prop target no Link se for <a>.
                    // Se a product_url for externa, o Link deve ser um <a> normal ou o Link component deve ser customizado.
                    // Por simplicidade, vou manter o Link para a rota interna. Se a URL externa for prioridade, use <a href={product.product_url}>
                >
                    Ver Detalhes
                </Button>
            ) : (
                <Button className="w-100 btn-gemini" disabled>
                    Detalhes (Link Indisponível)
                </Button>
            )}
          </div>
        )}
        
        {/* Indicador de status de seleção no modo de seleção */}
        {isSelectionMode && (
          <div className="text-center mt-2">
            {isCompared ? <span className="text-success fw-bold">Selecionado para Comparar</span> : <span className="text-muted">Clique para Selecionar</span>}
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default ProductCard;