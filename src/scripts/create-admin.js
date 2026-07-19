import 'dotenv/config'
import bcrypt from 'bcryptjs'
import sequelize from '../src/config/database.js'
import User, { USER_ROLES } from '../src/models/User.js'

async function createAdminUser() {
  const name = process.env.ADMIN_NAME || 'Administrador'
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  const password = process.env.ADMIN_PASSWORD

  if (!email || !password) {
    throw new Error(
      'Configure ADMIN_EMAIL e ADMIN_PASSWORD no arquivo .env.'
    )
  }

  if (password.length < 12) {
    throw new Error(
      'ADMIN_PASSWORD deve ter pelo menos 12 caracteres.'
    )
  }

  await sequelize.authenticate()
  await sequelize.sync()

  const passwordHash = await bcrypt.hash(password, 12)

  const [user, created] = await User.findOrCreate({
    where: { email },
    defaults: {
      name,
      email,
      passwordHash,
      role: USER_ROLES.ADMIN,
      active: true
    }
  })

  if (!created) {
    await user.update({
      name,
      passwordHash,
      role: USER_ROLES.ADMIN,
      active: true
    })
  }

  console.log(
    created
      ? `Administrador ${email} criado com sucesso.`
      : `Administrador ${email} atualizado com sucesso.`
  )
}

try {
  await createAdminUser()
} catch (error) {
  console.error('Erro ao criar administrador:', error.message)
  process.exitCode = 1
} finally {
  await sequelize.close()
}