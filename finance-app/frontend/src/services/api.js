import axios from "axios";

const base = "http://localhost:3001";

export const getTransactions = () =>
  axios.get(`${base}/transactions`).then((r) => r.data);
export const getCategories = () =>
  axios.get(`${base}/categories`).then((r) => r.data);
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
