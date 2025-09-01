import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { 
  Save, 
  ArrowLeft, 
  Plus, 
  Trash2, 
  MapPin,
  Star
} from 'lucide-react';
import { customerAPI } from '../services/api';
import toast from 'react-hot-toast';

const CustomerForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [customer, setCustomer] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [showAddressForm, setShowAddressForm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm();

  const isEditing = Boolean(id);

  useEffect(() => {
    if (isEditing) {
      fetchCustomer();
    }
  }, [id]);

  const fetchCustomer = async () => {
    try {
      setLoading(true);
      const response = await customerAPI.getCustomer(id);
      const customerData = response.data.data;
      setCustomer(customerData);
      setAddresses(customerData.addresses || []);

      // Set form values
      setValue('first_name', customerData.first_name);
      setValue('last_name', customerData.last_name);
      setValue('phone_number', customerData.phone_number);
      setValue('email', customerData.email || '');
    } catch (error) {
      console.error('Error fetching customer:', error);
      toast.error('Failed to load customer data');
      navigate('/customers');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      
      // Validate that addresses have required fields
      const validAddresses = addresses.filter(addr => 
        addr.address_line1 && addr.city && addr.state && addr.pin_code
      );
      
      if (validAddresses.length === 0) {
        toast.error('At least one complete address is required');
        return;
      }
      
      const customerData = {
        ...data,
        addresses: validAddresses,
      };

      console.log('Submitting customer data:', customerData);

      if (isEditing) {
        await customerAPI.updateCustomer(id, customerData);
        toast.success('Customer updated successfully');
      } else {
        await customerAPI.createCustomer(customerData);
        toast.success('Customer created successfully');
      }

      navigate('/customers');
    } catch (error) {
      console.error('Error saving customer:', error);
      const errorMessage = error.response?.data?.message || 'Failed to save customer';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const addAddress = () => {
    setAddresses(prev => [
      ...prev,
      {
        id: `temp-${Date.now()}`,
        address_line1: '',
        address_line2: '',
        city: '',
        state: '',
        pin_code: '',
        country: 'India',
        is_primary: addresses.length === 0, // First address is primary by default
      }
    ]);
    setShowAddressForm(true);
  };

  const updateAddress = (index, field, value) => {
    setAddresses(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      
      // If this address is set as primary, unset others
      if (field === 'is_primary' && value) {
        updated.forEach((addr, i) => {
          if (i !== index) {
            addr.is_primary = false;
          }
        });
      }
      
      return updated;
    });
  };

  const removeAddress = (index) => {
    setAddresses(prev => {
      const updated = prev.filter((_, i) => i !== index);
      // If we removed the primary address, make the first remaining address primary
      if (updated.length > 0 && !updated.some(addr => addr.is_primary)) {
        updated[0].is_primary = true;
      }
      return updated;
    });
  };

  const validatePinCode = (value) => {
    return /^[0-9]{6}$/.test(value) || 'Pin code must be exactly 6 digits';
  };

  const validatePhoneNumber = (value) => {
    return /^[0-9]{10}$/.test(value) || 'Phone number must be exactly 10 digits';
  };

  if (loading && isEditing) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
              {isEditing ? 'Edit Customer' : 'New Customer'}
            </h1>
            <p className="mt-2 text-gray-600">
              {isEditing ? 'Update customer information' : 'Create a new customer record'}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Customer Information */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Customer Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="form-group">
              <label className="form-label">First Name *</label>
              <input
                type="text"
                {...register('first_name', {
                  required: 'First name is required',
                  minLength: { value: 2, message: 'First name must be at least 2 characters' },
                  maxLength: { value: 50, message: 'First name must be less than 50 characters' }
                })}
                className={`input ${errors.first_name ? 'border-red-500' : ''}`}
                placeholder="Enter first name"
              />
              {errors.first_name && (
                <p className="form-error">{errors.first_name.message}</p>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Last Name *</label>
              <input
                type="text"
                {...register('last_name', {
                  required: 'Last name is required',
                  minLength: { value: 2, message: 'Last name must be at least 2 characters' },
                  maxLength: { value: 50, message: 'Last name must be less than 50 characters' }
                })}
                className={`input ${errors.last_name ? 'border-red-500' : ''}`}
                placeholder="Enter last name"
              />
              {errors.last_name && (
                <p className="form-error">{errors.last_name.message}</p>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number *</label>
              <input
                type="tel"
                {...register('phone_number', {
                  required: 'Phone number is required',
                  validate: validatePhoneNumber
                })}
                className={`input ${errors.phone_number ? 'border-red-500' : ''}`}
                placeholder="Enter 10-digit phone number"
              />
              {errors.phone_number && (
                <p className="form-error">{errors.phone_number.message}</p>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                {...register('email', {
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
                  }
                })}
                className={`input ${errors.email ? 'border-red-500' : ''}`}
                placeholder="Enter email address"
              />
              {errors.email && (
                <p className="form-error">{errors.email.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Addresses */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Addresses</h2>
            <button
              type="button"
              onClick={addAddress}
              className="btn btn-primary flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Address
            </button>
          </div>

          {addresses.length === 0 ? (
            <div className="text-center py-8">
              <MapPin className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No addresses</h3>
              <p className="mt-1 text-sm text-gray-500">
                Add at least one address for this customer.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {addresses.map((address, index) => (
                <div key={address.id} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Address {index + 1}
                      {address.is_primary && (
                        <span className="ml-2 badge badge-success flex items-center gap-1">
                          <Star className="h-3 w-3" />
                          Primary
                        </span>
                      )}
                    </h3>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={address.is_primary}
                          onChange={(e) => updateAddress(index, 'is_primary', e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-600">Primary</span>
                      </label>
                      {addresses.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeAddress(index)}
                          className="text-red-600 hover:text-red-800"
                          title="Remove address"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-group">
                      <label className="form-label">Address Line 1 *</label>
                      <input
                        type="text"
                        value={address.address_line1}
                        onChange={(e) => updateAddress(index, 'address_line1', e.target.value)}
                        className="input"
                        placeholder="Enter address line 1"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Address Line 2</label>
                      <input
                        type="text"
                        value={address.address_line2}
                        onChange={(e) => updateAddress(index, 'address_line2', e.target.value)}
                        className="input"
                        placeholder="Enter address line 2 (optional)"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">City *</label>
                      <input
                        type="text"
                        value={address.city}
                        onChange={(e) => updateAddress(index, 'city', e.target.value)}
                        className="input"
                        placeholder="Enter city"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">State *</label>
                      <input
                        type="text"
                        value={address.state}
                        onChange={(e) => updateAddress(index, 'state', e.target.value)}
                        className="input"
                        placeholder="Enter state"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Pin Code *</label>
                      <input
                        type="text"
                        value={address.pin_code}
                        onChange={(e) => updateAddress(index, 'pin_code', e.target.value)}
                        className="input"
                        placeholder="Enter 6-digit pin code"
                        pattern="[0-9]{6}"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Country</label>
                      <input
                        type="text"
                        value={address.country}
                        onChange={(e) => updateAddress(index, 'country', e.target.value)}
                        className="input"
                        placeholder="Enter country"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/customers')}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || addresses.length === 0}
            className="btn btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isEditing ? 'Update Customer' : 'Create Customer'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CustomerForm;
