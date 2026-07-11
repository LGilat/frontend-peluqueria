import React from 'react';
import './Table.css';

const Table = ({ columns, data, onEdit, onDelete }) => {
  return (
    <div className="table-responsive">
      <table className="custom-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key}>{col.header}</th>
            ))}
            {onEdit || onDelete ? <th>Acciones</th> : null}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length + (onEdit || onDelete ? 1 : 0)} className="no-data">
                No se encontraron registros
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr key={row.id}>
                {columns.map((col) => (
                  <td key={col.key}>
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
                {(onEdit || onDelete) && (
                  <td className="actions-cell">
                    {onEdit && (
                      <button className="btn btn-secondary btn-sm" onClick={() => onEdit(row)}>
                        Editar
                      </button>
                    )}
                    {onDelete && (
                      <button className="btn btn-danger btn-sm" onClick={() => onDelete(row.id)}>
                        Eliminar
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
