import { View, ScrollView } from 'react-native';
import { Text } from '~/components/ui/text';
import { Card } from '~/components/ui/card';

interface ExpenseTotalsProps {
  totals: {
    total: number;
    pending: number;
    approved: number;
    paid: number;
    draft: number;
    validated: number;
  };
}

export function ExpenseTotals({ totals }: ExpenseTotalsProps) {
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
  };

  const statuses = [
    { label: 'Total', value: totals.total, color: 'bg-blue-500' },
    { label: 'Pending', value: totals.pending, color: 'bg-yellow-500' },
    { label: 'Approved', value: totals.approved, color: 'bg-green-500' },
    { label: 'Paid', value: totals.paid, color: 'bg-purple-500' },
    { label: 'Draft', value: totals.draft, color: 'bg-gray-500' },
    { label: 'Validated', value: totals.validated, color: 'bg-orange-500' },
  ];

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
      <View className="flex-row space-x-4 px-4">
        {statuses.map((status) => (
          <Card key={status.label} className={`${status.color} p-4 min-w-[150px]`}>
            <Text className="text-white text-sm">{status.label}</Text>
            <Text className="text-white text-lg font-bold">{formatAmount(status.value)}</Text>
          </Card>
        ))}
      </View>
    </ScrollView>
  );
} 