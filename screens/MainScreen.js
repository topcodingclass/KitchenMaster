import React, { useState, useLayoutEffect, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, FlatList, Alert } from 'react-native';
import { Text, Card, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db, auth } from '../firebase';
import { collection, getDocs, doc, getDoc, query, where, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useFocusEffect } from '@react-navigation/native';
import RecipeCard from '../components/RecipeCard';

const formatExpirationDate = (dateValue) => {
  if (!dateValue) return 'No date';
  const d = new Date(dateValue);
  if (isNaN(d.getTime())) return dateValue;
  return d.toLocaleDateString();
};

const MainScreen = ({ navigation }) => {
  const userID = auth.currentUser?.uid;

  const [userName, setUserName] = useState('');
  const [todayMeal, setTodayMeal] = useState([]);
  const [expiringFood, setExpiringFood] = useState([]);
  const [allExpiringFood, setAllExpiringFood] = useState([]);
  const [showAllExpiring, setShowAllExpiring] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savedRecipes, setSavedRecipes] = useState([]);

  // Fire/Water alert state
  const [fireAlert, setFireAlert] = useState(false);
  const [waterAlert, setWaterAlert] = useState(false);
  const [fireAlertSent, setFireAlertSent] = useState(false);
  const [waterAlertSent, setWaterAlertSent] = useState(false);
  const [fireTimestamp, setFireTimestamp] = useState(null);
  const [waterTimestamp, setWaterTimestamp] = useState(null);

  // Header setup
  useLayoutEffect(() => {
    navigation.setOptions({
      headerBackVisible: false,
      headerLeft: () => (
        <Text style={styles.welcomeText}>
          {userName ? `Welcome, ${userName}` : 'Welcome'}
        </Text>
      ),
      headerRight: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {/* Fire Alert */}
          <TouchableOpacity
            onPress={() => {
              const msg = fireAlert
                ? `🔥 Fire alert active since ${fireTimestamp?.toLocaleString() ?? 'unknown'}`
                : '🔥 Fire alert is inactive';
              Alert.alert('Fire Alert Info', msg);
            }}
          >
            <View style={[styles.headerAlertIcon, fireAlert && { borderColor: 'red' }]}>
              <Text style={{ fontSize: 18 }}>🔥</Text>
            </View>
          </TouchableOpacity>

          {/* Water Alert */}
          <TouchableOpacity
            onPress={() => {
              const msg = waterAlert
                ? `💧 Water alert active since ${waterTimestamp?.toLocaleString() ?? 'unknown'}`
                : '💧 Water alert is inactive';
              Alert.alert('Water Alert Info', msg);
            }}
          >
            <View style={[styles.headerAlertIcon, waterAlert && { borderColor: 'blue' }]}>
              <Text style={{ fontSize: 18 }}>💧</Text>
            </View>
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, userName, fireAlert, waterAlert, fireTimestamp, waterTimestamp]);

  // Refresh data on focus
  useFocusEffect(
    React.useCallback(() => {
      if (!userID) return;

      const fetchAllData = async () => {
        try {
          setLoading(true);

          // Fetch user name
          const userRef = doc(db, 'users', userID);
          const userSnap = await getDoc(userRef);
          setUserName(userSnap.exists() ? userSnap.data().name || 'Guest' : 'Guest');

          // Fetch saved recipes
          const recipesQuery = query(collection(db, 'recipes'), where('userId', '==', userID));
          const recipesSnapshot = await getDocs(recipesQuery);
          setSavedRecipes(recipesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

          // Fetch expiring food
          const foodsQuery = query(collection(db, 'foods'), where('userID', '==', userID));
          const foodSnap = await getDocs(foodsQuery);
          const foods = foodSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          const today = new Date();
          const in7Days = new Date();
          in7Days.setDate(today.getDate() + 7);
          const expiringItems = foods.filter(food => {
            if (!food.expirationDate) return false;
            const [month, day, year] = food.expirationDate.split('/');
            const fullYear = year.length === 2 ? 2000 + parseInt(year, 10) : parseInt(year, 10);
            const expDate = new Date(fullYear, month - 1, day);
            return expDate >= today && expDate <= in7Days;
          });
          const sortedExpiring = expiringItems.sort(
            (a, b) => new Date(a.expirationDate) - new Date(b.expirationDate)
          );
          setAllExpiringFood(sortedExpiring);
          setExpiringFood(sortedExpiring.slice(0, 3));

          // Fetch today’s meal plan
          const mealPlansRef = collection(db, 'mealPlans');
          const startOfDay = new Date(today);
          startOfDay.setHours(0, 0, 0, 0);
          const endOfDay = new Date(today);
          endOfDay.setHours(23, 59, 59, 999);

          const mealQuery = query(
            mealPlansRef,
            where('userID', '==', userID),
         //   where('date', '>=', startOfDay.toISOString()),
            where('date', '<=', endOfDay.toISOString())
          );

          console.log(startOfDay.toISOString())
          console.log(endOfDay.toISOString())

          const mealSnap = await getDocs(mealQuery);
          const mealsPlan = mealSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

          console.log(mealsPlan)

          if (!mealSnap.empty) {
            const parentDoc = mealSnap.docs[0].ref;
            const subSnapshot = await getDocs(collection(parentDoc, 'mealPlan'));
            const meals = subSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            setTodayMeal(meals);
          } else {
            setTodayMeal([]);
          }

        } catch (error) {
          console.error('Error fetching data on focus:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchAllData();
    }, [userID])
  );

  // Poll Fire/Water alerts
  useEffect(() => {
    if (!userID) return;

    const alertDocRef = doc(db, 'alerts', userID);

    const checkAlerts = async () => {
      try {
        const docSnap = await getDoc(alertDocRef);
        if (!docSnap.exists()) return;
        const data = docSnap.data();

        // Update alerts and timestamps
        setFireAlert(data.fire?.isOn ?? false);
        setWaterAlert(data.water?.isDetected ?? false);
        setFireTimestamp(data.fire?.timestamp ? data.fire.timestamp.toDate() : null);
        setWaterTimestamp(data.water?.timestamp ? data.water.timestamp.toDate() : null);

        // Show alert popups once
        if (data.fire?.isOn && !fireAlertSent) {
          Alert.alert('🔥 Fire Alert!', 'Fire has been detected.');
          setFireAlertSent(true);
        }
        if (data.water?.isDetected && !waterAlertSent) {
          Alert.alert('💧 Water Alert!', 'Water has been detected.');
          setWaterAlertSent(true);
        }

        // Update timestamp in Firestore
        if (data.fire?.isOn) await updateDoc(alertDocRef, { 'fire.timestamp': serverTimestamp() });
        if (data.water?.isDetected) await updateDoc(alertDocRef, { 'water.timestamp': serverTimestamp() });

      } catch (error) {
        console.error('Error checking alerts:', error);
      }
    };

    checkAlerts();
    const interval = setInterval(checkAlerts, 5000);
    return () => clearInterval(interval);
  }, [userID, fireAlertSent, waterAlertSent]);

  if (!userID) {
    return (
      <View style={styles.centered}>
        <Text>Please log in to see your data</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text>Loading...</Text>
      </View>
    );
  }

  const navigateToGenerate = () => navigation.navigate('Recipe List');
  const navigateToPlanner = () => navigation.navigate('Meal Planner');
  const navigateToStorage = () => navigation.navigate('Storage List');

  const handleSeeAllExpiring = () => {
    setShowAllExpiring(prev => {
      const next = !prev;
      setExpiringFood(next ? allExpiringFood : allExpiringFood.slice(0, 3));
      return next;
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Top Recipes */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.sectionTitle}>Top Recipes</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Community Recipes')}>
                <Text style={{ color: '#007AFF' }}>See All...</Text>
              </TouchableOpacity>
            </View>
            {savedRecipes.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 4 }}>
                {savedRecipes.map(recipe => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    onPress={() => navigation.navigate('Recipe Detail', { recipe })}
                  />
                ))}
              </ScrollView>
            ) : (
              <Text>No saved recipes yet.</Text>
            )}
          </Card.Content>
        </Card>

        {/* Expiring Food */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.sectionTitle}>Expiring Soon</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Food List')}>
                <Text style={{ color: '#007AFF' }}>View All Food</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={expiringFood}
              keyExtractor={item => item.id}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.foodRow} onPress={() => navigation.navigate('Food Detail', { food: item })}>
                  <Text style={styles.foodName}>{item.name}</Text>
                  <Text style={styles.foodMeta}>Qty: {item.quantity ?? 1}</Text>
                  <Text style={styles.foodMeta}>{formatExpirationDate(item.expirationDate)}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={styles.itemText}>No expiring food</Text>}
            />
            {allExpiringFood.length > 3 && (
              <TouchableOpacity style={styles.seeAll} onPress={handleSeeAllExpiring}>
                <Text style={styles.seeAllText}>{showAllExpiring ? '…see less' : '…see all'}</Text>
              </TouchableOpacity>
            )}
            <Button mode="outlined" onPress={navigateToStorage}>
              Storage Screen
            </Button>
          </Card.Content>
        </Card>

        {/* Today's Meal Plan */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Today’s Meal Plan</Text>
            <FlatList
              data={todayMeal}
              keyExtractor={item => item.id}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.todayMealRow} onPress={() => navigation.navigate('Meal Planner')}>
                  <Text style={styles.mealType}>{item.mealType}</Text>
                  <Text style={styles.mealName}>{item.mealName}</Text>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.mealDivider} />}
              ListEmptyComponent={<Text style={styles.itemText}>No meals planned today</Text>}
            />
            <Button mode="outlined" onPress={navigateToPlanner} style={{ marginTop: 10 }}>
              Meal Planner
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Bottom Nav */}
      <View style={styles.bottomNav}>
        <Button style={{ width: '45%' }} onPress={navigateToGenerate} mode="contained" icon="pot-steam">
          Generate Recipe
        </Button>
        <Button style={{ width: '42%' }} onPress={() => navigation.navigate('Food Scan')} mode="contained" icon="camera">
          Scan Food
        </Button>
      </View>
    </View>
  );
};

