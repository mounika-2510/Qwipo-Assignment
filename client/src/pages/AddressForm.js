import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { 
  Save, 
  ArrowLeft, 
  MapPin,
  Star
} from 'lucide-react';
import { addressAPI, customerAPI } from '../services/api';
import toast from 'react-hot-toast';

const AddressForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm();

  const isEditing = Boolean(id);

  useEffect(() => {
    fetchCustomers();
    if (isEditing) {
      fetchAddress();
    }
  }, [id]);

  const fetchCustomers = async () => {
    try {
      const response = await customerAPI.getCustomers({ limit: 100 });
      setCustomers(response.data.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Failed to load customers');
    }
  };

  const fetchAddress = async () => {
    try {
      setLoading(true);
      const response = await addressAPI.getAddress(id);
      const addressData = response.data.data;
      setAddress(addressData);
      setSelectedCustomer(addressData.customer_id);

      // Set form values
      setValue('customer_id', addressData.customer_id);
      setValue('address_line1', addressData.address_line1);
      setValue('address_line2', addressData.address_line2 || '');
      setValue('city', addressData.city);
      setValue('state', addressData.state);
      setValue('pin_code', addressData.pin_code);
      setValue('country', addressData.country || 'India');
      setValue('is_primary', addressData.is_primary);
    } catch (error) {
      console.error('Error fetching address:', error);
      toast.error('Failed to load address data');
      navigate('/addresses');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      
      // Ensure customer_id is an integer
      const formData = {
        ...data,
        customer_id: parseInt(data.customer_id),
        is_primary: Boolean(data.is_primary)
      };
      
      if (isEditing) {
        await addressAPI.updateAddress(id, formData);
        toast.success('Address updated successfully');
      } else {
        await addressAPI.createAddress(formData);
        toast.success('Address created successfully');
      }

      navigate('/addresses');
    } catch (error) {
      console.error('Error saving address:', error);
      const errorMessage = error.response?.data?.message || 'Failed to save address';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerChange = (customerId) => {
    setSelectedCustomer(customerId);
    setValue('customer_id', customerId);
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
            onClick={() => navigate('/addresses')}
            className="btn btn-secondary"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isEditing ? 'Edit Address' : 'New Address'}
            </h1>
            <p className="mt-2 text-gray-600">
              {isEditing ? 'Update address information' : 'Create a new address record'}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Address Information */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Address Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="form-group md:col-span-2">
              <label className="form-label">Customer *</label>
              <select
                {...register('customer_id', {
                  required: 'Customer is required'
                })}
                value={selectedCustomer || ''}
                onChange={(e) => handleCustomerChange(e.target.value)}
                className={`input ${errors.customer_id ? 'border-red-500' : ''}`}
                disabled={isEditing}
              >
                <option value="">Select a customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.first_name} {customer.last_name} (ID: {customer.id})
                  </option>
                ))}
              </select>
              {errors.customer_id && (
                <p className="form-error">{errors.customer_id.message}</p>
              )}
            </div>

            <div className="form-group md:col-span-2">
              <label className="form-label">Address Line 1 *</label>
              <input
                type="text"
                {...register('address_line1', {
                  required: 'Address line 1 is required',
                  minLength: { value: 5, message: 'Address must be at least 5 characters' },
                  maxLength: { value: 200, message: 'Address must be less than 200 characters' }
                })}
                className={`input ${errors.address_line1 ? 'border-red-500' : ''}`}
                placeholder="Enter address line 1"
              />
              {errors.address_line1 && (
                <p className="form-error">{errors.address_line1.message}</p>
              )}
            </div>

            <div className="form-group md:col-span-2">
              <label className="form-label">Address Line 2</label>
              <input
                type="text"
                {...register('address_line2', {
                  maxLength: { value: 200, message: 'Address line 2 must be less than 200 characters' }
                })}
                className={`input ${errors.address_line2 ? 'border-red-500' : ''}`}
                placeholder="Enter address line 2 (optional)"
              />
              {errors.address_line2 && (
                <p className="form-error">{errors.address_line2.message}</p>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">City *</label>
              <input
                type="text"
                {...register('city', {
                  required: 'City is required',
                  minLength: { value: 2, message: 'City must be at least 2 characters' },
                  maxLength: { value: 50, message: 'City must be less than 50 characters' }
                })}
                className={`input ${errors.city ? 'border-red-500' : ''}`}
                placeholder="Enter city"
              />
              {errors.city && (
                <p className="form-error">{errors.city.message}</p>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">State *</label>
              <input
                type="text"
                {...register('state', {
                  required: 'State is required',
                  minLength: { value: 2, message: 'State must be at least 2 characters' },
                  maxLength: { value: 50, message: 'State must be less than 50 characters' }
                })}
                className={`input ${errors.state ? 'border-red-500' : ''}`}
                placeholder="Enter state"
              />
              {errors.state && (
                <p className="form-error">{errors.state.message}</p>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Pin Code *</label>
              <input
                type="text"
                {...register('pin_code', {
                  required: 'Pin code is required',
                  pattern: {
                    value: /^[0-9]{6}$/,
                    message: 'Pin code must be exactly 6 digits'
                  }
                })}
                className={`input ${errors.pin_code ? 'border-red-500' : ''}`}
                placeholder="Enter 6-digit pin code"
              />
              {errors.pin_code && (
                <p className="form-error">{errors.pin_code.message}</p>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Country</label>
              <input
                type="text"
                {...register('country', {
                  minLength: { value: 2, message: 'Country must be at least 2 characters' },
                  maxLength: { value: 50, message: 'Country must be less than 50 characters' }
                })}
                className={`input ${errors.country ? 'border-red-500' : ''}`}
                placeholder="Enter country"
                defaultValue="India"
              />
              {errors.country && (
                <p className="form-error">{errors.country.message}</p>
              )}
            </div>

            <div className="form-group md:col-span-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  {...register('is_primary')}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Set as primary address</span>
                <Star className="h-4 w-4 text-yellow-500" />
              </label>
              <p className="text-sm text-gray-500 mt-1">
                Primary addresses are used as the default shipping address for the customer.
              </p>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/addresses')}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isEditing ? 'Update Address' : 'Create Address'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddressForm;
