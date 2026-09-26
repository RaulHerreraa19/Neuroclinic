import client from './client';

export const registerPatient = (data) => client.post('/auth/register-patient', data).then((r) => r.data);
export const registerPatientByStaff = (data) =>
  client.post('/auth/register-patient-by-staff', data).then((r) => r.data);
export const login = (data) => client.post('/auth/login', data).then((r) => r.data);
export const logout = () => client.post('/auth/logout').then((r) => r.data);
export const fetchMe = () => client.get('/auth/me').then((r) => r.data);
export const changePassword = (data) => client.put('/auth/me/password', data).then((r) => r.data);
export const fetchMyReminders = () => client.get('/auth/me/reminders').then((r) => r.data);
export const uploadAvatar = (file) => {
  const formData = new FormData();
  formData.append('avatar', file);
  return client.post('/auth/me/avatar', formData).then((r) => r.data);
};