export default MainScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#eee', padding: 4 },
  card: { backgroundColor: '#f9f9f9', marginVertical: 4, padding: 5, borderRadius: 8, borderWidth: 1, borderColor: '#ddd' },
  sectionTitle: { fontWeight: 'bold', fontSize: 16, marginBottom: 5 },
  itemText: { fontSize: 14, marginBottom: 4 },
  seeAll: { marginTop: 4, marginBottom: 10 },
  seeAllText: { color: 'gray', fontStyle: 'italic' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  welcomeText: { fontSize: 15, fontWeight: '600', color: '#333', marginLeft: 12 },
  foodRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, borderTopWidth: 1, borderColor: '#e0e0e0' },
  foodName: { fontWeight: '600', flex: 1 },
  foodMeta: { fontSize: 12, color: '#555', marginLeft: 10 },
  todayMealRow: { flexDirection: 'row', justifyContent: 'space-between',  },
  mealDivider: { height: 1, backgroundColor: '#ccc', marginVertical: 4 },
  mealType: { fontWeight: '600', fontSize: 14 },
  mealName: { fontSize: 13, fontWeight: 'bold', marginTop: 2 },
  bottomNav: { position: 'absolute', bottom: 20, width: '100%', paddingLeft: 15, flexDirection: 'row', justifyContent: 'space-around' },
  headerAlertIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 8,
    padding: 3,
    marginRight: 6,
  },
});
