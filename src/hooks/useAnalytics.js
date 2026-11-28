import { useMemo } from 'react';
import { useOrders } from './useOrders';
import { useAuth } from '../context/AuthContext';

export function useAnalytics() {
  const { orders = [], loading } = useOrders();
  const { userRole } = useAuth();

  const allOrders = useMemo(() => (Array.isArray(orders) ? orders : []), [orders]);

  const analytics = useMemo(() => {
    if (allOrders.length === 0) {
      return {
        totalSpent: 0,
        totalItems: 0,
        completedOrders: 0,
        spendingByDate: [],
        topItems: [],
      };
    }

    let totalSpent = 0;
    let totalItems = 0;
    let completedOrders = 0;
    const dateMap = {};
    const itemMap = {};

    allOrders.forEach(order => {
      const isArchived = order.status === 'Archived';
      if (isArchived) completedOrders += 1;

      (order.items || []).forEach(item => {
        const qty = item.actual_quantity || item.quantity || 0;
        const price = item.actual_price || 0;
        totalItems += qty;
        totalSpent += price;

        // Group by date
        const d = order.orderDate || 'Recent';
        dateMap[d] = (dateMap[d] || 0) + price;

        // Group by item
        const name = item.name || 'Unknown';
        itemMap[name] = (itemMap[name] || 0) + qty;
      });
    });

    const spendingByDate = Object.entries(dateMap).map(([date, amount]) => ({
      date,
      amount,
    }));

    const topItems = Object.entries(itemMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalSpent,
      totalItems,
      completedOrders,
      spendingByDate,
      topItems,
    };
  }, [allOrders]);

  return {
    ...analytics,
    allOrders,
    orders: allOrders,
    loading,
    userRole,
  };
}
