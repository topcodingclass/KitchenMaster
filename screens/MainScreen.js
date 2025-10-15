import React, { useState, useLayoutEffect, useEffect } from 'react';
import { View, StyleSheet, Image, TouchableOpacity, ActivityIndicator, ScrollView, FlatList, Modal, Animated, Dimensions, Alert } from 'react-native';
import { Text, Card, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db, auth } from '../firebase';
import { collection, getDocs, doc, getDoc, query, where, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useFocusEffect } from '@react-navigation/native';
import RecipeCard from '../components/RecipeCard';


const formatExpirationDate = (dateValue) => {
  if (!dateValue) return 'No date';
  const d = new Date(dateValue);
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
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [drawerAnim] = useState(new Animated.Value(Dimensions.get('window').width));
  const [savedRecipes, setSavedRecipes] = useState([]);


  // Fire/Water alert state
  const [fireAlert, setFireAlert] = useState(false);
  const [waterAlert, setWaterAlert] = useState(false);
  // Track if alert has been shown for this session
  const [fireAlertSent, setFireAlertSent] = useState(false);
  const [waterAlertSent, setWaterAlertSent] = useState(false);


  const openDrawer = () => {
    setShowNotifications(true);
    Animated.timing(drawerAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };


  const closeDrawer = () => {
    Animated.timing(drawerAnim, {
      toValue: Dimensions.get('window').width,
      duration: 300,
      useNativeDriver: false,
    }).start(() => setShowNotifications(false));
  };


  // Header with welcome and notifications
  useLayoutEffect(() => {
    navigation.setOptions({
      headerBackVisible: false,
      headerLeft: () => (
        <Text style={styles.welcomeText}>
          {userName ? `Welcome, ${userName}` : 'Welcome'}
        </Text>
      ),
      headerRight: () => (
        <TouchableOpacity style={styles.notificationButton} onPress={openDrawer}>
          <Image
            source={{
              uri: 'https://assets.streamlinehq.com/image/private/w_300,h_300,ar_1/f_auto/v1/icons/notifications/bell-oidqm6rhvuc2en0khzvmw2.png/bell-ligh2sop7xi1hvsmujni.png?_a=DATAg1AAZAA0',
            }}
            style={{ width: 28, height: 28 }}
          />
          {notifications.length > 0 && (
            <View style={styles.notifBadge}>
              <Text style={styles.notifBadgeText}>{notifications.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      ),
    });
  }, [navigation, userName, notifications]);


  // Refresh all data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (!userID) return;


      const fetchAllData = async () => {
        try {
          setLoading(true);


          // User name
          const userRef = doc(db, 'users', userID);
          const userSnap = await getDoc(userRef);
          setUserName(userSnap.exists() ? userSnap.data().name || 'Guest' : 'Guest');


          // Notifications
          const notifQuery = query(collection(db, 'notifications'), where('userID', '==', userID));
          const notifSnapshot = await getDocs(notifQuery);
          const notifList = notifSnapshot.docs.map(doc => doc.data().message || '');
          setNotifications(notifList);


          // Saved Recipes
          const recipesQuery = query(collection(db, 'recipes'), where('userId', '==', userID));
          const recipesSnapshot = await getDocs(recipesQuery);
          const userRecipes = recipesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setSavedRecipes(userRecipes);


          // Expiring Food
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


          // Today's meals
          const dateString = today.toISOString().split('T')[0];
          const userDayDocRef = doc(db, 'mealPlans', `${userID}_${dateString}`);
          const mealPlanSubRef = collection(userDayDocRef, 'mealPlan');
          const subSnapshot = await getDocs(mealPlanSubRef);


          const meals = subSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setTodayMeal(meals);


        } catch (error) {
          console.error('Error fetching data on focus:', error);
        } finally {
          setLoading(false);
        }
      };


      fetchAllData();
    }, [userID])
  );


  // Polling Fire/Water alerts every 5 seconds with one-time alert per session
  useEffect(() => {
    if (!userID) return;


    const alertDocRef = doc(db, 'alerts', userID);


    const checkAlerts = async () => {
      try {
        const docSnap = await getDoc(alertDocRef);
        if (!docSnap.exists()) return;


        const data = docSnap.data();


        setFireAlert(data.fire?.isOn ?? false);
        setWaterAlert(data.water?.isDetected ?? false);


        // One-time alerts per screen open
        if (data.fire?.isOn && !fireAlertSent) {
          Alert.alert('🔥 Fire Alert!', 'Fire has been detected.');
          setFireAlertSent(true);
        }


        if (data.water?.isDetected && !waterAlertSent) {
          Alert.alert('💧 Water Alert!', 'Water has been detected.');
          setWaterAlertSent(true);
        }


        // Update timestamps
        if (data.fire?.isOn) {
          await updateDoc(alertDocRef, { 'fire.timestamp': serverTimestamp() });
        }
        if (data.water?.isDetected) {
          await updateDoc(alertDocRef, { 'water.timestamp': serverTimestamp() });
        }
      } catch (error) {
        console.error('Error checking alerts:', error);
      }
    };


    // Initial check and every 5 seconds
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
  const navigateToCamera = () => navigation.navigate('Food Scan');
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
      {/* Fire/Water Notifier with subtle border */}
      <View style={styles.alertNotifierContainer}>
        <View style={[styles.alertItem, fireAlert && { borderColor: 'red' }]}>
          <Text>🔥 Fire</Text>
        </View>
        <View style={[styles.alertItem, waterAlert && { borderColor: 'blue' }]}>
          <Text>💧 Water</Text>
        </View>
      </View>


      {/* Notifications Drawer */}
      <Modal transparent animationType="none" visible={showNotifications} onRequestClose={closeDrawer}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={closeDrawer} />
        <Animated.View style={[styles.drawer, { right: drawerAnim }]}>
          <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.drawerHeader}>
              <Text style={styles.drawerTitle}>Notifications</Text>
              <Button onPress={closeDrawer}>Close</Button>
            </View>
            <ScrollView contentContainerStyle={{ paddingBottom: 20 }} style={{ flex: 1 }}>
              {notifications.length > 0
                ? notifications.map((item, index) => <Text key={index} style={styles.itemText}>• {item}</Text>)
                : <Text style={styles.itemText}>No notifications</Text>}
            </ScrollView>
          </SafeAreaView>
        </Animated.View>
      </Modal>


      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Top Recipes */}
        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
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
          <Card.Content style={styles.cardContent}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.sectionTitle}>Expiring Soon</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Food List')}>
                <Text style={{ color: '#007AFF' }}>View All</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={expiringFood}
              keyExtractor={item => item.id}
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


        {/* Today’s Meal */}
        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <Text style={styles.sectionTitle}>Today’s Meal Plan</Text>
            {todayMeal.length > 0 ? (
              <FlatList
                data={todayMeal}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.todayMealRow} onPress={() => navigation.navigate('Meal Planner')}>
                    <Text style={styles.mealType}>{item.mealType.charAt(0).toUpperCase() + item.mealType.slice(1)}</Text>
                    <Text style={styles.mealName}>{item.recipeName || item.mealName}</Text>
                  </TouchableOpacity>
                )}
                ItemSeparatorComponent={() => <View style={styles.mealDivider} />}
              />
            ) : (
              <Text style={styles.itemText}>No meals planned</Text>
            )}
            <Button mode="outlined" onPress={navigateToPlanner} style={{ marginTop: 10 }}>
              Meal Planner
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>


      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <Button style={{ width: '48%' }} onPress={navigateToGenerate} mode="contained" icon="pot-steam">
          Generate Recipe
        </Button>
        <Button style={{ width: '48%' }} onPress={navigateToCamera} mode="contained" icon="camera">
          Scan Food
        </Button>
      </View>
    </View>
  );
};


