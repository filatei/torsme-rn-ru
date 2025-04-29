import { View, Text, ScrollView } from 'react-native';
import { Button } from '~/components/ui/button';
import { Card } from '~/components/ui/card';

export default function FintechScreen() {
  return (
    <ScrollView className="flex-1 p-4">
      <Text className="text-2xl font-bold mb-4">Fintech</Text>
      
      <Card className="p-4 mb-4">
        <Text className="text-lg font-semibold mb-2">Account Balance</Text>
        <Text className="text-3xl font-bold text-blue-600">₦0.00</Text>
      </Card>

      <Card className="p-4 mb-4">
        <Text className="text-lg font-semibold mb-2">Quick Actions</Text>
        <View className="space-y-2">
          <Button variant="outline">
            <Text>Transfer Money</Text>
          </Button>
          <Button variant="outline">
            <Text>Pay Bills</Text>
          </Button>
          <Button variant="outline">
            <Text>View Transactions</Text>
          </Button>
        </View>
      </Card>
    </ScrollView>
  );
} 