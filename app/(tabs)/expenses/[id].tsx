// app/(tabs)/expenses/[id].tsx

import { View, ScrollView, ActivityIndicator, Image, Alert } from 'react-native';
import { Text } from '~/components/ui/text';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFetch } from '~/hook/useFetch';
import { getApiUrl } from '~/utils/config';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { useState, useEffect } from 'react';
import { Card } from '~/components/ui/card';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '~/context/auth-context';
import Modal from 'react-native-modal';
import { ExpenseHeader } from '~/components/expense/ExpenseHeader';
import { ExpenseStatusUpdate } from '~/components/expense/ExpenseStatusUpdate';
import { ExpensePayment } from '~/components/expense/ExpensePayment';
import { ExpenseNotes } from '~/components/expense/ExpenseNotes';
import { ExpensePaymentHistory } from '~/components/expense/ExpensePaymentHistory';
import { ExpenseItemRow } from '~/components/expense/ExpenseItemRow';
import { PaymentHistoryRow } from '~/components/expense/PaymentHistoryRow';
import { NoteRow } from '~/components/expense/NoteRow';
import { SectionHeader } from '~/components/expense/SectionHeader';
import { FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type ExpenseStatus = 'DRAFT' | 'VALIDATED' | 'REVIEWED' | 'APPROVED' | 'PAID' | 'PART-PAY';

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
  balance?: number;
  payHistory?: Array<{
    bankAcct: string;
    paidAmount: number;
    paymentDate: string;
    memo?: string;
    payer: string;
  }>;
  log?: Array<{
    updater: string;
    date: string;
    status?: string;
    note?: { text: string };
    products?: Array<{ name: string }>;
  }>;
  products?: Array<{
    name: string;
    quantity?: number;
    price?: number;
    total?: number;
    [key: string]: any;
  }>;
}

interface ExpenseResponse {
  expense: Expense;
}

interface BanksResponse {
  data: Array<{
    _id: string;
    name: string;
    code: string;
  }>;
  success: boolean;
}

const statusFlow: Record<ExpenseStatus, ExpenseStatus[]> = {
  DRAFT: ['VALIDATED'],
  VALIDATED: ['REVIEWED'],
  REVIEWED: ['APPROVED'],
  APPROVED: ['PAID'],
  PAID: [],
  'PART-PAY': ['PAID'],
};

