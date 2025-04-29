// app/(tabs)/expenses/[id].tsx

import { View, ScrollView, ActivityIndicator, Image } from 'react-native';
import { Text } from '~/components/ui/text';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFetch } from '~/hook/useFetch';
import { getApiUrl } from '~/utils/config';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { useState, useEffect } from 'react';
import { Card } from '~/components/ui/card';

type ExpenseStatus = 'DRAFT' | 'VALIDATED' | 'REVIEWED' | 'APPROVED' | 'PAID';

interface Expense {
  _id: string;
  txn_amount: number;
  status: ExpenseStatus;
  date: string;
  vendor: { name: string };
  title: string;
  notes: Array<{
    text: string;
    author: string;
    date: string;
    image?: string;
  }>;
  statusHistory: Array<{
    oldStatus: string;
    newStatus: string;
    updater: string;
  }>;
}

interface ExpenseResponse {
  expense: Expense;
}

const statusFlow: Record<ExpenseStatus, ExpenseStatus[]> = {
  DRAFT: ['VALIDATED'],
  VALIDATED: ['REVIEWED'],
  REVIEWED: ['APPROVED'],
  APPROVED: ['PAID'],
  PAID: [],
};

export default function ExpenseDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [newNote, setNewNote] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const { data: response, loading, error, fetch } = useFetch<ExpenseResponse>(getApiUrl());
  const expense = response?.expense;

  const loadExpense = async () => {
    await fetch(`/expense/${id}`);
  };

  useEffect(() => {
    loadExpense();
  }, [id]);

  const updateStatus = async (newStatus: ExpenseStatus) => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/expense/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });
      if (response) {
        await loadExpense();
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const addNote = async () => {
    if (!newNote.trim()) return;
    setIsUpdating(true);
    try {
      const response = await fetch(`/expense/notes/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: newNote,
          author: 'User', // This should be replaced with actual user info
          date: new Date().toISOString(),
        }),
      });
      if (response) {
        setNewNote('');
        await loadExpense();
      }
    } catch (err) {
      console.error('Failed to add note:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error || !expense) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-red-500">Failed to load expense details</Text>
      </View>
    );
  }

  const nextStatuses = statusFlow[expense.status] || [];

  return (
    <ScrollView className="flex-1 bg-background p-4">
      <Card className="p-4 mb-4">
        <Text className="text-2xl font-bold mb-4">{expense.title}</Text>
        
        <View className="mb-4">
          <Text className="text-muted-foreground">Amount</Text>
          <Text className="text-xl font-bold">
            {new Intl.NumberFormat('en-NG', {
              style: 'currency',
              currency: 'NGN',
            }).format(expense.txn_amount)}
          </Text>
        </View>

        <View className="mb-4">
          <Text className="text-muted-foreground">Vendor</Text>
          <Text className="text-lg">{expense.vendor?.name}</Text>
        </View>

        <View className="mb-4">
          <Text className="text-muted-foreground">Date</Text>
          <Text className="text-lg">
            {new Date(expense.date).toLocaleDateString()}
          </Text>
        </View>

        <View className="mb-4">
          <Text className="text-muted-foreground">Status</Text>
          <Text className={`text-lg ${
            expense.status === 'DRAFT' ? 'text-gray-500' :
            expense.status === 'VALIDATED' ? 'text-blue-500' :
            expense.status === 'REVIEWED' ? 'text-purple-500' :
            expense.status === 'APPROVED' ? 'text-green-500' :
            'text-indigo-500'
          }`}>
            {expense.status}
          </Text>
        </View>

        {nextStatuses.length > 0 && (
          <View className="mb-4">
            <Text className="text-muted-foreground mb-2">Update Status</Text>
            <View className="flex-row flex-wrap gap-2">
              {nextStatuses.map((status) => (
                <Button
                  key={status}
                  onPress={() => updateStatus(status)}
                  disabled={isUpdating}
                  className="min-w-[120px]"
                >
                  <Text className="text-white">Mark as {status}</Text>
                </Button>
              ))}
            </View>
          </View>
        )}

        <View className="mb-4">
          <Text className="text-muted-foreground mb-2">Add Note</Text>
          <View className="flex-row gap-2">
            <Input
              value={newNote}
              onChangeText={setNewNote}
              placeholder="Enter note..."
              className="flex-1"
            />
            <Button onPress={addNote} disabled={isUpdating || !newNote.trim()}>
              <Text className="text-white">Add</Text>
            </Button>
          </View>
        </View>

        {expense.notes && expense.notes.length > 0 && (
          <View className="mb-4">
            <Text className="text-muted-foreground mb-2">Notes</Text>
            {expense.notes.map((note, index) => (
              <View key={index} className="bg-muted p-3 rounded-lg mb-2">
                <Text className="font-medium">{note.text}</Text>
                <Text className="text-sm text-muted-foreground mt-1">
                  By {note.author} on {new Date(note.date).toLocaleDateString()}
                </Text>
                {note.image && (
                  <Image 
                    source={{ uri: note.image }} 
                    className="w-full h-40 mt-2 rounded-lg"
                  />
                )}
              </View>
            ))}
          </View>
        )}

        {expense.statusHistory && expense.statusHistory.length > 0 && (
          <View>
            <Text className="text-muted-foreground mb-2">Status History</Text>
            {expense.statusHistory.map((history, index) => (
              <View key={index} className="bg-muted p-3 rounded-lg mb-2">
                <Text>
                  Changed from {history.oldStatus} to {history.newStatus}
                </Text>
              </View>
            ))}
          </View>
        )}
      </Card>
    </ScrollView>
  );
}
