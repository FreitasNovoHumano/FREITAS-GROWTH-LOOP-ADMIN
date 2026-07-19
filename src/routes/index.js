import { Router } from 'express'
import userRoutes from './userRoutes.js'

const router = Router()

router.get('/health', (_request, response) => {
  response.json({
    status: 'ok',
    application: process.env.APP_NAME || 'FreitasGrowthLoop',
    timestamp: new Date().toISOString()
  })
})

// Rotas apenas para consulta. Proteja-as antes de expor dados reais.
router.use('/users', userRoutes)

export default router