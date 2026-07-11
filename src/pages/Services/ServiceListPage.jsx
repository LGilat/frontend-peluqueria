import { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import './ServiceListPage.css';

const PAGE_SIZE = 10;

const ServiceListPage = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentService, setCurrentService] = useState(null);
  const [page, setPage] = useState(1);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    duracion_minutos: 30,
    activo: true
  });

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await axiosClient.get('/servicio/');
      setServices(response.data);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleOpenModal = (service = null) => {
    if (service) {
      setCurrentService(service);
      setFormData({
        nombre: service.nombre || '',
        descripcion: service.descripcion || '',
        precio: service.precio || '',
        duracion_minutos: service.duracion_minutos || 30,
        activo: service.activo ?? true
      });
    } else {
      setCurrentService(null);
      setFormData({
        nombre: '',
        descripcion: '',
        precio: '',
        duracion_minutos: 30,
        activo: true
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentService(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        precio: parseFloat(formData.precio),
        duracion_minutos: parseInt(formData.duracion_minutos, 10)
      };

      if (currentService) {
        await axiosClient.put(`/servicio/${currentService.id}/`, payload);
      } else {
        await axiosClient.post('/servicio/', payload);
      }

      fetchServices();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving service:', error);
      alert('Error al guardar el servicio. Verifica los datos.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este servicio?')) {
      try {
        await axiosClient.delete(`/servicio/${id}/`);
        fetchServices();
      } catch (error) {
        console.error('Error deleting service:', error);
        alert('Error al eliminar el servicio.');
      }
    }
  };

  const filteredServices = services.filter((service) =>
    service.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filteredServices.length / PAGE_SIZE));
  const start = (page - 1) * PAGE_SIZE;
  const pagedServices = filteredServices.slice(start, start + PAGE_SIZE);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [totalPages, page]);

  const columns = [
    { key: 'id', header: 'ID' },
    { key: 'nombre', header: 'Nombre' },
    { key: 'descripcion', header: 'Descripción' },
    {
      key: 'precio',
      header: 'Precio',
      render: (value) => `$${parseFloat(value).toFixed(2)}`
    },
    { key: 'duracion_minutos', header: 'Duración (min)' },
    {
      key: 'activo',
      header: 'Activo',
      render: (value) => (value ? 'Sí' : 'No')
    }
  ];

  if (loading) {
    return <div className="loading">Cargando servicios...</div>;
  }

  return (
    <div className="services-page">
      <div className="content-header">
        <h2>Servicios</h2>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          + Nuevo Servicio
        </button>
      </div>

      <div className="card">
        <div className="card-header">
          <input
            type="text"
            className="form-input"
            placeholder="Buscar servicios..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            style={{ maxWidth: '300px' }}
          />
        </div>

        <Table
          columns={columns}
          data={pagedServices}
          onEdit={handleOpenModal}
          onDelete={handleDelete}
        />

        {filteredServices.length > 0 && (
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
        title={currentService ? 'Editar Servicio' : 'Nuevo Servicio'}
      >
        <form onSubmit={handleSubmit} className="service-form">
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
            <label>Descripción</label>
            <textarea
              name="descripcion"
              value={formData.descripcion}
              onChange={handleInputChange}
              rows="3"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Precio</label>
            <input
              type="number"
              name="precio"
              value={formData.precio}
              onChange={handleInputChange}
              required
              min="0"
              step="0.01"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Duración (minutos)</label>
            <input
              type="number"
              name="duracion_minutos"
              value={formData.duracion_minutos}
              onChange={handleInputChange}
              required
              min="5"
              step="5"
              className="form-input"
            />
          </div>

          <div className="form-group" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input
              type="checkbox"
              name="activo"
              checked={formData.activo}
              onChange={handleInputChange}
            />
            <label>Servicio activo</label>
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              {currentService ? 'Actualizar' : 'Guardar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ServiceListPage;
