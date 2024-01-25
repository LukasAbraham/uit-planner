import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import 'react-native-get-random-values';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import moment from 'moment';

import { Course } from '../types';
import { getCoursesBySemester, removeCourse } from '../storage/CoursesStorage';
import { useCurrentSemester } from '../hooks/CurrentSemesterContext';
import SearchBar from '../components/SearchBars';

interface CoursesScreenProps {
  navigation: any;
}

const CoursesScreen: React.FC<CoursesScreenProps> = ({ navigation }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const { currentSemesterId } = useCurrentSemester();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedCourses, setSelectedCourses] = useState(null);

  const fetchCourses = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // get courses by semester id
      let currentSemesterCourses: Course[] | undefined;
      if (currentSemesterId) {
        currentSemesterCourses = await getCoursesBySemester(currentSemesterId);
      }

      setCourses(currentSemesterCourses ?? []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [currentSemesterId]);

  useFocusEffect(
    React.useCallback(() => {
      fetchCourses();
    }, [fetchCourses])
  );

  const handleItemPress = (item: Course) => {
    navigation.navigate('Course Details', { item });
  };

  const handleDeletePress = async (item: Course) => {
    Alert.alert(
      'Delete Course',
      'Are you sure to delete this course?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'OK',
          onPress: async () => {
            await removeCourse(item.id);
            fetchCourses();
          },
        },
      ]
    );
  };

  const handleSearch = (searchQuery, courses) => {
    setSelectedCourses(courses.filter(course => course.name.includes(searchQuery.trim())));
  };

  useEffect(() => {
    setSelectedCourses(courses);
  }, [isLoading, error]);

  return (
    <View style={styles.container}>
      {isLoading && <Text>Loading courses...</Text>}
      {error && <Text style={styles.errorText}>Error loading courses: {error}</Text>}
      <SearchBar
        onSearch={(searchQuery) => handleSearch(searchQuery,courses)}
      />
      {!isLoading && !error && (
        <FlatList
          contentContainerStyle={styles.listContent}
          data={selectedCourses}
          renderItem={({ item }) => (
            <View style={styles.itemBlock}>
              <TouchableOpacity onPress={() => handleItemPress(item)}>
                <View>
                  <Text style={styles.itemTitle}>{item.code} - {item.name}</Text>
                  <Text style={styles.itemTime}>{item.schedule[0].day}, {moment(item.schedule[0].startTime).format('HH:mm')} - {moment(item.schedule[0].endTime).format('HH:mm')}</Text>
                  <Text style={styles.itemLoc}>Location: {item.location}</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDeletePress(item)}>
                <Icon name="delete" size={25} />
              </TouchableOpacity>
            </View>
          )}
          keyExtractor={item => item.code}
        />
      )}

      <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('Add Course', { setCourses })}>
        <Text style={styles.addButtonText}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorText: {
    color: 'red',
  },
  listContent: {
    paddingBottom: 70,
  },
  itemBlock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'black',
    borderRadius: 5,
    marginTop: 20,
    marginHorizontal: 20,
    padding: 10,
  },
  itemTitle: {
    fontSize: 18,
    color: 'black',
    fontWeight: '700',
  },
  itemLoc: {
    fontSize: 15,
    color: 'gray',
  },
  itemTime: {
    fontSize: 15,
    color: 'gray',
    marginVertical: 3,
  },
  addButton: {
    backgroundColor: '#1e90ff',
    width: 50,
    height: 50,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 10,
    right: 10,
  },
  addButtonText: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
  },
});

export default CoursesScreen;
