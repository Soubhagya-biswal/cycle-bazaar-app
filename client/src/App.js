import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import './App.css';

import Header from './components/Header';
import CycleList from './components/CycleList';
import AdminDashboard from './components/AdminDashboard';
import EditCycle from './components/EditCycle';
import VerifyEmail from './components/VerifyEmail';
import Register from './components/Register';
import Login from './components/Login';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import CycleDetailsPage from './components/CycleDetailsPage';
import CartPage from './components/CartPage';
import ShippingPage from './components/ShippingPage';
import PaymentPage from './components/PaymentPage';
import PlaceOrderPage from './components/PlaceOrderPage';
import OrderPage from './components/OrderPage';
import MyOrdersScreen from './components/MyOrdersScreen';
import WishlistPage from './components/WishlistPage';
import OrderListScreen from './components/OrderListScreen'; 
import UserListScreen from './components/UserListScreen';
import MyReviewsPage from './components/MyReviewsPage.js';
import ProfilePage from './components/ProfilePage.js';
import AddressPage from './components/AddressPage';
import ReturnListScreen from './components/ReturnListScreen';
import BecomeSellerPage from './components/BecomeSellerPage';

function App() {
  return (
    <Router>
      <Header />
      <main className="py-3">
        <Container>
          <Routes>
            <Route path="/" element={<CycleList />} exact />
            <Route path="/page/:pageNumber" element={<CycleList />} />
             <Route path="/search/:keyword" element={<CycleList />} />
            <Route path="/search/:keyword/page/:pageNumber" element={<CycleList />} />

            <Route path="/" element={<CycleList />} />
            <Route path="/cycle/:id" element={<CycleDetailsPage />} />

            {/* Admin Routes */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/userlist" element={<UserListScreen />} />
            <Route path="/admin/orderlist" element={<OrderListScreen />} /> 
            <Route path="/edit/:id" element={<EditCycle />} /> 
            <Route path="/admin/returns" element={<ReturnListScreen />} />


            {/* User/Auth Routes */}
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/address" element={<AddressPage />} />
            <Route path="/shipping" element={<ShippingPage />} />
            <Route path="/payment" element={<PaymentPage />} />
            <Route path="/placeorder" element={<PlaceOrderPage />} />
            <Route path="/order/:id" element={<OrderPage />} />
             <Route path="/wishlist" element={<WishlistPage />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/verify/:token" element={<VerifyEmail />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/myorders" element={<MyOrdersScreen />} />
            <Route path="/myreviews" element={<MyReviewsPage />} />
            <Route path="/become-seller" element={<BecomeSellerPage />} />
          </Routes>
        </Container>
      </main>
    </Router>
  );
}

export default App;