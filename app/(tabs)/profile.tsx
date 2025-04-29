import { View, Text, ScrollView } from 'react-native';
import { Button } from '~/components/ui/button';
import { Card } from '~/components/ui/card';
import { useAuth } from '~/context/auth-context';

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  return (
    <ScrollView className="flex-1 p-4">
      <Text className="text-2xl font-bold mb-4">Profile</Text>
      
      <Card className="p-4 mb-4">
        <Text className="text-lg font-semibold mb-2">Account Information</Text>
        <View className="space-y-2">
          <Text className="text-gray-600">Name: {user?.name}</Text>
          <Text className="text-gray-600">Email: {user?.email}</Text>
        </View>
      </Card>

      <Card className="p-4 mb-4">
        <Text className="text-lg font-semibold mb-2">Settings</Text>
        <View className="space-y-2">
          <Button variant="outline">
            <Text>Edit Profile</Text>
          </Button>
          <Button variant="outline">
            <Text>Change Password</Text>
          </Button>
          <Button variant="outline">
            <Text>Notification Settings</Text>
          </Button>
        </View>
      </Card>

      <Button variant="destructive" onPress={logout}>
        <Text className="text-white">Logout</Text>
      </Button>
    </ScrollView>
  );
} 