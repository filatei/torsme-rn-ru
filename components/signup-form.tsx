import { View } from 'react-native';
import { Input } from '~/components/ui/input';
import { Button } from '~/components/ui/button';
import { Text } from '~/components/ui/text';
import { useState } from 'react';
import { useFetch } from '~/hook/useFetch';
import { getApiUrl } from '~/utils/config';
import { router } from 'expo-router';

interface SignupResponse {
  message: string;
  result: {
    verify: string;
    otp: string;
  };
  otp: string;
}

export function SignupForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { fetch } = useFetch(getApiUrl());

  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleSignup = async () => {
    try {
      setError(null);

      if (!name || !email || !password || !phone) {
        setError('All fields are required');
        return;
      }

      if (!validateEmail(email)) {
        setError('Please enter a valid email address');
        return;
      }

      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }

      const response = await fetch('/users/signup', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, phone }),
      }) as SignupResponse;

      console.log(response, 'response');
      if (response.message === 'User created!') {
        router.replace({
          pathname: '/(auth)/verify',
          params: { email, token: response.result.verify,otpfromserver: response.otp }
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed');
    }
  };

  return (
    <View className="flex-1 p-4">
      <Text className="text-2xl font-bold mb-6 text-center">Create Account</Text>
      
      {error && (
        <Text className="text-red-500 mb-4 text-center">{error}</Text>
      )}

      <Input
        placeholder="Full Name"
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
        className="mb-4"
      />

      <Input
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        className="mb-4"
      />

      <Input
        placeholder="Phone Number"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        className="mb-4"
      />

      <Input
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        className="mb-6"
      />

      <Button onPress={handleSignup}>
        <Text className="text-white">Sign Up</Text>
      </Button>

      <Button
        variant="ghost"
        onPress={() => router.replace('/login')}
        className="mt-4"
      >
        <Text>Already have an account? Login</Text>
      </Button>
    </View>
  );
} 