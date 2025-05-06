import {
  View,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { Input } from '~/components/ui/input';
import { Text } from '~/components/ui/text';
import { useFetch } from '~/hook/useFetch';
import { useState, useCallback, useEffect, useRef } from 'react';
import { ExpenseTotals } from './expense-totals';
import { getApiUrl } from '~/utils/config';
import { Skeleton } from '~/components/ui/skeleton';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';

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
  products: Product[];
  notes: Note[];
  site?: string;
  balance?: number;
}

interface Note {
  text: string;
  author: string;
  date: string;
  image: string;
}

interface Product {
  name: string;
  description: string;
  category: string;
  qty: number;
  unit: string;
  price: number;
  amount: number;
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
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [searchAnim] = useState(new Animated.Value(0));
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const lastSearch = useRef('');

  const { data: totalsData, fetch: fetchTotals } = useFetch<TotalsResponse>(getApiUrl());
  const { fetch } = useFetch<ExpenseResponse>(getApiUrl());

  const fetchExpenses = useCallback(async (search: string, pageNum: number, reset = false) => {
    const isFirstPage = pageNum === 1;
    if (reset && !isRefreshing) setIsLoading(true);
    try {
      const url = `/expense/list?page=${pageNum}&pagesize=${pageSize}${search ? `&search=${encodeURIComponent(search)}` : ''}`;
      const res = await fetch(url);
      if (reset) {
        setExpenses(res?.expenses || []);
      } else {
        setExpenses(prev => [...prev, ...(res?.expenses || [])]);
      }
      setHasMore(res?.expenses?.length === pageSize);
      setPage(pageNum + 1);
    } catch (err) {
      if (reset) setExpenses([]);
      setHasMore(false);
      console.error('Fetch expenses failed:', err);
    } finally {
      if (reset && !isRefreshing) setIsLoading(false);
    }
  }, [fetch, isRefreshing]);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      await fetchTotals('/expense/totals');
      await fetchExpenses('', 1, true);
      setIsLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    setIsLoading(true);
    searchTimeout.current = setTimeout(() => {
      if (lastSearch.current !== searchQuery) {
        setPage(2);
        setHasMore(true);
        fetchExpenses(searchQuery, 1, true).then(() => setIsLoading(false));
        lastSearch.current = searchQuery;
      } else {
        setIsLoading(false);
      }
    }, 350);
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [searchQuery, fetchExpenses]);

  const loadMore = async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    await fetchExpenses(searchQuery, page, false);
    setIsLoadingMore(false);
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    setPage(2);
    setHasMore(true);
    await fetchExpenses(searchQuery, 1, true);
    setIsRefreshing(false);
  };

  const filtered = expenses;

  const handleExpensePress = (expense: Expense) => {
    navigation.navigate('[id]', { id: expense._id });
  };

  const toggleSearch = () => {
    if (!showSearch) {
      Animated.timing(searchAnim, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }).start(() => setShowSearch(true));
    } else {
      Animated.timing(searchAnim, {
        toValue: 0,
        duration: 300,
        easing: Easing.in(Easing.ease),
        useNativeDriver: false,
      }).start(() => setShowSearch(false));
    }
  };

  const animatedWidth = searchAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '80%'],
  });

  const renderCard = (item: Expense) => {
    const firstProduct = item.products && item.products.length > 0 ? item.products[0] : null;
    const moreCount = item.products && item.products.length > 1 ? item.products.length - 1 : 0;
    return (
      <div key={item.expense_id ? String(item.expense_id) : item._id} className="bg-background rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4 flex flex-col justify-between h-full">
        <div>
          <div className="flex-row flex-wrap justify-between items-center mb-1 flex">
            <span className="font-medium text-foreground text-base flex-1 min-w-0 truncate">{item.title}</span>
            <span className="text-xs text-muted-foreground ml-2">{new Date(item.date).toLocaleDateString()}</span>
          </div>
          <div className="flex-row flex-wrap justify-between items-center mb-1 flex">
            <span className="text-xs text-muted-foreground flex-1 min-w-0 truncate">Vendor: {item.vendor?.name || 'No vendor'}</span>
            <span className="text-xs text-muted-foreground ml-2">Site: {item.site || '-'}</span>
          </div>
          <div className="flex-row flex-wrap justify-between items-center mb-1 flex">
            <span className="text-xs text-muted-foreground flex-1 min-w-0 truncate">
              {firstProduct ? `Product: ${firstProduct.name}` : 'No products'}
              {moreCount > 0 && <span className="text-xs text-muted-foreground"> +{moreCount} more</span>}
            </span>
            <span className="text-xs text-muted-foreground ml-2">{item.products?.length || 0} items</span>
          </div>
          <div className="flex-row flex-wrap justify-between items-center mt-1 flex">
            <span className="text-xs text-muted-foreground">Balance:</span>
            <span className="text-lg font-bold text-red-500 ml-2">₦{(item.balance ?? 0).toLocaleString()}</span>
            <span className="text-xs text-muted-foreground ml-4">Total: ₦{item.txn_amount?.toLocaleString()}</span>
          </div>
        </div>
        <div className="mt-2 flex flex-row items-center justify-between">
          <span
            className={`text-sm ${
              item.status === 'APPROVED'
                ? 'text-green-500'
                : item.status === 'PENDING'
                ? 'text-yellow-500'
                : item.status === 'PAID'
                ? 'text-purple-500'
                : item.status === 'REVIEWED'
                ? 'text-blue-500'
                : item.status === 'VALIDATED'
                ? 'text-indigo-500'
                : 'text-muted-foreground'
            }`}
          >
            {item.status}
          </span>
          <button
            className="ml-2 px-3 py-1 rounded bg-primary text-white text-xs font-semibold hover:bg-primary/80"
            onClick={() => handleExpensePress(item)}
          >
            View
          </button>
        </div>
      </div>
    );
  };

  const renderItem = ({ item }: { item: Expense }) => {
    const firstProduct = item.products && item.products.length > 0 ? item.products[0] : null;
    const moreCount = item.products && item.products.length > 1 ? item.products.length - 1 : 0;
    return (
      <TouchableOpacity
        onPress={() => handleExpensePress(item)}
        className="border-b border-gray-200 dark:border-gray-700 p-4 bg-background"
      >
        <View className="flex-row flex-wrap justify-between items-center mb-1">
          <Text className="font-medium text-foreground text-base flex-1 min-w-0 truncate">{item.title}</Text>
          <Text className="text-xs text-muted-foreground ml-2">{new Date(item.date).toLocaleDateString()}</Text>
        </View>
        <View className="flex-row flex-wrap justify-between items-center mb-1">
          <Text className="text-xs text-muted-foreground flex-1 min-w-0 truncate">Vendor: {item.vendor?.name || 'No vendor'}</Text>
          <Text className="text-xs text-muted-foreground ml-2">Site: {item.site || '-'}</Text>
        </View>
        <View className="flex-row flex-wrap justify-between items-center mb-1">
          <Text className="text-xs text-muted-foreground flex-1 min-w-0 truncate">
            {firstProduct ? `Product: ${firstProduct.name}` : 'No products'}
            {moreCount > 0 && <Text className="text-xs text-muted-foreground"> +{moreCount} more</Text>}
          </Text>
          <Text className="text-xs text-muted-foreground ml-2">{item.products?.length || 0} items</Text>
        </View>
        <View className="flex-row flex-wrap justify-between items-center mt-1">
          <Text className="text-xs text-muted-foreground">Balance:</Text>
          <Text className="text-lg font-bold text-red-500 ml-2">₦{(item.balance ?? 0).toLocaleString()}</Text>
          <Text className="text-xs text-muted-foreground ml-4">Total: ₦{item.txn_amount?.toLocaleString()}</Text>
        </View>
        <View className="mt-2">
          <Text
            className={`text-sm ${
              item.status === 'APPROVED'
                ? 'text-green-500'
                : item.status === 'PENDING'
                ? 'text-yellow-500'
                : item.status === 'PAID'
                ? 'text-purple-500'
                : item.status === 'REVIEWED'
                ? 'text-blue-500'
                : item.status === 'VALIDATED'
                ? 'text-indigo-500'
                : 'text-muted-foreground'
            }`}
          >
            {item.status}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row justify-between items-center px-4 mb-4 space-x-2">
        {(Platform.OS === 'web' || showSearch) ? (
          <View style={{ flex: 1 }}>
            <Input
              placeholder="Search expenses..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="bg-background w-full"
            />
          </View>
        ) : null}
        {Platform.OS !== 'web' && (
          <View className="flex-row space-x-3 items-center">
            <TouchableOpacity onPress={toggleSearch}>
              <Ionicons name="search" size={28} color="#007AFF" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/expenses/create')}>
              <Ionicons name="add-circle-outline" size={32} color="#007AFF" />
            </TouchableOpacity>
          </View>
        )}
        {Platform.OS === 'web' && (
          <View className="flex-row space-x-3 items-center">
            <TouchableOpacity onPress={() => router.push('/expenses/create')}>
              <Ionicons name="add-circle-outline" size={32} color="#007AFF" />
            </TouchableOpacity>
          </View>
        )}
      </View>
      <ExpenseTotals
        totals={
          totalsData || {
            total: 0,
            pending: 0,
            approved: 0,
            paid: 0,
            draft: 0,
            validated: 0,
          }
        }
      />

      {isLoading && expenses.length === 0 ? (
        Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-24 my-2 rounded-xl bg-gray-200 dark:bg-gray-800" />
        ))
      ) : expenses.length === 0 && !hasMore ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-red-500 p-4">Failed to load data</Text>
        </View>
      ) : Platform.OS === 'web' ? (
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 px-4 pb-8">
          {filtered.length === 0 ? (
            <div className="col-span-full p-4 text-center text-muted-foreground">No expenses found</div>
          ) : (
            filtered.map(renderCard)
          )}
        </div>
      ) : (
        <FlatList
          data={filtered}
          renderItem={renderItem}
          keyExtractor={item => (item.expense_id ? String(item.expense_id) : item._id)}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
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
