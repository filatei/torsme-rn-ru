import { View } from 'react-native';
import { Input } from '~/components/ui/input';
import { Button } from '~/components/ui/button';
import { Text } from '~/components/ui/text';
import { useState } from 'react';
import { useAuth } from '~/context/auth-context';
import { router } from 'expo-router';

export function LoginForm() {
  const [email, setEmail] = useState('filatei@torama.ng');
  const [password, setPassword] = useState('f12345');
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();

  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleLogin = async () => {
    try {
      setError(null);

      if (!email || !password) {
        setError('All fields are required');
        return;
      }

      if (!validateEmail(email)) {
        setError('Please enter a valid email address');
        return;
      }

      await login(email, password);
      router.replace('/(tabs)/expenses');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  };

  return (
    <View className="flex-1 p-4">
      <Text className="text-2xl font-bold mb-6 text-center">Login</Text>
      
      {error && (
        <Text className="text-red-500 mb-4 text-center">{error}</Text>
      )}

      <Input
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        className="mb-4"
      />

      <Input
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        className="mb-6"
      />

      <Button
        onPress={handleLogin}
        className="w-full bg-primary"
      >
        <Text className="text-primary-foreground">Login</Text>
      </Button>

      <Button
        variant="ghost"
        onPress={() => router.replace('/(auth)/signup')}
        className="mt-4"
      >
        <Text>Don't have an account? Sign up</Text>
      </Button>
    </View>
  );
} 