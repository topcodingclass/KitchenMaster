import React, { useState, useLayoutEffect } from 'react';
import { View, StyleSheet, Image, TouchableOpacity, ActivityIndicator, FlatList, Modal, Animated, Dimensions } from 'react-native';
import { Text, Card, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { db, auth } from '../firebase';
import { collection, getDocs, doc, getDoc, query, where } from 'firebase/firestore';
import RecipeCard from '../components/RecipeCard';

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

  useLayoutEffect(() => {
    navigation.setOptions({
      headerBackVisible: false,
      headerLeft: () => (
        <Text style={styles.welcomeText}>
          {userName ? `Welcome, ${userName}` : 'Welcome'}
        </Text>
      ),
      headerRight: () => (
        <TouchableOpacity style={styles.notificationButton} onPress={() => setShowNotifications(true)}>
          <Image
            source={{ uri: 'https://assets.streamlinehq.com/image/private/w_300,h_300,ar_1/f_auto/v1/icons/notifications/bell-oidqm6rhvuc2en0khzvmw2.png/bell-ligh2sop7xi1hvsmujni.png?_a=DATAg1AAZAA0' }}
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
  
  useFocusEffect(
    React.useCallback(() => {
      if (!userID) return;
      const fetchAll = async () => {
        try {
          setLoading(true);
          const userRef = doc(db, 'users', userID);
          const userSnap = await getDoc(userRef);
          setUserName(userSnap.exists() ? userSnap.data().name || 'Guest' : 'Guest');

          const notifQuery = query(collection(db, 'notifications'), where('userID', '==', userID));
          const notifSnapshot = await getDocs(notifQuery);
          setNotifications(notifSnapshot.docs.map(doc => doc.data().message || ''));

          const recipesQuery = query(collection(db, 'recipes'), where('userId', '==', userID));
          const recipeSnap = await getDocs(recipesQuery);
          setSavedRecipes(recipeSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

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


          const year = today.getFullYear();
          const month = String(today.getMonth() + 1).padStart(2, '0');
          const day = String(today.getDate()).padStart(2, '0');

          // 🔹 Build ISO-style string range for today
          const startOfDay = `${year}-${month}-${day}T00:00:00.000Z`;
          const endOfDay = `${year}-${month}-${day}T23:59:59.999Z`;

          console.log(userID, startOfDay, endOfDay)

          // Step 1: Query top-level mealPlans collection for the user
          const parentQuery = query(
            collection(db, "mealPlans"),
            where("userID", "==", userID),
            where("date", ">=", startOfDay),
            where("date", "<=", endOfDay)
          );

          const parentSnap = await getDocs(parentQuery);

          if (!parentSnap.empty) {
            // Step 2: Get the subcollection mealPlan inside the matched document
            const parentDoc = parentSnap.docs[0];
            const subRef = collection(db, "mealPlans", parentDoc.id, "mealPlan");

            const subSnap = await getDocs(subRef);

            if (!subSnap.empty) {
              const meals = subSnap.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
              }));
              setTodayMeal(meals);
            } else {
              setTodayMeal([]);
            }
          } else {
            setTodayMeal("No meal planned for today");
          }
        } catch (error) {
          console.error('Error refreshing data:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchAll();
    }, [userID])
  );

  if (!userID) return <View style={styles.centered}><Text>Please log in to see your data</Text></View>;
  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" /><Text>Loading...</Text></View>;

  const handleSeeAllExpiring = () => {
    setShowAllExpiring(prev => {
      const next = !prev;
      setExpiringFood(next ? allExpiringFood : allExpiringFood.slice(0, 3));
      return next;
    });
  };

  const renderContent = () => (
    <View>
      {/* Top Recipes */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Top Recipes</Text>
          {savedRecipes.length > 0 ? (
            <FlatList
              data={savedRecipes}
              horizontal
              keyExtractor={item => item.id}
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => (
                <RecipeCard
                  recipe={item}
                  onPress={() => navigation.navigate('Recipe Detail', { recipe: item })}
                />
              )}
            />
          ) : (
            <Text>No saved recipes yet.</Text>
          )}
        </Card.Content>
      </Card>

      {/* Expiring Soon */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>Expiring Soon</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Food List')}>
              <Text style={{ color: '#007AFF' }}>View All Foods</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={expiringFood}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.foodRow}
                onPress={() => navigation.navigate('Food Detail', { food: item })}
              >
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
          <Button mode="outlined" onPress={() => navigation.navigate('Storage List')} style={{marginTop:7}}>
            View Storage
          </Button>
        </Card.Content>
      </Card>

      {/* Today’s Meal Plan */}
<Card style={styles.card}>
  <Card.Content>
    <Text style={styles.sectionTitle}>Today’s Meal Plan</Text>

    {Array.isArray(todayMeal) && todayMeal.length > 0 ? (
      todayMeal.map((meal, index) => (
        <TouchableOpacity
          key={index}
          style={styles.mealRow}
          onPress={() =>
            navigation.navigate("Meal Planner Detail", {
              meal: {
                id: meal.id,
                mealName: meal.mealName,
                mealType: meal.mealType,
                recipeID: meal.recipeID,
                date: meal.date,
              },
            })
          }
        >
          <Text style={styles.mealType}>{meal.mealType}:</Text>
          <Text style={styles.mealName}>{meal.mealName}</Text>
        </TouchableOpacity>
      ))
    ) : (
      <Text style={styles.itemText}>No meal planned for today</Text>
    )}

    <Button mode="outlined" onPress={() => navigation.navigate("Meal Planner")} style={{marginTop:7}}>
      Meal Planner
    </Button>
  </Card.Content>
</Card>


    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={[1]}
        renderItem={renderContent}
        keyExtractor={() => 'content'}
        contentContainerStyle={{ paddingBottom: 120 }}
      />
      <View style={styles.bottomNav}>
        <Button style={{ width: '45%' }} onPress={() => navigation.navigate('Recipe List')} mode="contained" icon="pot-steam">
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
  container: { flex: 1, backgroundColor: '#eee', padding: 7 },
  card: { backgroundColor: '#f9f9f9', marginVertical: 4, padding: 5, borderRadius: 8, borderWidth: 1, borderColor: '#ddd' },
  sectionTitle: { fontWeight: 'bold', fontSize: 16, marginBottom: 5 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemText: { fontSize: 14, marginBottom: 4 },
  seeAll: { marginTop: 4, marginBottom: 10 },
  seeAllText: { color: 'gray', fontStyle: 'italic' },
  foodRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderColor: '#e0e0e0' },
  foodName: { fontWeight: '600', flex: 1 },
  foodMeta: { fontSize: 12, color: '#555', marginLeft: 10 },
  bottomNav: { position: 'absolute', bottom: 20, width: '100%', paddingLeft: 15, flexDirection: 'row', justifyContent: 'space-around' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  notificationButton: { flexDirection: 'row', alignItems: 'center', position: 'relative', marginLeft: 12 },
  notifBadge: { position: 'absolute', top: -4, right: -4, backgroundColor: 'red', borderRadius: 10, paddingHorizontal: 5, paddingVertical: 1 },
  notifBadgeText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  welcomeText: { fontSize: 15, fontWeight: '600', color: '#333', marginLeft: 12 },
  mealRow: {
  flexDirection: "row",
  alignItems: "center",
  paddingVertical: 4,
},
mealType: {
  fontWeight: "bold",
  fontSize: 14,
  color: "#333",
  marginRight: 6,
},
mealName: {
  fontSize: 14,
  color: "#555",
},
});
