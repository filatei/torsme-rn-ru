import { View, ScrollView, ActivityIndicator, NativeScrollEvent, NativeSyntheticEvent, TouchableOpacity } from 'react-native';
import { Text } from '~/components/ui/text';
import { Input } from '~/components/ui/input';
import { Button } from '~/components/ui/button';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { useFetch } from '~/hook/useFetch';
import { getApiUrl } from '~/utils/config';
import { EntitySearchModal } from '~/components/entity-search-modal';
import { Card } from '~/components/ui/card';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import Modal from 'react-native-modal';

interface Product {
  _id: string;
  name: string;
  description?: string;
  unit?: string;
  category?: string;
}

interface Vendor {
  _id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipcode?: string;
  };
}

interface ExpenseProduct extends Product {
  qty: number;
  price: number;
  amount: number;
}

export default function CreateExpense() {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [title, setTitle] = useState('');
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [products, setProducts] = useState<ExpenseProduct[]>([]);
  const [isProductModalVisible, setIsProductModalVisible] = useState(false);
  const [isVendorModalVisible, setIsVendorModalVisible] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [qty, setQty] = useState('1');
  const [price, setPrice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [date, setDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [sites, setSites] = useState<{ name: string }[]>([]);
  const [site, setSite] = useState('');
  const [type, setType] = useState('Daily Imprest');
  const [category, setCategory] = useState('General');
  const [expenseAccount, setExpenseAccount] = useState('Operations');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [lastScrollPosition, setLastScrollPosition] = useState(0);
  const [isFirstProductSelect, setIsFirstProductSelect] = useState(true);

  const { fetch } = useFetch(getApiUrl());

  useEffect(() => {
    // Fetch sites from backend
    (async () => {
      try {
        const res = await fetch('/sites');
        if (res && res.site) {
          setSites(res.site.map((s: any) => ({ name: s.name })));
        }
      } catch (e) {
        setSites([]);
      }
    })();
  }, []);

  const handleProductSelect = (product: Product) => {
    setCurrentProduct(product);
    
    // Restore scroll position after modal closes
    setTimeout(() => {
      if (isFirstProductSelect) {
        // For first product selection, scroll to products section
        const productsSection = 600; // Approximate position of products section
        scrollViewRef.current?.scrollTo({ y: productsSection, animated: false });
        setIsFirstProductSelect(false);
      } else {
        // For subsequent selections, restore last position
        scrollViewRef.current?.scrollTo({ y: lastScrollPosition, animated: false });
      }
    }, 100);
  };

  const handleVendorSelect = (selectedVendor: Vendor) => {
    setVendor(selectedVendor);
    
    // Restore scroll position after modal closes
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: lastScrollPosition, animated: false });
    }, 100);
  };

  const handleQtyChange = (value: string) => {
    // Remove any non-numeric characters
    const numericValue = value.replace(/[^0-9]/g, '');
    setQty(numericValue);
  };

  const handlePriceChange = (value: string) => {
    // Allow decimal points for price, but ensure proper numeric format
    const numericValue = value.replace(/[^0-9.]/g, '');
    // Ensure only one decimal point
    const parts = numericValue.split('.');
    if (parts.length > 2) {
      return;
    }
    // Ensure no more than 2 decimal places
    if (parts[1] && parts[1].length > 2) {
      return;
    }
    setPrice(numericValue);
  };

  const addProductLine = () => {
    if (!currentProduct || !qty || !price) return;

    const quantity = Number(qty);
    const unitPrice = Number(price);
    const amount = quantity * unitPrice;

    setProducts(prev => [...prev, {
      ...currentProduct,
      qty: quantity,
      price: unitPrice,
      amount,
    }]);

    // Reset form
    setCurrentProduct(null);
    setQty('1');
    setPrice('');
  };

  const removeProduct = (index: number) => {
    setProducts(prev => prev.filter((_, i) => i !== index));
  };

  const getTotalAmount = () => {
    return products.reduce((sum, product) => sum + product.amount, 0);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) setDate(selectedDate);
  };

  const handleSubmit = async () => {
    if (!title || !vendor || products.length === 0) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/expense', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          vendor: vendor._id,
          products: products.map(({ _id, name, qty, price, amount }) => ({
            _id,
            name,
            qty,
            price,
            amount,
          })),
          txn_amount: getTotalAmount(),
          date: date.toISOString(),
          site,
          type,
          category,
          expenseAccount,
        }),
      });

      if (response) {
        router.push('/expenses');
      }
    } catch (error) {
      console.error('Failed to create expense:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateClick = () => {
    setShowConfirmModal(true);
  };

  const typeOptions = [
    { label: 'Daily Imprest', value: 'Daily Imprest' },
    { label: 'Non Cash', value: 'Non Cash' },
  ];

  return (
    <ScrollView 
      ref={scrollViewRef}
      className="flex-1 bg-background p-4"
      onScroll={(event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const currentPosition = event.nativeEvent.contentOffset.y;
        setScrollPosition(currentPosition);
        // Only update lastScrollPosition if we're not in the process of selecting first product
        if (!isFirstProductSelect) {
          setLastScrollPosition(currentPosition);
        }
      }}
      scrollEventThrottle={16}
    >
      <Card className="p-4 mb-4">
        <Text className="text-lg font-bold mb-4">Create New Expense</Text>

        <View className="mb-4">
          <Text className="text-muted-foreground mb-2">Title</Text>
          <Input
            value={title}
            onChangeText={setTitle}
            placeholder="Enter expense title"
          />
        </View>

        <View className="mb-4">
          <Text className="text-muted-foreground mb-2">Date</Text>
          <Button onPress={() => setShowDatePicker(true)} variant="outline" className="w-full mb-2">
            <Text>{date.toLocaleDateString()}</Text>
          </Button>
          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display="default"
              onChange={handleDateChange}
            />
          )}
        </View>

        <View className="mb-4">
          <Text className="text-muted-foreground mb-2">Site</Text>
          <View className="border border-input rounded-md bg-background">
            <Picker
              selectedValue={site}
              onValueChange={setSite}
            >
              <Picker.Item label="Select Site" value="" />
              {sites.map((s) => (
                <Picker.Item key={s.name} label={s.name} value={s.name} />
              ))}
            </Picker>
          </View>
        </View>

        <View className="mb-4">
          <Text className="text-muted-foreground mb-2">Type</Text>
          <View className="flex-row gap-4 items-center justify-start">
            {typeOptions.map(option => (
              <TouchableOpacity
                key={option.value}
                onPress={() => setType(option.value)}
                style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16 }}
                accessibilityRole="radio"
                accessibilityState={{ selected: type === option.value }}
              >
                <View
                  style={{
                    height: 20,
                    width: 20,
                    borderRadius: 10,
                    borderWidth: 2,
                    borderColor: type === option.value ? '#2563eb' : '#ccc',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 6,
                    backgroundColor: '#fff',
                  }}
                >
                  {type === option.value && (
                    <View
                      style={{
                        height: 10,
                        width: 10,
                        borderRadius: 5,
                        backgroundColor: '#2563eb',
                      }}
                    />
                  )}
                </View>
                <Text style={{ color: type === option.value ? '#2563eb' : '#222', fontWeight: type === option.value ? 'bold' : 'normal' }}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {/* // TODO: Add animation for radio selection in the future */}
        </View>

        <View className="mb-4">
          <Text className="text-muted-foreground mb-2">Category</Text>
          <View className="border border-input rounded-md bg-background">
            <Picker
              selectedValue={category}
              onValueChange={setCategory}
            >
              <Picker.Item label="General" value="General" />
              <Picker.Item label="Maintenance" value="Maintenance" />
              <Picker.Item label="Procurement" value="Procurement" />
              <Picker.Item label="Travel" value="Travel" />
              <Picker.Item label="Other" value="Other" />
            </Picker>
          </View>
        </View>

        <View className="mb-4">
          <Text className="text-muted-foreground mb-2">Expense Account</Text>
          <View className="border border-input rounded-md bg-background">
            <Picker
              selectedValue={expenseAccount}
              onValueChange={setExpenseAccount}
            >
              <Picker.Item label="Operations" value="Operations" />
              <Picker.Item label="Admin" value="Admin" />
              <Picker.Item label="Finance" value="Finance" />
              <Picker.Item label="Other" value="Other" />
            </Picker>
          </View>
        </View>

        <View className="mb-4">
          <Text className="text-muted-foreground mb-2">Vendor</Text>
          <Button
            onPress={() => setIsVendorModalVisible(true)}
            variant="outline"
            className="w-full"
          >
            <Text>{vendor ? vendor.name : 'Select Vendor'}</Text>
          </Button>
        </View>

        <View className="mb-4">
          <Text className="text-muted-foreground mb-2">Products</Text>
          
          {products.map((product, index) => (
            <View key={index} className="flex-row items-center bg-muted p-3 rounded-lg mb-2">
              <View className="flex-1">
                <Text className="font-medium">{product.name}</Text>
                <Text className="text-sm text-muted-foreground">
                  {product.qty} x ₦{product.price.toLocaleString()} = ₦{product.amount.toLocaleString()}
                </Text>
              </View>
              <Button
                variant="destructive"
                size="sm"
                onPress={() => removeProduct(index)}
              >
                <Text className="text-white">Remove</Text>
              </Button>
            </View>
          ))}

          <View className="bg-muted p-3 rounded-lg mb-2">
            <View className="flex-row gap-2 mb-2">
              <View className="flex-1">
                <Button
                  onPress={() => setIsProductModalVisible(true)}
                  variant="outline"
                  className="w-full"
                >
                  <Text>{currentProduct ? currentProduct.name : 'Select Product'}</Text>
                </Button>
              </View>
              <Input
                value={qty}
                onChangeText={handleQtyChange}
                placeholder="Qty"
                keyboardType="numeric"
                className="w-20"
                maxLength={5}
              />
              <Input
                value={price}
                onChangeText={handlePriceChange}
                placeholder="Price"
                keyboardType="decimal-pad"
                className="w-24"
                maxLength={10}
              />
            </View>
            <Button
              onPress={addProductLine}
              disabled={!currentProduct || !qty || !price || isNaN(Number(qty)) || isNaN(Number(price))}
              className="w-full"
            >
              <Text className="text-white">Add Product</Text>
            </Button>
          </View>
        </View>

        <View className="mb-4">
          <Text className="text-muted-foreground">Total Amount</Text>
          <Text className="text-xl font-bold">
            ₦{getTotalAmount().toLocaleString()}
          </Text>
        </View>

        <Button
          onPress={handleCreateClick}
          disabled={isSubmitting || !title || !vendor || products.length === 0}
          className="w-full"
        >
          {isSubmitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white">Create Expense</Text>
          )}
        </Button>
      </Card>

      <EntitySearchModal
        visible={isProductModalVisible}
        onClose={() => {
          setIsProductModalVisible(false);
          // Restore scroll position after modal closes
          setTimeout(() => {
            scrollViewRef.current?.scrollTo({ y: scrollPosition, animated: false });
          }, 100);
        }}
        onSelect={handleProductSelect}
        entityType="product"
        searchEndpoint="/stockitem/getByText"
        createEndpoint="/stockitem"
        updateEndpoint="/stockitem"
        requiredFields={['name']}
        additionalFields={['description', 'unit', 'category']}
      />

      <EntitySearchModal
        visible={isVendorModalVisible}
        onClose={() => {
          setIsVendorModalVisible(false);
          // Restore scroll position after modal closes
          setTimeout(() => {
            scrollViewRef.current?.scrollTo({ y: scrollPosition, animated: false });
          }, 100);
        }}
        onSelect={handleVendorSelect}
        entityType="vendor"
        searchEndpoint="/contact/getByText"
        createEndpoint="/contact"
        updateEndpoint="/contact"
        requiredFields={['name']}
        additionalFields={['phone', 'email', 'address']}
      />

      {/* Confirmation Modal */}
      <Modal 
        isVisible={showConfirmModal} 
        onBackdropPress={() => setShowConfirmModal(false)}
        className="m-0"
      >
        <View className="bg-background p-6 rounded-lg">
          <Text className="text-lg font-bold mb-4 text-foreground">Confirm Expense Details</Text>
          
          <ScrollView className="max-h-[60vh]">
            <View className="space-y-4">
              <View>
                <Text className="text-sm text-muted-foreground">Title</Text>
                <Text className="text-base">{title}</Text>
              </View>

              <View>
                <Text className="text-sm text-muted-foreground">Date</Text>
                <Text className="text-base">{date.toLocaleDateString()}</Text>
              </View>

              <View>
                <Text className="text-sm text-muted-foreground">Vendor</Text>
                <Text className="text-base">{vendor?.name}</Text>
              </View>

              <View>
                <Text className="text-sm text-muted-foreground">Site</Text>
                <Text className="text-base">{site}</Text>
              </View>

              <View>
                <Text className="text-sm text-muted-foreground">Type</Text>
                <Text className="text-base">{type}</Text>
              </View>

              <View>
                <Text className="text-sm text-muted-foreground">Category</Text>
                <Text className="text-base">{category}</Text>
              </View>

              <View>
                <Text className="text-sm text-muted-foreground">Expense Account</Text>
                <Text className="text-base">{expenseAccount}</Text>
              </View>

              <View>
                <Text className="text-sm text-muted-foreground mb-2">Products</Text>
                {products.map((product, index) => (
                  <View key={index} className="bg-muted p-3 rounded-lg mb-2">
                    <Text className="font-medium">{product.name}</Text>
                    <Text className="text-sm text-muted-foreground">
                      {product.qty} x ₦{product.price.toLocaleString()} = ₦{product.amount.toLocaleString()}
                    </Text>
                  </View>
                ))}
              </View>

              <View>
                <Text className="text-sm text-muted-foreground">Total Amount</Text>
                <Text className="text-xl font-bold">
                  ₦{getTotalAmount().toLocaleString()}
                </Text>
              </View>
            </View>
          </ScrollView>

          <View className="flex-row justify-end space-x-2 mt-4">
            <Button 
              variant="outline" 
              onPress={() => setShowConfirmModal(false)}
            >
              <Text>Cancel</Text>
            </Button>
            <Button 
              className="bg-primary" 
              onPress={() => {
                setShowConfirmModal(false);
                handleSubmit();
              }}
              disabled={isSubmitting}
            >
              <Text className="text-white">
                {isSubmitting ? 'Creating...' : 'Confirm & Create'}
              </Text>
            </Button>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
} 