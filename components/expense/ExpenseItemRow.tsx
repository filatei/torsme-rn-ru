import React from 'react';
import { View } from 'react-native';
import { Text } from '~/components/ui/text';

interface ExpenseItemRowProps {
  item: {
    name: string;
    quantity?: number;
    price?: number;
    total?: number;
    [key: string]: any;
  };
}

export function ExpenseItemRow({ item }: ExpenseItemRowProps) {
  return (
    <View className="flex-row items-center justify-between bg-card rounded-lg mb-2 p-3 border border-border">
      <View className="flex-1">
        <Text className="font-medium text-foreground">{item.name}</Text>
        {item.quantity !== undefined && (
          <Text className="text-sm text-muted-foreground">Qty: {item.quantity}</Text>
        )}
        {item.price !== undefined && (
          <Text className="text-sm text-muted-foreground">Price: ₦{item.price}</Text>
        )}
      </View>
      {item.total !== undefined && (
        <Text className="font-semibold text-foreground">₦{item.total}</Text>
      )}
    </View>
  );
} 