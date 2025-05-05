import { Platform } from 'react-native';

export function buildImageFormData({
  imageFile,
  imageUri,
  fields = {},
  fieldName = 'image',
}: {
  imageFile?: File;
  imageUri?: string;
  fields?: Record<string, any>;
  fieldName?: string;
}) {
  const formData = new FormData();

  // Add all fields
  Object.entries(fields).forEach(([key, value]) => {
    formData.append(key, value);
  });

  if (Platform.OS === 'web' && imageFile) {
    formData.append(fieldName, imageFile);
  } else if (imageUri) {
    formData.append(fieldName, {
      uri: imageUri,
      name: 'photo.jpg',
      type: 'image/jpeg',
    } as any);
  }

  return formData;
} 