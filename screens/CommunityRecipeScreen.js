import { StyleSheet, View, FlatList, SafeAreaView, TouchableOpacity } from 'react-native';
import { Text, TextInput, Divider } from 'react-native-paper';
import React, { useState, useLayoutEffect, useCallback } from 'react';
import { collection, getDocs } from "firebase/firestore"; 
import { db } from '../firebase';
import { StarRatingDisplay } from 'react-native-star-rating-widget';
import { useFocusEffect } from '@react-navigation/native';

const CommunityRecipeScreen = ({ navigation }) => {
  const [recipes, setRecipes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredRecipes, setFilteredRecipes] = useState([]);

  const readRecipes = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "recipes"));
      const recipeList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      console.log("Recipes loaded:", recipeList.map(r => ({ name: r.name, ratings: r.ratings })));
      setRecipes(recipeList);
      setFilteredRecipes(recipeList);
    } catch (e) {
      console.error("Error reading recipes: ", e);
    }
  };

  // 🔄 Automatically reload recipes when coming back to this screen
  useFocusEffect(
    useCallback(() => {
      readRecipes();
    }, [])
  );

  React.useEffect(() => {
    const lowerQuery = searchQuery.toLowerCase();
    const filtered = recipes.filter(recipe =>
      recipe.name?.toLowerCase().includes(lowerQuery) ||
      (Array.isArray(recipe.type) && recipe.type.join(', ').toLowerCase().includes(lowerQuery))
    );
    setFilteredRecipes(filtered);
  }, [searchQuery, recipes]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <View style={{ flex: 1, flexDirection: "row", alignItems: 'flex-start' }}>
          <Text variant="titleMedium">Top Recipes</Text>
        </View>
      ),
      headerRight: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TextInput
            placeholder="Search"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={{ backgroundColor: 'white', width: 200, height: 35 }}
            dense
          />
        </View>
      ),
    });
  }, [navigation, searchQuery]);

  const getAverageRating = (ratings = []) => {
    if (!Array.isArray(ratings) || ratings.length === 0) return 0;

    const values = ratings
      .map(r => (typeof r === 'number' ? r : r?.rating))
      .filter(v => Number.isFinite(v));

    if (values.length === 0) return 0;

    const total = values.reduce((sum, v) => sum + v, 0);

    console.log("Rating:", total)
    return Number((total / values.length).toFixed(1));
  };

  const renderItem = ({ item, index }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => navigation.navigate("Community Recipe Detail", { recipe: item })}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text variant="titleSmall">{index + 1}. {item.name}</Text>
        <StarRatingDisplay
          rating={getAverageRating(item.ratings)}
          starSize={16}
          color="gold"
          starStyle={{ marginHorizontal: 2 }}
        />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
        <Text style={styles.text}>{item.difficulties}</Text>
        <Text style={styles.text}>
          {Array.isArray(item?.type) ? item.type.join(', ') : '—'}
        </Text>
      </View>
      <Divider />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <FlatList
        data={filteredRecipes}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 100 }}
      />
    </SafeAreaView>
  );
};

export default CommunityRecipeScreen;

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: 'gray',
    padding: 12,
    borderRadius: 10,
    margin: 5,
  },
  item: {
    padding: 7,
    borderBottomWidth: 1,
    borderBottomColor: 'gray',
    margin: 3,
  },
  text: {
    marginRight: 10,
  },
});
