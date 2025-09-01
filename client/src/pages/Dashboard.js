import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  MapPin, 
  Plus, 
  Search, 
  BarChart3,
  TrendingUp,
  Home,
  Building
} from 'lucide-react';
import { customerAPI, addressAPI } from '../services/api';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalAddresses: 0,
    multipleAddresses: 0,
    singleAddress: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      
      // Fetch customers
      const customersResponse = await customerAPI.getCustomers({ limit: 1 });
      const totalCustomers = customersResponse.data.pagination?.total || 0;

      // Fetch addresses
      const addressesResponse = await addressAPI.getAddresses({ limit: 1 });
      const totalAddresses = addressesResponse.data.pagination?.total || 0;

      // Fetch multiple addresses
      const multipleResponse = await customerAPI.getMultipleAddresses();
      const multipleAddresses = multipleResponse.data.data?.length || 0;

      // Fetch single addresses
      const singleResponse = await customerAPI.getSingleAddress();
      const singleAddress = singleResponse.data.data?.length || 0;

      setStats({
        totalCustomers,
        totalAddresses,
        multipleAddresses,
        singleAddress,
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      toast.error('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      name: 'Add New Customer',
      description: 'Create a new customer record',
      href: '/customers/new',
      icon: Plus,
      color: 'bg-blue-500',
    },
    {
      name: 'View Customers',
      description: 'Browse all customer records',
      href: '/customers',
      icon: Users,
      color: 'bg-green-500',
    },
    {
      name: 'Manage Addresses',
      description: 'View and edit addresses',
      href: '/addresses',
      icon: MapPin,
      color: 'bg-purple-500',
    },
    {
      name: 'Multiple Addresses',
      description: 'Customers with multiple addresses',
      href: '/multiple-addresses',
      icon: BarChart3,
      color: 'bg-orange-500',
    },
  ];

  const statCards = [
    {
      name: 'Total Customers',
      value: stats.totalCustomers,
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      name: 'Total Addresses',
      value: stats.totalAddresses,
      icon: MapPin,
      color: 'bg-green-500',
    },
    {
      name: 'Multiple Addresses',
      value: stats.multipleAddresses,
      icon: Building,
      color: 'bg-purple-500',
    },
    {
      name: 'Single Address',
      value: stats.singleAddress,
      icon: Home,
      color: 'bg-orange-500',
    },
  ];

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
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Welcome to your Customer Management System. Here's an overview of your data.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="card p-6">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.name}
                to={action.href}
                className="card p-6 hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex items-center">
                  <div className={`p-3 rounded-lg ${action.color}`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">{action.name}</h3>
                    <p className="text-sm text-gray-600">{action.description}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
