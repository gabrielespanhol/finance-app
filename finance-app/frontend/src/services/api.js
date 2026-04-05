import axios from "axios";

const base = "http://localhost:3001";

export const getTransactions = () =>
  axios.get(`${base}/transactions`).then((r) => r.data);
export const getCategories = () =>
  axios.get(`${base}/categories`).then((r) => r.data);
export const createCategory = (payload) =>
  axios.post(`${base}/categories`, payload).then((r) => r.data);
export const updateCategory = (id, payload) =>
  axios.put(`${base}/categories/${id}`, payload);
export const deleteCategory = (id) =>
  axios.delete(`${base}/categories/${id}`);
export const createTransaction = (payload) =>
  axios.post(`${base}/transactions`, payload).then((r) => r.data);
export const updateTransaction = (id, payload) =>
  axios.put(`${base}/transactions/${id}`, payload);
export const deleteTransaction = (id) =>
  axios.delete(`${base}/transactions/${id}`);
export const uploadFile = (formData) =>
  axios
    .post(`${base}/upload`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data);

// Saved Money
export const getSavedMoney = () =>
  axios.get(`${base}/saved-money`).then((r) => r.data);
export const createSavedMoney = (payload) =>
  axios.post(`${base}/saved-money`, payload).then((r) => r.data);
export const updateSavedMoney = (id, payload) =>
  axios.put(`${base}/saved-money/${id}`, payload);
export const deleteSavedMoney = (id) =>
  axios.delete(`${base}/saved-money/${id}`);

// Projections
export const getProjections = () =>
  axios.get(`${base}/projections`).then((r) => r.data);
export const createProjection = (payload) =>
  axios.post(`${base}/projections`, payload).then((r) => r.data);
export const updateProjection = (id, payload) =>
  axios.put(`${base}/projections/${id}`, payload);
export const deleteProjection = (id) =>
  axios.delete(`${base}/projections/${id}`);

