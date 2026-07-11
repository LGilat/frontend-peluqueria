import { useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient';
import Modal from '../../components/common/Modal';

const NoticesPage = () => {
  const [notices, setNotices] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [lastSendResult, setLastSendResult] = useState(null);
  const [formData, setFormData] = useState({
    titulo: '',
    mensaje: '',
    destinatarios: []
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resNotices, resStaff] = await Promise.all([
        axiosClient.get('/aviso/'),
        axiosClient.get('/atendente/')
      ]);
      setNotices(resNotices.data);
      setStaff(resStaff.data);
    } catch (error) {
      console.error('Error fetching notices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = () => {
    setFormData({ titulo: '', mensaje: '', destinatarios: [] });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const toggleDestinatario = (id) => {
    setFormData((prev) => {
      const exists = prev.destinatarios.includes(id);
      return {
        ...prev,
        destinatarios: exists
          ? prev.destinatarios.filter((d) => d !== id)
          : [...prev.destinatarios, id]
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSending(true);
      setLastSendResult(null);
      const aviso = await axiosClient.post('/aviso/', {
        titulo: formData.titulo,
        mensaje: formData.mensaje
      });

      await Promise.all(
        formData.destinatarios.map((id) =>
          axiosClient.post('/aviso-destinatario/', {
            aviso: aviso.data.id,
            atendente: id
          })
        )
      );

      const result = await axiosClient.post('/aviso/enviar-email/', { aviso: aviso.data.id });
      setLastSendResult(result.data);

      fetchData();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving notice:', error);
      alert('Error al enviar el aviso.');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <div className="loading">Cargando avisos...</div>;
  }

  return (
    <div className="notices-page">
      <div className="content-header">
        <h2>Comunicados</h2>
        <button className="btn btn-primary" onClick={handleOpenModal}>
          + Nuevo Comunicado
        </button>
      </div>

      {lastSendResult && (
        <div className="card" style={{ marginBottom: '16px' }}>
          <strong>Resultado envío</strong>
          <p>Enviados: {lastSendResult.enviados}</p>
          {lastSendResult.errores && lastSendResult.errores.length > 0 && (
            <div>
              <strong>Errores:</strong>
              {lastSendResult.errores.map((e, idx) => (
                <div key={`${e.atendente}-${idx}`} style={{ color: '#e74c3c' }}>
                  Atendente {e.atendente}: {e.error}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="card">
        <div className="item-list">
          {notices.length === 0 ? (
            <p style={{ padding: '20px', color: '#7f8c8d' }}>No hay comunicados.</p>
          ) : (
            notices.map((n) => (
              <div key={n.id} className="item-row" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <strong>{n.titulo}</strong>
                <span style={{ color: '#7f8c8d' }}>{n.mensaje}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title="Nuevo Comunicado">
        <form onSubmit={handleSubmit} className="notice-form">
          <div className="form-group">
            <label>Título</label>
            <input
              type="text"
              name="titulo"
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              required
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label>Mensaje</label>
            <textarea
              name="mensaje"
              value={formData.mensaje}
              onChange={(e) => setFormData({ ...formData, mensaje: e.target.value })}
              required
              rows="4"
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label>Destinatarios</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {staff.map((member) => (
                <label key={member.id} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="checkbox"
                    checked={formData.destinatarios.includes(member.id)}
                    onChange={() => toggleDestinatario(member.id)}
                  />
                  {member.nombre} {member.apellido}
                </label>
              ))}
            </div>
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={sending}>
              {sending ? 'Enviando...' : 'Enviar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default NoticesPage;
