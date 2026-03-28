import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import LoanApplication from './pages/LoanApplication';
import LoanTracker from './pages/LoanTracker';
import Payment from './pages/Payment';
import PaymentDues from './pages/PaymentDues';
import PaymentHistory from './pages/PaymentHistory';
import PaymentSuccess from './pages/PaymentSuccess';
import Profile from './pages/Profile';
import './App.css';
// removed toastify

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }
  
  return user ? children : <Navigate to="/login" />;
};

// Public Route component (redirect to dashboard if already logged in)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }
  
  return user ? <Navigate to="/dashboard" /> : children;
};

// App Routes component
const AppRoutes = () => {
  return (
    <Routes>
      <Route 
        path="/login" 
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } 
      />
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/loans" 
        element={
          <ProtectedRoute>
            <LoanApplication />
          </ProtectedRoute>
        } 
      />
         <Route 
           path="/loan-tracker" 
           element={
             <ProtectedRoute>
               <LoanTracker />
             </ProtectedRoute>
           }
         />
      <Route 
        path="/payment" 
        element={
          <ProtectedRoute>
            <Payment />
          </ProtectedRoute>
        } 
      />
      {/* Payment success page: render directly so redirect from gateway with query params is handled */}
      <Route
        path="/payment-success"
        element={<PaymentSuccess />}
      />
      <Route 
        path="/payment-dues" 
        element={
          <ProtectedRoute>
            <PaymentDues />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/history" 
        element={
          <ProtectedRoute>
            <PaymentHistory />
          </ProtectedRoute>
        } 
      />
      <Route path="/" element={<Navigate to="/dashboard" />} />
      <Route 
        path="/profile" 
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <AppRoutes />
          {/* Toasts removed */}
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
