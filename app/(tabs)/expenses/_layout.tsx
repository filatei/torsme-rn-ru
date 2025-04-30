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
          headerShown: false,
          title: '', 
          
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