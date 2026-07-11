import { useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient';

const StockPage = () => {
  const [stock, setStock] = useState([]);
  const [products, setProducts] = useState([]);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resStock, resProducts, resProviders] = await Promise.all([
        axiosClient.get('/stock/'),
        axiosClient.get('/producto/'),
        axiosClient.get('/proveedor/')
      ]);
      setStock(resStock.data);
      setProducts(resProducts.data);
      setProviders(resProviders.data);
    } catch (error) {
      console.error('Error fetching stock:', error);
    } finally {
      setLoading(false);
    }
  };

  const productById = new Map(products.map((p) => [p.id, p]));
  const providerById = new Map(providers.map((p) => [p.id, p]));

  if (loading) {
    return <div className="loading">Cargando stock...</div>;
  }

  return (
    <div className="stock-page">
      <div className="content-header">
        <h2>Stock</h2>
      </div>

      <div className="card">
        <div className="item-list">
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '10px 0', borderBottom: '2px solid var(--border-color)', fontWeight: '600', color: '#7f8c8d' }}>
            <span>Producto</span>
            <span>Proveedor</span>
            <span>Cantidad</span>
            <span>Costo</span>
          </div>

          {stock.map((s) => {
            const product = productById.get(s.producto);
            const provider = providerById.get(s.proveedor);
            const costo = product ? parseFloat(product.costo || 0) : 0;
            return (
              <div key={s.id} className="item-row" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr' }}>
                <span>{product ? product.nombre : 'Producto'}</span>
                <span>{provider ? provider.nombre : 'Proveedor'}</span>
                <span>{s.cantidad}</span>
                <span>${(costo * s.cantidad).toFixed(2)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StockPage;
