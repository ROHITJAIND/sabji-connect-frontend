import { useState, useEffect, useCallback } from 'react';
import { ordersApi } from '../api';

export function useUserOrders(userId) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    if (!userId) {
      setOrders([]);
      setLoading(false);
      return;
    }
    try {
      const allOrders = await ordersApi.list();
      const userOrders = allOrders.filter(
        o => o.createdBy === userId && ['Published', 'Fulfilling', 'Archived'].includes(o.status)
      );
      setOrders(userOrders);
    } catch (e) {
      console.error('Error fetching user orders:', e);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return { orders, loading, refreshOrders: fetchOrders };
}
