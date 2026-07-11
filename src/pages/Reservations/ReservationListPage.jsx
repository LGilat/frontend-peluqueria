import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import './ReservationListPage.css';

const PAGE_SIZE = 10;

const ReservationListPage = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentReservation, setCurrentReservation] = useState(null);
  const [clients, setClients] = useState([]);
  const [staff, setStaff] = useState([]);
  const [services, setServices] = useState([]);
  const [page, setPage] = useState(1);
  const [formData, setFormData] = useState({
    cliente: '',
    servicio: '',
    fecha: '',
    hora: '',
    estado: 'pendiente',
    observaciones: '',
    atendente: '',
    motivo_cancelacion: ''
  });

  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    fetchReservations();
    fetchClients();
    fetchStaff();
    fetchServices();
  }, []);

  useEffect(() => {
    const shouldOpen = searchParams.get('new') === '1';
    if (shouldOpen) {
      const serviceId = searchParams.get('service');
      handleOpenModal();
      if (serviceId) {
        setFormData((prev) => ({ ...prev, servicio: serviceId }));
      }
      searchParams.delete('new');
      searchParams.delete('service');
      setSearchParams(searchParams);
    }
  }, [searchParams, setSearchParams]);

  const fetchReservations = async () => {
    try {
      const response = await axiosClient.get('/reserva/');
      setReservations(response.data);
    } catch (error) {
      console.error('Error fetching reservations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await axiosClient.get('/cliente/');
      setClients(response.data);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchStaff = async () => {
    try {
      const response = await axiosClient.get('/atendente/');
      setStaff(response.data);
    } catch (error) {
      console.error('Error fetching staff:', error);
    }
  };

  const fetchServices = async () => {
    try {
      const response = await axiosClient.get('/servicio/');
      setServices(response.data);
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleOpenModal = (reservation = null) => {
    if (reservation) {
      setCurrentReservation(reservation);
      setFormData({
        cliente: reservation.cliente || '',
        servicio: reservation.servicio || '',
        fecha: reservation.fecha || '',
        hora: reservation.hora || '',
        estado: reservation.estado || 'pendiente',
        observaciones: reservation.observaciones || '',
        atendente: reservation.atendente || '',
        motivo_cancelacion: reservation.motivo_cancelacion || ''
      });
    } else {
      setCurrentReservation(null);
      setFormData({
        cliente: '',
        servicio: '',
        fecha: '',
        hora: '',
        estado: 'pendiente',
        observaciones: '',
        atendente: '',
        motivo_cancelacion: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentReservation(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        cliente: parseInt(formData.cliente, 10),
        servicio: parseInt(formData.servicio, 10),
        atendente: formData.atendente ? parseInt(formData.atendente, 10) : null
      };

      if (currentReservation) {
        await axiosClient.put(`/reserva/${currentReservation.id}/`, payload);
      } else {
        await axiosClient.post('/reserva/', payload);
      }

      fetchReservations();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving reservation:', error);
      alert('Error al guardar la reserva. Verifica los datos.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta reserva?')) {
      try {
        await axiosClient.delete(`/reserva/${id}/`);
        fetchReservations();
      } catch (error) {
        console.error('Error deleting reservation:', error);
        alert('Error al eliminar la reserva.');
      }
    }
  };

  const clientById = new Map(clients.map((c) => [c.id, c]));
  const staffById = new Map(staff.map((s) => [s.id, s]));
  const serviceById = new Map(services.map((s) => [s.id, s]));

  const filteredReservations = reservations.filter((res) => {
    const cliente = clientById.get(res.cliente);
    const servicio = serviceById.get(res.servicio);
    const clienteNombre = cliente ? `${cliente.nombre} ${cliente.apellido}` : '';
    const servicioNombre = servicio ? servicio.nombre : '';

    return (
      clienteNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      servicioNombre.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredReservations.length / PAGE_SIZE));
  const start = (page - 1) * PAGE_SIZE;
  const pagedReservations = filteredReservations.slice(start, start + PAGE_SIZE);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [totalPages, page]);

  const columns = [
    { key: 'id', header: 'ID' },
    {
      key: 'cliente',
      header: 'Cliente',
      render: (value) => {
        const cliente = clientById.get(value);
        return cliente ? `${cliente.nombre} ${cliente.apellido}` : 'N/A';
      }
    },
    {
      key: 'servicio',
      header: 'Servicio',
      render: (value) => {
        const servicio = serviceById.get(value);
        return servicio ? servicio.nombre : 'N/A';
      }
    },
    { key: 'fecha', header: 'Fecha' },
    { key: 'hora', header: 'Hora' },
    {
      key: 'estado',
      header: 'Estado',
      render: (value) => (
        <span className={`status-badge status-${value}`}>
          {value}
        </span>
      )
    },
    {
      key: 'recordatorio_enviado',
      header: 'Recordatorio',
      render: (value) => (value ? 'Sí' : 'No')
    },
    {
      key: 'atendente',
      header: 'Atendente',
      render: (value) => {
        const member = staffById.get(value);
        return member ? `${member.nombre} ${member.apellido}` : 'N/A';
      }
    }
  ];

  if (loading) {
    return <div className="loading">Cargando reservas...</div>;
  }

  return (
    <div className="reservations-page">
      <div className="content-header">
        <h2>Reservas</h2>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          + Nueva Reserva
        </button>
      </div>

      <div className="card">
        <div className="card-header">
          <input
            type="text"
            className="form-input"
            placeholder="Buscar reservas..."
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
          data={pagedReservations}
          onEdit={handleOpenModal}
          onDelete={handleDelete}
        />

        {filteredReservations.length > 0 && (
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
        title={currentReservation ? 'Editar Reserva' : 'Nueva Reserva'}
      >
        <form onSubmit={handleSubmit} className="reservation-form">
          <div className="form-group">
            <label>Cliente</label>
            <select
              name="cliente"
              value={formData.cliente}
              onChange={handleInputChange}
              required
              className="form-input"
            >
              <option value="">Seleccionar cliente</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.nombre} {client.apellido}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Servicio</label>
            <select
              name="servicio"
              value={formData.servicio}
              onChange={handleInputChange}
              required
              className="form-input"
            >
              <option value="">Seleccionar servicio</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.nombre} ({service.duracion_minutos} min)
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Fecha</label>
            <input
              type="date"
              name="fecha"
              value={formData.fecha}
              onChange={handleInputChange}
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Hora</label>
            <input
              type="time"
              name="hora"
              value={formData.hora}
              onChange={handleInputChange}
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Estado</label>
            <select
              name="estado"
              value={formData.estado}
              onChange={handleInputChange}
              className="form-input"
            >
              <option value="pendiente">pendiente</option>
              <option value="realizada">realizada</option>
              <option value="finalizada">finalizada</option>
              <option value="cancelada">cancelada</option>
            </select>
          </div>

          {formData.estado === 'cancelada' && (
            <div className="form-group">
              <label>Motivo de cancelación</label>
              <textarea
                name="motivo_cancelacion"
                value={formData.motivo_cancelacion}
                onChange={handleInputChange}
                rows="2"
                className="form-input"
              />
            </div>
          )}

          <div className="form-group">
            <label>Atendente</label>
            <select
              name="atendente"
              value={formData.atendente}
              onChange={handleInputChange}
              className="form-input"
            >
              <option value="">Sin asignar</option>
              {staff.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.nombre} {member.apellido}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Observaciones</label>
            <textarea
              name="observaciones"
              value={formData.observaciones}
              onChange={handleInputChange}
              rows="3"
              className="form-input"
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              {currentReservation ? 'Actualizar' : 'Guardar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ReservationListPage;
