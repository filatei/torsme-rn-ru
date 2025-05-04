import React, { useState } from 'react';
import { View, Alert, Platform } from 'react-native';
import { Text } from '~/components/ui/text';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Picker } from '@react-native-picker/picker';
import Modal from 'react-native-modal';
import DateTimePicker from '@react-native-community/datetimepicker';

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

export function ExpensePayment({ balance, banks, onMakePayment, userName, isVisible, onClose }: ExpensePaymentProps) {
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentAccount, setPaymentAccount] = useState('CASH');
  const [isPaying, setIsPaying] = useState(false);
  const [paymentDate, setPaymentDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handlePayment = async () => {
    if (!paymentAmount || isNaN(Number(paymentAmount)) || Number(paymentAmount) <= 0) {
      Alert.alert('Invalid amount', 'Please enter a valid payment amount.');
      return;
    }
    if (Number(paymentAmount) > balance) {
      Alert.alert('Amount too high', 'Payment cannot exceed balance.');
      return;
    }

    const newBalance = balance - Number(paymentAmount);
    const status = newBalance === 0 ? 'PAID' : 'PART-PAY';

    Alert.alert(
      'Confirm Payment',
      `Are you sure you want to make a payment of ₦${Number(paymentAmount).toLocaleString()}?\n\n` +
      `Current Balance: ₦${balance.toLocaleString()}\n` +
      `New Balance: ₦${newBalance.toLocaleString()}\n` +
      `Status will be updated to: ${status}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setIsPaying(true);
            try {
              await onMakePayment(Number(paymentAmount), paymentAccount, paymentDate.toISOString());
              setPaymentAmount('');
              if (onClose) onClose();
            } catch (err) {
              Alert.alert('Payment failed', 'Could not process payment.');
            } finally {
              setIsPaying(false);
            }
          },
        },
      ]
    );
  };

  const onChangeDate = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) setPaymentDate(selectedDate);
  };

  console.log('Banks in ExpensePayment:', banks);

  // Always render DateTimePicker, but hide it when not needed
  const datePickerStyle = showDatePicker ? {} : { position: 'absolute' as const, left: -9999 };

  return (
    <Modal isVisible={!!isVisible} onBackdropPress={onClose}>
      <View className="bg-background p-4 rounded-lg">
        <Text className="text-lg font-bold mb-2 text-foreground">Make Payment</Text>
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
        <View className="border border-input rounded-md bg-background mb-2">
          <Picker
            selectedValue={paymentAccount}
            onValueChange={setPaymentAccount}
            style={{ color: '#222' }}
          >
            <Picker.Item label="Select Bank Account" value="" color="#888" />
            <Picker.Item label="CASH" value="CASH" color="#222" />
            {banks.map((bank) => (
              <Picker.Item 
                key={bank.code} 
                label={bank.name} 
                value={bank.name}
                color="#222"
              />
            ))}
          </Picker>
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
      </View>
    </Modal>
  );
} 