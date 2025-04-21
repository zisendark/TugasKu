import { View, Text, TextInput, TouchableOpacity, FlatList, SafeAreaView, Alert } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import tw from 'twrnc'
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define the Task interface
interface Task {
  id: string;
  title: string;
  completed: boolean;
}

export default function TodoList() {
  const [task, setTask] = useState<string>('');
  const [list, setList] = useState<Task[]>([]);
  const [isEditing, setEditingId] = useState(false);
  const [editId, setEditId] = useState(null);

  const addTask = () => {
    if (task.trim() === "") 
    return;
    const newTask: Task = {
      id: Date.now().toString(),
      title: task.trim(),
      completed: false
    };
    setList([...list, newTask]);
    setTask('');
  };

  const toggleTaskCompletion = (id: string) => {
    setList(list.map(task =>
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const saveTask = async () => {
    try {
      await AsyncStorage.setItem('tasks', JSON.stringify(list));
      console.log('Berhasil simpan data');
    } catch (error) {
      console.log('Gagal simpan data:', error);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  useEffect(() => {
    saveTask();
  }, [list]);

  const loadTasks = async () => {
    try {
      const saved = await AsyncStorage.getItem('tasks');
      if (saved !== null) {
        setList(JSON.parse(saved));
        console.log('Berhasil load data');
      }
    } catch (error) {
      console.log('Gagal load data:', error);
    }
  };

  const deleteTask = (id: string) => {
    const filtered = list.filter(item => item.id !== id);
    setList(filtered);
  };

  const handleEdit = () => {
    const updated = list.map(item =>
      item.id === editId
      ? { ...item, title: task.trim() }
      : item
    );
    setList(updated);
    setTask('');
    setEditingId(false);
    setEditId(null);
  };

  const startEdit = (item: any) => {
    setTask(item.title);
    setEditingId(true);
    setEditId(item.id);
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-gradient-to-b from-blue-50 to-white`}>
      {/* Yellow semi-circle at the top */}
      <View style={[
        tw`absolute bg-yellow-400 w-full rounded-b-full`,
        {
          height: 250,
          top: -100,
          borderBottomLeftRadius: 500,
          borderBottomRightRadius: 500,
          width: '120%',
          left: '-10%'
        }
      ]} />

      {/* Background pattern */}
      <View style={tw`absolute top-0 right-0 h-40 w-40 opacity-10`}>
       <Ionicons name="book" size={160} color="#007AFF" />
      </View>

      <View style={tw`absolute bottom-0 left-0 h-40 w-40 opacity-10`}>
        <Ionicons name="list" size={160} color="#007AFF" />
      </View>

      {/* Main content - added more top margin */}
      <View style={tw`flex-1 p-4 pt-16`}>
        {/* Header with icon and title - increased top margin */}
        <View style={tw`flex-row items-center mt-16 mb-8`}>
          <View style={tw`h-10 w-10 bg-blue-500 rounded-full items-center justify-center shadow-md`}>
            <Ionicons name="book" size={24} color="white" />
          </View>
          <Text style={tw`text-2xl font-bold ml-3 text-gray-800`}>Personal</Text>
        </View>

        {/* Search bar and button */}
        <View style={tw`flex-row items-center mb-6`}>
          <View style={tw`flex-1 relative`}>
            <TextInput
              style={tw`h-10 bg-white rounded-lg px-4 pr-10 text-sm shadow-sm border border-gray-200 w-full`}
              placeholder="Tambahkan Tugas..."
              placeholderTextColor="#999"
              value={task}
              onChangeText={setTask}
            />
            <MaterialCommunityIcons
              name='magnify'
              size={20}
              color={'#007AFF'}
              style={tw`absolute right-3 top-2.5`}
            />
          </View>
          <TouchableOpacity
            style={tw`ml-2 h-10 px-4 bg-blue-500 rounded-lg justify-center items-center shadow`}
            onPress={isEditing ? handleEdit: addTask}
          >
            <Text style={tw`text-base font-medium text-white`}>Tambah</Text>
          </TouchableOpacity>
        </View>

        {/* Task list - added top margin */}
        <FlatList
          data={list}
          keyExtractor={(item) => item.id}
          contentContainerStyle={tw`pb-20 pt-2`} // Added top padding
          renderItem={({ item }) => (
            <View style={tw`flex-row items-center p-3 mb-2 border-b border-gray-200`}>
              {/* Checkbox */}
              <TouchableOpacity
                style={tw`h-6 w-6 rounded-md border-2 ${item.completed ? 'bg-blue-500 border-blue-500' : 'border-gray-300'} mr-3 items-center justify-center`}
                onPress={() => toggleTaskCompletion(item.id)}
              >
                {item.completed && (
                  <Ionicons name="checkmark" size={16} color="white" />
                )}
              </TouchableOpacity>

              {/* Task content */}
              <View style={tw`flex-1`}>
                <Text style={tw`text-gray-800 font-medium ${item.completed ? 'line-through text-gray-400' : ''}`}>
                  {item.title}
                </Text>
                <Text style={tw`text-gray-400 text-xs mt-1`}>
                  {new Date().toLocaleDateString()}
                </Text>
              </View>
                {/* Edit button */}
                <TouchableOpacity onPress={() => startEdit(item)}>
                <Text style={tw`text-blue-500 font-bold text-xs`}>Edit</Text>
              </TouchableOpacity>
              {/* Delete button */}
              <TouchableOpacity
                style={tw`h-8 px-3 rounded-full items-center justify-center ml-2`}
                onPress={() => deleteTask(item.id)}
              >
                <Text style={tw`text-red-500 font-bold text-xs`}>Hapus</Text>
              </TouchableOpacity>
              
            </View>
          )}
          ItemSeparatorComponent={() => <View style={tw`h-1`} />}
          ListEmptyComponent={
            <View style={tw`items-center justify-center py-20`}>
              <Ionicons name="list" size={60} color="#d1d5db" />
              <Text style={tw`text-gray-400 text-base mt-4`}>Belum ada tugas</Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}
