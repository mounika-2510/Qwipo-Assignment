import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  MapPin, 
  Phone, 
  Mail, 
  Star,
  Plus,
  Calendar
} from 'lucide-react';
import { customerAPI } from '../services/api';
import toast from 'react-hot-toast';

const CustomerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  useEffect(() => {
    fetchCustomer();
  }, [id]);

  const fetchCustomer = async () => {
    try {
      setLoading(true);
      const response = await customerAPI.getCustomer(id);
      setCustomer(response.data.data);
    } catch (error) {
      console.error('Error fetching customer:', error);
      toast.error('Failed to load customer data');
      navigate('/customers');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await customerAPI.deleteCustomer(id);
      toast.success('Customer deleted successfully');
      navigate('/customers');
    } catch (error) {
      console.error('Error deleting customer:', error);
      toast.error('Failed to delete customer');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Customer not found</h3>
        <p className="mt-2 text-gray-600">The customer you're looking for doesn't exist.</p>
        <Link to="/customers" className="btn btn-primary mt-4">
          Back to Customers
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/customers')}
            className="btn btn-secondary"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {customer.first_name} {customer.last_name}
            </h1>
            <p className="mt-2 text-gray-600">Customer ID: {customer.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to={`/customers/${id}/edit`}
            className="btn btn-primary flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            Edit
          </Link>
          <button
            onClick={() => setDeleteConfirm(true)}
            className="btn btn-danger flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Information */}
        <div className="lg:col-span-1">
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Customer Information</h2>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold">
                    {customer.first_name[0]}{customer.last_name[0]}
                  </span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">
                    {customer.first_name} {customer.last_name}
                  </h3>
                  <p className="text-sm text-gray-500">Customer</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-900">{customer.phone_number}</span>
                </div>

                {customer.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-900">{customer.email}</span>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-900">
                    Created: {formatDate(customer.created_at)}
                  </span>
                </div>

                {customer.updated_at !== customer.created_at && (
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-900">
                      Updated: {formatDate(customer.updated_at)}
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Address Status:</span>
                  {customer.has_multiple_addresses==1? (
                    <span className="badge badge-success">Multiple Addresses</span>
                  ):customer.only_one_address==1? (
                    <span className="badge badge-warning">Single Address</span>
                  ):null}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Addresses */}
        <div className="lg:col-span-2">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Addresses</h2>
              <Link
                to={`/customers/${id}/edit`}
                className="btn btn-primary flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Address
              </Link>
            </div>

            {customer.addresses && customer.addresses.length > 0 ? (
              <div className="space-y-4">
                {customer.addresses.map((address, index) => (
                  <div
                    key={address.id}
                    className={`border rounded-lg p-4 ${
                      address.is_primary
                        ? 'border-green-200 bg-green-50'
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium text-gray-900">
                            Address {index + 1}
                          </h3>
                          {address.is_primary && (
                            <span className="badge badge-success flex items-center gap-1">
                              <Star className="h-3 w-3" />
                              Primary
                            </span>
                          )}
                        </div>

                        <div className="space-y-1 text-sm">
                          <p className="text-gray-900">{address.address_line1}</p>
                          {address.address_line2 && (
                            <p className="text-gray-600">{address.address_line2}</p>
                          )}
                          <p className="text-gray-600">
                            {address.city}, {address.state} {address.pin_code}
                          </p>
                          <p className="text-gray-600">{address.country}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link
                          to={`/addresses/${address.id}/edit`}
                          className="text-blue-600 hover:text-blue-800"
                          title="Edit address"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <MapPin className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No addresses</h3>
                <p className="mt-1 text-sm text-gray-500">
                  This customer doesn't have any addresses yet.
                </p>
                <Link
                  to={`/customers/${id}/edit`}
                  className="btn btn-primary mt-4"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Address
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Delete Customer
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete {customer.first_name} {customer.last_name}? 
              This action cannot be undone and will also delete all associated addresses.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(false)}
                className="btn btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
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

export default CustomerDetail;
