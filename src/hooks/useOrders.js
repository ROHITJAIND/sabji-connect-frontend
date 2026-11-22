import { useState, useEffect, useCallback } from 'react';
import { ordersApi, connectWebSocket } from '../api';
import { useAuth } from '../context/AuthContext';

export function useOrders() {
  const { currentUser, userFamilyId } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    if (!currentUser) return;
    try {
      const data = await ordersApi.list();
      setOrders(data);
    } catch (e) {
      console.error('Error fetching orders:', e);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchOrders();

    // Live WebSocket connection to refresh orders on updates
    const ws = connectWebSocket(userFamilyId, (msg) => {
      if (msg.event === 'order_updated' || msg.event === 'order_deleted') {
        fetchOrders();
      }
    });

    return () => {
      if (ws) ws.close();
    };
  }, [fetchOrders, userFamilyId]);

  const createDraft = async (orderDate) => {
    try {
      const res = await ordersApi.create(orderDate);
      await fetchOrders();
      return res;
    } catch (e) {
      console.error('Error creating order draft:', e);
      throw e;
    }
  };

  const updateOrder = async (id, data) => {
    try {
      const res = await ordersApi.update(id, data);
      await fetchOrders();
      return res;
    } catch (e) {
      console.error('Error updating order:', e);
      throw e;
    }
  };

  const deleteOrder = async (id) => {
    try {
      await ordersApi.delete(id);
      await fetchOrders();
    } catch (e) {
      console.error('Error deleting order:', e);
      throw e;
    }
  };

  return { orders, loading, createDraft, updateOrder, deleteOrder, refreshOrders: fetchOrders };
}
