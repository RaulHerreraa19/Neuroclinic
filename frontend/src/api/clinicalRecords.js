import client from './client';

export const listClinicalRecords = (patientId) =>
  client.get(`/patients/${patientId}/clinical-records`).then((r) => r.data.records);
export const createClinicalRecord = (patientId, data) =>
  client.post(`/patients/${patientId}/clinical-records`, data).then((r) => r.data.record);
export const updateClinicalRecord = (id, data) =>
  client.put(`/clinical-records/${id}`, data).then((r) => r.data.record);
