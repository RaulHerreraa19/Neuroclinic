const jwt = require('jsonwebtoken');
const { User } = require('../models');

async function authenticate(req, res, next) {
  try {
    const token = req.cookies?.token;
    if (!token) {
      return res.status(401).json({ error: 'No autenticado.' });
    }
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(payload.sub);
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Sesión inválida.' });
    }
    // Tokens emitidos antes del último cambio de contraseña ya no valen (sesiones en otros equipos).
    if (user.passwordChangedAt && payload.iat < Math.floor(user.passwordChangedAt.getTime() / 1000)) {
      return res.status(401).json({ error: 'Tu contraseña cambió. Inicia sesión de nuevo.' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Sesión inválida o expirada.' });
  }
}

module.exports = { authenticate };
