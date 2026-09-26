import client from './client';

export const listDoctors = () => client.get('/doctors').then((r) => r.data.doctors);
export const getDoctor = (id) => client.get(`/doctors/${id}`).then((r) => r.data.doctor);
export const getAvailability = (id, from, to) =>
  client.get(`/doctors/${id}/availability`, { params: { from, to } }).then((r) => r.data.availability);

export const listSchedules = (doctorId) =>
  client.get(`/doctors/${doctorId}/schedules`).then((r) => r.data.schedules);
export const createSchedule = (doctorId, data) =>
  client.post(`/doctors/${doctorId}/schedules`, data).then((r) => r.data.schedule);
export const updateSchedule = (id, data) => client.put(`/schedules/${id}`, data).then((r) => r.data.schedule);
export const deleteSchedule = (id) => client.delete(`/schedules/${id}`);

export const listScheduleExceptions = (doctorId) =>
  client.get(`/doctors/${doctorId}/schedule-exceptions`).then((r) => r.data.exceptions);
export const createScheduleException = (doctorId, data) =>
  client.post(`/doctors/${doctorId}/schedule-exceptions`, data).then((r) => r.data.exception);
export const deleteScheduleException = (id) => client.delete(`/schedule-exceptions/${id}`);

export const listDoctorAppointments = (doctorId, from, to) =>
  client.get(`/doctors/${doctorId}/appointments`, { params: { from, to } }).then((r) => r.data.appointments);

export const getMyDoctorProfile = () => client.get('/doctors/me/profile').then((r) => r.data.profile);
export const updateMyDoctorProfile = (data) => client.put('/doctors/me/profile', data).then((r) => r.data.profile);
