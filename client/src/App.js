import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import CustomerList from './pages/CustomerList';
import CustomerDetail from './pages/CustomerDetail';
import CustomerForm from './pages/CustomerForm';
import AddressList from './pages/AddressList';
import AddressForm from './pages/AddressForm';
import MultipleAddresses from './pages/MultipleAddresses';
import SingleAddress from './pages/SingleAddress';
import NotFound from './pages/NotFound';

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="customers" element={<CustomerList />} />
          <Route path="customers/new" element={<CustomerForm />} />
          <Route path="customers/:id" element={<CustomerDetail />} />
          <Route path="customers/:id/edit" element={<CustomerForm />} />
          <Route path="addresses" element={<AddressList />} />
          <Route path="addresses/new" element={<AddressForm />} />
          <Route path="addresses/:id/edit" element={<AddressForm />} />
          <Route path="multiple-addresses" element={<MultipleAddresses />} />
          <Route path="single-address" element={<SingleAddress />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </div>
  );
}

export default App;
