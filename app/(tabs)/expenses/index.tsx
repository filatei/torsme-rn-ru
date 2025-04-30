import { View, Text } from 'react-native';
import { ExpenseTable } from '~/components/expense-table';
import { Button } from '~/components/ui/button';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';


export default function ExpensesScreen() {
  return (
    <View className="flex-1 bg-background">
      {/* <Text className="text-2xl font-bold p-4 text-foreground">Expenses</Text> */}

      {/* Make ExpenseTable fill remaining space */}
      <View className="flex-1 ">
        
        <ExpenseTable />
      </View>
    </View>
  );
}
