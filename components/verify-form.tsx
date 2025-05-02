import { View } from 'react-native';
import { Input } from '~/components/ui/input';
import { Button } from '~/components/ui/button';
import { Text } from '~/components/ui/text';
import { useState } from 'react';
import { useFetch } from '~/hook/useFetch';
import { getApiUrl } from '~/utils/config';
import { router, useLocalSearchParams } from 'expo-router';

interface VerifyResponse {
  message: string;
  otp: string;
}

export function VerifyForm() {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { fetch } = useFetch(getApiUrl());
  const { email, token, otpfromserver   } = useLocalSearchParams<{ email: string; token: string; otpfromserver: string;   }>();

  const handleVerify = async () => {
    try {
      setError(null);

      if (!otp || otp.length !== 4) {
        setError('Please enter a valid 4-digit OTP');
        return;
      }

      const response = await fetch('/users/verify', {
        method: 'POST',
        body: JSON.stringify({ token, otp }),
      }) as VerifyResponse;
       console.log(response, 'response');

      if (response.message === 'Confirmation successful') {
        router.replace('/(auth)/login');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    }
  };

  return (
    <View className="flex-1 p-4">
      <Text className="text-2xl font-bold mb-6 text-center">Verify Email</Text>
      
      <Text className="text-center mb-4 mt-8">
        Enter the 4-digit OTP shown below
      </Text>
      <View className="flex-row justify-center items-center">
        <Text className="text-center mb-4">
          OTP: {otpfromserver} 
        </Text>
       
      </View>
     

      {error && (
        <Text className="text-red-500 mb-4 text-center">{error}</Text>
      )}

      <Input
        placeholder="Enter OTP"
        value={otp}
        onChangeText={setOtp}
        keyboardType="number-pad"
        maxLength={4}
        className="mb-6"
      />

      <Button onPress={handleVerify}>
        <Text className="text-white">Verify</Text>
      </Button>

      <Button
        variant="ghost"
        onPress={() => router.replace('/signup')}
        className="mt-4"
      >
        <Text>Back to Sign Up</Text>
      </Button>
    </View>
  );
} 