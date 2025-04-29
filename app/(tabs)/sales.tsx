import { View, Text, ScrollView } from 'react-native';
import { Button } from '~/components/ui/button';
import { Card } from '~/components/ui/card';

export default function SalesScreen() {
  return (
    <ScrollView className="flex-1 p-4">
      <Text className="text-2xl font-bold mb-4">Sales</Text>
      
      <Card className="p-4 mb-4">
        <Text className="text-lg font-semibold mb-2">Today's Sales</Text>
        <Text className="text-3xl font-bold text-green-600">₦0.00</Text>
      </Card>

      <Card className="p-4 mb-4">
        <Text className="text-lg font-semibold mb-2">Quick Actions</Text>
        <View className="flex-row flex-wrap gap-2">
          <Button variant="outline" className="flex-1">
            <Text>New Sale</Text>
          </Button>
          <Button variant="outline" className="flex-1">
            <Text>View History</Text>
          </Button>
        </View>
      </Card>
    </ScrollView>
  );
} 