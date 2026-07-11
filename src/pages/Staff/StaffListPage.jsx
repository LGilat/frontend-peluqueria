import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import './StaffListPage.css';

const PAGE_SIZE = 10;

const StaffListPage = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStaff, setCurrentStaff] = useState(null);
  const [page, setPage] = useState(1);
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    especialidad: '',
    contacto: ''
  });

  const navigate = useNavigate();

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const response = await axiosClient.get('/atendente/');
      setStaff(response.data);
    } catch (error) {
      console.error('Error fetching staff:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleOpenModal = (staffMember = null) => {
    if (staffMember) {
      setCurrentStaff(staffMember);
      setFormData({
        nombre: staffMember.nombre || '',
        apellido: staffMember.apellido || '',
        email: staffMember.email || '',
        telefono: staffMember.telefono || '',
        especialidad: staffMember.especialidad || '',
        contacto: staffMember.contacto || ''
      });
    } else {
      setCurrentStaff(null);
      setFormData({
        nombre: '',
        apellido: '',
        email: '',
        telefono: '',
        especialidad: '',
        contacto: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentStaff(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (currentStaff) {
        await axiosClient.put(`/atendente/${currentStaff.id}/`, formData);
      } else {
        await axiosClient.post('/atendente/', formData);
      }

      fetchStaff();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving staff:', error);
      alert('Error al guardar el atendente. Verifica los datos.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este atendente?')) {
      try {
        await axiosClient.delete(`/atendente/${id}/`);
        fetchStaff();
      } catch (error) {
        console.error('Error deleting staff:', error);
        alert('Error al eliminar el atendente.');
      }
    }
  };

  const filteredStaff = staff.filter((member) =>
    member.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.especialidad.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filteredStaff.length / PAGE_SIZE));
  const start = (page - 1) * PAGE_SIZE;
  const pagedStaff = filteredStaff.slice(start, start + PAGE_SIZE);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [totalPages, page]);

  const columns = [
    { key: 'id', header: 'ID' },
    {
      key: 'nombre',
      header: 'Nombre',
      render: (value, row) => `${value} ${row.apellido}`
    },
    { key: 'email', header: 'Email' },
    { key: 'telefono', header: 'Teléfono' },
    { key: 'especialidad', header: 'Especialidad' },
    {
      key: 'calendar',
      header: 'Calendario',
      render: (_value, row) => (
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => navigate(`/calendar?staff=${row.id}`)}
        >
          Ver
        </button>
      )
    }
  ];

  if (loading) {
    return <div className="loading">Cargando atendentes...</div>;
  }

  return (
    <div className="staff-page">
      <div className="content-header">
        <h2>Atendentes</h2>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          + Nuevo Atendente
        </button>
      </div>

      <div className="card">
        <div className="card-header">
          <input
            type="text"
            className="form-input"
            placeholder="Buscar atendentes..."
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
          data={pagedStaff}
          onEdit={handleOpenModal}
          onDelete={handleDelete}
        />

        {filteredStaff.length > 0 && (
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
        title={currentStaff ? 'Editar Atendente' : 'Nuevo Atendente'}
      >
        <form onSubmit={handleSubmit} className="staff-form">
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
              <label>Contacto</label>
              <input
                type="text"
                name="contacto"
                value={formData.contacto}
                onChange={handleInputChange}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Especialidad</label>
            <input
              type="text"
              name="especialidad"
              value={formData.especialidad}
              onChange={handleInputChange}
              required
              className="form-input"
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              {currentStaff ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default StaffListPage;
