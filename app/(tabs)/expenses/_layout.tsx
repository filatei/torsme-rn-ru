import { Stack } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function ExpensesLayout() {
  const router = useRouter();

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: true,
          title: 'Expenses',
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push('/expenses/create')}
              className="mr-4"
            >
              <Ionicons name="add" size={24} color="#007AFF" />
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: 'Expense Details',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="create"
        options={{
          title: 'Create Expense',
          headerShown: true,
        }}
      />
    </Stack>
  );
}