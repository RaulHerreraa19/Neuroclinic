function sanitizeUser(user) {
  const { id, email, roles, nombre, apellidoPaterno, apellidoMaterno, telefono, isActive, avatarUrl } = user;
  return { id, email, roles, nombre, apellidoPaterno, apellidoMaterno, telefono, isActive, avatarUrl };
}

module.exports = { sanitizeUser };
