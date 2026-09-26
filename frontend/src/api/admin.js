import client from './client';

export const createDoctor = (data) => client.post('/admin/doctors', data).then((r) => r.data.doctor);
export const listMyDoctors = () => client.get('/admin/doctors').then((r) => r.data.doctors);
export const listAllAppointments = () => client.get('/admin/appointments').then((r) => r.data.appointments);
export const getRevenue = (params) => client.get('/admin/revenue', { params }).then((r) => r.data);
export const updateDoctor = (id, data) => client.put(`/admin/doctors/${id}`, data).then((r) => r.data.doctor);
export const setDoctorStatus = (id, isActive) =>
  client.patch(`/admin/doctors/${id}/status`, { isActive }).then((r) => r.data.doctor);
