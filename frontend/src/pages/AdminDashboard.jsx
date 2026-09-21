import { useEffect, useState } from 'react';
import { getRevenue, listMyDoctors, listAllAppointments } from '../api/admin';
import AdminLayout from '../components/AdminLayout';
import PageHeader from '../components/PageHeader';

function startOfMonth() {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString().slice(0, 10);
}

function endOfMonth() {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).toISOString().slice(0, 10);
}

export default function AdminDashboard() {
  const [revenue, setRevenue] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const from = startOfMonth();
    const to = endOfMonth();
    Promise.all([getRevenue({ from, to }), listMyDoctors(), listAllAppointments()])
      .then(([r, d, a]) => {
        setRevenue(r);
        setDoctors(d);
        setAppointments(a);
      })
      .finally(() => setLoading(false));
  }, []);

  const doctoresActivos = doctors.filter((d) => d.user?.isActive).length;

  return (
    <AdminLayout>
      <PageHeader eyebrow="Panel admin" title="Resumen de la clínica" subtitle="Ingresos y actividad del mes en curso, de tus doctores." />

      {loading && <p className="text-slate-500">Cargando...</p>}

      {!loading && (
        <>
          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
            <StatCard label="Ingresos del mes" value={`$${(revenue?.totalIngresos || 0).toFixed(2)}`} icon="💰" />
            <StatCard label="Consultas cobradas" value={revenue?.totalCitasCobradas || 0} icon="🧾" />
            <StatCard label="Citas del mes" value={appointments.length} icon="🗓️" />
            <StatCard label="Doctores activos" value={doctoresActivos} icon="🩺" />
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h2 className="font-semibold text-navy-900 mb-4">Ingresos por doctor (este mes)</h2>
            {revenue?.porDoctor?.length ? (
              <div className="space-y-3">
                {revenue.porDoctor.map((d) => (
                  <div key={d.doctorId} className="flex items-center justify-between gap-4 text-sm">
                    <span className="text-slate-700 font-medium">{d.nombre}</span>
                    <span className="text-slate-500">{d.citas} cita{d.citas === 1 ? '' : 's'}</span>
                    <span className="text-navy-900 font-semibold">${d.total.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400">Todavía no hay consultas cobradas este mes.</p>
            )}
          </div>
        </>
      )}
    </AdminLayout>
  );
}

function StatCard({ label, value, icon }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
        <span aria-hidden="true">{icon}</span>
        {label}
      </div>
      <p className="text-2xl font-bold text-navy-900">{value}</p>
    </div>
  );
}
