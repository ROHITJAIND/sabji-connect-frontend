import { useState, useEffect, useCallback } from 'react';
import { catalogApi } from '../api';

export function useCatalog() {
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCatalog = useCallback(async () => {
    try {
      const items = await catalogApi.list();
      setCatalog(items);
    } catch (e) {
      console.error('Error fetching catalog:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

  const addItem = async (item) => {
    try {
      const res = await catalogApi.add(item);
      await fetchCatalog();
      return res;
    } catch (e) {
      console.error('Error adding item:', e);
      throw e;
    }
  };

  const updateItem = async (id, data) => {
    try {
      const res = await catalogApi.update(id, data);
      await fetchCatalog();
      return res;
    } catch (e) {
      console.error('Error updating item:', e);
      throw e;
    }
  };

  const deleteItem = async (id) => {
    try {
      await catalogApi.delete(id);
      await fetchCatalog();
    } catch (e) {
      console.error('Error deleting item:', e);
      throw e;
    }
  };

  return { catalog, loading, addItem, updateItem, deleteItem, refreshCatalog: fetchCatalog };
}
