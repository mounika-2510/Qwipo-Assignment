import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  MapPin,
  Star
} from 'lucide-react';
import { addressAPI } from '../services/api';
import toast from 'react-hot-toast';

const AddressList = () => {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    customer_id: '',
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

  useEffect(() => {
    fetchAddresses();
  }, [pagination.page, pagination.limit, filters, sortBy, sortOrder]);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        sort: sortBy,
        order: sortOrder,
        ...filters,
      };

      const response = await addressAPI.getAddresses(params);
      setAddresses(response.data.data);
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination.total,
        totalPages: response.data.pagination.totalPages,
      }));
    } catch (error) {
      console.error('Error fetching addresses:', error);
      toast.error('Failed to load addresses');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({ customer_id: '', city: '', state: '', pin_code: '' });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleDelete = async (addressId) => {
    try {
      await addressAPI.deleteAddress(addressId);
      toast.success('Address deleted successfully');
      fetchAddresses();
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting address:', error);
      toast.error('Failed to delete address');
    }
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
          <h1 className="text-3xl font-bold text-gray-900">Addresses</h1>
          <p className="mt-2 text-gray-600">
            Manage all customer addresses
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            to="/addresses/new"
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Address
          </Link>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card p-6">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="btn btn-secondary flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
            </button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
              <div>
                <label className="form-label">Customer ID</label>
                <input
                  type="number"
                  value={filters.customer_id}
                  onChange={(e) => handleFilterChange('customer_id', e.target.value)}
                  className="input"
                  placeholder="Filter by customer ID"
                />
              </div>
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

          {Object.values(filters).some(v => v) && (
            <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
              <span className="text-sm text-gray-600">Active filters:</span>
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
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
          {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
          {pagination.total} addresses
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
            <option value="city-asc">City A-Z</option>
            <option value="city-desc">City Z-A</option>
            <option value="state-asc">State A-Z</option>
            <option value="state-desc">State Z-A</option>
          </select>
        </div>
      </div>

      {/* Addresses Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">Customer</th>
                <th className="table-header-cell">Address</th>
                <th className="table-header-cell">Location</th>
                <th className="table-header-cell">Status</th>
                <th className="table-header-cell">Actions</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {addresses.map((address) => (
                <tr key={address.id} className="table-row">
                  <td className="table-cell">
                    <div>
                      <div className="font-medium text-gray-900">
                        {address.first_name} {address.last_name}
                      </div>
                      <div className="text-sm text-gray-500">ID: {address.customer_id}</div>
                      <div className="text-sm text-gray-500">{address.phone_number}</div>
                    </div>
                  </td>
                  <td className="table-cell">
                    <div>
                      <div className="text-gray-900">{address.address_line1}</div>
                      {address.address_line2 && (
                        <div className="text-sm text-gray-500">{address.address_line2}</div>
                      )}
                    </div>
                  </td>
                  <td className="table-cell">
                    <div>
                      <div className="text-gray-900">{address.city}, {address.state}</div>
                      <div className="text-sm text-gray-500">{address.pin_code}</div>
                      <div className="text-sm text-gray-500">{address.country}</div>
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      {address.is_primary && (
                        <span className="badge badge-success flex items-center gap-1">
                          <Star className="h-3 w-3" />
                          Primary
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/customers/${address.customer_id}`}
                        className="text-blue-600 hover:text-blue-800"
                        title="View customer"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <Link
                        to={`/addresses/${address.id}/edit`}
                        className="text-green-600 hover:text-green-800"
                        title="Edit address"
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => setDeleteConfirm(address.id)}
                        className="text-red-600 hover:text-red-800"
                        title="Delete address"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {addresses.length === 0 && !loading && (
          <div className="text-center py-12">
            <MapPin className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No addresses found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {Object.values(filters).some(v => v) 
                ? 'Try adjusting your filters.'
                : 'Get started by adding a new address.'
              }
            </p>
            {!Object.values(filters).some(v => v) && (
              <div className="mt-6">
                <Link
                  to="/addresses/new"
                  className="btn btn-primary"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Address
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
              Delete Address
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this address? This action cannot be undone.
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

export default AddressList;
