import { useEffect, useMemo, useState } from 'react';
import axiosClient from '../../api/axiosClient';

const PAGE_SIZE = 10;

const computeTax = (amount, ivaPorcentaje, ivaIncluido) => {
  const rate = (parseFloat(ivaPorcentaje || 0) / 100) || 0;
  const total = parseFloat(amount || 0);
  if (!rate) {
    return { base: total, iva: 0, total };
  }
  if (ivaIncluido) {
    const base = total / (1 + rate);
    return { base, iva: total - base, total };
  }
  const iva = total * rate;
  return { base: total, iva, total: total + iva };
};

const ReportsPage = () => {
  const [ingresos, setIngresos] = useState([]);
  const [gastos, setGastos] = useState([]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState('');
  const [ingresoCategoria, setIngresoCategoria] = useState('');
  const [gastoCategoria, setGastoCategoria] = useState('');
  const [pageIngresos, setPageIngresos] = useState(1);
  const [pageGastos, setPageGastos] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, [year]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const [resIngresos, resGastos] = await Promise.all([
        axiosClient.get('/ingreso/'),
        axiosClient.get('/gasto/')
      ]);
      setIngresos(resIngresos.data || []);
      setGastos(resGastos.data || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const ingresosFiltrados = useMemo(() => {
    return ingresos.filter((i) => {
      const d = new Date(i.fecha);
      if (d.getFullYear() !== Number(year)) return false;
      if (month && d.getMonth() + 1 !== Number(month)) return false;
      if (ingresoCategoria && i.categoria !== ingresoCategoria) return false;
      return true;
    });
  }, [ingresos, year, month, ingresoCategoria]);

  const gastosFiltrados = useMemo(() => {
    return gastos.filter((g) => {
      const d = new Date(g.fecha);
      if (d.getFullYear() !== Number(year)) return false;
      if (month && d.getMonth() + 1 !== Number(month)) return false;
      if (gastoCategoria && g.categoria !== gastoCategoria) return false;
      return true;
    });
  }, [gastos, year, month, gastoCategoria]);

  const monthlySummary = useMemo(() => {
    const map = new Map();
    for (let m = 1; m <= 12; m += 1) {
      map.set(m, { ingresos: 0, gastos: 0, margen: 0 });
    }

    ingresos.filter((i) => new Date(i.fecha).getFullYear() === Number(year)).forEach((i) => {
      const d = new Date(i.fecha);
      const m = d.getMonth() + 1;
      map.get(m).ingresos += parseFloat(i.cantidad || 0);
    });

    gastos.filter((g) => new Date(g.fecha).getFullYear() === Number(year)).forEach((g) => {
      const d = new Date(g.fecha);
      const m = d.getMonth() + 1;
      map.get(m).gastos += parseFloat(g.cantidad || 0);
    });

    map.forEach((value) => {
      value.margen = value.ingresos - value.gastos;
    });

    return map;
  }, [ingresos, gastos, year]);

  const ingresosPorCategoria = useMemo(() => {
    const totals = {};
    ingresosFiltrados.forEach((i) => {
      const key = i.categoria || 'Otros';
      totals[key] = (totals[key] || 0) + parseFloat(i.cantidad || 0);
    });
    return totals;
  }, [ingresosFiltrados]);

  const gastosPorCategoria = useMemo(() => {
    const totals = {};
    gastosFiltrados.forEach((g) => {
      const key = g.categoria || 'Varios';
      totals[key] = (totals[key] || 0) + parseFloat(g.cantidad || 0);
    });
    return totals;
  }, [gastosFiltrados]);

  const totalIngresos = ingresosFiltrados.reduce((sum, i) => sum + parseFloat(i.cantidad), 0);
  const totalGastos = gastosFiltrados.reduce((sum, g) => sum + parseFloat(g.cantidad), 0);
  const balance = totalIngresos - totalGastos;

  const ivaIngresos = ingresosFiltrados.reduce((sum, i) => {
    const tax = computeTax(i.cantidad, i.iva_porcentaje, i.iva_incluido);
    return sum + tax.iva;
  }, 0);

  const ivaGastos = gastosFiltrados.reduce((sum, g) => {
    const tax = computeTax(g.cantidad, g.iva_porcentaje, g.iva_incluido);
    return sum + tax.iva;
  }, 0);

  const ivaNeto = ivaIngresos - ivaGastos;

  const ingresoCategorias = Array.from(new Set(ingresos.map((i) => i.categoria || 'Otros')));
  const gastoCategorias = Array.from(new Set(gastos.map((g) => g.categoria || 'Varios')));

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
    return <div className="loading">Cargando reportes...</div>;
  }

  return (
    <div className="reports-page">
      <div className="content-header">
        <h2>Finanzas</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="number"
            className="form-input"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            style={{ maxWidth: '120px' }}
          />
          <select
            className="form-input"
            value={month}
            onChange={(e) => {
              setMonth(e.target.value);
              setPageIngresos(1);
              setPageGastos(1);
            }}
            style={{ maxWidth: '140px' }}
          >
            <option value="">Mes (todos)</option>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="card">
        <div className="item-list">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', padding: '10px 0', borderBottom: '2px solid var(--border-color)', fontWeight: '600', color: '#7f8c8d' }}>
            <span>Mes</span>
            <span>Ingresos</span>
            <span>Gastos</span>
            <span>Margen</span>
          </div>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
            const row = monthlySummary.get(m);
            return (
              <div key={`${year}-${m}`} className="item-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr' }}>
                <span>{m}/{year}</span>
                <span>${row.ingresos.toFixed(2)}</span>
                <span>${row.gastos.toFixed(2)}</span>
                <span>${row.margen.toFixed(2)}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card" style={{ marginTop: '16px' }}>
        <div className="card-header"><strong>IVA</strong></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
          <div className="card" style={{ padding: '12px' }}>
            <p style={{ color: '#7f8c8d' }}>IVA repercutido (ventas)</p>
            <strong>${ivaIngresos.toFixed(2)}</strong>
          </div>
          <div className="card" style={{ padding: '12px' }}>
            <p style={{ color: '#7f8c8d' }}>IVA soportado (gastos)</p>
            <strong>${ivaGastos.toFixed(2)}</strong>
          </div>
          <div className="card" style={{ padding: '12px' }}>
            <p style={{ color: '#7f8c8d' }}>IVA neto</p>
            <strong>${ivaNeto.toFixed(2)}</strong>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
        <div className="card">
          <div className="card-header"><strong>Ingresos por categoría</strong></div>
          <div className="item-list">
            {Object.keys(ingresosPorCategoria).length === 0 ? (
              <p style={{ padding: '20px', color: '#7f8c8d' }}>Sin ingresos.</p>
            ) : (
              Object.entries(ingresosPorCategoria).map(([cat, val]) => (
                <div key={cat} className="item-row" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{cat}</span>
                  <span>${val.toFixed(2)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><strong>Gastos por categoría</strong></div>
          <div className="item-list">
            {Object.keys(gastosPorCategoria).length === 0 ? (
              <p style={{ padding: '20px', color: '#7f8c8d' }}>Sin gastos.</p>
            ) : (
              Object.entries(gastosPorCategoria).map(([cat, val]) => (
                <div key={cat} className="item-row" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{cat}</span>
                  <span>${val.toFixed(2)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong>Ingresos (detalle)</strong>
            <select
              className="form-input"
              value={ingresoCategoria}
              onChange={(e) => {
                setIngresoCategoria(e.target.value);
                setPageIngresos(1);
              }}
              style={{ maxWidth: '200px' }}
            >
              <option value="">Todas</option>
              {ingresoCategorias.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div className="item-list">
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '10px 0', borderBottom: '2px solid var(--border-color)', fontWeight: '600', color: '#7f8c8d' }}>
              <span>Concepto</span>
              <span>Base</span>
              <span>IVA</span>
              <span>Total</span>
            </div>
            {ingresosPaginados.map((i) => {
              const tax = computeTax(i.cantidad, i.iva_porcentaje, i.iva_incluido);
              return (
                <div key={`ing-${i.id}`} className="item-row" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr' }}>
                  <span>{i.tipo}</span>
                  <span>${tax.base.toFixed(2)}</span>
                  <span>${tax.iva.toFixed(2)}</span>
                  <span>${tax.total.toFixed(2)}</span>
                </div>
              );
            })}
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
        </div>

        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong>Gastos (detalle)</strong>
            <select
              className="form-input"
              value={gastoCategoria}
              onChange={(e) => {
                setGastoCategoria(e.target.value);
                setPageGastos(1);
              }}
              style={{ maxWidth: '200px' }}
            >
              <option value="">Todas</option>
              {gastoCategorias.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div className="item-list">
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '10px 0', borderBottom: '2px solid var(--border-color)', fontWeight: '600', color: '#7f8c8d' }}>
              <span>Concepto</span>
              <span>Base</span>
              <span>IVA</span>
              <span>Total</span>
            </div>
            {gastosPaginados.map((g) => {
              const tax = computeTax(g.cantidad, g.iva_porcentaje, g.iva_incluido);
              return (
                <div key={`gas-${g.id}`} className="item-row" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr' }}>
                  <span>{g.tipo}</span>
                  <span>${tax.base.toFixed(2)}</span>
                  <span>${tax.iva.toFixed(2)}</span>
                  <span>${tax.total.toFixed(2)}</span>
                </div>
              );
            })}
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
        </div>
      </div>

      <div className="card" style={{ marginTop: '16px' }}>
        <div className="card-header"><strong>Balance</strong></div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Total ingresos: ${totalIngresos.toFixed(2)}</span>
          <span>Total gastos: ${totalGastos.toFixed(2)}</span>
          <strong>Balance: ${balance.toFixed(2)}</strong>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
