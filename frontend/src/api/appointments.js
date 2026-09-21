import client from './client';

export const createAppointment = (data) => client.post('/appointments', data).then((r) => r.data.appointment);
export const createAppointmentForDoctor = (data) =>
  client.post('/appointments/doctor', data).then((r) => r.data.appointment);
export const listMyAppointments = () => client.get('/appointments/me').then((r) => r.data.appointments);
export const cancelAppointment = (id) => client.patch(`/appointments/${id}/cancel`).then((r) => r.data.appointment);
export const updateAppointmentStatus = (id, estado) =>
  client.patch(`/appointments/${id}/status`, { estado }).then((r) => r.data.appointment);

export const getAppointmentPayment = (id) => client.get(`/appointments/${id}/payment`).then((r) => r.data.payment);
export const chargeAppointment = (id, data) => client.post(`/appointments/${id}/payment`, data).then((r) => r.data.payment);
export const updateAppointmentPayment = (id, data) =>
  client.patch(`/appointments/${id}/payment`, data).then((r) => r.data.payment);
