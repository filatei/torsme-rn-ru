import React from 'react';
import { View } from 'react-native';
import { Text } from '~/components/ui/text';

interface PaymentHistoryRowProps {
  item: {
    bankAcct: string;
    paidAmount: number;
    paymentDate: string;
    memo?: string;
    payer?: string;
    [key: string]: any;
  };
}

export function PaymentHistoryRow({ item }: PaymentHistoryRowProps) {
  return (
    <View className="flex-row items-center justify-between bg-card rounded-lg mb-2 p-3 border border-border">
      <View className="flex-1">
        <Text className="font-medium text-foreground">₦{item.paidAmount.toLocaleString()}</Text>
        <Text className="text-sm text-muted-foreground">{item.bankAcct} • {item.payer || 'N/A'}</Text>
        <Text className="text-xs text-muted-foreground">{new Date(item.paymentDate).toLocaleDateString()}</Text>
        {item.memo && <Text className="text-xs text-muted-foreground">{item.memo}</Text>}
      </View>
    </View>
  );
} 