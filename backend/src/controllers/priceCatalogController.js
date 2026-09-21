const { Op } = require('sequelize');
const { PriceCatalogItem, DoctorProfile } = require('../models');
const { recordAudit } = require('../middleware/auditLog');

// Solo un ítem puede ser el sugerido por defecto a la vez, por admin.
async function clearOtherDefaults(ownerAdminId, exceptItemId) {
  await PriceCatalogItem.update({ esDefault: false }, { where: { ownerAdminId, id: { [Op.ne]: exceptItemId } } });
}

// Admin: su propio catálogo. Médico: el catálogo del admin dueño de su perfil, solo lectura.
async function listCatalog(req, res) {
  let ownerAdminId = req.user.id;
  if (!req.user.hasRole('admin')) {
    const doctorProfile = await DoctorProfile.findOne({ where: { userId: req.user.id } });
    ownerAdminId = doctorProfile?.ownerAdminId || null;
  }

  const items = ownerAdminId
    ? await PriceCatalogItem.findAll({ where: { ownerAdminId, activo: true }, order: [['nombre', 'ASC']] })
    : [];
  res.json({ items });
}

async function createItem(req, res) {
  const { nombre, precio, esDefault } = req.body;
  const item = await PriceCatalogItem.create({
    ownerAdminId: req.user.id,
    nombre,
    precio,
    esDefault: Boolean(esDefault),
  });

  if (item.esDefault) await clearOtherDefaults(req.user.id, item.id);

  await recordAudit({ user: req.user, entidad: 'price_catalog', entidadId: item.id, accion: 'create', req, detalles: { nombre, precio } });
  res.status(201).json({ item });
}

async function updateItem(req, res) {
  const item = await PriceCatalogItem.findOne({ where: { id: req.params.id, ownerAdminId: req.user.id } });
  if (!item) return res.status(404).json({ error: 'Ítem de catálogo no encontrado.' });

  const { nombre, precio, esDefault } = req.body;
  await item.update({
    ...(nombre !== undefined && { nombre }),
    ...(precio !== undefined && { precio }),
    ...(esDefault !== undefined && { esDefault }),
  });

  if (esDefault) await clearOtherDefaults(req.user.id, item.id);

  await recordAudit({ user: req.user, entidad: 'price_catalog', entidadId: item.id, accion: 'update', req });
  res.json({ item });
}

// Soft-delete: nunca se borra físicamente para no perder trazabilidad de pagos históricos
// que referencian el ítem.
async function deactivateItem(req, res) {
  const item = await PriceCatalogItem.findOne({ where: { id: req.params.id, ownerAdminId: req.user.id } });
  if (!item) return res.status(404).json({ error: 'Ítem de catálogo no encontrado.' });

  await item.update({ activo: false });
  await recordAudit({ user: req.user, entidad: 'price_catalog', entidadId: item.id, accion: 'delete', req, detalles: { soft: true } });
  res.status(204).send();
}

module.exports = { listCatalog, createItem, updateItem, deactivateItem };
