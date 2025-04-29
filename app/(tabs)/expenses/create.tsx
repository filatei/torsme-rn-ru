import { View, ScrollView, ActivityIndicator } from 'react-native';
import { Text } from '~/components/ui/text';
import { Input } from '~/components/ui/input';
import { Button } from '~/components/ui/button';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useFetch } from '~/hook/useFetch';
import { getApiUrl } from '~/utils/config';
import { ProductSearchModal } from '~/components/product-search-modal';
import { Card } from '~/components/ui/card';

interface Product {
  _id: string;
  name: string;
  description?: string;
  unit?: string;
  category?: string;
}

interface ExpenseProduct extends Product {
  qty: number;
  price: number;
  amount: number;
}

export default function CreateExpense() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [vendor, setVendor] = useState('');
  const [products, setProducts] = useState<ExpenseProduct[]>([]);
  const [isSearchModalVisible, setIsSearchModalVisible] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [qty, setQty] = useState('1');
  const [price, setPrice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { fetch } = useFetch(getApiUrl());

  const handleProductSelect = (product: Product) => {
    setCurrentProduct(product);
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
          vendor: { name: vendor },
          products: products.map(({ _id, name, qty, price, amount }) => ({
            _id,
            name,
            qty,
            price,
            amount,
          })),
          txn_amount: getTotalAmount(),
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

  return (
    <ScrollView className="flex-1 bg-background p-4">
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
          <Text className="text-muted-foreground mb-2">Vendor</Text>
          <Input
            value={vendor}
            onChangeText={setVendor}
            placeholder="Enter vendor name"
          />
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
                  onPress={() => setIsSearchModalVisible(true)}
                  variant="outline"
                  className="w-full"
                >
                  <Text>{currentProduct ? currentProduct.name : 'Select Product'}</Text>
                </Button>
              </View>
              <Input
                value={qty}
                onChangeText={setQty}
                placeholder="Qty"
                keyboardType="numeric"
                className="w-20"
              />
              <Input
                value={price}
                onChangeText={setPrice}
                placeholder="Price"
                keyboardType="numeric"
                className="w-24"
              />
            </View>
            <Button
              onPress={addProductLine}
              disabled={!currentProduct || !qty || !price}
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
          onPress={handleSubmit}
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

      <ProductSearchModal
        visible={isSearchModalVisible}
        onClose={() => setIsSearchModalVisible(false)}
        onSelect={handleProductSelect}
      />
    </ScrollView>
  );
} 