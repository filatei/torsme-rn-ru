import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import Modal from 'react-native-modal';
import { Text } from '~/components/ui/text';
import { Button } from '~/components/ui/button';
import { Ionicons } from '@expo/vector-icons';

interface ConfirmDialogProps {
  visible: boolean;
  title?: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
}

export function ConfirmDialog({
  visible,
  title = 'Confirm',
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isLoading = false,
}: ConfirmDialogProps) {
  return (
    <Modal isVisible={visible} onBackdropPress={onCancel}>
      <View className="bg-background p-6 rounded-lg">
        <View className="flex-row justify-between items-center mb-2">
          {title && <Text className="text-lg font-bold text-foreground">{title}</Text>}
          <TouchableOpacity onPress={onCancel} hitSlop={{top:8,right:8,bottom:8,left:8}}>
            <Ionicons name="close" size={24} color="#888" />
          </TouchableOpacity>
        </View>
        <Text className="mb-4 text-foreground">{message}</Text>
        <View className="flex-row justify-end space-x-2">
          <Button variant="outline" onPress={onCancel} disabled={isLoading}>
            <Text>{cancelText}</Text>
          </Button>
          <Button className="bg-primary" onPress={onConfirm} disabled={isLoading}>
            <Text className="text-white">{isLoading ? 'Processing...' : confirmText}</Text>
          </Button>
        </View>
      </View>
    </Modal>
  );
} 