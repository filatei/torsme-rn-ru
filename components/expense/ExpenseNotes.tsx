import { View, Image } from 'react-native';
import { Text } from '~/components/ui/text';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';

interface Note {
  text: string;
  author: string;
  date: string;
  image?: string;
}

interface ExpenseNotesProps {
  notes: Note[];
  onAddNote: (text: string, image: string | null) => Promise<void>;
  isUpdating: boolean;
  userName: string;
}

export function ExpenseNotes({ notes, onAddNote, isUpdating, userName }: ExpenseNotesProps) {
  const [newNote, setNewNote] = useState('');
  const [noteImage, setNoteImage] = useState<string | null>(null);

  const pickNoteImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0].uri) {
      setNoteImage(result.assets[0].uri);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    await onAddNote(newNote, noteImage);
    setNewNote('');
    setNoteImage(null);
  };

  return (
    <View className="mb-4">
      <Text className="text-muted-foreground mb-2">Notes</Text>
      {notes.map((note, idx) => (
        <View key={idx} className="bg-muted p-3 rounded-lg mb-2">
          <Text className="font-medium">{note.text}</Text>
          <Text className="text-sm text-muted-foreground mt-1">
            By {note.author} on {new Date(note.date).toLocaleDateString()}
          </Text>
          {note.image && (
            <Image 
              source={{ uri: note.image }} 
              className="w-full h-40 mt-2 rounded-lg"
            />
          )}
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
          <Button onPress={pickNoteImage} variant="outline">
            <Text>{noteImage ? 'Change Image' : 'Add Image'}</Text>
          </Button>
        </View>
        {noteImage && (
          <Image source={{ uri: noteImage }} className="w-24 h-24 mb-2 rounded-lg" />
        )}
        <Button onPress={handleAddNote} disabled={isUpdating || !newNote.trim()}>
          <Text className="text-white">Add</Text>
        </Button>
      </View>
    </View>
  );
} 