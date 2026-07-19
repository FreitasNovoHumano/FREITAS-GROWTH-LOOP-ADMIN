import 'dotenv/config'
import { Sequelize } from 'sequelize'

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('A variável DATABASE_URL não foi configurada.')
}

const useSsl = process.env.DATABASE_SSL === 'true'
const enableLogging = process.env.DATABASE_LOGGING === 'true'

const sequelize = new Sequelize(databaseUrl, {
  dialect: 'postgres',
  logging: enableLogging ? console.log : false,
  define: {
    underscored: true,
    timestamps: true
  },
  dialectOptions: useSsl
    ? {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      }
    : {},
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
})

export async function connectDatabase() {
  await sequelize.authenticate()
  console.log('Conexão com PostgreSQL estabelecida.')
}

export default sequelize