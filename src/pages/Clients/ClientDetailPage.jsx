import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import './ClientDetailPage.css';

const ClientDetailPage = () => {
  const { id } = useParams();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClient();
  }, [id]);

  const fetchClient = async () => {
    try {
      const response = await axiosClient.get(`/cliente/${id}/`);
      setClient(response.data);
    } catch (error) {
      console.error('Error fetching client:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Cargando cliente...</div>;
  }

  if (!client) {
    return (
      <div className="card">
        <p>No se encontró el cliente.</p>
        <Link to="/clients">Volver</Link>
      </div>
    );
  }

  return (
    <div className="client-detail-page">
      <div className="content-header">
        <div>
          <h2>{client.nombre} {client.apellido}</h2>
          <p style={{ color: '#7f8c8d' }}>{client.email}</p>
        </div>
        <Link className="btn btn-secondary" to="/clients">Volver</Link>
      </div>

      <div className="card">
        <h3>Datos de contacto</h3>
        <p><strong>Teléfono:</strong> {client.telefono}</p>
        <p><strong>Dirección:</strong> {client.direccion}</p>
        <p><strong>Preferencias:</strong> {client.preferencias || 'Sin preferencias'} </p>
        <p><strong>Gasto acumulado:</strong> ${parseFloat(client.gasto_acumulado || 0).toFixed(2)}</p>
      </div>

      <div className="card" style={{ marginTop: '16px' }}>
        <h3>Historial de servicios</h3>
        {client.historial_servicios && client.historial_servicios.length > 0 ? (
          <div className="item-list">
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', padding: '10px 0', borderBottom: '2px solid var(--border-color)', fontWeight: '600', color: '#7f8c8d' }}>
              <span>Servicio</span>
              <span>Fecha</span>
              <span>Hora</span>
              <span>Atendente</span>
              <span>Precio</span>
            </div>
            {client.historial_servicios.map((item) => (
              <div key={item.id} className="item-row" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr' }}>
                <span>{item.servicio_nombre || item.servicio}</span>
                <span>{item.fecha}</span>
                <span>{item.hora}</span>
                <span>{item.atendente_nombre || 'Sin atendente'}</span>
                <span>${parseFloat(item.precio).toFixed(2)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#7f8c8d' }}>Sin historial por ahora.</p>
        )}
      </div>
    </div>
  );
};

export default ClientDetailPage;
