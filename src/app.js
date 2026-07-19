import express from 'express'
import AdminJS from 'adminjs'
// ... outros imports

export async function createApp() {
  const app = express()
  app.use(express.json()) // Garante que o express entenda JSON

  // --- AQUI ENTRA O SEU PADRÃO DE RESPOSTA ---
  
  // 1. Rota de Sucesso Simples
  app.get('/api/sucesso', (req, res) => {
    return res.status(200).json({
      "success": true,
      "data": {}, 
      "message": "Operação realizada com sucesso."
    });
  });

  // 2. Rota de Lista Paginada
  app.get('/api/items', (req, res) => {
    return res.status(200).json({
      "success": true,
      "data": [], 
      "pagination": {
        "page": 1,
        "totalPages": 1,
        "totalItems": 0
      }
    });
  });

  // Configurações do AdminJS...
  const admin = new AdminJS({ ... })

  return { app, admin }
}