// app/(tabs)/expenses/[id].tsx

import { View, ScrollView, ActivityIndicator, Image, Alert, Modal, Pressable, Platform } from 'react-native';
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
import { AnimatedModal } from '~/components/ui/animated-modal';
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
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip';

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
    date: Date;
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
  APPROVED: ['PART-PAY', 'PAID'],
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
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<ExpenseStatus | null>(null);

  const loadBanks = async () => {
    const res = await fetch('/banks');
    setBanks(res.data.map((bank: any) => ({
      name: bank.name,
      code: bank.code
    })));
  }

  console.log('Full response:', response);
  console.log('Expense from full response:', response?.expense);
  console.log('Rendering ExpenseDetail', expense);

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
    if (!expense) return;
    setIsUpdating(true);
    try {
      const response = await fetchData(`/expense/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...expense,
          status: newStatus,
          statusHistory: [
            {
              oldStatus: expense.status,
              newStatus,
              updater: user?.name || 'User',
            },
            ...(expense.statusHistory || []),
          ],
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

  const handleStatusUpdate = (status: ExpenseStatus) => {
    setShowStatusModal(false);
    updateStatus(status);
  };

  const handleNoteChanged = () => {
    setRefresh(r => r + 1);
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
  // Only show status update for transitions from DRAFT to APPROVED
  const showStatusUpdate = ['DRAFT', 'VALIDATED', 'REVIEWED'].includes(expense.status);

  return (
    Platform.OS === 'web' ? (
      <View className=" bg-background p-6 h-screen overflow-y-auto">
  <View className="min-h-full p-6 w-full grid grid-cols-1 gap-6 ">
    {/* Left Column: Summary & Items */}
    <View className="col-span-1 flex flex-col gap-4">
      <ExpenseHeader
        title={expense.title}
        amount={expense.txn_amount}
        vendor={expense.vendor?.name || ''}
        date={expense.date}
        status={expense.status}
        balance={expense.balance ?? 0}
      />
      <div className="bg-card rounded-xl shadow-md p-4 space-y-2">
        <SectionHeader title="Items" />
        {expense.products && expense.products?.length > 0 ? (
          <table className="w-full text-sm text-left">
            <thead className="text-muted-foreground border-b">
              <tr>
                <th className="py-2 px-1">#</th>
                <th className="py-2 px-1">Name</th>
                <th className="py-2 px-1">Qty</th>
                <th className="py-2 px-1">Price</th>
                <th className="py-2 px-1">Amount</th>
              </tr>
            </thead>
            <tbody>
              {expense.products.map((item, idx) => (
                <tr key={idx} className="border-b hover:bg-muted/30">
                  <td className="py-2 px-1">{idx + 1}</td>
                  <td className="py-2 px-1">{item.name}</td>
                  <td className="py-2 px-1">{item.qty}</td>
                  <td className="py-2 px-1">{item.price}</td>
                  <td className="py-2 px-1">{item.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <Text className="text-muted-foreground">No items</Text>
        )}
      </div>
    </View>

    {/* Middle Column: Payment History */}
    <View className="col-span-1 flex flex-col gap-4">
      <div className="bg-card rounded-xl shadow-md p-4 space-y-2 overflow-x-hidden">
        <SectionHeader title="Payment History" />
        {expense.payHistory && expense.payHistory?.length > 0 ? (
          <table className="w-full text-sm text-left">
            <thead className="text-muted-foreground border-b">
              <tr>
                <th className="py-2 px-1">#</th>
                <th className="py-2 px-1">Date</th>
                <th className="py-2 px-1">Amt</th>
                <th className="py-2 px-1">Bank</th>
                <th className="py-2 px-1">Payer</th>
                <th className="py-2 px-1">Memo</th>
              </tr>
            </thead>
            <tbody>
              {expense.payHistory && expense.payHistory.map((item, idx) => (
                <tr key={idx} className="border-b hover:bg-muted/30  ">
                  <td className="py-2 px-1">{idx + 1}</td>
                  <td className="py-2 px-1">{item.paymentDate}</td>
                  <td className="py-2 px-1">₦{item.paidAmount.toLocaleString()}</td>
                  <td className="py-2 px-1">{item.bankAcct}</td>
                  <td className="py-2 px-1">{item.payer}</td>
                  <td className="py-2 px-1 truncate">{item.memo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <Text className="text-muted-foreground">No payments</Text>
        )}
      </div>

      <ExpensePayment
        balance={expense.balance ?? 0}
        banks={banks}
        onMakePayment={handleMakePayment}
        userName={user?.name || 'User'}
        isVisible={showPayment && showPayModal}
        onClose={() => setShowPayModal(false)}
      />
    </View>

    {/* Right Column: Notes */}
    <View className="col-span-1 flex flex-col gap-4">
      <div className="bg-card rounded-xl shadow-md p-4 space-y-2">
        <SectionHeader title="Notes" />
        {expense.notes?.length > 0 ? (
          expense.notes.map((note, idx) => <NoteRow key={idx} item={note} />)
        ) : (
          <Text className="text-muted-foreground">No notes</Text>
        )}
        <ExpenseNotes
          notes={expense.notes || []}
          onAddNote={addNote}
          isUpdating={isUpdating}
          userName={user?.name || 'User'}
          onChanged={handleNoteChanged}
        />
      </div>
    </View>
  </View>
</View>

    ) : (
      <ScrollView className="flex-1 bg-background p-4">
        {/* Stacked content for mobile */}
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-xl font-bold text-foreground">Expense Details</Text>
          <View className="flex-row items-center space-x-4">
            {showPayment && (
              <View className="items-center">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Pressable
                      onPress={() => setShowPayModal(true)}
                      className="p-2"
                    >
                      <Ionicons name="cash-outline" size={22} color="#2563eb" />
                    </Pressable>
                  </TooltipTrigger>
                  <TooltipContent>
                    <Text>Pay</Text>
                  </TooltipContent>
                </Tooltip>
                <Text className="text-xs text-center text-muted-foreground mt-1">Pay</Text>
              </View>
            )}
            {showStatusUpdate && (
              <View className="items-center">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Pressable
                      onPress={() => {
                        if (nextStatuses.length === 1) {
                          setSelectedStatus(nextStatuses[0]);
                          setShowStatusModal(true);
                        } else {
                          setShowStatusModal(true);
                        }
                      }}
                      className="p-2"
                    >
                      <Ionicons name="checkmark-done" size={22} color="#22c55e" />
                    </Pressable>
                  </TooltipTrigger>
                  <TooltipContent>
                    <Text>Update Status</Text>
                  </TooltipContent>
                </Tooltip>
                <Text className="text-xs text-center text-muted-foreground mt-1">Status</Text>
              </View>
            )}
            {canReset && (
              <View className="items-center">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Pressable
                      onPress={() => setShowResetModal(true)}
                      disabled={isResetting}
                      className="p-2"
                    >
                      <Ionicons name="refresh" size={22} color="#888" />
                    </Pressable>
                  </TooltipTrigger>
                  <TooltipContent>
                    <Text>Reset to Draft</Text>
                  </TooltipContent>
                </Tooltip>
                <Text className="text-xs text-center text-muted-foreground mt-1">Reset</Text>
              </View>
            )}
            {canDelete && (
              <View className="items-center">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Pressable
                      onPress={() => setShowDeleteModal(true)}
                      disabled={isDeleting}
                      className="p-2"
                    >
                      <Ionicons name="trash" size={22} color="#e11d48" />
                    </Pressable>
                  </TooltipTrigger>
                  <TooltipContent>
                    <Text>Delete</Text>
                  </TooltipContent>
                </Tooltip>
                <Text className="text-xs text-center text-muted-foreground mt-1">Delete</Text>
              </View>
            )}
          </View>
        </View>
        <ExpenseHeader
          title={expense.title}
          amount={expense.txn_amount}
          vendor={expense.vendor?.name || ''}
          date={expense.date}
          status={expense.status}
          balance={expense.balance ?? 0}
        />
        <SectionHeader title="Items" />
        <FlatList
          data={expense.products || []}
          renderItem={({ item }) => <ExpenseItemRow item={item} />}
          keyExtractor={(_, idx) => idx.toString()}
          ListEmptyComponent={<Text className="text-muted-foreground">No items</Text>}
          scrollEnabled={false}
        />
        <SectionHeader title="Payment History" />
        <FlatList
          data={expense.payHistory || []}
          renderItem={({ item }) => <PaymentHistoryRow item={item} />}
          keyExtractor={(_, idx) => idx.toString()}
          ListEmptyComponent={<Text className="text-muted-foreground">No payments</Text>}
          scrollEnabled={false}
        />
        <SectionHeader title="Notes" />
        <FlatList
          data={expense.notes || []}
          renderItem={({ item }) => <NoteRow item={item} />}
          keyExtractor={(_, idx) => idx.toString()}
          ListEmptyComponent={<Text className="text-muted-foreground">No notes</Text>}
          scrollEnabled={false}
        />
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
          onChanged={handleNoteChanged}
        />
        {showDeleteModal && (
          <Modal
            visible={showDeleteModal}
            transparent
            animationType="fade"
            onRequestClose={() => setShowDeleteModal(false)}
          >
            <Pressable
              onPress={() => setShowDeleteModal(false)}
              className="flex-1 bg-black/50 justify-center items-center"
            >
              <View className="bg-background rounded-lg p-6 w-[90%] max-w-sm shadow-lg">
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
            </Pressable>
          </Modal>
        )}
        {showResetModal && (
          <Modal
            visible={showResetModal}
            transparent
            animationType="fade"
            onRequestClose={() => setShowResetModal(false)}
          >
            <Pressable
              onPress={() => setShowResetModal(false)}
              className="flex-1 bg-black/50 justify-center items-center"
            >
              <View className="bg-background rounded-lg p-6 w-[90%] max-w-sm shadow-lg">
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
            </Pressable>
          </Modal>
        )}
        {showStatusModal && (
          <Modal
            visible={showStatusModal}
            transparent
            animationType="fade"
            onRequestClose={() => setShowStatusModal(false)}
          >
            <Pressable
              onPress={() => setShowStatusModal(false)}
              className="flex-1 bg-black/50 justify-center items-center"
            >
              <View className="bg-background rounded-lg p-6 w-[90%] max-w-sm shadow-lg">
                <Text className="text-lg font-bold mb-4 text-foreground">Update Status</Text>
                <Text className="mb-4 text-foreground">Are you sure you want to update the status to {selectedStatus || nextStatuses[0]}?</Text>
                <View className="flex-row justify-end space-x-2">
                  <Button variant="outline" onPress={() => setShowStatusModal(false)}>
                    <Text>Cancel</Text>
                  </Button>
                  <Button 
                    className="bg-primary" 
                    onPress={() => handleStatusUpdate(selectedStatus || nextStatuses[0])} 
                    disabled={isUpdating}
                  >
                    <Text className="text-white">{isUpdating ? 'Updating...' : 'Update'}</Text>
                  </Button>
                </View>
              </View>
            </Pressable>
          </Modal>
        )}
      </ScrollView>
    )
  );
}
