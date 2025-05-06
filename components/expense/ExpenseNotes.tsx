import React from 'react';
import { View, Image, Platform, Alert, TouchableOpacity } from 'react-native';
import { Text } from '~/components/ui/text';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useFetch } from '~/hook/useFetch';
import { getApiUrl } from '~/utils/config';
import { Ionicons } from '@expo/vector-icons';
import { ConfirmDialog } from '~/components/ConfirmDialog';
import { AnimatedModal } from '~/components/ui/animated-modal';

interface Note {
  text: string;
  author: string;
  date: string;
  image?: string;
}

interface ExpenseNotesProps {
  notes: Note[];
  onAddNote: (text: string, image: string | null, file?: File | null) => Promise<void>;
  isUpdating: boolean;
  userName: string;
  onChanged?: () => void;
}

export function ExpenseNotes({ notes, onAddNote, isUpdating, userName, onChanged }: ExpenseNotesProps) {
  const [newNote, setNewNote] = useState('');
  const [noteImage, setNoteImage] = useState<string | null>(null);
  const [noteImageFile, setNoteImageFile] = useState<File | null>(null);
  const { id } = useLocalSearchParams();
  const { fetch } = useFetch(getApiUrl());
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);
  const [deleteDialogIdx, setDeleteDialogIdx] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const pickNoteImage = async () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e: Event) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          if (file.size > 800 * 1024) {
            alert('Image too large. Please select an image smaller than 800KB.');
            return;
          }
          setNoteImage(URL.createObjectURL(file));
          setNoteImageFile(file);
        }
      };
      input.click();
    } else {
      try {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });

        if (!result.canceled && result.assets[0].uri) {
          const fileInfo = await FileSystem.getInfoAsync(result.assets[0].uri);
          if (fileInfo.exists && fileInfo.size && fileInfo.size > 800 * 1024) {
            Alert.alert('Image too large', 'Please select an image smaller than 800KB.');
            return;
          }
          setNoteImage(result.assets[0].uri);
        }
      } catch (e) {
        console.error('Error picking image:', e);
        Alert.alert('Error', 'Failed to pick image. Please try again.');
      }
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    
    try {
      if (Platform.OS === 'web' && noteImageFile) {
        const formData = new FormData();
        formData.append('text', newNote);
        formData.append('author', userName);
        formData.append('date', new Date().toISOString());
        formData.append('image', noteImageFile);
        
        await fetch(`/expense/notes/${id}`, {
          method: 'PUT',
          body: formData,
        });
      } else if (Platform.OS !== 'web' && noteImage) {
        const formData = new FormData();
        formData.append('text', newNote);
        formData.append('author', userName);
        formData.append('date', new Date().toISOString());
        formData.append('image', {
          uri: noteImage,
          type: 'image/jpeg',
          name: `note_${Date.now()}.jpg`,
        } as any);
        
        await fetch(`/expense/notes/${id}`, {
          method: 'PUT',
          body: formData,
        });
      } else {
        await onAddNote(newNote, null);
      }
      
      setNewNote('');
      setNoteImage(null);
      setNoteImageFile(null);
      setIsVisible(false);
      
      if (onChanged) onChanged();
    } catch (err) {
      console.error('Failed to add note:', err);
      Alert.alert('Error', 'Failed to add note. Please try again.');
    }
  };

  const handleDeleteNote = async (noteIdx: number) => {
    setDeletingIndex(noteIdx);
    try {
      const res = await fetch(`/expense/notes/${id}/${noteIdx}`, { method: 'DELETE' });
      // No local notes state, rely on parent to refresh notes via onChanged
    } catch (err) {
      Alert.alert('Error', 'Failed to delete note.');
    } finally {
      setDeletingIndex(null);
      setDeleteDialogIdx(null);
      if (onChanged) onChanged();
    }
  };

  const handleCloseModal = () => {
    setNewNote('');
    setNoteImage(null);
    setNoteImageFile(null);
    setIsVisible(false);
  };

  return (
    <>
      <View className="mb-4">
        <Text className="text-muted-foreground mb-2">Notes</Text>
        {notes.map((note, idx) => (
          <View key={idx} className="bg-muted p-3 rounded-lg mb-2 flex-row justify-between items-start">
            <View style={{ flex: 1 }}>
              <Text className="font-medium">{note.text}</Text>
              <Text className="text-sm text-muted-foreground mt-1">
                By {note.author} on {new Date(note.date).toLocaleDateString()}
              </Text>
              {note.image && (
                <Image 
                  source={{ uri: note.image }} 
                  className="w-40 h-40 mt-2 rounded-lg"
                />
              )}
            </View>
            <TouchableOpacity
              onPress={() => setDeleteDialogIdx(idx)}
              disabled={deletingIndex === idx}
              style={{ marginLeft: 8 }}
            >
              <Ionicons name="trash" size={20} color="#e11d48" />
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <Button
        variant="outline"
        onPress={() => setIsVisible(true)}
        className="mt-4"
      >
        <Text>Add Note</Text>
      </Button>

      <AnimatedModal isVisible={isVisible} onClose={handleCloseModal}>
        <View>
          <Text className="text-lg font-bold mb-4 text-foreground">Add Note</Text>
          <View className="space-y-4">
            <Input
              value={newNote}
              onChangeText={setNewNote}
              placeholder="Enter your note"
              multiline
              numberOfLines={4}
              className="h-24"
            />
            {noteImage && (
              <View className="items-center">
                <Image
                  source={{ uri: noteImage }}
                  className="w-32 h-32 rounded-lg"
                />
                <Button
                  variant="ghost"
                  onPress={() => {
                    setNoteImage(null);
                    setNoteImageFile(null);
                  }}
                  className="mt-2"
                >
                  <Text className="text-destructive">Remove Image</Text>
                </Button>
              </View>
            )}
            <View className="flex-row justify-between">
              <Button
                variant="outline"
                onPress={pickNoteImage}
                disabled={!!noteImage}
              >
                <Text>Add Image</Text>
              </Button>
              <View className="flex-row space-x-2">
                <Button
                  variant="outline"
                  onPress={handleCloseModal}
                >
                  <Text>Cancel</Text>
                </Button>
                <Button
                  className="bg-primary"
                  onPress={handleAddNote}
                  disabled={isUpdating || !newNote.trim()}
                >
                  <Text className="text-white">
                    {isUpdating ? 'Adding...' : 'Add Note'}
                  </Text>
                </Button>
              </View>
            </View>
          </View>
        </View>
      </AnimatedModal>
      <ConfirmDialog
        visible={deleteDialogIdx !== null}
        title="Delete Note"
        message="Are you sure you want to delete this note?"
        onConfirm={() => deleteDialogIdx !== null && handleDeleteNote(deleteDialogIdx)}
        onCancel={() => setDeleteDialogIdx(null)}
        isLoading={deletingIndex !== null}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </>
  );
} 