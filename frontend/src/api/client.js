import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

// Origen del backend sin el sufijo /api, para construir URLs de archivos servidos como
// estáticos (avatares) que no viven bajo /api.
export const API_ORIGIN = API_URL.replace(/\/api\/?$/, '');

export function resolveUploadUrl(relativeUrl) {
  return relativeUrl ? `${API_ORIGIN}${relativeUrl}` : undefined;
}

const client = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

export default client;