export default MainScreen;


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#eee', padding: 7 },
  card: { backgroundColor: '#f9f9f9', marginVertical: 4, padding: 5, borderRadius: 8, borderWidth: 1, borderColor: '#ddd' },
  cardContent: { flexDirection: 'column' },
  sectionTitle: { fontWeight: 'bold', fontSize: 16, marginBottom: 5 },
  itemText: { fontSize: 14, marginBottom: 4 },
  seeAll: { marginTop: 4, marginBottom: 10 },
  seeAllText: { color: 'gray', fontStyle: 'italic' },
  bottomNav: { position: 'absolute', bottom: 20, width: '100%', paddingHorizontal: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  notificationButton: { flexDirection: 'row', alignItems: 'center', position: 'relative', marginLeft: 12 },
  notifBadge: { position: 'absolute', top: -4, right: -4, backgroundColor: 'red', borderRadius: 10, paddingHorizontal: 5, paddingVertical: 1 },
  notifBadgeText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  drawer: { position: 'absolute', top: 0, bottom: 0, width: '75%', backgroundColor: 'white', borderLeftWidth: 1, borderColor: '#ccc', padding: 15, flex: 1 },
  drawerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  drawerTitle: { fontSize: 18, fontWeight: 'bold' },
  foodRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderColor: '#e0e0e0' },
  foodName: { fontWeight: '600', flex: 1 },
  foodMeta: { fontSize: 12, color: '#555', marginLeft: 10 },
  welcomeText: { fontSize: 15, fontWeight: '600', color: '#333', marginLeft: 12 },
  todayMealRow: { padding: 12, borderWidth: 1, borderColor: '#ccc', borderRadius: 6, marginVertical: 4 },
  mealDivider: { height: 1, backgroundColor: '#ccc', marginVertical: 4 },
  mealType: { fontWeight: '600', fontSize: 14 },
  mealName: { fontSize: 16, fontWeight: 'bold', marginTop: 2 },
  alertNotifierContainer: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 8 },
  alertItem: { alignItems: 'center', padding: 6, borderWidth: 1, borderColor: 'transparent', borderRadius: 8 },
});



 
