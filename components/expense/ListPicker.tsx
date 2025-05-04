import React, { useState, useMemo } from 'react';
import { View, TouchableOpacity, FlatList } from 'react-native';
import { Text } from '~/components/ui/text';
import { Input } from '~/components/ui/input';
import Modal from 'react-native-modal';
import { Button } from '~/components/ui/button';

export interface ListPickerItem {
  label: string;
  value: string;
}

interface ListPickerProps {
  items: ListPickerItem[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  visible: boolean;
  onClose: () => void;
}

export function ListPicker({ items, value, onChange, placeholder = 'Select Item', visible, onClose }: ListPickerProps) {
  const [search, setSearch] = useState('');

  // Filter and sort items alphabetically
  const filteredItems = useMemo(() => {
    return items
      .filter(item => item.label.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [items, search]);

  return (
    <Modal isVisible={visible} onBackdropPress={onClose}>
      <View className="bg-background p-4 rounded-lg max-h-[80vh] w-full">
        <Text className="text-lg font-bold mb-2 text-foreground">{placeholder}</Text>
        <Input
          value={search}
          onChangeText={setSearch}
          placeholder="Search..."
          className="mb-2"
        />
        <FlatList
          data={filteredItems.slice(0, 8)}
          keyExtractor={item => item.value}
          renderItem={({ item }) => (
            <TouchableOpacity
              className={`p-3 rounded-md mb-1 ${value === item.value ? 'bg-primary' : 'bg-muted'}`}
              onPress={() => {
                onChange(item.value);
                onClose();
              }}
            >
              <Text className={`text-base ${value === item.value ? 'text-primary-foreground' : 'text-foreground'}`}>{item.label}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text className="text-muted-foreground">No items found.</Text>}
        />
        <Button className="mt-2" onPress={onClose} variant="outline">
          <Text className="text-foreground">Close</Text>
        </Button>
      </View>
    </Modal>
  );
} 