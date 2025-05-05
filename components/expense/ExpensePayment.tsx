import React, { useState } from 'react';
import { View, Alert, Platform, TouchableOpacity } from 'react-native';
import { Text } from '~/components/ui/text';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import Modal from 'react-native-modal';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ListPicker, ListPickerItem } from '../ListPicker';
import { ConfirmDialog } from '~/components/ConfirmDialog';
import { Ionicons } from '@expo/vector-icons';

interface Bank {
  name: string;
  code: string;
}

interface ExpensePaymentProps {
  balance: number;
  banks: Bank[];
  onMakePayment: (amount: number, account: string, date: string) => Promise<void>;
  userName: string;
  isVisible?: boolean;
  onClose?: () => void;
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

export function ExpensePayment({ balance, banks, onMakePayment, userName, isVisible, onClose }: ExpensePaymentProps) {
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentAccount, setPaymentAccount] = useState('CASH');
  const [isPaying, setIsPaying] = useState(false);
  const [paymentDate, setPaymentDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showBankPicker, setShowBankPicker] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingPayment, setPendingPayment] = useState<{ amount: number; account: string; date: string } | null>(null);

  // Prepare items for ListPicker (bank list)
  const bankItems: ListPickerItem[] = banks.map(bank => ({ label: bank.name, value: bank.name }));

  const handlePayment = async () => {
    if (!paymentAmount || isNaN(Number(paymentAmount)) || Number(paymentAmount) <= 0) {
      Alert.alert('Invalid amount', 'Please enter a valid payment amount.');
      return;
    }
    if (Number(paymentAmount) > balance) {
      Alert.alert('Amount too high', 'Payment cannot exceed balance.');
      return;
    }
    setPendingPayment({
      amount: Number(paymentAmount),
      account: paymentAccount,
      date: paymentDate.toISOString(),
    });
    setShowConfirm(true);
  };

  const confirmAndPay = async () => {
    if (!pendingPayment) return;
    setIsPaying(true);
    try {
      await onMakePayment(pendingPayment.amount, pendingPayment.account, pendingPayment.date);
      setPaymentAmount('');
      setShowConfirm(false);
      setPendingPayment(null);
      if (onClose) onClose();
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
    <Modal isVisible={!!isVisible} onBackdropPress={onClose}>
      <View className="bg-background p-4 rounded-lg">
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
          value={paymentAmount}
          onChangeText={setPaymentAmount}
          placeholder={`Enter amount (max ₦${balance.toLocaleString()})`}
          keyboardType="numeric"
          className="mb-2"
        />
        <View className="mb-2">
          <Text className="text-foreground/70 mb-1">Bank Account</Text>
          <Button
            variant="outline"
            className="mb-2"
            onPress={() => setShowBankPicker(true)}
          >
            <Text className="text-foreground">
              {paymentAccount || 'Select Bank Account'}
            </Text>
          </Button>
          <ListPicker
            items={[{ label: 'CASH', value: 'CASH' }, ...bankItems]}
            value={paymentAccount}
            onChange={setPaymentAccount}
            placeholder="Select Bank Account"
            visible={showBankPicker}
            onClose={() => setShowBankPicker(false)}
          />
        </View>
        <Button variant="outline" className="mb-2" onPress={() => setShowDatePicker(true)}>
          <Text className="text-foreground">
            Payment Date: {paymentDate.toLocaleDateString()}
          </Text>
        </Button>
        <View style={datePickerStyle}>
          <DateTimePicker
            value={paymentDate}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) setPaymentDate(selectedDate);
            }}
          />
        </View>
        <Input
          value={userName}
          editable={false}
          className="mb-2"
          placeholder="Payer"
        />
        {paymentAmount && !isNaN(Number(paymentAmount)) && (
          <View className="mb-4 p-2 bg-muted rounded-md">
            <Text className="text-foreground/70">
              New Balance: ₦{(balance - Number(paymentAmount)).toLocaleString()}
            </Text>
            <Text className="text-foreground/70">
              Status: {balance - Number(paymentAmount) === 0 ? 'PAID' : 'PART-PAY'}
            </Text>
          </View>
        )}
        <Button
          onPress={handlePayment}
          disabled={isPaying || !paymentAmount || isNaN(Number(paymentAmount)) || Number(paymentAmount) > balance}
          className="w-full bg-primary"
        >
          <Text className="text-primary-foreground">
            {isPaying ? 'Processing...' : 'Submit Payment'}
          </Text>
        </Button>
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
    </Modal>
  );
} 