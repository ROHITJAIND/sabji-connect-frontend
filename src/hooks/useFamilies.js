import { useState, useEffect, useCallback } from 'react';
import { familiesApi } from '../api';

export function useFamilies() {
  const [families, setFamilies] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFamilies = useCallback(async () => {
    try {
      const data = await familiesApi.list();
      setFamilies(data);
    } catch (e) {
      console.error('Error fetching families:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFamilies();
  }, [fetchFamilies]);

  const createFamily = async (name) => {
    try {
      const res = await familiesApi.create(name);
      await fetchFamilies();
      return res;
    } catch (e) {
      console.error('Error creating family:', e);
      throw e;
    }
  };

  const updateFamily = async (id, name) => {
    try {
      const res = await familiesApi.update(id, name);
      await fetchFamilies();
      return res;
    } catch (e) {
      console.error('Error updating family:', e);
      throw e;
    }
  };

  const deleteFamily = async (id) => {
    try {
      await familiesApi.delete(id);
      await fetchFamilies();
    } catch (e) {
      console.error('Error deleting family:', e);
      throw e;
    }
  };

  return { families, loading, createFamily, updateFamily, deleteFamily, refreshFamilies: fetchFamilies };
}
