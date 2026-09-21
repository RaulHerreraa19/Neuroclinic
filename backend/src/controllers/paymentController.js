const { Appointment, Payment, PriceCatalogItem, DoctorProfile } = require('../models');
const { recordAudit } = require('../middleware/auditLog');
const { assertCanCharge, PRECIO_SUGERIDO_DEFAULT } = require('../services/billing');

// Resuelve monto/concepto a partir del ítem de catálogo elegido, un monto libre, o el
// sugerido por defecto — nunca se cobra en silencio: el frontend siempre confirma antes de enviar.
async function resolveChargeDetails({ priceCatalogItemId, monto, concepto }, ownerAdminId) {
  if (priceCatalogItemId) {
    const item = await PriceCatalogItem.findOne({ where: { id: priceCatalogItemId, ownerAdminId } });
    if (!item) {
      const err = new Error('Ese ítem del catálogo de precios no existe.');
      err.status = 400;
      throw err;
    }
    return { monto: item.precio, concepto: item.nombre, priceCatalogItemId: item.id };
  }
  if (monto !== undefined && monto !== null) {
    return { monto, concepto: concepto || 'Cobro manual', priceCatalogItemId: null };
  }
  return { monto: PRECIO_SUGERIDO_DEFAULT, concepto: 'Consulta (precio sugerido)', priceCatalogItemId: null };
}

async function createPayment(req, res) {
  const appointment = await Appointment.findByPk(req.params.id);
  if (!appointment) return res.status(404).json({ error: 'Cita no encontrada.' });
  if (appointment.estado !== 'completada') {
    return res.status(400).json({ error: 'Solo se pueden cobrar citas marcadas como completadas.' });
  }

  await assertCanCharge(appointment, req.user);

  const existing = await Payment.findOne({ where: { appointmentId: appointment.id } });
  if (existing) {
    return res.status(409).json({ error: 'Esta cita ya tiene un cobro registrado. Usa la edición para corregirlo.' });
  }

  const doctorProfile = await DoctorProfile.findOne({ where: { userId: appointment.doctorId } });
  const { monto, concepto, priceCatalogItemId } = await resolveChargeDetails(req.body, doctorProfile?.ownerAdminId);

  let payment;
  try {
    payment = await Payment.create({
      appointmentId: appointment.id,
      priceCatalogItemId,
      monto,
      concepto,
      cobradoPorUserId: req.user.id,
      metodoPago: req.body.metodoPago || 'efectivo',
      fechaCobro: new Date().toISOString().slice(0, 10),
    });
  } catch (err) {
    // Dos solicitudes simultáneas pueden pasar ambas el check de "existing" de arriba; el
    // índice único de appointment_id es la garantía real contra el doble cobro.
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'Esta cita ya tiene un cobro registrado. Usa la edición para corregirlo.' });
    }
    throw err;
  }

  await recordAudit({
    user: req.user,
    entidad: 'payments',
    entidadId: payment.id,
    accion: 'create',
    req,
    detalles: { appointmentId: appointment.id, monto, metodoPago: payment.metodoPago },
  });
  res.status(201).json({ payment });
}

async function getPayment(req, res) {
  const appointment = await Appointment.findByPk(req.params.id);
  if (!appointment) return res.status(404).json({ error: 'Cita no encontrada.' });
  await assertCanCharge(appointment, req.user);

  const payment = await Payment.findOne({
    where: { appointmentId: req.params.id },
    include: [{ model: PriceCatalogItem, as: 'priceCatalogItem', attributes: ['id', 'nombre'] }],
  });
  res.json({ payment: payment || null });
}

async function updatePayment(req, res) {
  const appointment = await Appointment.findByPk(req.params.id);
  if (!appointment) return res.status(404).json({ error: 'Cita no encontrada.' });

  const payment = await Payment.findOne({ where: { appointmentId: appointment.id } });
  if (!payment) return res.status(404).json({ error: 'Esta cita no tiene un cobro registrado todavía.' });

  await assertCanCharge(appointment, req.user);

  // Solo se recalcula el monto/concepto si el body trae un ítem de catálogo o un monto nuevo;
  // si solo se corrige el método de pago, el cobro existente se conserva tal cual.
  let monto = payment.monto;
  let concepto = payment.concepto;
  let priceCatalogItemId = payment.priceCatalogItemId;
  if (req.body.priceCatalogItemId !== undefined || req.body.monto !== undefined) {
    const doctorProfile = await DoctorProfile.findOne({ where: { userId: appointment.doctorId } });
    ({ monto, concepto, priceCatalogItemId } = await resolveChargeDetails(req.body, doctorProfile?.ownerAdminId));
  }

  await payment.update({
    monto,
    concepto,
    priceCatalogItemId,
    metodoPago: req.body.metodoPago || payment.metodoPago,
  });

  await recordAudit({
    user: req.user,
    entidad: 'payments',
    entidadId: payment.id,
    accion: 'update',
    req,
    detalles: { appointmentId: appointment.id, monto, metodoPago: payment.metodoPago },
  });
  res.json({ payment });
}

module.exports = { createPayment, getPayment, updatePayment };
