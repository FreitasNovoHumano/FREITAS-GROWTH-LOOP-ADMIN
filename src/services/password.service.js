import 'dotenv/config'
import { createApp } from './app.js'
import { connectDatabase } from './config/database.js'
import { syncModels } from './models/index.js'

const port = Number(process.env.PORT || 3000)

async function start() {
  try {
    await connectDatabase()
    await syncModels()

    const { app, admin } = await createApp()

    if (process.env.NODE_ENV === 'development') {
      await admin.watch()
    }

    app.listen(port, () => {
      console.log(
        `${process.env.APP_NAME || 'FreitasGrowthLoop'} disponível em ` +
          `http://localhost:${port}`
      )
      console.log(
        `AdminJS disponível em ` +
          `http://localhost:${port}${admin.options.rootPath}`
      )
    })
  } catch (error) {
    console.error('Não foi possível iniciar a aplicação:', error)
    process.exit(1)
  }
}

start()