import { View } from 'react-native';
import { Text } from '~/components/ui/text';

interface Payment {
  bankAcct: string;
  paidAmount: number;
  paymentDate: string;
  memo?: string;
  payer: string;
}

interface ExpensePaymentHistoryProps {
  payments: Payment[];
}

export function ExpensePaymentHistory({ payments }: ExpensePaymentHistoryProps) {
  if (!payments || payments.length === 0) return null;

  return (
    <View className="mb-4">
      <Text className="text-muted-foreground mb-2">Payment History</Text>
      {payments.map((pay, idx) => (
        <View key={`${pay.paymentDate}-${pay.paidAmount}-${idx}`} className="bg-muted p-3 rounded-lg mb-2">
          <Text>Amount: ₦{pay.paidAmount?.toLocaleString()}</Text>
          <Text>Date: {pay.paymentDate ? new Date(pay.paymentDate).toLocaleDateString() : ''}</Text>
          <Text>Account: {pay.bankAcct}</Text>
          <Text>Payer: {pay.payer}</Text>
          {pay.memo && <Text>Memo: {pay.memo}</Text>}
        </View>
      ))}
    </View>
  );
} 