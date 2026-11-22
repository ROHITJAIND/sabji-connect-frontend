import { useMemo } from 'react';
import { useOrders } from './useOrders';

export function useAnalytics() {
  const { orders, loading } = useOrders();

  const analytics = useMemo(() => {
    if (!orders || orders.length === 0) {
      return {
        totalSpent: 0,
        totalItems: 0,
        completedOrders: 0,
        spendingByDate: [],
        categorySpending: [],
        topItems: [],
      };
    }

    let totalSpent = 0;
    let totalItems = 0;
    let completedOrders = 0;
    const dateMap = {};
    const itemMap = {};

    orders.forEach(order => {
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
  }, [orders]);

  return { ...analytics, loading };
}
