import client from './client';

export const searchPatients = (q) => client.get('/patients', { params: { q } }).then((r) => r.data.patients);
export const listPatientsCatalog = () => client.get('/patients/catalog').then((r) => r.data.patients);
export const getPatient = (id) => client.get(`/patients/${id}`).then((r) => r.data.patient);
export const resetPatientPassword = (id) => client.post(`/patients/${id}/reset-password`).then((r) => r.data);
export const updatePatient = (id, data) => client.patch(`/patients/${id}`, data).then((r) => r.data.patient);
