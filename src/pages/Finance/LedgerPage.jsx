import { useEffect, useMemo, useState } from 'react';
import axiosClient from '../../api/axiosClient';

const PAGE_SIZE = 10;

const LedgerPage = () => {
  const [ingresos, setIngresos] = useState([]);
  const [gastos, setGastos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [pageIngresos, setPageIngresos] = useState(1);
  const [pageGastos, setPageGastos] = useState(1);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resIngresos, resGastos] = await Promise.all([
        axiosClient.get('/ingreso/'),
        axiosClient.get('/gasto/')
      ]);
      setIngresos(resIngresos.data);
      setGastos(resGastos.data);
    } catch (error) {
      console.error('Error fetching ledger:', error);
    } finally {
      setLoading(false);
    }
  };

  const ingresosFiltrados = useMemo(
    () => ingresos.filter((i) => new Date(i.fecha).getFullYear() === Number(year)),
    [ingresos, year]
  );

  const gastosFiltrados = useMemo(
    () => gastos.filter((g) => new Date(g.fecha).getFullYear() === Number(year)),
    [gastos, year]
  );

  const totalIngresos = ingresosFiltrados.reduce((sum, i) => sum + parseFloat(i.cantidad), 0);
  const totalGastos = gastosFiltrados.reduce((sum, g) => sum + parseFloat(g.cantidad), 0);
  const balance = totalIngresos - totalGastos;

  const totalPagesIngresos = Math.max(1, Math.ceil(ingresosFiltrados.length / PAGE_SIZE));
  const totalPagesGastos = Math.max(1, Math.ceil(gastosFiltrados.length / PAGE_SIZE));

  const ingresosPaginados = ingresosFiltrados.slice((pageIngresos - 1) * PAGE_SIZE, pageIngresos * PAGE_SIZE);
  const gastosPaginados = gastosFiltrados.slice((pageGastos - 1) * PAGE_SIZE, pageGastos * PAGE_SIZE);

  useEffect(() => {
    if (pageIngresos > totalPagesIngresos) setPageIngresos(totalPagesIngresos);
  }, [pageIngresos, totalPagesIngresos]);

  useEffect(() => {
    if (pageGastos > totalPagesGastos) setPageGastos(totalPagesGastos);
  }, [pageGastos, totalPagesGastos]);

  if (loading) {
    return <div className="loading">Cargando contabilidad...</div>;
  }

  return (
    <div className="ledger-page">
      <div className="content-header">
        <h2>Contabilidad</h2>
        <input
          type="number"
          className="form-input"
          value={year}
          onChange={(e) => {
            setYear(e.target.value);
            setPageIngresos(1);
            setPageGastos(1);
          }}
          style={{ maxWidth: '120px' }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div className="card">
          <div className="card-header">
            <strong>Ingresos</strong>
          </div>
          <div className="item-list">
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', padding: '10px 0', borderBottom: '2px solid var(--border-color)', fontWeight: '600', color: '#7f8c8d' }}>
              <span>Concepto</span>
              <span>Importe</span>
            </div>
            {ingresosPaginados.map((i) => (
              <div key={`ingreso-${i.id}`} className="item-row" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr' }}>
                <span>{i.tipo}</span>
                <span>${parseFloat(i.cantidad).toFixed(2)}</span>
              </div>
            ))}
            {ingresosFiltrados.length === 0 && (
              <p style={{ padding: '20px', color: '#7f8c8d' }}>Sin ingresos.</p>
            )}
          </div>

          {ingresosFiltrados.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0' }}>
              <span style={{ color: '#7f8c8d' }}>
                Página {pageIngresos} de {totalPagesIngresos}
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-secondary" disabled={pageIngresos === 1} onClick={() => setPageIngresos(pageIngresos - 1)}>
                  Anterior
                </button>
                <button className="btn btn-secondary" disabled={pageIngresos === totalPagesIngresos} onClick={() => setPageIngresos(pageIngresos + 1)}>
                  Siguiente
                </button>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
            <strong>Total ingresos:</strong>
            <strong>${totalIngresos.toFixed(2)}</strong>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <strong>Gastos</strong>
          </div>
          <div className="item-list">
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', padding: '10px 0', borderBottom: '2px solid var(--border-color)', fontWeight: '600', color: '#7f8c8d' }}>
              <span>Concepto</span>
              <span>Importe</span>
            </div>
            {gastosPaginados.map((g) => (
              <div key={`gasto-${g.id}`} className="item-row" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr' }}>
                <span>{g.tipo}</span>
                <span>${parseFloat(g.cantidad).toFixed(2)}</span>
              </div>
            ))}
            {gastosFiltrados.length === 0 && (
              <p style={{ padding: '20px', color: '#7f8c8d' }}>Sin gastos.</p>
            )}
          </div>

          {gastosFiltrados.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0' }}>
              <span style={{ color: '#7f8c8d' }}>
                Página {pageGastos} de {totalPagesGastos}
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-secondary" disabled={pageGastos === 1} onClick={() => setPageGastos(pageGastos - 1)}>
                  Anterior
                </button>
                <button className="btn btn-secondary" disabled={pageGastos === totalPagesGastos} onClick={() => setPageGastos(pageGastos + 1)}>
                  Siguiente
                </button>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
            <strong>Total gastos:</strong>
            <strong>${totalGastos.toFixed(2)}</strong>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '16px' }}>
        <div className="card-header">
          <strong>Resumen</strong>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
          <div className="card" style={{ padding: '12px' }}>
            <p style={{ color: '#7f8c8d' }}>Total ingresos</p>
            <strong>${totalIngresos.toFixed(2)}</strong>
          </div>
          <div className="card" style={{ padding: '12px' }}>
            <p style={{ color: '#7f8c8d' }}>Total gastos</p>
            <strong>${totalGastos.toFixed(2)}</strong>
          </div>
          <div className="card" style={{ padding: '12px' }}>
            <p style={{ color: '#7f8c8d' }}>Balance</p>
            <strong>${balance.toFixed(2)}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LedgerPage;
