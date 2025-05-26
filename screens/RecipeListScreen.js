import { StyleSheet, Text, View, FlatList, Button } from 'react-native'
import React, {useState} from 'react'
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
import { db } from '../firebase';

const RecipeListScreen = () => {
  
const [recipes, setRecipes] = useState([])

const userID = 1

const generateRecipes = () =>{
  const foods = fetchUserFoods();
  getRecipesFromAI(foods);
}
//1. Read food list from firebase
const fetchUserFoods = async () => {
  console.log("Fetch foods start")
  try{
    const foodQuery = query(collection(db, "foods"));
    const querySnapshot = await getDocs(foodQuery);
    const foods = [];
  
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      foods.push(data.name); // or include type, quantity if needed
    });
    console.log("Foods:", foods)
  
    return foods;
  } catch (error) {
    console.error("Error reading foods:", error);    
  }
    
  };

//2. Generate receipes by OpenAI
const getRecipesFromAI = async (foodsArray) => {
    console.log('Call API starts')
    const prompt = `
    Using only these ingredients: ${foodsArray.join(', ')}, generate 3 recipes. 
    For each recipe, include:
    - name
    - type (like Dinner, Vegan)
    - description
    - ingredients (as array of objects with name and quantity)
    - steps (as array of strings)
    - totalTime
    - calories, carbs, fat, protein
    - difficulty
    - servings
  
    Respond in clean JSON.
    `;
    try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer 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`,
          "Content-Type": "application/json",
        },
      }
    );

    const content = response.data.choices[0].message.content;

    console.log("Respons:" , content)
  } catch (e) {
    console.error("API error:", e);
  }
  
   
  
    // ⚠️ If response is a stringified JSON, you may need to fix formatting:
    try {
      console.log('Call API')
      const json = JSON.parse(content);
      setRecipes(json);
    } catch (e) {
      console.error("JSON parse error:", e);
      setRecipes([]);
    }
  };

//3. Display the recipe list

  return (
    <View>
      <Text>RecipeListScreen</Text>
      <Button title='Generate Recipes' onPress={generateRecipes} />

      <FlatList
  data={recipes}
  keyExtractor={(item, index) => index.toString()}
  renderItem={({ item }) => (
    <View style={{ padding: 10, marginBottom: 10, backgroundColor: '#f5f5f5' }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold' }}>{item.name}</Text>
      <Text>{item.description}</Text>
      <Text>🕒 Time: {item.totalTime}</Text>
      <Text>🍽 Servings: {item.servings}</Text>
      <Text>🔥 Difficulty: {item.difficulty}</Text>

      <Text style={{ fontWeight: 'bold' }}>Ingredients:</Text>
      {item.ingredients.map((ing, i) => (
        <Text key={i}>- {ing.name} ({ing.quantity})</Text>
      ))}

      <Text style={{ fontWeight: 'bold' }}>Steps:</Text>
      {item.steps.map((step, i) => (
        <Text key={i}>{i + 1}. {step}</Text>
      ))}
    </View>
  )}
/>
    </View>
  )
}

export default RecipeListScreen

const styles = StyleSheet.create({})