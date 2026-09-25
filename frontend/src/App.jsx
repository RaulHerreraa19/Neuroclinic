import { Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import DoctorProfile from './pages/DoctorProfile';
import Booking from './pages/Booking';
import Login from './pages/Login';
import MyAppointments from './pages/MyAppointments';
import MyProfile from './pages/MyProfile';
import DoctorAgenda from './pages/DoctorAgenda';
import DoctorSchedule from './pages/DoctorSchedule';
import DoctorPatients from './pages/DoctorPatients';
import PatientRecord from './pages/PatientRecord';
import AdminDoctors from './pages/AdminDoctors';
import AdminAppointments from './pages/AdminAppointments';
import AdminDashboard from './pages/AdminDashboard';
import AdminPriceCatalog from './pages/AdminPriceCatalog';

export default function App() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <NavBar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/doctors/:id" element={<DoctorProfile />} />
        <Route path="/booking" element={<Booking />} />
        <Route path="/login" element={<Login />} />

        <Route
          path="/mis-citas"
          element={
            <ProtectedRoute roles={['paciente']}>
              <MyAppointments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/perfil"
          element={
            <ProtectedRoute>
              <MyProfile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/agenda"
          element={
            <ProtectedRoute roles={['medico']}>
              <DoctorAgenda />
            </ProtectedRoute>
          }
        />
        <Route
          path="/horario"
          element={
            <ProtectedRoute roles={['medico']}>
              <DoctorSchedule />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pacientes"
          element={
            <ProtectedRoute roles={['medico']}>
              <DoctorPatients />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pacientes/:id"
          element={
            <ProtectedRoute roles={['medico', 'admin']}>
              <PatientRecord />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/panel"
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/doctores"
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminDoctors />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/citas"
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminAppointments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/catalogo-precios"
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminPriceCatalog />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}
