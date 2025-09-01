import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  MapPin, 
  Eye, 
  Edit, 
  Star,
  Building
} from 'lucide-react';
import { customerAPI } from '../services/api';
import toast from 'react-hot-toast';

const MultipleAddresses = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMultipleAddresses();
  }, []);

  const fetchMultipleAddresses = async () => {
    try {
      setLoading(true);
      const response = await customerAPI.getMultipleAddresses();
      setCustomers(response.data.data);
    } catch (error) {
      console.error('Error fetching customers with multiple addresses:', error);
      toast.error('Failed to load customers with multiple addresses');
    } finally {
      setLoading(false);
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Multiple Addresses</h1>
        <p className="mt-2 text-gray-600">
          Customers with multiple registered addresses
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-purple-500">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Customers</p>
              <p className="text-2xl font-semibold text-gray-900">{customers.length}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-500">
              <MapPin className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Addresses</p>
              <p className="text-2xl font-semibold text-gray-900">
                {customers.reduce((total, customer) => total + customer.address_count, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-500">
              <Building className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Addresses</p>
              <p className="text-2xl font-semibold text-gray-900">
                {customers.length > 0 
                  ? (customers.reduce((total, customer) => total + customer.address_count, 0) / customers.length).toFixed(1)
                  : '0'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Customers List */}
      <div className="card">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Customers with Multiple Addresses</h2>
        </div>

        {customers.length === 0 ? (
          <div className="text-center py-12">
            <Building className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No customers found</h3>
            <p className="mt-1 text-sm text-gray-500">
              No customers have multiple addresses yet.
            </p>
            <Link to="/customers" className="btn btn-primary mt-4">
              View All Customers
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {customers.map((customer) => (
              <div key={customer.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold">
                          {customer.first_name[0]}{customer.last_name[0]}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {customer.first_name} {customer.last_name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          ID: {customer.id} • {customer.phone_number}
                        </p>
                        {customer.email && (
                          <p className="text-sm text-gray-500">{customer.email}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="badge badge-success">
                          {customer.address_count} addresses
                        </span>
                      </div>
                    </div>

                    {/* Addresses */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {customer.addresses.map((address, index) => (
                        <div
                          key={address.id}
                          className={`border rounded-lg p-4 ${
                            address.is_primary
                              ? 'border-green-200 bg-green-50'
                              : 'border-gray-200'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium text-gray-900">
                              Address {index + 1}
                            </h4>
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
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Link
                      to={`/customers/${customer.id}`}
                      className="text-blue-600 hover:text-blue-800"
                      title="View customer details"
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
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MultipleAddresses;
