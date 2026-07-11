import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';

const DashboardPage = () => {
  const [reservations, setReservations] = useState([]);
  const [services, setServices] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    todayReservations: 0,
    totalClients: 0,
    monthlyIncome: 0
  });

  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [resReservations, resServices, resClients] = await Promise.all([
        axiosClient.get('/reserva/?ordering=fecha,hora'),
        axiosClient.get('/servicio/'),
        axiosClient.get('/cliente/')
      ]);

      const upcomingReservations = resReservations.data.filter(r => {
        const resDate = new Date(`${r.fecha} ${r.hora}`);
        return resDate >= new Date();
      }).slice(0, 5);

      setReservations(upcomingReservations);
      setServices(resServices.data);
      setClients(resClients.data);

      setStats({
        todayReservations: upcomingReservations.length,
        totalClients: resClients.data.length,
        monthlyIncome: 2500
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const options = { weekday: 'short', day: 'numeric', month: 'short' };
    return new Date(dateString).toLocaleDateString('es-ES', options);
  };

  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(':');
    return `${hours}:${minutes}`;
  };

  const serviceById = new Map(services.map((s) => [s.id, s]));
  const clientById = new Map(clients.map((c) => [c.id, c]));

  if (loading) {
    return <div className="loading">Cargando dashboard...</div>;
  }

  return (
    <div className="dashboard-page">
      <div className="content-header">
        <div>
          <h2>Bienvenido</h2>
          <p style={{ color: '#7f8c8d' }}>Resumen de tu negocio</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/reservations?new=1')}>
          + Nueva Reserva
        </button>
      </div>

      <div className="dashboard-grid">
        <div className="card stat-card">
          <p className="stat-label">Reservas Hoy</p>
          <p className="stat-value">{stats.todayReservations}</p>
        </div>
        <div className="card stat-card">
          <p className="stat-label">Total Clientes</p>
          <p className="stat-value">{stats.totalClients}</p>
        </div>
        <div className="card stat-card">
          <p className="stat-label">Ingresos Mensuales</p>
          <p className="stat-value">${stats.monthlyIncome}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Próximas Reservas</h3>
            <a href="/reservations" style={{ color: '#e67e22', fontSize: '0.9rem' }}>Ver todas</a>
          </div>
          <div className="item-list">
            {reservations.length > 0 ? (
              reservations.map((res) => {
                const servicio = serviceById.get(res.servicio);
                const cliente = clientById.get(res.cliente);
                return (
                  <div key={res.id} className="item-row">
                    <div className="item-info">
                      <h4>{servicio ? servicio.nombre : 'Servicio'}</h4>
                      <p>
                        <span style={{ marginRight: '10px' }}>
                          📅 {formatDate(res.fecha)}
                        </span>
                        <span>🕐 {formatTime(res.hora)}</span>
                      </p>
                      <p style={{ marginTop: '4px', fontSize: '0.85rem' }}>
                        Cliente: {cliente ? `${cliente.nombre} ${cliente.apellido}` : `ID ${res.cliente}`}
                      </p>
                    </div>
                    <span className={`item-status status-${res.estado}`}>
                      {res.estado}
                    </span>
                  </div>
                );
              })
            ) : (
              <p style={{ padding: '20px', textAlign: 'center', color: '#7f8c8d' }}>
                No hay reservas próximas
              </p>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Servicios</h3>
            <a href="/services" style={{ color: '#e67e22', fontSize: '0.9rem' }}>Ver todos</a>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {services.length > 0 ? (
              services.slice(0, 4).map((service) => (
                <div key={service.id} className="item-row" style={{ border: 'none', padding: '10px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div
                      style={{
                        width: '50px',
                        height: '50px',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#7f8c8d'
                      }}
                    >
                      {service.nombre.charAt(0)}
                    </div>
                    <div>
                      <h4 style={{ fontWeight: '500' }}>{service.nombre}</h4>
                      <p style={{ color: '#7f8c8d', fontSize: '0.9rem' }}>
                        ${parseFloat(service.precio).toFixed(2)} · {service.duracion_minutos} min
                      </p>
                    </div>
                  </div>
                  <button
                    className="btn btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                    onClick={() => navigate(`/reservations?new=1&service=${service.id}`)}
                  >
                    Reservar
                  </button>
                </div>
              ))
            ) : (
              <p style={{ padding: '20px', textAlign: 'center', color: '#7f8c8d' }}>
                No hay servicios disponibles
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
