import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import Modal from '../../components/common/Modal';

const PAGE_SIZE = 10;

const ClientListPage = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentClient, setCurrentClient] = useState(null);
  const [page, setPage] = useState(1);
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    direccion: '',
    preferencias: ''
  });

  const navigate = useNavigate();

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await axiosClient.get('/cliente/');
      setClients(response.data);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleOpenModal = (client = null) => {
    if (client) {
      setCurrentClient(client);
      setFormData({
        nombre: client.nombre || '',
        apellido: client.apellido || '',
        email: client.email || '',
        telefono: client.telefono || '',
        direccion: client.direccion || '',
        preferencias: client.preferencias || ''
      });
    } else {
      setCurrentClient(null);
      setFormData({
        nombre: '',
        apellido: '',
        email: '',
        telefono: '',
        direccion: '',
        preferencias: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentClient(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (currentClient) {
        await axiosClient.put(`/cliente/${currentClient.id}/`, formData);
      } else {
        await axiosClient.post('/cliente/', formData);
      }

      fetchClients();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving client:', error);
      alert('Error al guardar el cliente. Verifica los datos.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este cliente?')) {
      try {
        await axiosClient.delete(`/cliente/${id}/`);
        fetchClients();
      } catch (error) {
        console.error('Error deleting client:', error);
        alert('Error al eliminar el cliente.');
      }
    }
  };

  const filteredClients = clients.filter(client =>
    client.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filteredClients.length / PAGE_SIZE));
  const start = (page - 1) * PAGE_SIZE;
  const pagedClients = filteredClients.slice(start, start + PAGE_SIZE);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [totalPages, page]);

  if (loading) {
    return <div className="loading">Cargando clientes...</div>;
  }

  return (
    <div className="clients-page">
      <div className="content-header">
        <h2>Clientes</h2>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          + Nuevo Cliente
        </button>
      </div>

      <div className="card">
        <div className="card-header">
          <input
            type="text"
            className="form-input"
            placeholder="Buscar clientes..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            style={{ maxWidth: '300px' }}
          />
        </div>

        <div className="item-list">
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr 1fr', padding: '10px 0', borderBottom: '2px solid var(--border-color)', fontWeight: '600', color: '#7f8c8d' }}>
            <span>Nombre</span>
            <span>Email</span>
            <span>Teléfono</span>
            <span>Gasto</span>
            <span>Historial</span>
            <span>Acciones</span>
          </div>

          {pagedClients.map((client) => (
            <div key={client.id} className="item-row" style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr 1fr', alignItems: 'center' }}>
              <span style={{ fontWeight: '500' }}>{client.nombre} {client.apellido}</span>
              <span>{client.email}</span>
              <span>{client.telefono}</span>
              <span>${parseFloat(client.gasto_acumulado || 0).toFixed(2)}</span>
              <span>
                <button
                  className="btn btn-secondary"
                  style={{ padding: '4px 8px', fontSize: '0.8rem', width: 'fit-content' }}
                  onClick={() => navigate(`/clients/${client.id}`)}
                >
                  Ver
                </button>
              </span>
              <span>
                <button
                  className="btn btn-secondary"
                  style={{ padding: '4px 8px', fontSize: '0.8rem', marginRight: '5px' }}
                  onClick={() => handleOpenModal(client)}
                >
                  Editar
                </button>
                <button
                  className="btn"
                  style={{ padding: '4px 8px', fontSize: '0.8rem', backgroundColor: '#e74c3c', color: 'white' }}
                  onClick={() => handleDelete(client.id)}
                >
                  Eliminar
                </button>
              </span>
            </div>
          ))}
        </div>

        {filteredClients.length === 0 && (
          <p style={{ padding: '30px', textAlign: 'center', color: '#7f8c8d' }}>
            No se encontraron clientes
          </p>
        )}

        {filteredClients.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0' }}>
            <span style={{ color: '#7f8c8d' }}>
              Página {page} de {totalPages}
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-secondary" disabled={page === 1} onClick={() => setPage(page - 1)}>
                Anterior
              </button>
              <button className="btn btn-secondary" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={currentClient ? 'Editar Cliente' : 'Nuevo Cliente'}
      >
        <form onSubmit={handleSubmit} className="client-form">
          <div className="form-row">
            <div className="form-group">
              <label>Nombre</label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                required
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Apellido</label>
              <input
                type="text"
                name="apellido"
                value={formData.apellido}
                onChange={handleInputChange}
                required
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="form-input"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Teléfono</label>
              <input
                type="text"
                name="telefono"
                value={formData.telefono}
                onChange={handleInputChange}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Dirección</label>
              <input
                type="text"
                name="direccion"
                value={formData.direccion}
                onChange={handleInputChange}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Preferencias</label>
            <textarea
              name="preferencias"
              value={formData.preferencias}
              onChange={handleInputChange}
              rows="3"
              className="form-input"
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              {currentClient ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ClientListPage;
