import { View } from 'react-native';
import { Text } from '~/components/ui/text';
import { Card } from '~/components/ui/card';

interface ExpenseHeaderProps {
  title: string;
  amount: number;
  vendor: string;
  date: string;
  status: string;
  balance: number;
}

export function ExpenseHeader({ title, amount, vendor, date, status, balance }: ExpenseHeaderProps) {
  return (
    <Card className="p-4 mb-4">
      <Text className="text-2xl font-bold mb-4">{title}</Text>
      
      <View className="mb-4">
        <Text className="text-muted-foreground">Amount</Text>
        <Text className="text-xl font-bold">
          {new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
          }).format(amount)}
        </Text>
      </View>

      <View className="mb-4">
        <Text className="text-muted-foreground">Vendor</Text>
        <Text className="text-lg">{vendor}</Text>
      </View>

      <View className="mb-4">
        <Text className="text-muted-foreground">Date</Text>
        <Text className="text-lg">
          {new Date(date).toLocaleDateString()}
        </Text>
      </View>

      <View className="mb-4">
        <Text className="text-muted-foreground">Status</Text>
        <Text className={`text-lg ${
          status === 'DRAFT' ? 'text-gray-500' :
          status === 'VALIDATED' ? 'text-blue-500' :
          status === 'REVIEWED' ? 'text-purple-500' :
          status === 'APPROVED' ? 'text-green-500' :
          'text-indigo-500'
        }`}>
          {status}
        </Text>
      </View>

      <View className="mb-4">
        <Text className="text-muted-foreground">Balance</Text>
        <Text className="text-lg font-bold text-red-500">₦{(balance ?? 0).toLocaleString()}</Text>
      </View>
    </Card>
  );
} 