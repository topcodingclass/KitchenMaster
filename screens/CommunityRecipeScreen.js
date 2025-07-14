import { StyleSheet,  View, FlatList, SafeAreaView, reduce, TouchableOpacity, } from 'react-native'
import { Text, TextInput } from 'react-native-paper';
import React, {useEffect, useState, useLayoutEffect} from 'react'
import { collection , getDocs, addDoc } from "firebase/firestore"; 
import { db } from '../firebase';
import { StarRatingDisplay } from 'react-native-star-rating-widget';




const CommunityRecipeScreen = ({navigation}) => {

  const [recipes, setRecipes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredRecipes, setFilteredRecipes] = useState([]);

  
useEffect(() => {
  const readRecipes = async () => {
    const querySnapshot = await getDocs(collection(db, "recipes"));
    const recipeList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setRecipes(recipeList);
    setFilteredRecipes(recipeList); // initialize
  };
  readRecipes();
}, []);

useEffect(() => {
  const lowerQuery = searchQuery.toLowerCase();

  const filtered = recipes.filter(recipe =>
    recipe.name.toLowerCase().includes(lowerQuery) ||
    recipe.type.join(', ').toLowerCase().includes(lowerQuery)
  );

  setFilteredRecipes(filtered);
}, [searchQuery, recipes]);


useLayoutEffect(() => {
  navigation.setOptions({
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

    // useEffect (()=>{
    //     console.log(recipes)

    // }, [recipes])



    const getAverageRating = (ratings) => {
      if (ratings.length === 0) return 0;
      const total = ratings.reduce((sum, r) => sum + r.rating, 0);
      return (total / ratings.length).toFixed(1); // optional: round to 1 decimal
};

    const renderItem = ({item, index}) => (
      <View >
        <TouchableOpacity style = {styles.item} onPress={() =>navigation.navigate ("CommunityRecipeDetail", {recipe:item})}>
            <Text variant="titleSmall">{index+1}. {item.name}</Text>
            <Text styles = {styles.text}>difficulty: {item.difficulties}</Text>

            <View style = {{flexDirection: 'row', justifyContent: 'space-around'}}>
              <Text styles = {styles.text}>type: {item.type.join(", ")}</Text>
           
          <StarRatingDisplay
            rating={getAverageRating(item.rating)}
            starSize={16}
            color="gold"
          /> 
          </View>
        </TouchableOpacity>
        
      </View>
    )

    

  

  return (
    <SafeAreaView>
     
      <View>
        <FlatList data={filteredRecipes} renderItem={renderItem} />
      </View>
      
    </SafeAreaView>
  )

}






export default CommunityRecipeScreen

const styles = StyleSheet.create({
     input: {
    borderWidth: 1,
    borderColor: 'gray',
    padding: 12,
    borderRadius: 10,
    margin: 5,
  },
  item: {
    flexDirection: 'row', // <-- Makes name and type appear side-by-side
    justifyContent: 'space-between', // optional: space out the items
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'gray',
    margin: 5,
  },
  text: {
    marginRight: 10, // optional: spacing between name and type
  },
})

