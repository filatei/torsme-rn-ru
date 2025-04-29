import { View, Text } from 'react-native';
import { Button } from '~/components/ui/button';
import { Card } from '~/components/ui/card';
import { useAuth } from '~/context/auth-context';

export default function HomeScreen() {
  const { user, logout } = useAuth();

  return (
    <View className="flex-1 p-4 bg-background">
      <View className="mb-6">
        <Text className="text-2xl font-bold mb-2 text-foreground">Welcome, {user?.name}!</Text>
        <Text className="text-muted-foreground">Manage your business efficiently</Text>
      </View>

      <Card className="p-4 mb-4 bg-card">
        <Text className="text-lg font-semibold mb-2 text-foreground">Quick Actions</Text>
        <View className="flex-row flex-wrap gap-2">
          <Button variant="outline" className="flex-1">
            <Text>Add Expense</Text>
          </Button>
          <Button variant="outline" className="flex-1">
            <Text>Record Sale</Text>
          </Button>
        </View>
      </Card>

      <Card className="p-4 mb-4 bg-card">
        <Text className="text-lg font-semibold mb-2 text-foreground">Recent Activity</Text>
        <View className="space-y-2">
          <Text className="text-muted-foreground">No recent activity</Text>
        </View>
      </Card>

      <Button variant="destructive" onPress={logout}>
        <Text>Logout</Text>
      </Button>
    </View>
  );
} 