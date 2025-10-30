import React, { useEffect, useState, useLayoutEffect } from "react";
import {
  StyleSheet,
  View,
  SafeAreaView,
  ScrollView,
  Alert,
  Image,
} from "react-native";
import { Text, Button, Card } from "react-native-paper";
import { auth, db } from "../firebase";
import { doc, getDoc, deleteDoc } from "firebase/firestore";

const MealPlannerDetailScreen = ({ navigation, route }) => {
  const { meal } = route.params; 
  const user = auth.currentUser;

  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);

  useLayoutEffect(() => {
  const mealTitle = `${meal.mealName || meal.recipeName || "Meal Detail"} (${meal.mealType})`;

 
  let dateObj = null;
  if (meal.date) {
    if (typeof meal.date.toDate === "function") {
      dateObj = meal.date.toDate(); 
    } else {
      const parsed = new Date(meal.date);
      dateObj = isNaN(parsed.getTime()) ? null : parsed;
    }
  }

  const mealDateStr = dateObj
    ? `${dateObj.toLocaleDateString(undefined, {
        weekday: "short",  
        month: "short",    
        day: "numeric",
        year: "numeric",
      })}`
    : "";

  navigation.setOptions({
    title: mealTitle,
    headerRight: () =>
      mealDateStr ? (
        <Text
          style={{
            fontSize: 14,
            color: "#555",
            marginRight: 10,
            fontWeight: "500",
          }}
        >
         For {mealDateStr}
        </Text>
      ) : null,
  });
}, [navigation, meal]);




const resolveDate = (d) => {
  if (!d) return null;
  
  if (typeof d?.toDate === "function") return d.toDate();
 
  if (typeof d?._seconds === "number") return new Date(d._seconds * 1000);

  if (typeof d === "string") {
    const t = Date.parse(d);
    return Number.isNaN(t) ? null : new Date(t);
  }
  
  if (typeof d === "number") {
    const dt = new Date(d);
    return Number.isNaN(dt.getTime()) ? null : dt;
  }
  return null;
};




  useEffect(() => {
    console.log("Fetch recipe");
    const fetchRecipe = async () => {
      try {
        if (!meal.recipeID) {
          setLoading(false);
          return;
        }

        const recipeRef = doc(db, "recipes", meal.recipeID);
        const recipeSnap = await getDoc(recipeRef);

        if (recipeSnap.exists()) {
          setRecipe(recipeSnap.data());
          console.log("Loaded recipe:", recipeSnap.data());
        } else {
          console.warn("Recipe not found for ID:", meal.recipeID);
        }
      } catch (error) {
        console.error("Error loading recipe:", error);
        Alert.alert("Error", "Could not load recipe details.");
      } finally {
        setLoading(false);
      }
    };

    fetchRecipe();
  }, [meal.recipeID]);


  const handleDeleteMeal = async () => {
    if (!user || !meal?.id) {
      Alert.alert("Error", "Missing meal info or user not logged in.");
      return;
    }

    try {
      await deleteDoc(doc(db, "mealPlans", user.uid, "mealPlan", meal.id));
      Alert.alert("Deleted", "Meal has been deleted from your planner.");
      navigation.goBack();
    } catch (error) {
      console.error("Error deleting meal:", error);
      Alert.alert("Error", "Could not delete meal.");
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <Text>Loading recipe details...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f7f7f7" }}>
      <ScrollView contentContainerStyle={styles.container}>
       
        {recipe?.picture && (
          <Image source={{ uri: recipe.picture }} style={styles.image} />
        )}

      
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.title}>{recipe?.name || meal.recipeName}</Text>
            <Text style={styles.subText}>Type: {meal.mealType}</Text>
            <Text style={styles.subText}>
              Date: {new Date(meal.date).toDateString()}
            </Text>
          </Card.Content>
        </Card>

     
        {recipe ? (
          <>
          
            <Card style={styles.card}>
              <Card.Content>
                <Text style={styles.sectionTitle}>Ingredients</Text>
                {recipe.ingredients?.map((ing, index) => (
                  <Text key={index} style={styles.itemText}>
                    • {ing.ingredient}
                    {ing.quantity ? ` — ${ing.quantity}` : ""}
                  </Text>
                ))}
              </Card.Content>
            </Card>

      
            <Card style={styles.card}>
              <Card.Content>
                <Text style={styles.sectionTitle}>Steps</Text>
                {recipe.steps?.map((step, index) => (
                  <Text key={index} style={styles.itemText}>
                    {index + 1}. {step.description}{" "}
                    {step.time ? `(${step.time})` : ""}
                  </Text>
                ))}
              </Card.Content>
            </Card>

        
            <Card style={styles.card}>
              <Card.Content>
                <Text style={styles.sectionTitle}>Recipe Info</Text>
                {recipe.totalTime && <Text>Total Time: {recipe.totalTime} min</Text>}
                {recipe.difficulties && <Text>Difficulty: {recipe.difficulties}</Text>}
                {recipe.calories && <Text>Calories: {recipe.calories}</Text>}
                {recipe.servings && <Text>Servings: {recipe.servings}</Text>}
                {Array.isArray(recipe.type) && (
                  <Text>Type: {recipe.type.join(", ")}</Text>
                )}
              </Card.Content>
            </Card>
          </>
        ) : (
          <Text style={{ textAlign: "center", color: "#777" }}>
            No recipe details found for this meal.
          </Text>
        )}

      
        <Button
          mode="outlined"
          onPress={handleDeleteMeal}
        >
          Delete Meal From Planner
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
};

export default MealPlannerDetailScreen;

const styles = StyleSheet.create({
  container: {
    padding: 15,
  },
  image: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    marginBottom: 12,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#333",
    marginBottom: 5,
  },
  subText: {
    color: "#555",
    marginBottom: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 6,
  },
  itemText: {
    marginBottom: 4,
    color: "#333",
  },
  deleteButton: {
    borderColor: "#d9534f",
    borderWidth: 1,
    marginTop: 10,
    alignSelf: "center",
    width: 180,
  },
});
