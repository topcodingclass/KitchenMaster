import React, { useEffect, useState } from 'react';
import {View,StyleSheet,Image,TouchableOpacity,ActivityIndicator,} from 'react-native';
import { Text, Card, Button } from 'react-native-paper';
import { db, auth } from '../firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';

const MainScreen = ({ navigation }) => {
  const userID = auth.currentUser?.uid;

  const [userName, setUserName] = useState('');
  const [todayMeal, setTodayMeal] = useState('');
  const [expiringFood, setExpiringFood] = useState([]);
  const [allExpiringFood, setAllExpiringFood] = useState([]);
  const [showAllExpiring, setShowAllExpiring] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch user name
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

  // Fetch today's meal plan
  useEffect(() => {
    if (!userID) return;

    const fetchTodayMeal = async () => {
      try {
        const planColRef = collection(db, 'users', userID, 'plan');
        const planSnapshot = await getDocs(planColRef);

        if (!planSnapshot.empty) {
          const planDoc = planSnapshot.docs[0];
          const data = planDoc.data();

          const days = [
            'Sunday',
            'Monday',
            'Tuesday',
            'Wednesday',
            'Thursday',
            'Friday',
            'Saturday',
          ];
          const todayName = days[new Date().getDay()];
          const meal = data[todayName];

          setTodayMeal(meal || 'No meal planned for today');
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

  // Fetch expiring food items
  useEffect(() => {
    if (!userID) return;

    const fetchExpiringFood = async () => {
      try {
        const expiringColRef = collection(db, 'users', userID, 'expiring');
        const expiringSnapshot = await getDocs(expiringColRef);

        if (!expiringSnapshot.empty) {
          const expiringDoc = expiringSnapshot.docs[0];
          const data = expiringDoc.data();

          const sortedKeys = Object.keys(data).sort(
            (a, b) => parseInt(a) - parseInt(b)
          );
          const items = sortedKeys.map((key) => data[key]);

          setAllExpiringFood(items);
          setExpiringFood(items.slice(0, 3));
        } else {
          setAllExpiringFood(['No expiring food']);
          setExpiringFood(['No expiring food']);
        }
      } catch (error) {
        console.error('Error fetching expiring food:', error);
        setAllExpiringFood(['Error loading expiring food']);
        setExpiringFood(['Error loading expiring food']);
      }
    };

    fetchExpiringFood();
  }, [userID]);

  // Set header with welcome message
  useEffect(() => {
    navigation.setOptions({
      title: `Welcome, ${userName || '...'}`,
      headerRight: () => (
        <Button
          mode="contained"
          onPress={() => console.log('Notifications pressed')}
          style={{ marginRight: 8 }}
        >
          Notifications
        </Button>
      ),
    });
  }, [navigation, userName]);

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

  // Navigation functions
  const navigateToGenerate = () => navigation.navigate('RecipeListScreen');
  const navigateToCamera = () => navigation.navigate('FoodScan');
  const navigateToCommunity = () => navigation.navigate('FoodCommunity');
  const navigateToPlanner = () => navigation.navigate('MealPlanner');
  const navigateToStorage = () => navigation.navigate('FoodStorage');
  const navigateToAdd = () => navigation.navigate('FoodAdd');

  // Toggle expiring items view
  const handleSeeAll = () => {
    setShowAllExpiring((prev) => {
      const nextShowAll = !prev;
      setExpiringFood(
        nextShowAll ? allExpiringFood : allExpiringFood.slice(0, 3)
      );
      return nextShowAll;
    });
  };

  return (
    <View style={styles.container}>
      {/* Expiring food section */}
      <Card style={styles.card}>
        <Card.Content style={styles.cardContent}>
          <Text style={styles.sectionTitle}>Expiring Soon</Text>
          {expiringFood.map((item, index) => (
            <Text key={index} style={styles.itemText}>
              • {item}
            </Text>
          ))}

          {allExpiringFood.length > 3 && (
            <TouchableOpacity style={styles.seeAll} onPress={handleSeeAll}>
              <Text style={styles.seeAllText}>
                {showAllExpiring ? '…see less' : '…see all'}
              </Text>
            </TouchableOpacity>
          )}

          <Button mode="outlined" onPress={navigateToStorage}>
            Storage Screen
          </Button>
        </Card.Content>
      </Card>

      {/* Today's meal plan section */}
      <Card style={styles.card}>
        <Card.Content style={styles.cardContent}>
          <Text style={styles.sectionTitle}>Today’s Meal Plan</Text>
          <Text style={styles.itemText}>{todayMeal}</Text>

          <Button mode="outlined" onPress={navigateToPlanner}>
            Meal Planner
          </Button>
        </Card.Content>
      </Card>

      {/* Community recipes section */}
      <Card style={styles.card}>
        <Card.Content style={styles.cardContent}>
          <Text style={styles.sectionTitle}>Popular Recipes</Text>
          <Button mode="outlined" onPress={navigateToCommunity}>
            Community Page
          </Button>
        </Card.Content>
      </Card>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <Button onPress={navigateToGenerate}>
          <Text style={styles.navText}>Generate{'\n'}Recipe</Text>
        </Button>

        <Button onPress={navigateToCamera}>
          <Image
            source={{
              uri: 'https://img.icons8.com/ios-filled/50/000000/camera.png',
            }}
            style={styles.cameraIcon}
          />
        </Button>

        <Button onPress={navigateToAdd}>
          <Text style={styles.navText}>Add{'\n'}Recipe</Text>
        </Button>
      </View>
    </View>
  );
};

export default MainScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eee',
    padding: 16,
    paddingTop: 40,
  },
  card: {
    backgroundColor: '#f2f2f2',
    marginVertical: 10,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  cardContent: {
    flexDirection: 'column',
    gap: 8,
  },
  sectionTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 8,
  },
  itemText: {
    fontSize: 14,
    marginBottom: 4,
  },
  seeAll: {
    marginTop: 4,
    marginBottom: 10,
  },
  seeAllText: {
    color: 'gray',
    fontStyle: 'italic',
  },
  bottomNav: {
    position: 'absolute',
    bottom: 20,
    width: '100%',
    paddingHorizontal: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navText: {
    fontSize: 12,
    textAlign: 'center',
  },
  cameraIcon: {
    width: 40,
    height: 40,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
