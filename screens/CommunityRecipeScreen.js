import { StyleSheet, Text, View, FlatList, SafeAreaView, reduce, TouchableOpacity } from 'react-native'
import React, {useEffect, useState} from 'react'
import { collection , getDocs, addDoc } from "firebase/firestore"; 
import { db } from '../firebase';
import { StarRatingDisplay } from 'react-native-star-rating-widget';



const CommunityRecipeScreen = ({navigation}) => {

  const [recipes, setRecipes] = useState([]);

    useEffect (()=>{
        const readRecipes = async () => {
            const querySnapshot = await getDocs(collection(db, "recipes"));

            setRecipes(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            
        }
        readRecipes()

    }, [])

    useEffect (()=>{
        console.log(recipes)

    }, [recipes])

    const getAverageRating = (ratings) => {
      if (ratings.length === 0) return 0;
      const total = ratings.reduce((sum, r) => sum + r.rating, 0);
      return (total / ratings.length).toFixed(1); // optional: round to 1 decimal
};

    const renderItem = ({item, index}) => (
      <View >
        <TouchableOpacity style = {styles.item} onPress={() =>navigation.navigate ("Detail", {recipe:item})}>
            <Text styles = {styles.text}>{index+1}. {item.name}</Text>
            <Text styles = {styles.text}>type: {item.type.join(", ")}</Text>
            <Text styles = {styles.text}>difficulty: {item.difficulties}</Text>
          <StarRatingDisplay
            rating={getAverageRating(item.rating)}
            starSize={16}
            color="gold"
          />
        </TouchableOpacity>
        
      </View>
    )

    

  

  return (
    <SafeAreaView>
      <View style = {{alignSelf: 'center'}}>
        <Text>Top Ten Best Rated Dishes</Text>
      </View>
      <View>
        <FlatList data = {recipes} renderItem={renderItem} />
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

