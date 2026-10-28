import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore, useThemeStore } from './lib/store';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';

// Officer Pages
import MyExams from './pages/officer/MyExams';
import TakeExam from './pages/officer/TakeExam';
import Results from './pages/officer/Results';
import ResultDetail from './pages/officer/ResultDetail';
import Certificates from './pages/officer/Certificates';
import Profile from './pages/officer/Profile';

// Grader Pages
import GradingQueue from './pages/grader/GradingQueue';
import GradeExam from './pages/grader/GradeExam';
import Appeals from './pages/grader/Appeals';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import Accounts from './pages/admin/Accounts';
import AccountCreate from './pages/admin/AccountCreate';
import Ranks from './pages/admin/Ranks';
import ExamList from './pages/admin/ExamList';
import ExamCreate from './pages/admin/ExamCreate';
import Assignments from './pages/admin/Assignments';
import CertificatesAdmin from './pages/admin/CertificatesAdmin';
import CertApproval from './pages/admin/CertApproval';
import ResultsLog from './pages/admin/ResultsLog';

export default function App() {
  const { init } = useThemeStore();
  const { user, isAuthenticated, setUser } = useAuthStore();

  useEffect(() => {
    init();
    // Hydrate session if exists in localStorage
    try {
      const raw = localStorage.getItem('pd_auth_user');
      if (raw) {
        setUser(JSON.parse(raw));
      }
    } catch (e) {
      console.error('Session restore error', e);
    }
  }, [init, setUser]);

  // Root redirect helper
  const getInitialRedirect = () => {
    if (!isAuthenticated || !user) return '/login';
    if (user.role === 'ADMIN') return '/admin/dashboard';
    if (user.role === 'GRADER') return '/grader/queue';
    return '/officer/exams';
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Public login */}
        <Route path="/login" element={<Login />} />

        {/* Exam Taking: dedicated focused layout without distracting nav */}
        <Route
          path="/exam/:assignmentId"
          element={
            <ProtectedRoute roles={['OFFICER', 'ADMIN']}>
              <TakeExam />
            </ProtectedRoute>
          }
        />

        {/* Officer Workspace */}
        <Route
          path="/officer/*"
          element={
            <ProtectedRoute roles={['OFFICER', 'ADMIN', 'GRADER']}>
              <Layout>
                <Routes>
                  <Route path="exams" element={<MyExams />} />
                  <Route path="results" element={<Results />} />
                  <Route path="results/:attemptId" element={<ResultDetail />} />
                  <Route path="certificates" element={<Certificates />} />
                  <Route path="profile" element={<Profile />} />
                  <Route path="*" element={<Navigate to="/officer/exams" replace />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Grader Workspace */}
        <Route
          path="/grader/*"
          element={
            <ProtectedRoute roles={['GRADER', 'ADMIN']}>
              <Layout>
                <Routes>
                  <Route path="queue" element={<GradingQueue />} />
                  <Route path="grading/:attemptId" element={<GradeExam />} />
                  <Route path="appeals" element={<Appeals />} />
                  <Route path="*" element={<Navigate to="/grader/queue" replace />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Admin Workspace */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute roles={['ADMIN']}>
              <Layout>
                <Routes>
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="create-account" element={<AccountCreate />} />
                  <Route path="accounts" element={<Accounts />} />
                  <Route path="ranks" element={<Ranks />} />
                  <Route path="certificates" element={<CertificatesAdmin />} />
                  <Route path="exams" element={<ExamList />} />
                  <Route path="exams/create" element={<ExamCreate />} />
                  <Route path="assignments" element={<Assignments />} />
                  <Route path="cert-approvals" element={<CertApproval />} />
                  <Route path="results-log" element={<ResultsLog />} />
                  <Route path="appeals" element={<Appeals />} />
                  <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Root redirect */}
        <Route path="/" element={<Navigate to={getInitialRedirect()} replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
