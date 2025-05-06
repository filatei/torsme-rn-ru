import { View, ScrollView, Platform } from 'react-native';
import { Text } from '~/components/ui/text';
import { Card } from '~/components/ui/card';
import React from 'react';

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
  const isWeb = (Platform as any).OS === 'web';

  const statuses = [
    { label: 'Total', value: totals.total, color: 'bg-blue-500' },
    { label: 'Pending', value: totals.pending, color: 'bg-yellow-500' },
    { label: 'Approved', value: totals.approved, color: 'bg-green-500' },
    { label: 'Paid', value: totals.paid, color: 'bg-purple-500' },
    { label: 'Draft', value: totals.draft, color: 'bg-gray-500' },
    { label: 'Validated', value: totals.validated, color: 'bg-orange-500' },
  ];

  if (Platform.OS === 'web') {
    return (
      <div className="mb-4 w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 px-4">
        {statuses.map((status) => (
          <div key={status.label} className="w-full">
            <div className={`rounded-lg p-4 ${status.color} w-full`}>
              <span className="text-white text-sm block">{status.label}</span>
              <span className="text-white text-lg font-bold block">{formatAmount(status.value)}</span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Native: horizontal scroll
  return (
    // <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4 w-full overflow-x-auto">
    //   <View className="flex-row space-x-4 px-4 min-w-[600px]">
    //     {statuses.map((status) => (
    //       <Card key={status.label} className={`${status.color} p-4 min-w-[140px] w-full`}>
    //         <Text className="text-white text-sm">{status.label}</Text>
    //         <Text className="text-white text-lg font-bold">{formatAmount(status.value)}</Text>
    //       </Card>
    //     ))}
    //   </View>
    // </ScrollView>
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{
        overflowX: isWeb ? 'auto' : undefined,
        marginBottom: 16,
        width: '100%',
      }}
      contentContainerStyle={{
        paddingHorizontal: 16,
        minWidth: 600,
      }}
    >
      <View style={{ flexDirection: 'row', gap: 16 }}>
        {statuses.map((status) => (
          <View
            key={status.label}
            style={{
              minWidth: 140,
              padding: 16,
              backgroundColor: status.color,
            }}
          >
            <Text style={{ color: '#fff', fontSize: 14 }}>{status.label}</Text>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>
              {formatAmount(status.value)}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
} 