import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import './CalendarPage.css';

const startOfWeek = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day; // Monday start
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const formatDate = (date) => date.toISOString().slice(0, 10);

const formatLabel = (date) =>
  date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });

const monthStart = (date) => {
  const d = new Date(date.getFullYear(), date.getMonth(), 1);
  d.setHours(0, 0, 0, 0);
  return d;
};

const monthEnd = (date) => {
  const d = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  d.setHours(0, 0, 0, 0);
  return d;
};

const CalendarPage = () => {
  const [reservations, setReservations] = useState([]);
  const [services, setServices] = useState([]);
  const [clients, setClients] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date()));
  const [monthCursor, setMonthCursor] = useState(new Date());
  const [viewMode, setViewMode] = useState('week');
  const [searchParams, setSearchParams] = useSearchParams();

  const staffFilter = searchParams.get('staff') || '';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resReservations, resServices, resClients, resStaff] = await Promise.all([
        axiosClient.get('/reserva/'),
        axiosClient.get('/servicio/'),
        axiosClient.get('/cliente/'),
        axiosClient.get('/atendente/')
      ]);
      setReservations(resReservations.data);
      setServices(resServices.data);
      setClients(resClients.data);
      setStaff(resStaff.data);
    } catch (error) {
      console.error('Error fetching calendar data:', error);
    } finally {
      setLoading(false);
    }
  };

  const serviceById = useMemo(() => new Map(services.map((s) => [s.id, s])), [services]);
  const clientById = useMemo(() => new Map(clients.map((c) => [c.id, c])), [clients]);
  const staffById = useMemo(() => new Map(staff.map((s) => [s.id, s])), [staff]);

  const handleStaffFilter = (value) => {
    if (!value) {
      searchParams.delete('staff');
      setSearchParams(searchParams);
      return;
    }
    setSearchParams({ staff: value });
  };

  const parseTimeToMinutes = (timeStr) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  const isOverlap = (a, b) => {
    const aStart = parseTimeToMinutes(a.hora);
    const aEnd = aStart + (serviceById.get(a.servicio)?.duracion_minutos || 0);
    const bStart = parseTimeToMinutes(b.hora);
    const bEnd = bStart + (serviceById.get(b.servicio)?.duracion_minutos || 0);
    return aStart < bEnd && bStart < aEnd;
  };

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const weekReservationsByDate = useMemo(() => {
    const map = new Map();
    weekDays.forEach((d) => map.set(formatDate(d), []));

    reservations.forEach((res) => {
      if (!map.has(res.fecha)) return;
      if (staffFilter && String(res.atendente) !== String(staffFilter)) return;
      map.get(res.fecha).push(res);
    });

    for (const list of map.values()) {
      list.sort((a, b) => a.hora.localeCompare(b.hora));
    }

    return map;
  }, [reservations, weekDays, staffFilter]);

  const monthDays = useMemo(() => {
    const start = monthStart(monthCursor);
    const end = monthEnd(monthCursor);
    const days = [];
    let current = startOfWeek(start);
    const endBoundary = addDays(end, 6);

    while (current <= endBoundary) {
      days.push(new Date(current));
      current = addDays(current, 1);
    }
    return days;
  }, [monthCursor]);

  const monthReservationsByDate = useMemo(() => {
    const map = new Map();
    monthDays.forEach((d) => map.set(formatDate(d), []));

    reservations.forEach((res) => {
      if (!map.has(res.fecha)) return;
      if (staffFilter && String(res.atendente) !== String(staffFilter)) return;
      map.get(res.fecha).push(res);
    });

    for (const list of map.values()) {
      list.sort((a, b) => a.hora.localeCompare(b.hora));
    }

    return map;
  }, [reservations, monthDays, staffFilter]);

  const workload = useMemo(() => {
    const totals = new Map();
    staff.forEach((s) => totals.set(s.id, 0));

    weekReservationsByDate.forEach((list) => {
      list.forEach((res) => {
        const duration = serviceById.get(res.servicio)?.duracion_minutos || 0;
        if (!totals.has(res.atendente)) {
          totals.set(res.atendente, 0);
        }
        totals.set(res.atendente, totals.get(res.atendente) + duration);
      });
    });

    return Array.from(totals.entries()).map(([id, minutes]) => ({
      id,
      minutes,
      hours: (minutes / 60).toFixed(1)
    }));
  }, [staff, weekReservationsByDate, serviceById]);

  const handlePrevWeek = () => setWeekStart(addDays(weekStart, -7));
  const handleNextWeek = () => setWeekStart(addDays(weekStart, 7));
  const handlePrevMonth = () => setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() - 1, 1));
  const handleNextMonth = () => setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 1));

  if (loading) {
    return <div className="loading">Cargando calendario...</div>;
  }

  return (
    <div className="calendar-page">
      <div className="content-header">
        <h2>Calendario</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          {viewMode === 'week' ? (
            <>
              <button className="btn btn-secondary" onClick={handlePrevWeek}>Semana anterior</button>
              <button className="btn btn-secondary" onClick={handleNextWeek}>Semana siguiente</button>
            </>
          ) : (
            <>
              <button className="btn btn-secondary" onClick={handlePrevMonth}>Mes anterior</button>
              <button className="btn btn-secondary" onClick={handleNextMonth}>Mes siguiente</button>
            </>
          )}
          <button
            className="btn btn-secondary"
            onClick={() => setViewMode(viewMode === 'week' ? 'month' : 'week')}
          >
            Ver {viewMode === 'week' ? 'mes' : 'semana'}
          </button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '16px' }}>
        <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ fontWeight: 600 }}>Filtrar por atendente:</label>
          <select
            className="form-input"
            value={staffFilter}
            onChange={(e) => handleStaffFilter(e.target.value)}
            style={{ maxWidth: '260px' }}
          >
            <option value="">Todos</option>
            {staff.map((member) => (
              <option key={member.id} value={member.id}>
                {member.nombre} {member.apellido}
              </option>
            ))}
          </select>
          {staffFilter && (
            <button className="btn btn-secondary" onClick={() => handleStaffFilter('')}>
              Limpiar filtro
            </button>
          )}
        </div>
      </div>

      <div className="card" style={{ marginBottom: '16px' }}>
        <div className="card-header">
          <strong>Carga semanal (horas)</strong>
        </div>
        <div className="workload-grid">
          {workload.map((item) => {
            const person = staffById.get(item.id);
            return (
              <div key={item.id || 'sin-asignar'} className="workload-item">
                <span>{person ? `${person.nombre} ${person.apellido}` : 'Sin asignar'}</span>
                <span>{item.hours} h</span>
              </div>
            );
          })}
        </div>
      </div>

      {viewMode === 'week' ? (
        <div className="calendar-grid">
          {weekDays.map((day) => {
            const key = formatDate(day);
            const items = weekReservationsByDate.get(key) || [];
            return (
              <div key={key} className="calendar-day">
                <div className="calendar-day-header">
                  {formatLabel(day)}
                </div>
                {items.length === 0 ? (
                  <div className="calendar-empty">Sin reservas</div>
                ) : (
                  items.map((res, idx) => {
                    const servicio = serviceById.get(res.servicio);
                    const cliente = clientById.get(res.cliente);
                    const atendente = staffById.get(res.atendente);
                    const hasOverlap = items.some((other, oIdx) => oIdx !== idx && isOverlap(res, other));
                    return (
                      <div key={res.id} className={`calendar-item status-${res.estado} ${hasOverlap ? 'overlap' : ''}`}>
                        <div className="calendar-time">Hora: {res.hora.slice(0, 5)}</div>
                        <div className="calendar-title">
                          Servicio: {servicio ? servicio.nombre : 'Servicio'}
                        </div>
                        <div className="calendar-meta">
                          Cliente: {cliente ? `${cliente.nombre} ${cliente.apellido}` : `Cliente ${res.cliente}`}
                        </div>
                        <button
                          type="button"
                          className="calendar-link"
                          onClick={() => handleStaffFilter(res.atendente)}
                        >
                          Atendente: {atendente ? `${atendente.nombre} ${atendente.apellido}` : 'Sin atendente'}
                        </button>
                        {hasOverlap && (
                          <div className="overlap-badge">Solape</div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="calendar-grid month">
          {monthDays.map((day) => {
            const key = formatDate(day);
            const items = monthReservationsByDate.get(key) || [];
            const inMonth = day.getMonth() === monthCursor.getMonth();
            return (
              <div key={key} className={`calendar-day ${inMonth ? '' : 'muted'}`}>
                <div className="calendar-day-header">
                  {day.getDate()}
                </div>
                {items.length === 0 ? (
                  <div className="calendar-empty">Sin reservas</div>
                ) : (
                  items.slice(0, 3).map((res, idx) => {
                    const servicio = serviceById.get(res.servicio);
                    const atendente = staffById.get(res.atendente);
                    const hasOverlap = items.some((other, oIdx) => oIdx !== idx && isOverlap(res, other));
                    return (
                      <div key={res.id} className={`calendar-item status-${res.estado} ${hasOverlap ? 'overlap' : ''}`}>
                        <div className="calendar-time">{res.hora.slice(0, 5)}</div>
                        <div className="calendar-title">{servicio ? servicio.nombre : 'Servicio'}</div>
                        <button
                          type="button"
                          className="calendar-link"
                          onClick={() => handleStaffFilter(res.atendente)}
                        >
                          {atendente ? atendente.nombre : 'Atendente'}
                        </button>
                        {hasOverlap && (
                          <div className="overlap-badge">Solape</div>
                        )}
                      </div>
                    );
                  })
                )}
                {items.length > 3 && (
                  <div className="calendar-more">+{items.length - 3} más</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CalendarPage;
