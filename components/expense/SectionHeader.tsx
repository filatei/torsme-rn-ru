import React from 'react';
import { View } from 'react-native';
import { Text } from '~/components/ui/text';

interface SectionHeaderProps {
  title: string;
}

export function SectionHeader({ title }: SectionHeaderProps) {
  return (
    <View className="py-2 px-1">
      <Text className="text-lg font-bold text-foreground mb-1">{title}</Text>
    </View>
  );
} 