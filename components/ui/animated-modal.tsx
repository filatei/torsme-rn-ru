import { Platform } from 'react-native';
import Modal from 'react-native-modal';
import { View } from 'react-native';
import { cn } from '~/lib/utils';

// Only import ReactDOM on web
let ReactDOM: typeof import('react-dom') | undefined = undefined;
if (typeof window !== 'undefined' && Platform.OS === 'web') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  ReactDOM = require('react-dom');
}

interface AnimatedModalProps {
  isVisible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

export function AnimatedModal({ isVisible, onClose, children, className }: AnimatedModalProps) {
  return (
    <Modal
      isVisible={isVisible}
      onBackdropPress={onClose}
      backdropOpacity={0.5}
      backdropTransitionOutTiming={200}
      hideModalContentWhileAnimating
      useNativeDriver={Platform.OS !== 'web'}
      style={{ margin: 0, justifyContent: 'center', alignItems: 'center' }}
    >
      <View
        className={cn(
          'bg-background rounded-lg p-6 w-[90%] max-w-sm shadow-lg',
          className
        )}
      >
        {children}
      </View>
    </Modal>
  );
} 