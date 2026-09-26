const { Op } = require('sequelize');
const { PriceCatalogItem } = require('../models');

// Reemplaza los servicios que ofrece un doctor. Solo se aceptan ítems activos del catálogo
// del admin dueño del doctor: un doctor nunca puede ofrecer servicios de otra clínica.
async function setDoctorServices(doctorProfile, servicioIds, transaction) {
  const ids = [...new Set(servicioIds)];
  const items = ids.length
    ? await PriceCatalogItem.findAll({
        where: { id: { [Op.in]: ids }, ownerAdminId: doctorProfile.ownerAdminId, activo: true },
        transaction,
      })
    : [];
  if (items.length !== ids.length) {
    const err = new Error('Alguno de los servicios elegidos no existe en el catálogo de la clínica.');
    err.status = 400;
    throw err;
  }
  await doctorProfile.setServicios(items, { transaction });
}

// Atributos públicos de un servicio (sin datos internos del catálogo).
const SERVICIO_ATTRIBUTES = ['id', 'nombre', 'precio'];

module.exports = { setDoctorServices, SERVICIO_ATTRIBUTES };
