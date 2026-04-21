import { Component } from 'react'
import VerificationPending from './pages/verificationpending'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

class ErrorBoundary extends Component {
  state = { error: null }
  static getDerivedStateFromError(e) { return { error: e } }
  componentDidCatch(e, info) { console.error('[ErrorBoundary]', e.message, info.componentStack) }
  render() {
    if (this.state.error) return (
      <div style={{ padding: 32, fontFamily: 'monospace', color: '#f87171' }}>
        <b>Something went wrong:</b>
        <pre style={{ fontSize: 12, marginTop: 8 }}>{this.state.error.message}</pre>
        <button onClick={() => { this.setState({ error: null }); window.location.reload() }}
          style={{ marginTop: 16, padding: '8px 16px', cursor: 'pointer' }}>
          Reload
        </button>
      </div>
    )
    return this.props.children
  }
}
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Register from './pages/Register'
import ProfileSetup from './pages/ProfileSetup'
import ClientDashboard from './pages/ClientDashboard'
import FreelancerDashboard from './pages/FreelancerDashboard'
import JobBoard from './pages/JobBoard'
import JobDetail from './pages/JobDetail'
import PostJob from './pages/PostJob'
import ContractDashboard from './pages/ContractDashboard'
import FreelancerProfile from './pages/FreelancerProfile'
import FreelancerBrowse from './pages/FreelancerBrowse'
import ClientProfile from './pages/ClientProfile'
import VerifyHash from './pages/VerifyHash'
import AdminDashboard from './pages/AdminDashboard'
import AuthCallback from './pages/AuthCallback'
import GoogleComplete from './pages/GoogleComplete'
import PaymentSettings from './pages/PaymentSettings'
import BannedPage from './pages/BannedPage'
import LandingPage from './pages/LandingPage'
import AboutPage from './pages/AboutPage'
import BlogPage from './pages/BlogPage'
import CareersPage from './pages/CareersPage'
import PressPage from './pages/PressPage'
import PrivacyPage from './pages/PrivacyPage'
import TermsPage from './pages/TermsPage'
import SecurityPage from './pages/SecurityPage'
import ContactPage from './pages/ContactPage'
import ThreeBackground from './components/ThreeBackground'
import CustomCursor from './components/CustomCursor'
import { useLocation } from 'react-router-dom'

function ThreeBackgroundGated() {
  const { pathname } = useLocation()
  if (pathname === '/') return null
  return <ThreeBackground />
}

function DashboardRedirect() {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  if (user.role === 'admin') return <Navigate to="/admin" replace />
  if (user.role === 'freelancer') return <Navigate to="/dashboard/freelancer" replace />
  return <Navigate to="/dashboard/client" replace />
}

function SmartRoot() {
  const token = localStorage.getItem('token')
  if (!token) return <LandingPage />
  return <DashboardRedirect />
}

export default function App() {
  return (
    <ErrorBoundary>
    <BrowserRouter>
      <CustomCursor />
      <ThreeBackgroundGated />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#ffffff',
            color: '#09090b',
            border: '1px solid #e4e4e7',
            borderRadius: '10px',
            fontSize: '13px',
            fontFamily: "'Inter', -apple-system, sans-serif",
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
            padding: '10px 14px',
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#ffffff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#ffffff' } },
          duration: 3000,
        }}
      />
      <div style={{ position: 'relative', zIndex: 1 }}>
      <Routes>
        {/* Public */}
        <Route path="/verification-pending" element={<VerificationPending />} />
        <Route path="/banned" element={<BannedPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify/:hash" element={<VerifyHash />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/auth/google/complete" element={<GoogleComplete />} />

        {/* Home: landing page for guests, dashboard redirect for logged-in */}
        <Route path="/" element={<SmartRoot />} />

        {/* Onboarding */}
        <Route path="/profile/setup" element={<ProtectedRoute><ProfileSetup /></ProtectedRoute>} />

        {/* Dashboards */}
        <Route path="/dashboard/client" element={<ProtectedRoute role="client"><ClientDashboard /></ProtectedRoute>} />
        <Route path="/dashboard/freelancer" element={<ProtectedRoute role="freelancer"><FreelancerDashboard /></ProtectedRoute>} />

        {/* Jobs */}
        <Route path="/jobs" element={<ProtectedRoute><JobBoard /></ProtectedRoute>} />
        <Route path="/jobs/post" element={<ProtectedRoute role="client"><PostJob /></ProtectedRoute>} />
        <Route path="/jobs/:id" element={<ProtectedRoute><JobDetail /></ProtectedRoute>} />

        {/* Freelancers */}
        <Route path="/freelancers" element={<ProtectedRoute><FreelancerBrowse /></ProtectedRoute>} />
        <Route path="/freelancers/:userId" element={<ProtectedRoute><FreelancerProfile /></ProtectedRoute>} />
        <Route path="/clients/:userId" element={<ProtectedRoute><ClientProfile /></ProtectedRoute>} />

        {/* Contracts & Milestones */}
        <Route path="/contracts/:id" element={<ProtectedRoute><ContractDashboard /></ProtectedRoute>} />


        {/* Payment Settings */}
        <Route path="/payments" element={<ProtectedRoute><PaymentSettings /></ProtectedRoute>} />

        {/* Admin */}
        <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />

        {/* Static pages */}
        <Route path="/about"    element={<AboutPage />} />
        <Route path="/blog"     element={<BlogPage />} />
        <Route path="/careers"  element={<CareersPage />} />
        <Route path="/press"    element={<PressPage />} />
        <Route path="/privacy"  element={<PrivacyPage />} />
        <Route path="/terms"    element={<TermsPage />} />
        <Route path="/security" element={<SecurityPage />} />
        <Route path="/contact"  element={<ContactPage />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </div>
    </BrowserRouter>
    </ErrorBoundary>
  )
}