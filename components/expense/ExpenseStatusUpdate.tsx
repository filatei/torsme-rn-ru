import { View } from 'react-native';
import { Text } from '~/components/ui/text';
import { Button } from '~/components/ui/button';

type ExpenseStatus = 'DRAFT' | 'VALIDATED' | 'REVIEWED' | 'APPROVED' | 'PAID' | 'PART-PAY';

interface ExpenseStatusUpdateProps {
  nextStatuses: ExpenseStatus[];
  isUpdating: boolean;
  onUpdateStatus: (status: ExpenseStatus) => void;
}

export function ExpenseStatusUpdate({ nextStatuses, isUpdating, onUpdateStatus }: ExpenseStatusUpdateProps) {
  if (nextStatuses.length === 0) return null;

  return (
    <View className="mb-4">
      <Text className="text-muted-foreground mb-2">Update Status</Text>
      <View className="flex-row flex-wrap gap-2">
        {nextStatuses.map((status) => (
          <Button
            key={status}
            onPress={() => onUpdateStatus(status)}
            disabled={isUpdating}
            className="min-w-[120px]"
          >
            <Text className="text-white">Mark as {status}</Text>
          </Button>
        ))}
      </View>
    </View>
  );
} 