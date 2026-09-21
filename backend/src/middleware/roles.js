function authorize(...allowedRoles) {
  return (req, res, next) => {
    const userRoles = req.user?.roles || [];
    if (!allowedRoles.some((role) => userRoles.includes(role))) {
      return res.status(403).json({ error: 'No tienes permiso para realizar esta acción.' });
    }
    next();
  };
}

module.exports = { authorize };
