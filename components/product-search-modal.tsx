import { View, Modal, FlatList, ActivityIndicator, Image, SafeAreaView, Platform, TouchableOpacity, ScrollView } from 'react-native';
import { Text } from '~/components/ui/text';
import { Input } from '~/components/ui/input';
import { Button } from '~/components/ui/button';
import { useState, useEffect } from 'react';
import { useFetch } from '~/hook/useFetch';
import { getApiUrl } from '~/utils/config';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React from 'react';

interface Product {
  _id: string;
  name: string;
  description?: string;
  unit?: string;
  category?: string;
  icon?: string;
}

interface ProductSearchModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (product: Product) => void;
}

export function ProductSearchModal({ visible, onClose, onSelect }: ProductSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Product | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [unit, setUnit] = useState('');
  const [category, setCategory] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data, loading, error, fetch } = useFetch<{ stockItems: Product[] }>(getApiUrl());
  const { fetch: fetchCreate } = useFetch<Product>(getApiUrl());

  const searchProducts = async () => {
    if (searchQuery.trim().length < 1) return;
    await fetch(`/stockitem/getByText?searchTerm=${encodeURIComponent(searchQuery)}`);
  };

  useEffect(() => {
    if (visible && searchQuery.length > 0) {
      const debounce = setTimeout(() => {
        searchProducts();
      }, 300);
      return () => clearTimeout(debounce);
    }
  }, [searchQuery, visible]);

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

      if (image && !image.startsWith('http')) {
        formData.append('image', {
          uri: image,
          type: 'image/jpeg',
          name: 'stockitem.jpg',
        } as any);
      }

      const endpoint = selectedItem?._id 
        ? `/stockitem/${selectedItem._id}`
        : '/stockitem';

      const response = await fetchCreate(endpoint, {
        method: selectedItem?._id ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      if (response) {
        onSelect(response);
        onClose();
      }
    } catch (error) {
      console.error('Failed to save stock item:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEditing = (item: Product) => {
    setSelectedItem(item);
    setName(item.name);
    setDescription(item.description || '');
    setUnit(item.unit || '');
    setCategory(item.category || '');
    setImage(item.icon || null);
    setIsEditing(true);
  };

  const startCreating = () => {
    setSelectedItem(null);
    setName(searchQuery);
    setDescription('');
    setUnit('');
    setCategory('');
    setImage(null);
    setIsEditing(true);
  };

  const renderItem = ({ item }: { item: Product }) => (
    <View className="flex-row items-center bg-card rounded-lg mb-2 p-4">
      <View className="flex-1">
        <Text className="font-medium text-foreground">{item.name}</Text>
      </View>
      <View className="flex-row space-x-2">
        <Button
          variant="ghost"
          size="sm"
          onPress={() => startEditing(item)}
        >
          <Ionicons name="create-outline" size={20} color="#666" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onPress={() => {
            onSelect(item);
            onClose();
          }}
        >
          <Ionicons name="checkmark-circle-outline" size={20} color="#666" />
        </Button>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-background">
        <SafeAreaView className="flex-1">
          <View className="flex-row items-center border-b border-border px-4 py-2">
            <Button
              variant="ghost"
              className="mr-2 p-2"
              onPress={() => {
                if (isEditing) {
                  setIsEditing(false);
                  setSelectedItem(null);
                } else {
                  onClose();
                }
              }}
            >
              <Ionicons name="arrow-back" size={24} color="#666" />
            </Button>
            {!isEditing && (
              <View className="flex-1 bg-muted rounded-full">
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoFocus
                  returnKeyType="search"
                  onSubmitEditing={searchProducts}
                  className="px-4 py-2"
                />
              </View>
            )}
          </View>

          {isEditing ? (
            <ScrollView className="flex-1 p-4">
              <View className="space-y-4">
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

                <Button
                  onPress={handleSubmit}
                  disabled={isSubmitting || !name.trim()}
                  className="w-full mt-4"
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text className="text-white">Save</Text>
                  )}
                </Button>
              </View>
            </ScrollView>
          ) : (
            <>
              {loading ? (
                <View className="flex-1 justify-center items-center">
                  <ActivityIndicator size="large" />
                </View>
              ) : error ? (
                <View className="flex-1 justify-center items-center p-4">
                  <Text className="text-red-500">{error.message}</Text>
                </View>
              ) : (
                <FlatList
                  data={data?.stockItems || []}
                  renderItem={renderItem}
                  keyExtractor={item => item._id}
                  contentContainerStyle={{ padding: 16 }}
                  ListEmptyComponent={
                    <View className="p-4 items-center">
                      <Text className="text-muted-foreground mb-4">
                        {searchQuery ? 'No products found' : 'Type to search products'}
                      </Text>
                      {searchQuery && (
                        <Button
                          onPress={startCreating}
                          className="w-full"
                        >
                          <Text className="text-white">Create New Item</Text>
                        </Button>
                      )}
                    </View>
                  }
                />
              )}
            </>
          )}

          {Platform.OS === 'ios' && !isEditing && (
            <SafeAreaView className="bg-background">
              <View className="p-4 border-t border-border">
                <Button onPress={onClose} variant="secondary" className="w-full">
                  <Text>Cancel</Text>
                </Button>
              </View>
            </SafeAreaView>
          )}
        </SafeAreaView>
      </View>
    </Modal>
  );
} 