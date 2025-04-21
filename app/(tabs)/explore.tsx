import { View, Text, TextInput, TouchableOpacity, FlatList, SafeAreaView, Modal, ScrollView, Animated, Dimensions, ActivityIndicator, Alert } from 'react-native'
import React, { useEffect, useState, useRef } from 'react'
import { Ionicons, MaterialCommunityIcons, FontAwesome, AntDesign } from '@expo/vector-icons'
import tw from 'twrnc'
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define the Task interface
interface Task {
  id: string;
  title: string;
  completed: boolean;
  subject?: string;
  deadline?: string;
  priority?: 'low' | 'medium' | 'high';
}

const { width } = Dimensions.get('window');

export default function TodoList() {
  const [task, setTask] = useState<string>('');
  const [subject, setSubject] = useState<string>('');
  const [deadline, setDeadline] = useState<string>('');
  const [list, setList] = useState<Task[]>([]);
  const [isEditing, setEditingId] = useState(false);
  const [editId, setEditId] = useState(null);
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [loading, setLoading] = useState(true);
  const [filterCompleted, setFilterCompleted] = useState<boolean | null>(null);

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Calendar states
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  useEffect(() => {
    // Start animations when component mounts
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      })
    ]).start();

    loadTasks();
  }, []);

  useEffect(() => {
    saveTask();
  }, [list]);

  const addTask = () => {
    if (task.trim() === '' || subject.trim() === '') {
      Alert.alert('Pemberitahuan', 'Belum kamu isi!')
      return;
    }
    if (task.trim().length < 3) {
      Alert.alert('Peringatan', 'Tolong yang betulkan inputnya!')
      return;
    }
    // Create task with animation
    const newTask: Task = {
      id: Date.now().toString(),
      title: task.trim(),
      completed: false,
      subject: subject.trim(),
      deadline: deadline.trim(),
      priority: priority
    };

    setList([...list, newTask]);
    setTask('');
    setSubject('');
    setDeadline('');
    setPriority('medium');
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

  const loadTasks = async () => {
    setLoading(true);
    try {
      const saved = await AsyncStorage.getItem('tasks');
      if (saved !== null) {
        setList(JSON.parse(saved));
        console.log('Berhasil load data');
      }
    } catch (error) {
      console.log('Gagal load data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Modify the deleteTask function to show an alert confirmation
  const deleteTask = (id: string) => {
    Alert.alert(
      'Konfirmasi Hapus',
      'Apakah Anda yakin ingin menghapus tugas ini?',
      [
        {
          text: 'Batal',
          style: 'cancel',
        },
        {
          text: 'Hapus',
          onPress: () => {
            const filtered = list.filter(item => item.id !== id);
            setList(filtered);
          },
          style: 'destructive',
        },
      ],
      { cancelable: true }
    );
  }

  // Remove the confirmation from startEdit function
const startEdit = (item: any) => {
  setTask(item.title);
  setSubject(item.subject || '');
  setDeadline(item.deadline || '');
  setPriority(item.priority || 'medium');
  setEditingId(true);
  setEditId(item.id);
};

// Modify handleEdit to show confirmation before saving
const handleEdit = () => {
  Alert.alert(
    'Konfirmasi Edit',
    'Apakah Anda yakin ingin menyimpan perubahan?',
    [
      {
        text: 'Batal',
        style: 'cancel',
      },
      {
        text: 'Simpan',
        onPress: () => {
          const updated = list.map(item =>
            item.id === editId
              ? {
                ...item,
                title: task.trim(),
                subject: subject.trim(),
                deadline: deadline.trim(),
                priority: priority
              }
              : item
          );
          setList(updated);
          setTask('');
          setSubject('');
          setDeadline('');
          setPriority('medium');
          setEditingId(false);
          setEditId(null);
        },
      },
    ],
    { cancelable: true }
  );
};


  // Calendar functions
  const showDatePickerModal = () => {
    setSelectedDate(new Date());
    setCurrentMonth(new Date().getMonth());
    setCurrentYear(new Date().getFullYear());
    setShowDatePicker(true);
  };

  const formatDate = (date: Date) => {
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();

    return `${day} ${month} ${year}`;
  };

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const handleDateSelect = (day: number) => {
    if (!day) return;

    const newDate = new Date(currentYear, currentMonth, day);
    setSelectedDate(newDate);
    setDeadline(formatDate(newDate));
    setShowDatePicker(false);
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextYear = () => {
    setCurrentYear(currentYear + 1);
  };

  const prevYear = () => {
    setCurrentYear(currentYear - 1);
  };

  const isToday = (day: number) => {
    const today = new Date();
    return day === today.getDate() &&
      currentMonth === today.getMonth() &&
      currentYear === today.getFullYear();
  };

  const isSelectedDay = (day: number) => {
    return day === selectedDate.getDate() &&
      currentMonth === selectedDate.getMonth() &&
      currentYear === selectedDate.getFullYear();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-blue-500';
    }
  };

  const getPriorityTextColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-green-500';
      default: return 'text-blue-500';
    }
  };

  // First, add a new state to track which tasks are showing the "Selesai" button
  const [showCompleteButton, setShowCompleteButton] = useState<string | null>(null);

  // Modify the checkbox click handler to show the complete button instead of immediately marking as complete
  const handleCheckboxClick = (id: string) => {
    // Toggle showing the complete button
    setShowCompleteButton(showCompleteButton === id ? null : id);
  };

  // First, add a new function to handle the completion confirmation
  const confirmCompleteTask = (id: string) => {
    Alert.alert(
      'Konfirmasi Selesai',
      'Apakah Anda yakin ingin menyelesaikan tugas ini?',
      [
        {
          text: 'Batal',
          style: 'cancel',
        },
        {
          text: 'Selesai',
          onPress: () => toggleTaskCompletion(id),
          style: 'default',
        },
      ],
      { cancelable: true }
    );
  };

  // Then modify the handleCompleteTask function to use this confirmation
  const handleCompleteTask = (id: string) => {
    confirmCompleteTask(id);
    setShowCompleteButton(null);
  };


  // Then modify the task item UI to use these new functions


  const filteredTasks = filterCompleted === null
    ? list
    : list.filter(item => item.completed === filterCompleted);

  return (
    <SafeAreaView style={tw`flex-1 bg-gray-50`}>
      <ScrollView>
        {/* Gradient background */}
        <View style={[
          tw`absolute bg-indigo-600 w-full rounded-b-[60px]`,
          {
            height: 280,
            top: -40,
            borderBottomLeftRadius: 60,
            borderBottomRightRadius: 60,
            width: '100%',
          }
        ]} />

        {/* Background pattern */}
        <View style={tw`absolute top-0 right-0 h-40 w-40 opacity-10`}>
          <Ionicons name="book" size={160} color="white" />
        </View>

        <View style={tw`absolute bottom-0 left-0 h-40 w-40 opacity-5`}>
          <Ionicons name="list" size={160} color="black" />
        </View>

        {/* Custom Calendar Modal */}
        <Modal
          transparent={true}
          animationType="fade"
          visible={showDatePicker}
          onRequestClose={() => setShowDatePicker(false)}
        >
          <TouchableOpacity
            style={tw`flex-1 justify-center items-center bg-black bg-opacity-50`}
            activeOpacity={1}
            onPress={() => setShowDatePicker(false)}
          >
            <View style={tw`bg-white rounded-2xl p-5 w-[85%] shadow-xl`}>
              <TouchableOpacity
                style={tw`absolute top-3 right-3 z-10`}
                onPress={() => setShowDatePicker(false)}
              >
                <AntDesign name="closecircle" size={24} color="#6B7280" />
              </TouchableOpacity>

              <Text style={tw`text-xl font-bold text-center mb-4 text-indigo-800`}>Pilih Tanggal</Text>

              {/* Year selector */}
              <View style={tw`flex-row justify-between items-center mb-2`}>
                <TouchableOpacity
                  style={tw`p-2 bg-indigo-100 rounded-full`}
                  onPress={prevYear}
                >
                  <Ionicons name="chevron-back" size={20} color="#4F46E5" />
                </TouchableOpacity>

                <Text style={tw`text-base font-bold text-indigo-800`}>{currentYear}</Text>

                <TouchableOpacity
                  style={tw`p-2 bg-indigo-100 rounded-full`}
                  onPress={nextYear}
                >
                  <Ionicons name="chevron-forward" size={20} color="#4F46E5" />
                </TouchableOpacity>
              </View>

              {/* Month selector */}
              <View style={tw`flex-row justify-between items-center mb-5`}>
                <TouchableOpacity
                  style={tw`p-2 bg-indigo-100 rounded-full`}
                  onPress={prevMonth}
                >
                  <Ionicons name="chevron-back" size={20} color="#4F46E5" />
                </TouchableOpacity>

                <Text style={tw`text-base font-bold text-indigo-800`}>
                  {['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'][currentMonth]}
                </Text>

                <TouchableOpacity
                  style={tw`p-2 bg-indigo-100 rounded-full`}
                  onPress={nextMonth}
                >
                  <Ionicons name="chevron-forward" size={20} color="#4F46E5" />
                </TouchableOpacity>
              </View>

              {/* Day names */}
              <View style={tw`flex-row mb-2`}>
                {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((day, index) => (
                  <Text key={index} style={tw`flex-1 text-center font-medium text-gray-500`}>{day}</Text>
                ))}
              </View>

              {/* Calendar grid */}
              <View style={tw`flex-wrap flex-row`}>
                {generateCalendarDays().map((day, index) => (
                  <TouchableOpacity
                    key={index}
                    style={tw`w-1/7 aspect-square justify-center items-center p-1`}
                    onPress={() => day && handleDateSelect(day)}
                    disabled={!day}
                  >
                    <View style={[
                      tw`w-full h-full rounded-full justify-center items-center`,
                      isSelectedDay(day) && tw`bg-indigo-600`,
                      isToday(day) && !isSelectedDay(day) && tw`border-2 border-indigo-500`
                    ]}>
                      <Text style={[
                        tw`text-center`,
                        isSelectedDay(day) && tw`text-white font-bold`,
                        isToday(day) && !isSelectedDay(day) && tw`text-indigo-600 font-bold`,
                        !isToday(day) && !isSelectedDay(day) && tw`text-gray-800`
                      ]}>
                        {day}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Buttons */}
              <View style={tw`flex-row justify-between mt-5`}>
                <TouchableOpacity
                  style={tw`flex-1 mr-2 py-3 bg-gray-200 rounded-xl`}
                  onPress={() => setShowDatePicker(false)}
                >
                  <Text style={tw`text-center font-bold text-gray-700`}>Batal</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={tw`flex-1 ml-2 py-3 bg-indigo-600 rounded-xl`}
                  onPress={() => {
                    setDeadline(formatDate(selectedDate));
                    setShowDatePicker(false);
                  }}
                >
                  <Text style={tw`text-center font-bold text-white`}>Pilih</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Main content */}
        <Animated.View
          style={[
            tw`flex-1 px-5 pt-14`,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
          ]}
        >
          {/* Header with icon and title */}
          <View style={tw`flex-row items-center justify-between mt-12 mb-6`}>
            <View style={tw`flex-row items-center`}>
              <Text style={tw`text-3xl font-bold text-white`}>TugasKu</Text>
              <MaterialCommunityIcons name="notebook-check" size={28} color="white" style={tw`ml-2`} />
            </View>

            <View style={tw`flex-row`}>
              <TouchableOpacity
                style={[
                  tw`h-10 w-10 rounded-full justify-center items-center mr-2`,
                  filterCompleted === true ? tw`bg-white` : tw`bg-indigo-500 bg-opacity-30`
                ]}
                onPress={() => setFilterCompleted(filterCompleted === true ? null : true)}
              >
                <Ionicons name="checkmark-circle" size={22} color={filterCompleted === true ? "#4F46E5" : "white"} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  tw`h-10 w-10 rounded-full justify-center items-center`,
                  filterCompleted === false ? tw`bg-white` : tw`bg-indigo-500 bg-opacity-30`
                ]}
                onPress={() => setFilterCompleted(filterCompleted === false ? null : false)}
              >
                <Ionicons name="time" size={22} color={filterCompleted === false ? "#4F46E5" : "white"} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Task Summary Section */}
          <View style={tw`bg-white rounded-3xl shadow-md p-5 mb-5`}>
            <Text style={tw`text-lg font-bold text-gray-800 mb-3`}>Daftar Tugas</Text>

            <View style={tw`flex-row justify-between`}>
              <View style={tw`items-center bg-indigo-50 rounded-xl p-3 flex-1 mr-2`}>
                <Text style={tw`text-2xl font-bold text-indigo-600`}>{list.length}</Text>
                <Text style={tw`text-xs text-indigo-600 font-medium`}>Total Tugas</Text>
              </View>

              <View style={tw`items-center bg-green-50 rounded-xl p-3 flex-1 mx-2`}>
                <Text style={tw`text-2xl font-bold text-green-600`}>
                  {list.filter(task => task.completed).length}
                </Text>
                <Text style={tw`text-xs text-green-600 font-medium`}>Selesai</Text>
              </View>

              <View style={tw`items-center bg-red-50 rounded-xl p-3 flex-1 ml-2`}>
                <Text style={tw`text-2xl font-bold text-red-600`}>
                  {list.filter(task => !task.completed).length}
                </Text>
                <Text style={tw`text-xs text-red-600 font-medium`}>Belum Selesai</Text>
              </View>
            </View>

            {/* Priority selector - improved spacing with task counts */}
            <View style={tw`mb-5`}>
              <Text style={tw`text-sm font-medium text-gray-700 mb-3`}>Prioritas:</Text>

              <View style={tw`flex-row justify-between`}>
                {/* Low Priority Button */}
                <TouchableOpacity
                  style={[
                    tw`px-3 py-2 rounded-xl flex-1 mr-2`,
                    priority === 'low' ? tw`bg-green-100` : tw`bg-gray-100`
                  ]}
                  onPress={() => setPriority('low')}
                >
                  <View style={tw`flex-row items-center justify-center`}>
                    <View style={tw`h-3 w-3 rounded-full bg-green-500 mr-1.5`}></View>
                    <Text
                      numberOfLines={1}
                      style={[
                        tw`text-xs font-medium`,
                        priority === 'low' ? tw`text-green-600` : tw`text-gray-600`
                      ]}
                    >
                      Rendah ({list.filter(task => task.priority === 'low').length})
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Medium Priority Button */}
                <TouchableOpacity
                  style={[
                    tw`px-3 py-2 rounded-xl flex-1 mx-2`,
                    priority === 'medium' ? tw`bg-yellow-100` : tw`bg-gray-100`
                  ]}
                  onPress={() => setPriority('medium')}
                >
                  <View style={tw`flex-row items-center justify-center`}>
                    <View style={tw`h-3 w-3 rounded-full bg-yellow-500 mr-1.5`}></View>
                    <Text
                      numberOfLines={1}
                      style={[
                        tw`text-xs font-medium`,
                        priority === 'medium' ? tw`text-yellow-600` : tw`text-gray-600`
                      ]}
                    >
                      Sedang ({list.filter(task => task.priority === 'medium').length})
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* High Priority Button */}
                <TouchableOpacity
                  style={[
                    tw`px-3 py-2 rounded-xl flex-1 ml-2`,
                    priority === 'high' ? tw`bg-red-100` : tw`bg-gray-100`
                  ]}
                  onPress={() => setPriority('high')}
                >
                  <View style={tw`flex-row items-center justify-center`}>
                    <View style={tw`h-3 w-3 rounded-full bg-red-500 mr-1.5`}></View>
                    <Text
                      numberOfLines={1}
                      style={[
                        tw`text-xs font-medium`,
                        priority === 'high' ? tw`text-red-600` : tw`text-gray-600`
                      ]}
                    >
                      Tinggi ({list.filter(task => task.priority === 'high').length})
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

          </View>

          {/* Input card */}
          <View style={tw`bg-white rounded-3xl shadow-md p-5 mb-6`}>
            <Text style={tw`text-lg font-bold text-gray-800 mb-4`}>
              {isEditing ? 'Edit Tugas' : 'Tambah Tugas Baru'}
            </Text>

            {/* Mata Pelajaran field */}
            <View style={tw`flex-row items-center mb-4`}>
              <View style={tw`flex-1 relative`}>
                <TextInput
                  style={tw`h-12 bg-gray-50 rounded-xl px-4 pr-10 text-sm border border-gray-200 w-full`}
                  placeholder="Mata Pelajaran..."
                  placeholderTextColor="#999"
                  value={subject}
                  onChangeText={setSubject}
                />
                <MaterialCommunityIcons
                  name='book-open-variant'
                  size={22}
                  color={'#4F46E5'}
                  style={tw`absolute right-3 top-2.5`}
                />
              </View>
            </View>

            {/* Judul Tugas field */}
            <View style={tw`flex-row items-center mb-4`}>
              <View style={tw`flex-1 relative`}>
                <TextInput
                  style={tw`h-12 bg-gray-50 rounded-xl px-4 pr-10 text-sm border border-gray-200 w-full`}
                  placeholder="Judul Tugas..."
                  placeholderTextColor="#999"
                  value={task}
                  onChangeText={setTask}
                />
                <Ionicons
                  name='document-text-outline'
                  size={22}
                  color={'#4F46E5'}
                  style={tw`absolute right-3 top-2.5`}
                />
              </View>
            </View>

            {/* Deadline field */}
            <View style={tw`flex-row items-center mb-4`}>
              <View style={tw`flex-1 relative`}>
                <TextInput
                  style={tw`h-12 bg-gray-50 rounded-xl px-4 pr-10 text-sm border border-gray-200 w-full`}
                  placeholder="Deadline (contoh: 20 April 2025)..."
                  placeholderTextColor="#999"
                  value={deadline}
                  onChangeText={setDeadline}
                />
                <TouchableOpacity
                  onPress={showDatePickerModal}
                  style={tw`absolute right-3 top-2.5`}
                >
                  <FontAwesome
                    name='calendar'
                    size={22}
                    color={'#4F46E5'}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Priority selector */}
            <View style={tw`flex-row justify-between mb-5`}>
              <Text style={tw`text-sm font-medium text-gray-700 mb-2`}>Prioritas:</Text>
              <View style={tw`flex-row`}>
                <TouchableOpacity
                  style={[
                    tw`px-3 py-1 rounded-full mr-2`,
                    priority === 'low' ? tw`bg-green-100` : tw`bg-gray-100`
                  ]}
                  onPress={() => setPriority('low')}
                >
                  <Text style={[
                    tw`text-sm font-medium`,
                    priority === 'low' ? tw`text-green-600` : tw`text-gray-600`
                  ]}>Rendah</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    tw`px-3 py-1 rounded-full mr-2`,
                    priority === 'medium' ? tw`bg-yellow-100` : tw`bg-gray-100`
                  ]}
                  onPress={() => setPriority('medium')}
                >
                  <Text style={[
                    tw`text-sm font-medium`,
                    priority === 'medium' ? tw`text-yellow-600` : tw`text-gray-600`
                  ]}>Sedang</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    tw`px-3 py-1 rounded-full`,
                    priority === 'high' ? tw`bg-red-100` : tw`bg-gray-100`
                  ]}
                  onPress={() => setPriority('high')}
                >
                  <Text style={[
                    tw`text-sm font-medium`,
                    priority === 'high' ? tw`text-red-600` : tw`text-gray-600`
                  ]}>Tinggi</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Action button */}
            <TouchableOpacity
              style={tw`h-12 bg-indigo-600 rounded-xl justify-center items-center shadow`}
              onPress={isEditing ? handleEdit : addTask}
            >
              <Text style={tw`text-base font-bold text-white`}>
                {isEditing ? 'Simpan Perubahan' : 'Tambah Tugas'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Task list */}
          {loading ? (
            <View style={tw`flex-1 justify-center items-center`}>
              <ActivityIndicator size="large" color="#4F46E5" />
              <Text style={tw`mt-4 text-gray-600`}>Memuat tugas...</Text>
            </View>
          ) : (
            <FlatList
              data={filteredTasks}
              keyExtractor={(item) => item.id}
              contentContainerStyle={tw`pb-20 pt-2`}
              showsVerticalScrollIndicator={false}
              scrollEnabled={false}
              renderItem={({ item, index }) => (
                <Animated.View
                  style={[
                    tw`mb-3`, // Reduced margin bottom to make cards more compact
                    {
                      opacity: 1,
                      transform: [{
                        translateY: 0
                      }]
                    }
                  ]}
                >
                  {/* // Replace the existing task item UI (the part you highlighted) with this updated version: */}

                  <View style={tw`bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100`}>
                    {/* Card header with colored accent */}
                    <View style={tw`h-1.5 ${getPriorityColor(item.priority || 'medium')}`} />

                    {/* Card content */}
                    <View style={tw`p-3 flex-row items-center`}>
                      {/* Checkmark positioned at the center-left of the entire card */}
                      <View style={tw`justify-center mr-3 `}>
                        <TouchableOpacity
                          style={[
                            tw`h-6 w-6 rounded-2 justify-center items-center border-2`,
                            item.completed ? tw`bg-green-600 border-green-600` : tw`bg-white border-gray-300`
                          ]}
                          onPress={() => handleCheckboxClick(item.id)}
                        >
                          {item.completed && (
                            <Ionicons name="checkmark" size={14} color="white" />
                          )}
                        </TouchableOpacity>
                      </View>

                      {/* Main content area */}
                      <View style={tw`flex-1 `}>
                        {/* Task title and action buttons */}
                        <View style={tw`flex-row justify-between items-center`}>
                          {/* Task title */}
                          <View style={tw`flex-1 mr-3`}>
                            <Text style={[
                              tw`text-base font-bold text-gray-800`,
                              item.completed && tw`line-through text-gray-400`
                            ]}>
                              {item.title}
                            </Text>
                          </View>
                        </View>

                        {/* Task details */}
                        <View style={tw`mt-1`}>
                          {item.subject && (
                            <View style={tw`flex-row items-center mb-1`}>
                              <MaterialCommunityIcons name="book-open-variant" size={14} color="#6B7280" />
                              <Text style={tw`text-gray-600 text-xs ml-2`}>
                                {item.subject}
                              </Text>
                            </View>
                          )}

                          {item.deadline && (
                            <View style={tw`flex-row items-center mb-1`}>
                              <FontAwesome name="calendar" size={12} color="#6B7280" />
                              <Text style={tw`text-gray-600 text-xs ml-2`}>
                                {item.deadline}
                              </Text>
                            </View>
                          )}

                          <View style={tw`flex-row items-center`}>
                            <AntDesign name="flag" size={12} color={
                              item.priority === 'high' ? '#EF4444' :
                                item.priority === 'medium' ? '#F59E0B' :
                                  '#10B981'
                            } />
                            <Text style={tw`${getPriorityTextColor(item.priority || 'medium')} text-xs ml-2 font-medium`}>
                              Prioritas {
                                item.priority === 'high' ? 'Tinggi' :
                                  item.priority === 'medium' ? 'Sedang' :
                                    'Rendah'
                              }
                            </Text>
                          </View>
                        </View>
                      </View>
                      <View style={tw`flex-row items-center`}>
                        {/* Show "Selesai" button only when the checkbox is clicked for this item */}
                        {/* // In the task item UI, modify the "Selesai" button's onPress handler: */}

                        {showCompleteButton === item.id && !item.completed && (
                          <TouchableOpacity
                            style={tw`px-4 py-2 mr-2 bg-green-50 rounded-lg`}
                            onPress={() => confirmCompleteTask(item.id)}
                          >
                            <View style={tw`flex-row items-center`}>
                              <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                            </View>
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity
                          style={tw`px-4 py-2 mr-2 bg-indigo-50 rounded-lg`}
                          onPress={() => startEdit(item)}
                        >
                          <MaterialCommunityIcons name="pencil" size={18} color="#4F46E5" />
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={tw`px-4 py-2 bg-red-50 rounded-lg`}
                          onPress={() => deleteTask(item.id)}
                        >
                          <MaterialCommunityIcons name="delete" size={18} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </Animated.View>
              )}
              ListEmptyComponent={
                <View style={tw`items-center justify-center py-16 bg-white rounded-2xl shadow-sm p-8 mt-4`}>
                  <MaterialCommunityIcons name="notebook-outline" size={70} color="#d1d5db" />

                  <Text style={tw`text-gray-500 text-lg font-medium mt-4 text-center`}>Belum ada tugas</Text>
                  <Text style={tw`text-gray-400 text-sm mt-2 text-center`}>
                    {filterCompleted !== null
                      ? 'Tidak ada tugas dengan filter yang dipilih'
                      : 'Tambahkan tugas baru untuk memulai'}
                  </Text>
                </View>
              }
            />
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
