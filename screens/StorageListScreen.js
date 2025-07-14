import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Divider } from 'react-native-paper';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function StorageListScreen() {
  const [storages, setStorages] = useState([]);

  useEffect(() => {
    const fetchStorages = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'storages'));
        const loadedStorages = querySnapshot.docs.map(doc => ({id: doc.id,...doc.data(),}));
        setStorages(loadedStorages);
      } catch (e) {
        console.error('Error fetching storages: ', e);
      }
    };

    fetchStorages();
  }, []);

  const renderStorage = ({ item }) => (
    <View>
        <TouchableOpacity
        style={styles.foodCard}
        onPress={() => navigation.navigate('StorageDetail', { storage: item })}>
            <View style={{flexDirection:'row',alignItems:'center'}}>
            <Text variant='titleMedium'>{item.name}</Text> 
            </View>



        </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style = {styles.container}>

      <FlatList
        data={storages}
        renderItem={renderStorage}
        keyExtractor={(item) => item.id}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 20,
  },
  title: {
    margin: 16,
  },
  foodCard: {
    padding: 10,
  },
  image: {
    width: '100%',
    height: 100,
    marginVertical: 8,
  },
  addFoodTitle: {
    fontSize: 18,
    marginVertical: 16,
    textAlign: 'center',
  },
  inputContainer: {
    marginHorizontal: 10,
  },
  input: {
    marginBottom: 8,
  },
});
