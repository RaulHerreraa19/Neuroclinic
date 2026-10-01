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

// Las páginas muestran `err.response.data.error` directamente. Nuestro backend siempre manda un
// texto, pero un proxy (p. ej. Vercel ante un 502) puede mandar `{ error: { code, message } }`,
// y React truena al intentar pintar un objeto. Aquí se normaliza a texto.
client.interceptors.response.use(undefined, (err) => {
  const data = err.response?.data;
  if (data && typeof data === 'object' && data.error && typeof data.error !== 'string') {
    data.error = 'El servidor no respondió. Intenta de nuevo en un momento.';
  }
  return Promise.reject(err);
});

export default client;
