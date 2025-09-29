import React, { useEffect, useState, useLayoutEffect } from 'react';
import RecipeCard from '../components/RecipeCard';
import {View,StyleSheet,Image,TouchableOpacity,ActivityIndicator,ScrollView,FlatList,Modal,Animated,Dimensions,} from 'react-native';
import { Text, Card, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db, auth } from '../firebase';
import { collection, getDocs, doc, getDoc, query, where } from 'firebase/firestore';

const formatExpirationDate = (dateValue) => {
  if (!dateValue) return 'No date';
  const d = new Date(dateValue);
  return d.toLocaleDateString();
};

const MainScreen = ({ navigation }) => {
  const userID = auth.currentUser?.uid;

  const [userName, setUserName] = useState('');
  const [todayMeal, setTodayMeal] = useState('');
  const [todayName, setTodayName] = useState('');
  const [expiringFood, setExpiringFood] = useState([]);
  const [allExpiringFood, setAllExpiringFood] = useState([]);
  const [showAllExpiring, setShowAllExpiring] = useState(false);
  const [loading, setLoading] = useState(true);

  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [drawerAnim] = useState(new Animated.Value(Dimensions.get('window').width));

  const [savedRecipes, setSavedRecipes] = useState([]);

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
  }, [navigation, notifications, userName]);

  useEffect(() => {
    if (!userID) return;

    const fetchUserName = async () => {
      try {
        const userRef = doc(db, 'users', userID);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          setUserName(userSnap.data().name || 'Guest');
        } else {
          setUserName('Guest');
        }
      } catch (error) {
        console.error('Error fetching user name:', error);
        setUserName('Guest');
      }
    };

    fetchUserName();
  }, [userID]);

  useEffect(() => {
    if (!userID) return;

    const fetchNotifications = async () => {
      try {
        const notifQuery = query(
          collection(db, 'notifications'),
          where('userID', '==', userID)
        );
        const notifSnapshot = await getDocs(notifQuery);
        const notifList = notifSnapshot.docs.map(doc => doc.data().message || '');
        setNotifications(notifList);
      } catch (error) {
        console.error('Error fetching notifications:', error);
        setNotifications([]);
      }
    };
    fetchNotifications();
  }, [userID]);

  useEffect(() => {
    if (!userID) return;

    const fetchRecipes = async () => {
      try {
        const recipesQuery = query(
          collection(db, 'recipes'),
          where('userId', '==', userID)
        );
        const snapshot = await getDocs(recipesQuery);
        const userRecipes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setSavedRecipes(userRecipes);
      } catch (error) {
        console.error('Error fetching saved recipes:', error);
        setSavedRecipes([]);
      }
    };
    fetchRecipes();
  }, [userID]);

  useEffect(() => {
    if (!userID) return;

    const fetchExpiringFood = async () => {
      try {
        const foodsQuery = query(
          collection(db, 'foods'),
          where('userID', '==', userID)
        );
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
      } catch (error) {
        console.error('Error fetching expiring food:', error);
        setAllExpiringFood([]);
        setExpiringFood([]);
      }
    };

    fetchExpiringFood();
  }, [userID]);

  useEffect(() => {
    if (!userID) return;

    const fetchTodayMeal = async () => {
      try {
        const mealPlanRef = doc(db, 'mealPlans', userID);
        const mealPlanSnap = await getDoc(mealPlanRef);

        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const today = days[new Date().getDay()];
        setTodayName(today);

        if (mealPlanSnap.exists()) {
          const data = mealPlanSnap.data();
          setTodayMeal(data[today] || 'No meal planned for today');
        } else {
          setTodayMeal('No meal planned for today');
        }
      } catch (error) {
        console.error('Error fetching today’s meal:', error);
        setTodayMeal('No meal planned for today');
      } finally {
        setLoading(false);
      }
    };

    fetchTodayMeal();
  }, [userID]);

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
    setShowAllExpiring((prev) => {
      const next = !prev;
      setExpiringFood(next ? allExpiringFood : allExpiringFood.slice(0, 3));
      return next;
    });
  };

  return (
    <View style={styles.container}>
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
        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <Text style={styles.sectionTitle}>Top Recipes</Text>
            {savedRecipes.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 8 }}>
                {savedRecipes.map((recipe) => (
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
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.foodRow}>
                  <Text style={styles.foodName}>{item.name}</Text>
                  <Text style={styles.foodMeta}>Qty: {item.quantity ?? 1}</Text>
                  <Text style={styles.foodMeta}>{formatExpirationDate(item.expirationDate)}</Text>
                </View>
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

        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <Text style={styles.sectionTitle}>Today’s Meal Plan</Text>
            <Text style={styles.itemText}>
              {todayName ? `${todayName}: ${todayMeal}` : todayMeal}
            </Text>
            <Button mode="outlined" onPress={navigateToPlanner}>Meal Planner</Button>
          </Card.Content>
        </Card>
      </ScrollView>

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
  card: { backgroundColor: '#f9f9f9', marginVertical: 10, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#ddd' },
  cardContent: { flexDirection: 'column', gap: 8 },
  sectionTitle: { fontWeight: 'bold', fontSize: 16, marginBottom: 8 },
  itemText: { fontSize: 14, marginBottom: 4 },
  seeAll: { marginTop: 4, marginBottom: 10 },
  seeAllText: { color: 'gray', fontStyle: 'italic' },
  bottomNav: { position: 'absolute', bottom: 20, width: '100%', paddingHorizontal: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
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
});
