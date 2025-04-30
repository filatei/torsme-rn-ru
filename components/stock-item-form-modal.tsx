import { View, Modal, SafeAreaView, Platform, Image, TouchableOpacity } from 'react-native';
import { Text } from '~/components/ui/text';
import { Input } from '~/components/ui/input';
import { Button } from '~/components/ui/button';
import { useState } from 'react';
import { useFetch } from '~/hook/useFetch';
import { getApiUrl } from '~/utils/config';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

export interface StockItem {
  _id?: string;
  name: string;
  description?: string;
  unit?: string;
  category?: string;
  barcode?: string;
  icon?: string;
}

interface StockItemFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: StockItem;
  suggestedName?: string;
}

export function StockItemFormModal({ 
  visible, 
  onClose, 
  onSuccess, 
  initialData,
  suggestedName 
}: StockItemFormModalProps) {
  const [name, setName] = useState(initialData?.name || suggestedName || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [unit, setUnit] = useState(initialData?.unit || '');
  const [category, setCategory] = useState(initialData?.category || '');
  const [barcode, setBarcode] = useState(initialData?.barcode || '');
  const [image, setImage] = useState<string | null>(initialData?.icon || null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { fetch } = useFetch(getApiUrl());

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0].uri) {
      setImage(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      if (description) formData.append('description', description.trim());
      if (unit) formData.append('unit', unit.trim());
      if (category) formData.append('category', category.trim());
      if (barcode) formData.append('barcode', barcode.trim());

      if (image && !image.startsWith('http')) {
        formData.append('image', {
          uri: image,
          type: 'image/jpeg',
          name: 'stockitem.jpg',
        } as any);
      }

      const endpoint = initialData?._id 
        ? `/stockitem/${initialData._id}`
        : '/stockitem';

      const response = await fetch(endpoint, {
        method: initialData?._id ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      if (response) {
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('Failed to save stock item:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-background">
        <SafeAreaView className="flex-1">
          <View className="flex-row items-center justify-between border-b border-border px-4 py-2">
            <Button
              variant="ghost"
              className="p-2"
              onPress={onClose}
            >
              <Ionicons name="close" size={24} color="#666" />
            </Button>
            <Text className="text-lg font-semibold">
              {initialData?._id ? 'Edit Item' : 'New Item'}
            </Text>
            <Button
              onPress={handleSubmit}
              disabled={isSubmitting || !name.trim()}
              className="py-2 px-4"
            >
              <Text className="text-white">Save</Text>
            </Button>
          </View>

          <View className="p-4">
            <TouchableOpacity 
              onPress={pickImage}
              className="w-24 h-24 mb-4 rounded-xl bg-muted items-center justify-center self-center"
            >
              {image ? (
                <Image 
                  source={{ uri: image }} 
                  className="w-24 h-24 rounded-xl"
                />
              ) : (
                <Ionicons name="camera" size={32} color="#666" />
              )}
            </TouchableOpacity>

            <View className="space-y-4">
              <View>
                <Text className="text-sm text-muted-foreground mb-1">Name *</Text>
                <Input
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter item name"
                />
              </View>

              <View>
                <Text className="text-sm text-muted-foreground mb-1">Description</Text>
                <Input
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Enter description"
                  multiline
                  numberOfLines={3}
                  className="min-h-[80px] py-2"
                />
              </View>

              <View>
                <Text className="text-sm text-muted-foreground mb-1">Unit</Text>
                <Input
                  value={unit}
                  onChangeText={setUnit}
                  placeholder="Enter unit (e.g., PCS, KG)"
                />
              </View>

              <View>
                <Text className="text-sm text-muted-foreground mb-1">Category</Text>
                <Input
                  value={category}
                  onChangeText={setCategory}
                  placeholder="Enter category"
                />
              </View>

              <View>
                <Text className="text-sm text-muted-foreground mb-1">Barcode</Text>
                <Input
                  value={barcode}
                  onChangeText={setBarcode}
                  placeholder="Enter barcode"
                />
              </View>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
} 