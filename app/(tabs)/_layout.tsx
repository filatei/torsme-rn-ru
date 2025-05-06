import { Tabs, Slot, useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import React from 'react';

function WebDrawer() {
  const router = useRouter();
  const pathname = usePathname();
  const menu = [
    { name: 'Home', route: '/', icon: 'home-outline' },
    { name: 'Expenses', route: '/expenses', icon: 'wallet-outline' },
    { name: 'Sales', route: '/sales', icon: 'cart-outline' },
    { name: 'Fintech', route: '/fintech', icon: 'card-outline' },
    { name: 'Profile', route: '/profile', icon: 'person-outline' },
  ];
  return (
    <div className="fixed top-0 left-0 h-full w-56 bg-background border-r border-border flex flex-col z-40">
      <div className="p-6 text-xl font-bold text-foreground border-b border-border">Menu</div>
      <nav className="flex-1 flex flex-col gap-2 p-4">
        {menu.map(item => (
          <button
            key={item.route}
            onClick={() => router.push(item.route as any)}
            className={`flex items-center gap-3 px-4 py-2 rounded-lg text-left transition-colors ${pathname === item.route ? 'bg-primary text-white' : 'hover:bg-muted text-foreground'}`}
            style={{ fontWeight: pathname === item.route ? 'bold' : 'normal' }}
          >
            <Ionicons name={item.icon as any} size={22} color={pathname === item.route ? '#fff' : '#2563eb'} />
            <span>{item.name}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

export default function TabLayout() {
  if (Platform.OS === 'web') {
    return (
      <div className="flex flex-row min-h-screen">
        <WebDrawer />
        <div className="flex-1 ml-56 bg-background">
          <Slot />
        </div>
      </div>
    );
  }
  // Native: show bottom tabs
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E5EA',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          title: 'Expenses',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="wallet-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="sales"
        options={{
          title: 'Sales',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cart-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="fintech"
        options={{
          title: 'Fintech',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="card-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}