export default function ExpenseDetail() {
  // State for controlling the payment modal from the top-right button
  const [showPayModal, setShowPayModal] = useState(false);
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [newNote, setNewNote] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentAccount, setPaymentAccount] = useState('CASH');
  const [isPaying, setIsPaying] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const { user } = useAuth();
  const [isPayModalVisible, setIsPayModalVisible] = useState(false);
  const [banks, setBanks] = useState<{ name: string; code: string }[]>([]);
  const [noteImage, setNoteImage] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const { data: response, loading, error, fetch: fetchData } = useFetch<ExpenseResponse>(getApiUrl());
  const { fetch } = useFetch(getApiUrl());
  const expense = response?.expense;

  const loadBanks = async () => {
    const res = await fetch('/banks');
    setBanks(res.data.map((bank: any) => ({
      name: bank.name,
      code: bank.code
    })));
  }

  console.log('Full response:', response);
  console.log('Expense from full response:', response?.expense);

  const loadExpense = async () => {
    try {
      console.log('Loading expense with ID:', id);
      const result = await fetchData(`/expense/${id}`);
      console.log('Load expense result:', result);
      if (result?.expense) {
        console.log('Expense found in result:', result.expense);
      } else {
        console.log('No expense found in result');
      }
    } catch (err) {
      console.error('Failed to load expense:', err);
    }
  };

  useEffect(() => {
    if (id) {
      loadExpense();
    }
  }, [id, refresh]);

  useEffect(  () => {
    loadBanks()
  }, []);

  const updateStatus = async (newStatus: ExpenseStatus) => {
    setIsUpdating(true);
    try {
      const response = await fetchData(`/expense/${id}`, {
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

  const handleMakePayment = async (amount: number, account: string, paymentDate: string) => {
    if (!expense) return;
    try {
      const newBalance = (expense.balance ?? expense.txn_amount) - amount;
      const newStatus = newBalance === 0 ? 'PAID' : 'PART-PAY';
      const newPayment = {
        bankAcct: account,
        paidAmount: amount,
        paymentDate,
        memo: `${account}/${expense.vendor?.name}/${Date.now()}/${(expense as any).expense_id || expense._id}/${amount}`,
        payer: user?.name || 'User',
      };
      const updatedPayHistory = [
        newPayment,
        ...(expense.payHistory || [])
      ];
      const res = await fetchData(`/expense/${expense._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...expense,
          balance: newBalance,
          status: newStatus,
          payHistory: updatedPayHistory,
        }),
      });
      if (res) {
        setPaymentAmount && setPaymentAmount(''); // Defensive: if setPaymentAmount exists
        setRefresh(r => r + 1);
      }
    } catch (err) {
      console.error('Failed to make payment:', err);
      throw err;
    }
  };

  const pickNoteImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0].uri) {
      setNoteImage(result.assets[0].uri);
    }
  };

  const addNote = async (text: string, image: string | null) => {
    if (!expense) return;
    setIsUpdating(true);
    try {
      const formData = new FormData();
      formData.append('text', text);
      formData.append('author', user?.name || 'User');
      formData.append('date', new Date().toISOString());
      if (image) {
        formData.append('image', {
          uri: image,
          type: 'image/jpeg',
          name: `note_${Date.now()}.jpg`,
        } as any);
      }
      const res = await fetchData(`/expense/notes/${expense._id}`, {
        method: 'PUT',
        body: formData,
      });
      if (res) {
        setNewNote('');
        setNoteImage(null);
        setRefresh(r => r + 1);
      }
    } catch (err) {
      console.error('Failed to add note:', err);
      throw err;
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteExpense = async () => {
    if (!expense) return;
    setIsDeleting(true);
    try {
      await fetchData(`/expense/${expense._id}`, {
        method: 'DELETE',
      });
      // Navigate back to expenses list regardless of response shape
      router.replace('/(tabs)/expenses');
    } catch (err) {
      Alert.alert('Delete Failed', 'Could not delete expense.');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const canDelete = expense && !['PAID', 'APPROVED', 'PART-PAY'].includes(expense.status);
  const canReset = expense && expense.status !== 'DRAFT';

  const handleResetExpense = async () => {
    if (!expense) return;
    setIsResetting(true);
    try {
      const res = await fetchData(`/expense/${expense._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...expense,
          status: 'DRAFT',
          payHistory: [],
          notes: [],
        }),
      });
      if (res) setRefresh(r => r + 1);
    } catch (err) {
      Alert.alert('Reset Failed', 'Could not reset expense.');
    } finally {
      setIsResetting(false);
      setShowResetModal(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!expense) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-red-500">Failed to load expense details</Text>
        {error && <Text className="text-red-500 mt-2">{error.message}</Text>}
      </View>
    );
  }

  const nextStatuses = statusFlow[expense.status] || [];

  // Only show payment if status is APPROVED or PART-PAY and balance > 0
  const showPayment = (expense.status === 'APPROVED' || expense.status === 'PART-PAY') && (expense.balance ?? 0) > 0;
  const showMarkAsPaid = expense.status !== 'APPROVED' && (expense.balance ?? 0) > 0 && nextStatuses.includes('PAID');

  return (
    <ScrollView className="flex-1 bg-background p-4">
      <View className="flex-row justify-between items-center mb-2">
        <ExpenseHeader
          title={expense.title}
          amount={expense.txn_amount}
          vendor={expense.vendor?.name || ''}
          date={expense.date}
          status={expense.status}
          balance={expense.balance ?? 0}
        />
        <View className="flex-row items-center">
          {canReset && (
            <Button
              variant="ghost"
              className="mr-2"
              onPress={() => setShowResetModal(true)}
              disabled={isResetting}
            >
              <Ionicons name="refresh" size={22} color="#888" />
            </Button>
          )}
          {canDelete && (
            <Button
              variant="ghost"
              onPress={() => setShowDeleteModal(true)}
              disabled={isDeleting}
            >
              <Ionicons name="trash" size={22} color="#e11d48" />
            </Button>
          )}
        </View>
      </View>

      {/* Items Section */}
      <SectionHeader title="Items" />
      <FlatList
        data={expense.products || []}
        renderItem={({ item }) => <ExpenseItemRow item={item} />}
        keyExtractor={(_, idx) => idx.toString()}
        ListEmptyComponent={<Text className="text-muted-foreground">No items</Text>}
        scrollEnabled={false}
      />

      {/* Payment History Section */}
      <SectionHeader title="Payment History" />
      <FlatList
        data={expense.payHistory || []}
        renderItem={({ item }) => <PaymentHistoryRow item={item} />}
        keyExtractor={(_, idx) => idx.toString()}
        ListEmptyComponent={<Text className="text-muted-foreground">No payments</Text>}
        scrollEnabled={false}
      />

      {/* Notes Section */}
      <SectionHeader title="Notes" />
      <FlatList
        data={expense.notes || []}
        renderItem={({ item }) => <NoteRow item={item} />}
        keyExtractor={(_, idx) => idx.toString()}
        ListEmptyComponent={<Text className="text-muted-foreground">No notes</Text>}
        scrollEnabled={false}
      />

      {/* Actions and Add Note remain as before */}
      {showPayment && (
        <Button className="mt-4 bg-primary" onPress={() => setShowPayModal(true)}>
          <Text className="text-primary-foreground">Pay</Text>
        </Button>
      )}
      {showMarkAsPaid && (
        <ExpenseStatusUpdate
          nextStatuses={nextStatuses}
          isUpdating={isUpdating}
          onUpdateStatus={updateStatus}
        />
      )}
      <ExpensePayment
        balance={expense.balance ?? 0}
        banks={banks}
        onMakePayment={handleMakePayment}
        userName={user?.name || 'User'}
        isVisible={showPayment && showPayModal}
        onClose={() => setShowPayModal(false)}
      />
      <ExpenseNotes
        notes={expense.notes || []}
        onAddNote={addNote}
        isUpdating={isUpdating}
        userName={user?.name || 'User'}
      />
      <Modal isVisible={showDeleteModal} onBackdropPress={() => setShowDeleteModal(false)}>
        <View className="bg-background p-6 rounded-lg">
          <Text className="text-lg font-bold mb-4 text-foreground">Delete Expense?</Text>
          <Text className="mb-4 text-foreground">Are you sure you want to delete this expense? This action cannot be undone.</Text>
          <View className="flex-row justify-end space-x-2">
            <Button variant="outline" onPress={() => setShowDeleteModal(false)}>
              <Text>Cancel</Text>
            </Button>
            <Button className="bg-destructive" onPress={handleDeleteExpense} disabled={isDeleting}>
              <Text className="text-white">{isDeleting ? 'Deleting...' : 'Delete'}</Text>
            </Button>
          </View>
        </View>
      </Modal>
      {/* Reset Confirmation Modal */}
      <Modal isVisible={showResetModal} onBackdropPress={() => setShowResetModal(false)}>
        <View className="bg-background p-6 rounded-lg">
          <Text className="text-lg font-bold mb-4 text-foreground">Reset Expense?</Text>
          <Text className="mb-4 text-foreground">Are you sure you want to reset this expense to draft? This will clear all payment and notes history.</Text>
          <View className="flex-row justify-end space-x-2">
            <Button variant="outline" onPress={() => setShowResetModal(false)}>
              <Text>Cancel</Text>
            </Button>
            <Button className="bg-primary" onPress={handleResetExpense} disabled={isResetting}>
              <Text className="text-white">{isResetting ? 'Resetting...' : 'Reset'}</Text>
            </Button>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
