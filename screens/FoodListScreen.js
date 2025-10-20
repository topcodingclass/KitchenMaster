import { StyleSheet, View, SafeAreaView, FlatList, TouchableOpacity, Image, ScrollView } from 'react-native';
import { Button, Text, Divider, Searchbar } from 'react-native-paper';
import React, { useState, useLayoutEffect, useCallback } from 'react';
import { collection, getDocs } from "firebase/firestore"; 
import { useFocusEffect } from '@react-navigation/native';
import { db } from '../firebase';

const FoodListScreen = ({ navigation }) => {
  const [foods, setFoods] = useState([]);
  const [filteredFoods, setFilteredFoods] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <View style={{ flex: 1, flexDirection: "row", alignItems:'flex-start' }}>
          <Text variant="titleMedium">Food List</Text>
        </View>
      ),
      headerRight: () => (
        <Button 
          icon="file-cabinet" 
          mode="elevated" 
          onPress={() => navigation.navigate('Storage List')} 
          style={{marginBottom:6}}
        >
          <Text>Storage List</Text>
        </Button>
      )
    });
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      const fetchFoods = async () => {
        try {
          const querySnapshot = await getDocs(collection(db, "foods"));
          const loadedFoods = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setFoods(loadedFoods);
          setFilteredFoods(loadedFoods);
        } catch (e) {
          console.error("Error fetching foods: ", e);
        }
      };
      fetchFoods();
    }, [])
  );

  const onChangeSearch = (query) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setFilteredFoods(foods);
    } else {
      const filtered = foods.filter(item =>
        item.name?.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredFoods(filtered);
    }
  };

  const renderFoodList = ({ item }) => (
    <View>
      <TouchableOpacity 
        style={styles.foodCard}
        onPress={() => navigation.navigate('Food Detail', { food: item })}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent:'space-between' }}>
          <Text variant="titleMedium">{item.name}</Text> 
          <Text variant="bodyMedium">Storage: {item.storage}</Text>
        </View>

        {item.picture ? (
          <Image source={{ uri: item.picture }} style={styles.image} resizeMode="cover" />
        ) : null}

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <Text variant="bodyMedium">Quantity: {item.quantity}</Text>
          <Text variant="bodyMedium">Weight: {item.weightLB}</Text>
          <Text variant="bodyMedium">Expiration: {item.expirationDate}</Text>
        </View>
      </TouchableOpacity>
      <Divider />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}>
        <Searchbar
          placeholder="Search for food name..."
          onChangeText={onChangeSearch}
          value={searchQuery}
          style={{ marginBottom: 10 }}
        />

        <FlatList
          data={filteredFoods}
          renderItem={renderFoodList}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
        />

        <View style={{flexDirection:"row", justifyContent:'space-around', marginTop: 20}}>
          <Button 
            icon="camera"
            mode="contained" 
            onPress={() => navigation.navigate('Food Scan')} 
          >
            Scan to Add
          </Button>

          <Button 
            icon="plus"
            mode="contained" 
            onPress={() => navigation.navigate('Food Manual Add')} 
          >
            Add Manually
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default FoodListScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    margin: 7
  },
  foodCard: {
    paddingVertical: 12,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderColor: '#ccc',
  },
  image: {
    width: '100%',
    height: 100,
    marginVertical: 8,
    borderRadius: 6,
  }
});
