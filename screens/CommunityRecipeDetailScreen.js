import { StyleSheet, View, SafeAreaView,  } from 'react-native'
import React, {useState, useLayoutEffect} from 'react'
import { Text } from 'react-native-paper';

const CommunityRecipeDetailScreen = ({navigation,route}) => {
const { recipe } = route.params;
console.log(recipe)


  useLayoutEffect(() => {
    navigation.setOptions({
      title: recipe.name 
    });
  }, [navigation, recipe]);


  return (
    <SafeAreaView>
      

      <View>
        <Text>{recipe.description}</Text>
      </View>

       <View style = {{margin: 10}}>
      <Text variant="titleMedium">Ingredients:</Text>
      {recipe.ingredients.map((item, index) => (
        <Text key={index} >
          {item.ingredient} - {item.quantity}
        </Text>
      ))}
      </View>

      <View>
        <Text variant="titleMedium">Steps: </Text>
        {recipe.steps.map((item,index) =>(
          <Text key = {index}>
            {item.sequence}-{item.description} - {item.time}

          </Text>
        ))}
      </View>
    </SafeAreaView>
    
    


  )
}

export default CommunityRecipeDetailScreen

const styles = StyleSheet.create({})
