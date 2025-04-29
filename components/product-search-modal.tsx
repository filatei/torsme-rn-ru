import { View, Modal, FlatList, ActivityIndicator, Image } from 'react-native';
import { Text } from '~/components/ui/text';
import { Input } from '~/components/ui/input';
import { Button } from '~/components/ui/button';
import { useState, useEffect } from 'react';
import { useFetch } from '~/hook/useFetch';
import { getApiUrl } from '~/utils/config';

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
  const { data, loading, error, fetch } = useFetch<{ expenseitem: Product[] }>(getApiUrl());

  const searchProducts = async () => {
    if (searchQuery.trim().length < 1) return;
    await fetch(`/expenseitem/getByText?searchTerm=${encodeURIComponent(searchQuery)}`);
  };

  useEffect(() => {
    if (visible && searchQuery.length > 0) {
      const debounce = setTimeout(() => {
        searchProducts();
      }, 300);
      return () => clearTimeout(debounce);
    }
  }, [searchQuery, visible]);

  const renderItem = ({ item }: { item: Product }) => (
    <Button
      variant="ghost"
      className="w-full p-4 justify-start items-center flex-row"
      onPress={() => {
        onSelect(item);
        onClose();
      }}
    >
      {item.icon && (
        <Image 
          source={{ uri: item.icon }}
          className="w-12 h-12 rounded-lg mr-3"
        />
      )}
      <View className="flex-1">
        <Text className="font-medium text-foreground">{item.name}</Text>
        {item.description && (
          <Text className="text-sm text-muted-foreground">{item.description}</Text>
        )}
        {(item.category || item.unit) && (
          <Text className="text-xs text-muted-foreground">
            {[item.category, item.unit].filter(Boolean).join(' • ')}
          </Text>
        )}
      </View>
    </Button>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-background/95">
        <View className="p-4 border-b border-border">
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
            returnKeyType="search"
            onSubmitEditing={searchProducts}
          />
        </View>

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
            data={data?.expenseitem || []}
            renderItem={renderItem}
            keyExtractor={item => item._id}
            contentContainerStyle={{ padding: 16 }}
            ListEmptyComponent={
              <View className="p-4 items-center">
                <Text className="text-muted-foreground">
                  {searchQuery ? 'No products found' : 'Type to search products'}
                </Text>
              </View>
            }
          />
        )}

        <View className="p-4 border-t border-border">
          <Button onPress={onClose} variant="secondary" className="w-full">
            <Text>Cancel</Text>
          </Button>
        </View>
      </View>
    </Modal>
  );
} 