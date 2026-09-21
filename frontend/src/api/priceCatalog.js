import client from './client';

export const listCatalog = () => client.get('/price-catalog').then((r) => r.data.items);
export const createItem = (data) => client.post('/price-catalog', data).then((r) => r.data.item);
export const updateItem = (id, data) => client.patch(`/price-catalog/${id}`, data).then((r) => r.data.item);
export const deactivateItem = (id) => client.delete(`/price-catalog/${id}`);
