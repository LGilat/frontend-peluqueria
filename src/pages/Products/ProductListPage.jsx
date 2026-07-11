import { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import './ProductListPage.css';

const PAGE_SIZE = 10;

const ProductListPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [page, setPage] = useState(1);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    costo: '',
    imagen: null
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axiosClient.get('/producto/');
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'imagen') {
      setFormData((prev) => ({ ...prev, [name]: files[0] }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleOpenModal = (product = null) => {
    if (product) {
      setCurrentProduct(product);
      setFormData({
        nombre: product.nombre || '',
        descripcion: product.descripcion || '',
        precio: product.precio || '',
        costo: product.costo || '',
        imagen: null
      });
    } else {
      setCurrentProduct(null);
      setFormData({
        nombre: '',
        descripcion: '',
        precio: '',
        costo: '',
        imagen: null
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentProduct(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = new FormData();
      payload.append('nombre', formData.nombre);
      payload.append('descripcion', formData.descripcion);
      payload.append('precio', formData.precio);
      payload.append('costo', formData.costo);
      if (formData.imagen) {
        payload.append('imagen', formData.imagen);
      }

      if (currentProduct) {
        await axiosClient.put(`/producto/${currentProduct.id}/`, payload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await axiosClient.post('/producto/', payload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      fetchProducts();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Error al guardar el producto. Verifica los datos.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este producto?')) {
      try {
        await axiosClient.delete(`/producto/${id}/`);
        fetchProducts();
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Error al eliminar el producto.');
      }
    }
  };

  const filteredProducts = products.filter((product) =>
    product.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const start = (page - 1) * PAGE_SIZE;
  const pagedProducts = filteredProducts.slice(start, start + PAGE_SIZE);

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
      render: (value, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#7f8c8d',
              fontSize: '0.8rem'
            }}
          >
            {row.imagen ? (
              <img
                src={row.imagen}
                alt={value}
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}
              />
            ) : (
              value.charAt(0)
            )}
          </div>
          {value}
        </div>
      )
    },
    { key: 'descripcion', header: 'Descripción' },
    {
      key: 'precio',
      header: 'Precio',
      render: (value) => `$${parseFloat(value).toFixed(2)}`
    },
    {
      key: 'costo',
      header: 'Costo',
      render: (value) => `$${parseFloat(value).toFixed(2)}`
    }
  ];

  if (loading) {
    return <div className="loading">Cargando productos...</div>;
  }

  return (
    <div className="products-page">
      <div className="content-header">
        <h2>Productos</h2>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          + Nuevo Producto
        </button>
      </div>

      <div className="card">
        <div className="card-header">
          <input
            type="text"
            className="form-input"
            placeholder="Buscar productos..."
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
          data={pagedProducts}
          onEdit={handleOpenModal}
          onDelete={handleDelete}
        />

        {filteredProducts.length > 0 && (
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
        title={currentProduct ? 'Editar Producto' : 'Nuevo Producto'}
      >
        <form onSubmit={handleSubmit} className="product-form">
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

          <div className="form-row">
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
              <label>Costo</label>
              <input
                type="number"
                name="costo"
                value={formData.costo}
                onChange={handleInputChange}
                required
                min="0"
                step="0.01"
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Imagen</label>
            <input
              type="file"
              name="imagen"
              onChange={handleInputChange}
              className="form-input"
              accept="image/*"
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              {currentProduct ? 'Actualizar' : 'Guardar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ProductListPage;
