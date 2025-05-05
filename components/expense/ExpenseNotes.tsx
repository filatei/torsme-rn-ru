import { View, Image, Platform, Alert, TouchableOpacity } from 'react-native';
import { Text } from '~/components/ui/text';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { useState } from 'react';
import { buildImageFormData } from '~/utils/uploadImage';
import { useLocalSearchParams } from 'expo-router';
import { useFetch } from '~/hook/useFetch';
import { getApiUrl } from '~/utils/config';
import { Ionicons } from '@expo/vector-icons';
import { ConfirmDialog } from '~/components/ConfirmDialog';

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

export function ExpenseNotes({ notes: initialNotes, onAddNote, isUpdating, userName, onChanged }: ExpenseNotesProps) {
  const [notes, setNotes] = useState(initialNotes);
  const [newNote, setNewNote] = useState('');
  const [noteImage, setNoteImage] = useState<string | null>(null); // for preview
  const [noteImageFile, setNoteImageFile] = useState<File | null>(null); // for upload (web)
  const { id } = useLocalSearchParams();
  const { fetch } = useFetch(getApiUrl());
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);
  const [deleteDialogIdx, setDeleteDialogIdx] = useState<number | null>(null);

  const pickNoteImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0].uri) {
      // Check file size using expo-file-system
      try {
        const fileInfo = await FileSystem.getInfoAsync(result.assets[0].uri);
        if (fileInfo.exists && fileInfo.size && fileInfo.size > 800 * 1024) {
          Alert.alert('Image too large', 'Please select an image smaller than 800KB.');
          return;
        }
      } catch (e) {
        // If file info fails, allow image (fail open)
      }
      setNoteImage(result.assets[0].uri);
    }
  };

  const handleWebFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    console.log('File selected:', file);
    if (file) {
      if (file.size > 800 * 1024) {
        alert('Image too large. Please select an image smaller than 800KB.');
        return;
      }
      setNoteImage(URL.createObjectURL(file)); // for preview
      setNoteImageFile(file); // for upload
      console.log('noteImageFile set:', file);
    }
  };

  const handleAddNote = async () => {
    console.log('handleAddNote called', { noteImageFile, noteImage, Platform: Platform.OS });
    if ((Platform.OS === 'web' && noteImageFile) || (Platform.OS !== 'web' && noteImage)) {
      console.log('About to upload note with image', { noteImageFile, noteImage });
      const formData = buildImageFormData({
        imageFile: noteImageFile || undefined,
        imageUri: noteImage || undefined,
        fields: {
          text: newNote,
          author: userName,
          date: new Date().toISOString(),
        },
        fieldName: 'image',
      });
      try {
        console.log(formData, 'formData');
        const noteput = await fetch(`/expense/notes/${id}`, {
          method: 'PUT',
          body: formData,
        });
        console.log(noteput, 'noteput');
      } catch (err) {
        console.error('Error uploading note with image:', err);
      }
    } else {
      console.log('No image file or uri, calling onAddNote fallback');
      await onAddNote(newNote, noteImage);
    }
    setNewNote('');
    setNoteImage(null);
    setNoteImageFile(null);
    if (onChanged) onChanged();
  };

  const handleDeleteNote = async (noteIdx: number) => {
    setDeletingIndex(noteIdx);
    try {
      const res = await fetch(`/expense/notes/${id}/${noteIdx}`, { method: 'DELETE' });
      if (res && res.notes) {
        setNotes(res.notes);
      } else {
        setNotes(prev => prev.filter((_, idx) => idx !== noteIdx));
      }
    } catch (err) {
      alert('Failed to delete note.');
    } finally {
      setDeletingIndex(null);
      setDeleteDialogIdx(null);
      if (onChanged) onChanged();
    }
  };

  return (
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

      <View className="mt-4">
        <Text className="text-muted-foreground mb-2">Add Note</Text>
        <View className="flex-row gap-2 mb-2">
          <Input
            value={newNote}
            onChangeText={setNewNote}
            placeholder="Enter note..."
            className="flex-1"
          />
          {Platform.OS === 'web' ? (
            <input
              type="file"
              accept="image/*"
              onChange={handleWebFileChange}
              style={{ marginLeft: 8 }}
            />
          ) : (
            <Button onPress={pickNoteImage} variant="outline">
              <Text>{noteImage ? 'Change Image' : 'Add Image'}</Text>
            </Button>
          )}
        </View>
        {noteImage && (
          <Image source={{ uri: noteImage }} className="w-12 h-24 mb-2 rounded-lg" />
        )}
        <Button onPress={handleAddNote} disabled={isUpdating || !newNote.trim()}>
          <Text className="text-white">Add</Text>
        </Button>
      </View>
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
    </View>
  );
} 