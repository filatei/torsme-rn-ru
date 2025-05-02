import { View, Modal, FlatList, ActivityIndicator, Image, SafeAreaView, Platform, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Text } from '~/components/ui/text';
import { Input } from '~/components/ui/input';
import { Button } from '~/components/ui/button';
import { useState, useEffect } from 'react';
import { useFetch } from '~/hook/useFetch';
import { getApiUrl } from '~/utils/config';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React from 'react';

interface Entity {
  _id: string;
  id?: string;
  name: string;
  description?: string;
  icon?: string;
  [key: string]: any; // Allow additional fields
}

interface EntitySearchModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (entity: Entity) => void;
  entityType: 'product' | 'vendor';
  searchEndpoint: string;
  createEndpoint: string;
  updateEndpoint: string;
  requiredFields: string[];
  additionalFields?: string[];
}

export function EntitySearchModal({ 
  visible, 
  onClose, 
  onSelect, 
  entityType,
  searchEndpoint,
  createEndpoint,
  updateEndpoint,
  requiredFields,
  additionalFields = []
}: EntitySearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Entity | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [image, setImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data, loading, error, fetch } = useFetch<{ stockItems?: Entity[], contacts?: Entity[] }>(getApiUrl());
  const { fetch: fetchCreate } = useFetch<{ item?: Entity } & Entity>(getApiUrl());

  const searchEntities = async () => {
    if (searchQuery.trim().length < 1) return;
    await fetch(`${searchEndpoint}?searchTerm=${encodeURIComponent(searchQuery)}`);
  };

  useEffect(() => {
    if (visible && searchQuery.length > 0) {
      const debounce = setTimeout(() => {
        searchEntities();
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
    // Validate required fields
    const missingFields = requiredFields.filter(field => !formData[field]?.trim());
    if (missingFields.length > 0) {
      Alert.alert(
        'Missing Fields',
        `Please fill in: ${missingFields.join(', ')}`,
        [{ text: 'OK' }]
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const formDataObj = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value) formDataObj.append(key, value.trim());
      });

      if (image && !image.startsWith('http')) {
        const fileName = `${entityType}_${Date.now()}.jpg`;
        formDataObj.append('icon', {
          uri: image,
          type: 'image/jpeg',
          name: fileName,
        } as any);
      }

      const endpoint = selectedItem?._id 
        ? `${updateEndpoint}/${selectedItem._id}`
        : createEndpoint;

      const response = await fetchCreate(endpoint, {
        method: selectedItem?._id ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        body: formDataObj,
      });

      if (response) {
        const entity = response.item || response;
        onSelect(entity);
        onClose();
      }
    } catch (error) {
      console.error(`Failed to save ${entityType}:`, error);
      Alert.alert(
        'Error',
        `Failed to save ${entityType}. Please try again.`,
        [{ text: 'OK' }]
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEditing = (item: Entity) => {
    setSelectedItem(item);
    const initialData: Record<string, string> = {};
    [...requiredFields, ...additionalFields].forEach(field => {
      initialData[field] = item[field] || '';
    });
    setFormData(initialData);
    setImage(item.icon || null);
    setIsEditing(true);
  };

  const startCreating = () => {
    setSelectedItem(null);
    const initialData: Record<string, string> = {};
    [...requiredFields, ...additionalFields].forEach(field => {
      initialData[field] = field === 'name' ? searchQuery : '';
    });
    setFormData(initialData);
    setImage(null);
    setIsEditing(true);
  };

  const getEntityData = () => {
    if (!data) return [];
    return entityType === 'product' ? data.stockItems || [] : data.contacts || [];
  };

  const renderItem = ({ item }: { item: Entity }) => (
    <View className="flex-row items-center bg-card rounded-lg mb-2 p-4">
      <View className="flex-1">
        <Text className="font-medium text-foreground">{item.name}</Text>
        {item.description && item.description !== 'null' && (
          <Text className="text-sm text-muted-foreground">{item.description}</Text>
        )}
        {entityType === 'product' && item.unit && item.unit !== 'undefined' && (
          <Text className="text-sm text-muted-foreground">Unit: {item.unit}</Text>
        )}
        {entityType === 'vendor' && (
          <>
            {item.phone && item.phone !== 'null' && (
              <Text className="text-sm text-muted-foreground">Phone: {item.phone}</Text>
            )}
            {item.email && item.email !== 'null' && (
              <Text className="text-sm text-muted-foreground">Email: {item.email}</Text>
            )}
          </>
        )}
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
                  placeholder={`Search ${entityType}s...`}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoFocus
                  returnKeyType="search"
                  onSubmitEditing={searchEntities}
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

                {[...requiredFields, ...additionalFields].map(field => (
                  <View key={field}>
                    <Text className="text-sm text-muted-foreground mb-1">
                      {field.charAt(0).toUpperCase() + field.slice(1)}
                      {requiredFields.includes(field) ? ' *' : ''}
                    </Text>
                    <Input
                      value={formData[field] || ''}
                      onChangeText={(value) => setFormData(prev => ({ ...prev, [field]: value }))}
                      placeholder={`Enter ${field}`}
                      multiline={field === 'description'}
                      numberOfLines={field === 'description' ? 3 : 1}
                      className={field === 'description' ? 'min-h-[80px] py-2' : ''}
                    />
                  </View>
                ))}

                <Button
                  onPress={handleSubmit}
                  disabled={isSubmitting || requiredFields.some(field => !formData[field]?.trim())}
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
                  data={getEntityData()}
                  renderItem={renderItem}
                  keyExtractor={item => item._id}
                  contentContainerStyle={{ padding: 16 }}
                  ListEmptyComponent={
                    <View className="p-4 items-center">
                      <Text className="text-muted-foreground mb-4">
                        {searchQuery ? `No ${entityType}s found` : `Type to search ${entityType}s`}
                      </Text>
                      {searchQuery && (
                        <Button
                          onPress={startCreating}
                          className="w-full"
                        >
                          <Text className="text-white">Create New {entityType.charAt(0).toUpperCase() + entityType.slice(1)}</Text>
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