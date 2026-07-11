import { useEffect, useMemo, useState } from 'react';
import axiosClient from '../../api/axiosClient';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';

const PayrollPage = () => {
  const [payrolls, setPayrolls] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPayroll, setCurrentPayroll] = useState(null);
  const [filters, setFilters] = useState({ month: '', year: '', atendente: '', estado: '' });
  const [formData, setFormData] = useState({
    atendente: '',
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    salario_base: '',
    comision_fija_total: '',
    comision_porcentaje_total: '',
    otros: '',
    deducciones: '',
    retencion_irpf: '',
    seguridad_social: '',
    estado: 'pendiente',
    fecha_pago: ''
  });
  const [detailItems, setDetailItems] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resPayrolls, resStaff] = await Promise.all([
        axiosClient.get('/nomina/'),
        axiosClient.get('/atendente/')
      ]);
      setPayrolls(resPayrolls.data);
      setStaff(resStaff.data);
    } catch (error) {
      console.error('Error fetching payrolls:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchItems = async (nominaId) => {
    try {
      const res = await axiosClient.get('/nomina-item/');
      setDetailItems(res.data.filter((i) => i.nomina === nominaId));
    } catch (error) {
      console.error('Error fetching items:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleOpenModal = (payroll = null) => {
    if (payroll) {
      setCurrentPayroll(payroll);
      setFormData({
        atendente: payroll.atendente,
        year: payroll.year,
        month: payroll.month,
        salario_base: payroll.salario_base,
        comision_fija_total: payroll.comision_fija_total,
        comision_porcentaje_total: payroll.comision_porcentaje_total,
        otros: payroll.otros,
        deducciones: payroll.deducciones,
        retencion_irpf: payroll.retencion_irpf,
        seguridad_social: payroll.seguridad_social,
        estado: payroll.estado || 'pendiente',
        fecha_pago: payroll.fecha_pago || ''
      });
      fetchItems(payroll.id);
    } else {
      setCurrentPayroll(null);
      setDetailItems([]);
      setFormData({
        atendente: '',
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        salario_base: '',
        comision_fija_total: '',
        comision_porcentaje_total: '',
        otros: '',
        deducciones: '',
        retencion_irpf: '',
        seguridad_social: '',
        estado: 'pendiente',
        fecha_pago: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentPayroll(null);
    setDetailItems([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const normalizeDecimal = (value) => (value === '' || value === null ? 0 : value);
      const payload = {
        ...formData,
        atendente: parseInt(formData.atendente, 10),
        year: parseInt(formData.year, 10),
        month: parseInt(formData.month, 10),
        salario_base: normalizeDecimal(formData.salario_base),
        comision_fija_total: normalizeDecimal(formData.comision_fija_total),
        comision_porcentaje_total: normalizeDecimal(formData.comision_porcentaje_total),
        otros: normalizeDecimal(formData.otros),
        deducciones: normalizeDecimal(formData.deducciones),
        retencion_irpf: normalizeDecimal(formData.retencion_irpf),
        seguridad_social: normalizeDecimal(formData.seguridad_social)
      };

      if (currentPayroll) {
        await axiosClient.put(`/nomina/${currentPayroll.id}/`, payload);
      } else {
        await axiosClient.post('/nomina/', payload);
      }

      fetchData();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving payroll:', error);
      alert('Error al guardar la nómina.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Eliminar nómina?')) {
      try {
        await axiosClient.delete(`/nomina/${id}/`);
        fetchData();
      } catch (error) {
        console.error('Error deleting payroll:', error);
        alert('Error al eliminar la nómina.');
      }
    }
  };

  const handleRecalculate = async () => {
    try {
      await axiosClient.post('/nomina/recalcular/', {
        year: filters.year || new Date().getFullYear(),
        month: filters.month || new Date().getMonth() + 1,
      });
      fetchData();
    } catch (error) {
      console.error('Error recalculating payroll:', error);
      alert('Error al recalcular nóminas.');
    }
  };

  const handleMarkPaid = async (payroll) => {
    try {
      await axiosClient.post(`/nomina/${payroll.id}/marcar_pagada/`, {
        fecha_pago: payroll.fecha_pago || new Date().toISOString().slice(0, 10),
      });
      fetchData();
    } catch (error) {
      console.error('Error marking payroll paid:', error);
      alert('Error al marcar nómina como pagada.');
    }
  };

  const staffById = new Map(staff.map((s) => [s.id, s]));
  const formatMoney = (value) => parseFloat(value || 0).toFixed(2);

  const filteredPayrolls = payrolls.filter((p) => {
    if (filters.month && String(p.month) !== String(filters.month)) return false;
    if (filters.year && String(p.year) !== String(filters.year)) return false;
    if (filters.atendente && String(p.atendente) !== String(filters.atendente)) return false;
    if (filters.estado && String(p.estado) !== String(filters.estado)) return false;
    return true;
  });

  const resumenPorEmpleado = useMemo(() => {
    const map = new Map();
    filteredPayrolls.forEach((p) => {
      const prev = map.get(p.atendente) || { total: 0, count: 0, comisiones: 0 };
      const total = parseFloat(p.total || 0);
      const comisiones = parseFloat(p.comision_fija_total || 0) + parseFloat(p.comision_porcentaje_total || 0);
      map.set(p.atendente, {
        total: prev.total + total,
        count: prev.count + 1,
        comisiones: prev.comisiones + comisiones
      });
    });
    return Array.from(map.entries()).map(([id, val]) => ({ id, ...val }));
  }, [filteredPayrolls]);

  const resumenGlobal = useMemo(() => {
    return filteredPayrolls.reduce(
      (acc, p) => {
        const comisiones = parseFloat(p.comision_fija_total || 0) + parseFloat(p.comision_porcentaje_total || 0);
        const deducciones =
          parseFloat(p.deducciones || 0)
          + parseFloat(p.retencion_irpf || 0)
          + parseFloat(p.seguridad_social || 0);
        const total = parseFloat(p.total || 0);
        const neto = parseFloat(p.total_neto || 0);
        if (p.estado === 'pendiente') acc.pendientes += 1;
        acc.total += total;
        acc.neto += neto;
        acc.comisiones += comisiones;
        acc.deducciones += deducciones;
        return acc;
      },
      {
        total: 0,
        neto: 0,
        comisiones: 0,
        deducciones: 0,
        pendientes: 0
      }
    );
  }, [filteredPayrolls]);

  const columns = [
    {
      key: 'atendente',
      header: 'Atendente',
      render: (value) => {
        const person = staffById.get(value);
        return person ? `${person.nombre} ${person.apellido}` : 'N/A';
      }
    },
    { key: 'month', header: 'Mes' },
    { key: 'year', header: 'Año' },
    { key: 'salario_base', header: 'Base', render: (value) => formatMoney(value) },
    { key: 'comision_fija_total', header: 'Comisión fija', render: (value) => formatMoney(value) },
    { key: 'comision_porcentaje_total', header: 'Comisión %', render: (value) => formatMoney(value) },
    { key: 'total', header: 'Total', render: (value) => formatMoney(value) },
    { key: 'total_neto', header: 'Neto', render: (value) => formatMoney(value) },
    {
      key: 'estado',
      header: 'Estado',
      render: (value, row) => (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span>{value === 'pagada' ? 'Pagada' : 'Pendiente'}</span>
          {value !== 'pagada' && (
            <button className="btn btn-secondary btn-sm" onClick={() => handleMarkPaid(row)}>
              Marcar pagada
            </button>
          )}
        </div>
      )
    },
    {
      key: 'fecha_pago',
      header: 'Fecha pago',
      render: (value) => value || '-'
    }
  ];

  if (loading) {
    return <div className="loading">Cargando nóminas...</div>;
  }

  return (
    <div className="payroll-page">
      <div className="content-header">
        <h2>Nóminas</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary" onClick={handleRecalculate}>
            Recalcular
          </button>
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            + Nueva Nómina
          </button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '16px' }}>
        <div className="card-header"><strong>Resumen por empleado</strong></div>
        <div className="item-list">
          {resumenPorEmpleado.length === 0 ? (
            <p style={{ padding: '20px', color: '#7f8c8d' }}>Sin nóminas.</p>
          ) : (
            resumenPorEmpleado.map((r) => {
              const person = staffById.get(r.id);
              return (
                <div key={r.id} className="item-row" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr' }}>
                  <span>{person ? `${person.nombre} ${person.apellido}` : 'N/A'}</span>
                  <span>Total: ${r.total.toFixed(2)}</span>
                  <span>Comisiones: ${r.comisiones.toFixed(2)}</span>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="card" style={{ marginBottom: '16px' }}>
        <div className="card-header"><strong>Resumen del periodo</strong></div>
        <div className="item-list">
          <div className="item-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr' }}>
            <span>Total bruto: ${resumenGlobal.total.toFixed(2)}</span>
            <span>Total neto: ${resumenGlobal.neto.toFixed(2)}</span>
            <span>Comisiones: ${resumenGlobal.comisiones.toFixed(2)}</span>
            <span>Deducciones: ${resumenGlobal.deducciones.toFixed(2)}</span>
            <span>Pendientes: {resumenGlobal.pendientes}</span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header" style={{ display: 'flex', gap: '10px' }}>
          <select name="month" className="form-input" value={filters.month} onChange={handleFilterChange}>
            <option value="">Mes</option>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <select
            name="atendente"
            className="form-input"
            value={filters.atendente || ''}
            onChange={handleFilterChange}
          >
            <option value="">Atendente</option>
            {staff.map((member) => (
              <option key={member.id} value={member.id}>
                {member.nombre} {member.apellido}
              </option>
            ))}
          </select>
          <select
            name="estado"
            className="form-input"
            value={filters.estado || ''}
            onChange={handleFilterChange}
          >
            <option value="">Estado</option>
            <option value="pendiente">Pendiente</option>
            <option value="pagada">Pagada</option>
          </select>
          <input
            type="number"
            name="year"
            className="form-input"
            placeholder="Año"
            value={filters.year}
            onChange={handleFilterChange}
            style={{ maxWidth: '120px' }}
          />
        </div>

        <Table
          columns={columns}
          data={filteredPayrolls}
          onEdit={handleOpenModal}
          onDelete={handleDelete}
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={currentPayroll ? 'Editar Nómina' : 'Nueva Nómina'}
      >
        <form onSubmit={handleSubmit} className="payroll-form">
          <div className="form-group">
            <label>Atendente</label>
            <select
              name="atendente"
              value={formData.atendente}
              onChange={handleInputChange}
              required
              className="form-input"
            >
              <option value="">Seleccionar atendente</option>
              {staff.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.nombre} {member.apellido}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Mes</label>
              <input
                type="number"
                name="month"
                value={formData.month}
                onChange={handleInputChange}
                min="1"
                max="12"
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <label>Año</label>
              <input
                type="number"
                name="year"
                value={formData.year}
                onChange={handleInputChange}
                className="form-input"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Salario base</label>
              <input
                type="number"
                name="salario_base"
                value={formData.salario_base}
                onChange={handleInputChange}
                step="0.01"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Comisión fija</label>
              <input
                type="number"
                name="comision_fija_total"
                value={formData.comision_fija_total}
                onChange={handleInputChange}
                step="0.01"
                className="form-input"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Comisión %</label>
              <input
                type="number"
                name="comision_porcentaje_total"
                value={formData.comision_porcentaje_total}
                onChange={handleInputChange}
                step="0.01"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Otros</label>
              <input
                type="number"
                name="otros"
                value={formData.otros}
                onChange={handleInputChange}
                step="0.01"
                className="form-input"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Deducciones</label>
              <input
                type="number"
                name="deducciones"
                value={formData.deducciones}
                onChange={handleInputChange}
                step="0.01"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Retención IRPF</label>
              <input
                type="number"
                name="retencion_irpf"
                value={formData.retencion_irpf}
                onChange={handleInputChange}
                step="0.01"
                className="form-input"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Seguridad Social</label>
              <input
                type="number"
                name="seguridad_social"
                value={formData.seguridad_social}
                onChange={handleInputChange}
                step="0.01"
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
                <option value="pendiente">Pendiente</option>
                <option value="pagada">Pagada</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Fecha de pago</label>
              <input
                type="date"
                name="fecha_pago"
                value={formData.fecha_pago || ''}
                onChange={handleInputChange}
                className="form-input"
              />
            </div>
            {currentPayroll && (
              <div className="form-group">
                <label>Total neto</label>
                <input
                  type="text"
                  value={parseFloat(currentPayroll.total_neto || 0).toFixed(2)}
                  className="form-input"
                  readOnly
                />
              </div>
            )}
          </div>

          {currentPayroll && detailItems.length > 0 && (
            <div className="card" style={{ marginTop: '12px' }}>
              <strong>Detalle</strong>
              <div className="item-list">
                {detailItems.map((item) => (
                  <div key={item.id} className="item-row" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{item.concepto}</span>
                    <span>${parseFloat(item.importe).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              {currentPayroll ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PayrollPage;
