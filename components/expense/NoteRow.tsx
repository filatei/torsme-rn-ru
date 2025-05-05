import React from 'react';
import { View, Image } from 'react-native';
import { Text } from '~/components/ui/text';

interface NoteRowProps {
  item: {
    text: string;
    author: string;
    date: string;
    image?: string;
    [key: string]: any;
  };
}

export function NoteRow({ item }: NoteRowProps) {
  return (
    <View className="flex-row items-start bg-card rounded-lg mb-2 p-3 border border-border">
      <View className="flex-1">
        <Text className="font-medium text-foreground mb-1">{item.text}</Text>
        <Text className="text-xs text-muted-foreground mb-1">By {item.author} on {new Date(item.date).toLocaleDateString()}</Text>
        {item.image && (
          <Image source={{ uri: item.image }} className="w-16 h-16 rounded-md mt-1" />
        )}
      </View>
    </View>
  );
} 