import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  ChevronLeft,
  ChevronRight,
  X,
  Users
} from 'lucide-react';
import { customerAPI } from '../services/api';
import toast from 'react-hot-toast';

const CustomerList = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    city: '',
    state: '',
    pin_code: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetchCustomers();
  }, [pagination.page, pagination.limit, searchTerm, filters, sortBy, sortOrder]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm,
        sort: sortBy,
        order: sortOrder,
        _t: Date.now(), // Cache busting parameter
        ...filters,
      };

      const response = await customerAPI.getCustomers(params);
      setCustomers(response.data.data);
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination.total,
        totalPages: response.data.pagination.totalPages,
      }));
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({ city: '', state: '', pin_code: '' });
    setSearchTerm('');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleDelete = async (customerId) => {
    try {
      await customerAPI.deleteCustomer(customerId);
      toast.success('Customer deleted successfully');
      fetchCustomers();
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting customer:', error);
      toast.error('Failed to delete customer');
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const getAddressCount = (addresses) => {
    if (!addresses || addresses.length === 0) return 0;
    return addresses.length;
  };

  const getPrimaryAddress = (addresses) => {
    if (!addresses || addresses.length === 0) return null;
    return addresses.find(addr => addr.is_primary) || addresses[0];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
          <p className="mt-2 text-gray-600">
            Manage your customer records and their addresses
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            to="/customers/new"
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Customer
          </Link>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card p-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search customers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="btn btn-secondary flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
            </button>
            <button
              type="submit"
              className="btn btn-primary"
            >
              Search
            </button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
              <div>
                <label className="form-label">City</label>
                <input
                  type="text"
                  value={filters.city}
                  onChange={(e) => handleFilterChange('city', e.target.value)}
                  className="input"
                  placeholder="Filter by city"
                />
              </div>
              <div>
                <label className="form-label">State</label>
                <input
                  type="text"
                  value={filters.state}
                  onChange={(e) => handleFilterChange('state', e.target.value)}
                  className="input"
                  placeholder="Filter by state"
                />
              </div>
              <div>
                <label className="form-label">Pin Code</label>
                <input
                  type="text"
                  value={filters.pin_code}
                  onChange={(e) => handleFilterChange('pin_code', e.target.value)}
                  className="input"
                  placeholder="Filter by pin code"
                />
              </div>
            </div>
          )}

          {(searchTerm || Object.values(filters).some(v => v)) && (
            <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
              <span className="text-sm text-gray-600">Active filters:</span>
              {searchTerm && (
                <span className="badge badge-primary flex items-center gap-1">
                  Search: {searchTerm}
                  <button
                    onClick={() => setSearchTerm('')}
                    className="ml-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {Object.entries(filters).map(([key, value]) => 
                value && (
                  <span key={key} className="badge badge-primary flex items-center gap-1">
                    {key}: {value}
                    <button
                      onClick={() => handleFilterChange(key, '')}
                      className="ml-1"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )
              )}
              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Clear all
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
          {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
          {pagination.total} customers
        </p>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Sort by:</label>
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortBy(field);
              setSortOrder(order);
            }}
            className="input text-sm"
          >
            <option value="created_at-desc">Newest First</option>
            <option value="created_at-asc">Oldest First</option>
            <option value="first_name-asc">First Name A-Z</option>
            <option value="first_name-desc">First Name Z-A</option>
            <option value="last_name-asc">Last Name A-Z</option>
            <option value="last_name-desc">Last Name Z-A</option>
          </select>
        </div>
      </div>

      {/* Customers Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">Customer</th>
                <th className="table-header-cell">Contact</th>
                <th className="table-header-cell">Addresses</th>
                <th className="table-header-cell">Primary Address</th>
                <th className="table-header-cell">Actions</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {customers.map((customer) => {
                const addressCount = getAddressCount(customer.addresses);
                const primaryAddress = getPrimaryAddress(customer.addresses);
                
                return (
                  <tr key={customer.id} className="table-row">
                    <td className="table-cell">
                      <div>
                        <div className="font-medium text-gray-900">
                          {customer.first_name} {customer.last_name}
                        </div>
                        <div className="text-sm text-gray-500">ID: {customer.id}</div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div>
                        <div className="text-gray-900">{customer.phone_number}</div>
                        {customer.email && (
                          <div className="text-sm text-gray-500">{customer.email}</div>
                        )}
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <span className="badge badge-primary">
                          {addressCount} {addressCount === 1 ? 'address' : 'addresses'}
                        </span>
                        {customer.has_multiple_addresses === 1 ? (
                          <span className="badge badge-success">Multiple</span>
                        ) : customer.only_one_address === 1 ? (
                          <span className="badge badge-warning">Single</span>
                        ) : null}
                      </div>
                    </td>
                    <td className="table-cell">
                      {primaryAddress ? (
                        <div className="text-sm">
                          <div className="text-gray-900">{primaryAddress.city}, {primaryAddress.state}</div>
                          <div className="text-gray-500">{primaryAddress.pin_code}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400">No address</span>
                      )}
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/customers/${customer.id}`}
                          className="text-blue-600 hover:text-blue-800"
                          title="View details"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <Link
                          to={`/customers/${customer.id}/edit`}
                          className="text-green-600 hover:text-green-800"
                          title="Edit customer"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => setDeleteConfirm(customer.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete customer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {customers.length === 0 && !loading && (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No customers found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || Object.values(filters).some(v => v) 
                ? 'Try adjusting your search or filters.'
                : 'Get started by creating a new customer.'
              }
            </p>
            {!searchTerm && !Object.values(filters).some(v => v) && (
              <div className="mt-6">
                <Link
                  to="/customers/new"
                  className="btn btn-primary"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Customer
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
              className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page === pagination.totalPages}
              className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Show:</label>
            <select
              value={pagination.limit}
              onChange={(e) => setPagination(prev => ({ 
                ...prev, 
                limit: parseInt(e.target.value),
                page: 1 
              }))}
              className="input text-sm"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Delete Customer
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this customer? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="btn btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="btn btn-danger flex-1"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerList;
