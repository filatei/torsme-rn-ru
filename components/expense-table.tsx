import { View, FlatList, ActivityIndicator } from 'react-native';
import { TouchableOpacity, RefreshControl } from 'react-native';

import { Input } from '~/components/ui/input';
import { Text } from '~/components/ui/text';
import { useFetch } from '~/hook/useFetch';
import { useState, useCallback, useEffect } from 'react';
import { ExpenseTotals } from './expense-totals';
import { getApiUrl } from '~/utils/config';
import {Skeleton } from '~/components/ui/skeleton'; // assume you created one
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  '[id]': { id: string };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Expense {
  _id: string;
  expense_id: number;
  txn_amount: number;
  status: string;
  date: string;
  vendor: { name: string };
  title: string;
}

interface ExpenseResponse {
  expenses: Expense[];
}

interface TotalsResponse {
  approved: number;
  draft: number;
  paid: number;
  pending: number;
  total: number;
  validated: number;
}

export function ExpenseTable() {
  const navigation = useNavigation<NavigationProp>();
  const pageSize = 10;
  const [page, setPage] = useState(1);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const { data: totalsData, fetch: fetchTotals } = useFetch<TotalsResponse>(getApiUrl());
  const { data, loading, error, fetch } = useFetch<ExpenseResponse>(getApiUrl());

  const loadInitial = useCallback(async () => {
    try {
      const [totals, list] = await Promise.all([
        fetchTotals('/expense/totals'),
        fetch(`/expense/list?page=1&pagesize=${pageSize}`)
      ]);
      setExpenses(list?.expenses || []);
      setHasMore(list?.expenses.length === pageSize || false);
      setPage(2);
    } catch (err) {
      console.error('Init load failed:', err);
    }
  }, [fetch, fetchTotals]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  const loadMore = async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    try {
      const more = await fetch(`/expense/list?page=${page}&pagesize=${pageSize}`);
      if (more?.expenses && more.expenses.length < pageSize) setHasMore(false);
      setExpenses(prev => [...prev, ...more?.expenses || []]);
      setPage(prev => prev + 1);
    } catch (err) {
      console.error('Load more error:', err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInitial();
    setRefreshing(false);
  };

  const filtered = expenses.filter(expense =>
    expense.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    expense.vendor?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    expense.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleExpensePress = (expense: Expense) => {
    navigation.navigate('[id]', { id: expense._id });
  };

  const renderItem = ({ item }: { item: Expense }) => (
    <TouchableOpacity
      onPress={() => handleExpensePress(item)}
      className="border-b border-gray-200 dark:border-gray-700 p-4 bg-background"
    >
      <View className="flex-row justify-between">
        <Text className="font-medium text-foreground">{item.title}</Text>
        <Text className="text-muted-foreground">{new Date(item.date).toLocaleDateString()}</Text>
      </View>
      <View className="flex-row justify-between mt-2">
        <Text className="text-muted-foreground">{item.vendor?.name || 'No vendor'}</Text>
        <Text className="font-bold text-foreground">
          {new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
          }).format(item.txn_amount)}
        </Text>
      </View>
      <View className="mt-2">
        <Text className={`text-sm ${
          item.status === 'APPROVED' ? 'text-green-500' :
          item.status === 'PENDING' ? 'text-yellow-500' :
          item.status === 'PAID' ? 'text-purple-500' :
          item.status === 'REVIEWED' ? 'text-blue-500' :
          item.status === 'VALIDATED' ? 'text-indigo-500' :
          'text-muted-foreground'
        }`}>
          {item.status}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-background">
      <ExpenseTotals totals={totalsData || {
        total: 0, pending: 0, approved: 0, paid: 0, draft: 0, validated: 0
      }} />

      <Input
        placeholder="Search expenses..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        className="mb-4 bg-background"
      />

      {loading && expenses.length === 0 ? (
        Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-24 my-2 rounded-xl bg-gray-200 dark:bg-gray-800" />
        ))
      ) : error ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-red-500 p-4">{error.message || 'Failed to load data'}</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          renderItem={renderItem}
          keyExtractor={item => item._id}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListFooterComponent={
            isLoadingMore ? <ActivityIndicator className="mt-4" size="small" /> : null
          }
          ListEmptyComponent={
            <View className="p-4 items-center">
              <Text className="text-muted-foreground">No expenses found</Text>
            </View>
          }
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </View>
  );
}
