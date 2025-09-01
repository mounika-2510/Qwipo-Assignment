import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add any auth tokens here if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

// Customer API calls
export const customerAPI = {
  // Get all customers with pagination and search
  getCustomers: (params = {}) => {
    return api.get('/customers', { params });
  },

  // Get customer by ID
  getCustomer: (id) => {
    return api.get(`/customers/${id}`);
  },

  // Create new customer
  createCustomer: (data) => {
    return api.post('/customers', data);
  },

  // Update customer
  updateCustomer: (id, data) => {
    return api.put(`/customers/${id}`, data);
  },

  // Delete customer
  deleteCustomer: (id) => {
    return api.delete(`/customers/${id}`);
  },

  // Get customers with multiple addresses
  getMultipleAddresses: () => {
    return api.get('/customers/multiple-addresses');
  },

  // Get customers with single address
  getSingleAddress: () => {
    return api.get('/customers/single-address');
  },
};

// Address API calls
export const addressAPI = {
  // Get all addresses with pagination and search
  getAddresses: (params = {}) => {
    return api.get('/addresses', { params });
  },

  // Get address by ID
  getAddress: (id) => {
    return api.get(`/addresses/${id}`);
  },

  // Create new address
  createAddress: (data) => {
    return api.post('/addresses', data);
  },

  // Update address
  updateAddress: (id, data) => {
    return api.put(`/addresses/${id}`, data);
  },

  // Delete address
  deleteAddress: (id) => {
    return api.delete(`/addresses/${id}`);
  },

  // Get addresses for a specific customer
  getCustomerAddresses: (customerId) => {
    return api.get(`/addresses/customer/${customerId}`);
  },
};

// Health check
export const healthCheck = () => {
  return api.get('/health');
};

export default api;
