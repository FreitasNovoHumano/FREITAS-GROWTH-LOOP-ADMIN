import bcrypt from 'bcryptjs'
import User, { USER_ROLES } from '../models/User.js'

const publicAttributes = [
  'id',
  'name',
  'email',
  'role',
  'active',
  'createdAt',
  'updatedAt'
]

export async function listUsers(_request, response, next) {
  try {
    const users = await User.findAll({
      attributes: publicAttributes,
      order: [['createdAt', 'DESC']]
    })

    response.json(users)
  } catch (error) {
    next(error)
  }
}

export async function getUser(request, response, next) {
  try {
    const user = await User.findByPk(request.params.id, {
      attributes: publicAttributes
    })

    if (!user) {
      return response.status(404).json({
        error: 'Usuário não encontrado.'
      })
    }

    return response.json(user)
  } catch (error) {
    return next(error)
  }
}

export async function createUser(request, response, next) {
  try {
    const {
      name,
      email,
      password,
      role = USER_ROLES.EDITOR,
      active = true
    } = request.body

    if (!name || !email || !password) {
      return response.status(400).json({
        error: 'Nome, e-mail e senha são obrigatórios.'
      })
    }

    if (password.length < 12) {
      return response.status(400).json({
        error: 'A senha deve ter pelo menos 12 caracteres.'
      })
    }

    if (!Object.values(USER_ROLES).includes(role)) {
      return response.status(400).json({
        error: 'Perfil de usuário inválido.'
      })
    }

    const existingUser = await User.findOne({
      where: {
        email: email.trim().toLowerCase()
      }
    })

    if (existingUser) {
      return response.status(409).json({
        error: 'Já existe um usuário com este e-mail.'
      })
    }

    const user = await User.create({
      name,
      email,
      passwordHash: await bcrypt.hash(password, 12),
      role,
      active
    })

    return response.status(201).json(user)
  } catch (error) {
    return next(error)
  }
}

export async function updateUser(request, response, next) {
  try {
    const user = await User.findByPk(request.params.id)

    if (!user) {
      return response.status(404).json({
        error: 'Usuário não encontrado.'
      })
    }

    const { name, email, password, role, active } = request.body

    if (role && !Object.values(USER_ROLES).includes(role)) {
      return response.status(400).json({
        error: 'Perfil de usuário inválido.'
      })
    }

    if (password && password.length < 12) {
      return response.status(400).json({
        error: 'A senha deve ter pelo menos 12 caracteres.'
      })
    }

    if (name !== undefined) user.name = name
    if (email !== undefined) user.email = email
    if (role !== undefined) user.role = role
    if (active !== undefined) user.active = active

    if (password) {
      user.passwordHash = await bcrypt.hash(password, 12)
    }

    await user.save()

    return response.json(user)
  } catch (error) {
    return next(error)
  }
}

export async function deleteUser(request, response, next) {
  try {
    const user = await User.findByPk(request.params.id)

    if (!user) {
      return response.status(404).json({
        error: 'Usuário não encontrado.'
      })
    }

    await user.destroy()
    return response.status(204).send()
  } catch (error) {
    return next(error)
  }
}