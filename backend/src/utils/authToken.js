const jwt = require('jsonwebtoken');

function signToken(user) {
  return jwt.sign({ sub: user.id, roles: user.roles }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

// Mismas opciones para crear y borrar la cookie: si difieren (path, secure, sameSite),
// algunos navegadores ignoran el borrado y la sesión sobrevive al logout.
function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  };
}

function setAuthCookie(res, token) {
  res.cookie('token', token, { ...cookieOptions(), maxAge: 7 * 24 * 60 * 60 * 1000 });
}

function clearAuthCookie(res) {
  res.clearCookie('token', cookieOptions());
}

module.exports = { signToken, setAuthCookie, clearAuthCookie };
