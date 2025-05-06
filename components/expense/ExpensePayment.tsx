import React, { useState } from 'react';
import { View, Alert, Platform, TouchableOpacity, Modal, Pressable } from 'react-native';
import { Text } from '~/components/ui/text';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ListPicker, ListPickerItem } from '../ListPicker';
import { ConfirmDialog } from '~/components/ConfirmDialog';
import { Ionicons } from '@expo/vector-icons';
import { cn } from '~/lib/utils';

interface Bank {
  name: string;
  code: string;
}

interface ExpensePaymentProps {
  balance: number;
  banks: Bank[];
  onMakePayment: (amount: number, account: string, paymentDate: string) => Promise<void>;
  userName: string;
  isVisible: boolean;
  onClose: () => void;
}

// Cross-platform confirm dialog
async function confirmDialog(message: string): Promise<boolean> {
  if (Platform.OS === 'web') {
    return window.confirm(message);
  } else {
    return new Promise(resolve => {
      Alert.alert(
        'Confirm Payment',
        message,
        [
          { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Confirm', onPress: () => resolve(true) }
        ]
      );
    });
  }
}

export function ExpensePayment({
  balance,
  banks,
  onMakePayment,
  userName,
  isVisible,
  onClose,
}: ExpensePaymentProps) {
  const [amount, setAmount] = useState('');
  const [account, setAccount] = useState(banks[0]?.code || 'CASH');
  const [paymentDate, setPaymentDate] = useState(new Date());
  const [isPaying, setIsPaying] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showBankPicker, setShowBankPicker] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingPayment, setPendingPayment] = useState<{ amount: number; account: string; date: string } | null>(null);

  // Prepare items for ListPicker (bank list)
  const bankItems: ListPickerItem[] = banks.map(bank => ({ label: bank.name, value: bank.name }));

  const handleSubmit = async () => {
    if (!amount || isNaN(Number(amount))) return;
    setIsPaying(true);
    try {
      await onMakePayment(Number(amount), account, paymentDate.toISOString());
      setAmount('');
      onClose();
    } catch (err) {
      console.error('Payment failed:', err);
    } finally {
      setIsPaying(false);
    }
  };

  const handlePayment = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      Alert.alert('Invalid amount', 'Please enter a valid payment amount.');
      return;
    }
    if (Number(amount) > balance) {
      Alert.alert('Amount too high', 'Payment cannot exceed balance.');
      return;
    }
    setPendingPayment({
      amount: Number(amount),
      account: account,
      date: paymentDate.toISOString(),
    });
    setShowConfirm(true);
  };

  const confirmAndPay = async () => {
    if (!pendingPayment) return;
    setIsPaying(true);
    try {
      await onMakePayment(pendingPayment.amount, pendingPayment.account, pendingPayment.date);
      setAmount('');
      setShowConfirm(false);
      setPendingPayment(null);
      onClose();
    } catch (err) {
      Alert.alert('Payment failed', 'Could not process payment.');
    } finally {
      setIsPaying(false);
    }
  };

  const onChangeDate = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) setPaymentDate(selectedDate);
  };

  // Always render DateTimePicker, but hide it when not needed
  const datePickerStyle = showDatePicker ? {} : { position: 'absolute' as const, left: -9999 };

  return (
    Platform.OS === 'web' ? (
      isVisible ? (
        <View style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 1000,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <View
            className={cn(
              'bg-background rounded-lg p-6 w-[90%] max-w-sm shadow-lg'
            )}
          >
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-lg font-bold text-foreground">Make Payment</Text>
              <TouchableOpacity onPress={onClose} style={{marginLeft: 8}}>
                <Ionicons name="close" size={24} color="#888" />
              </TouchableOpacity>
            </View>
            <View className="mb-4">
              <Text className="text-foreground/70 mb-1">Outstanding Balance</Text>
              <Text className="text-2xl font-bold text-foreground">₦{balance.toLocaleString()}</Text>
            </View>
            <Input
              value={amount}
              onChangeText={setAmount}
              placeholder={`Enter amount (max ₦${balance.toLocaleString()})`}
              keyboardType="numeric"
              className="mb-2"
            />
            <View className="mb-2">
              <Text className="text-foreground/70 mb-1">Bank Account</Text>
              <View className="border rounded-md">
                <Picker
                  selectedValue={account}
                  onValueChange={setAccount}
                  style={{ height: 50 }}
                >
                  <Picker.Item label="Cash" value="CASH" />
                  {banks.map((bank) => (
                    <Picker.Item
                      key={bank.code}
                      label={bank.name}
                      value={bank.code}
                    />
                  ))}
                </Picker>
              </View>
            </View>
            <View className="mb-2">
              <Text className="text-foreground/70 mb-1">Payment Date</Text>
              <input
                type="date"
                value={paymentDate.toISOString().slice(0, 10)}
                onChange={e => setPaymentDate(new Date(e.target.value))}
                style={{padding: 8, borderRadius: 4, border: '1px solid #ccc'}}
              />
            </View>
            <Input
              value={userName}
              editable={false}
              className="mb-2"
              placeholder="Payer"
            />
            {amount && !isNaN(Number(amount)) && (
              <View className="mb-4 p-2 bg-muted rounded-md">
                <Text className="text-foreground/70">
                  New Balance: ₦{(balance - Number(amount)).toLocaleString()}
                </Text>
                <Text className="text-foreground/70">
                  Status: {balance - Number(amount) === 0 ? 'PAID' : 'PART-PAY'}
                </Text>
              </View>
            )}
            <View className="flex-row justify-end space-x-2">
              <Button variant="outline" onPress={onClose}>
                <Text>Cancel</Text>
              </Button>
              <Button
                className="bg-primary"
                onPress={handlePayment}
                disabled={isPaying || !amount || Number(amount) <= 0}
              >
                <Text className="text-white">{isPaying ? 'Processing...' : 'Pay'}</Text>
              </Button>
            </View>
            <ConfirmDialog
              visible={showConfirm}
              title="Confirm Payment"
              message={
                pendingPayment
                  ? `Are you sure you want to make a payment of ₦${pendingPayment.amount.toLocaleString()}?\n\n` +
                    `Current Balance: ₦${balance.toLocaleString()}\n` +
                    `New Balance: ₦${(balance - pendingPayment.amount).toLocaleString()}\n` +
                    `Status will be updated to: ${(balance - pendingPayment.amount) === 0 ? 'PAID' : 'PART-PAY'}`
                  : ''
              }
              onConfirm={confirmAndPay}
              onCancel={() => {
                setShowConfirm(false);
                setPendingPayment(null);
              }}
              isLoading={isPaying}
              confirmText="Confirm"
              cancelText="Cancel"
            />
          </View>
        </View>
      ) : null
    ) : (
      <Modal
        visible={isVisible}
        transparent
        animationType="fade"
        onRequestClose={onClose}
      >
        <Pressable
          onPress={onClose}
          className="flex-1 bg-black/50 justify-center items-center"
        >
          <View
            className={cn(
              'bg-background rounded-lg p-6 w-[90%] max-w-sm shadow-lg'
            )}
          >
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-lg font-bold text-foreground">Make Payment</Text>
              <TouchableOpacity onPress={onClose} hitSlop={{top:8,right:8,bottom:8,left:8}}>
                <Ionicons name="close" size={24} color="#888" />
              </TouchableOpacity>
            </View>
            <View className="mb-4">
              <Text className="text-foreground/70 mb-1">Outstanding Balance</Text>
              <Text className="text-2xl font-bold text-foreground">₦{balance.toLocaleString()}</Text>
            </View>
            <Input
              value={amount}
              onChangeText={setAmount}
              placeholder={`Enter amount (max ₦${balance.toLocaleString()})`}
              keyboardType="numeric"
              className="mb-2"
            />
            <View className="mb-2">
              <Text className="text-foreground/70 mb-1">Bank Account</Text>
              <View className="border rounded-md">
                <Picker
                  selectedValue={account}
                  onValueChange={setAccount}
                  style={{ height: 50 }}
                >
                  <Picker.Item label="Cash" value="CASH" />
                  {banks.map((bank) => (
                    <Picker.Item
                      key={bank.code}
                      label={bank.name}
                      value={bank.code}
                    />
                  ))}
                </Picker>
              </View>
            </View>
            <Button variant="outline" className="mb-2" onPress={() => setShowDatePicker(true)}>
              <Text className="text-foreground">
                Payment Date: {paymentDate.toLocaleDateString()}
              </Text>
            </Button>
            <View style={datePickerStyle}>
              {Platform.OS === 'ios' && (
                <DateTimePicker
                  value={paymentDate}
                  mode="date"
                  display="default"
                  onChange={(_, date) => date && setPaymentDate(date)}
                />
              )}
            </View>
            <Input
              value={userName}
              editable={false}
              className="mb-2"
              placeholder="Payer"
            />
            {amount && !isNaN(Number(amount)) && (
              <View className="mb-4 p-2 bg-muted rounded-md">
                <Text className="text-foreground/70">
                  New Balance: ₦{(balance - Number(amount)).toLocaleString()}
                </Text>
                <Text className="text-foreground/70">
                  Status: {balance - Number(amount) === 0 ? 'PAID' : 'PART-PAY'}
                </Text>
              </View>
            )}
            <View className="flex-row justify-end space-x-2">
              <Button variant="outline" onPress={onClose}>
                <Text>Cancel</Text>
              </Button>
              <Button
                className="bg-primary"
                onPress={handlePayment}
                disabled={isPaying || !amount || Number(amount) <= 0}
              >
                <Text className="text-white">{isPaying ? 'Processing...' : 'Pay'}</Text>
              </Button>
            </View>
            <ConfirmDialog
              visible={showConfirm}
              title="Confirm Payment"
              message={
                pendingPayment
                  ? `Are you sure you want to make a payment of ₦${pendingPayment.amount.toLocaleString()}?\n\n` +
                    `Current Balance: ₦${balance.toLocaleString()}\n` +
                    `New Balance: ₦${(balance - pendingPayment.amount).toLocaleString()}\n` +
                    `Status will be updated to: ${(balance - pendingPayment.amount) === 0 ? 'PAID' : 'PART-PAY'}`
                  : ''
              }
              onConfirm={confirmAndPay}
              onCancel={() => {
                setShowConfirm(false);
                setPendingPayment(null);
              }}
              isLoading={isPaying}
              confirmText="Confirm"
              cancelText="Cancel"
            />
          </View>
        </Pressable>
      </Modal>
    )
  );
} 