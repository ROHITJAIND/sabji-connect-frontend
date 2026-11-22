import { useState, useEffect, useCallback } from 'react';
import { familiesApi } from '../api';

export function useFamilyMembers(familyId) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMembers = useCallback(async () => {
    if (!familyId) {
      setMembers([]);
      setLoading(false);
      return;
    }
    try {
      const data = await familiesApi.getMembers(familyId);
      setMembers(data);
    } catch (e) {
      console.error('Error fetching family members:', e);
    } finally {
      setLoading(false);
    }
  }, [familyId]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  return { members, loading, refreshMembers: fetchMembers };
}
