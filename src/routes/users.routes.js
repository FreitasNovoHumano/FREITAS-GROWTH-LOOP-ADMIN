import { Router } from 'express'
const router = Router()

// Exemplo de "Resposta de sucesso" em uma rota de buscar um usuário específico
router.get('/:id', async (req, res) => {
  try {
    // ... sua lógica para buscar o usuário no banco ...
    
    return res.status(200).json({
      "success": true,
      "data": { id: req.params.id, name: "Usuário Exemplo" }, // Seus dados reais entram aqui
      "message": "Operação realizada com sucesso."
    })
  } catch (error) {
    return res.status(500).json({ "success": false, "message": error.message })
  }
})

// Exemplo de "Resposta de lista paginada" em uma rota de listagem geral
router.get('/', async (req, res) => {
  try {
    // ... sua lógica de paginação no banco (Prisma/Sequelize) ...

    return res.status(200).json({
      "success": true,
      "data": [], // A lista de registros vinda do banco entra aqui
      "pagination": {
        "page": 1,
        "totalPages": 5,
        "totalItems": 50
      }
    })
  } catch (error) {
    return res.status(500).json({ "success": false, "message": error.message })
  }
})

export default router