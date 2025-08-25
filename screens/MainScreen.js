import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
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

  useEffect(() => {
    if (!userID) return;

    const fetchTodayMeal = async () => {
      try {
        const planColRef = collection(db, 'users', userID, 'plan');
        const planSnapshot = await getDocs(planColRef);

        if (!planSnapshot.empty) {
          const planDoc = planSnapshot.docs[0];
          const data = planDoc.data();

          const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
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

  useEffect(() => {
    if (!userID) return;

    const fetchExpiringFood = async () => {
      try {
        const expiringColRef = collection(db, 'users', userID, 'expiring');
        const expiringSnapshot = await getDocs(expiringColRef);

        if (!expiringSnapshot.empty) {
          const expiringDoc = expiringSnapshot.docs[0];
          const data = expiringDoc.data();

          const sortedKeys = Object.keys(data).sort((a,b) => parseInt(a) - parseInt(b));
          const items = sortedKeys.map(key => data[key]);

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

  // Set header
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

  const navigateToGenerate = () => {navigation.navigate('RecipeListScreen');};
  const navigateToCamera = () => {navigation.navigate('FoodScan');};
  const navigateToCommunity = () => {navigation.navigate('FoodCommunity');};

  // Toggle first 3 vs all expiring items
  const handleSeeAll = () => {
    if (showAllExpiring) {
      setExpiringFood(allExpiringFood.slice(0, 3));
    } else {
      setExpiringFood(allExpiringFood);
    }
    setShowAllExpiring(!showAllExpiring);
  };

  return (
    <View style={styles.container}>
      {/* Expiring food */}
      <Card style={styles.card}>
        <Card.Content style={styles.cardContent}>
          <Text>Food that expires soon:</Text>
          <View>
            {expiringFood.map((item, index) => (
              <Text key={index}>- {item}</Text>
            ))}
          </View>
          {allExpiringFood.length > 0 && (
            <TouchableOpacity style={styles.seeAll} onPress={handleSeeAll}>
              <Text style={{ color: 'gray' }}>
                {showAllExpiring ? '…see less' : '…see all'}
              </Text>
            </TouchableOpacity>
          )}
        </Card.Content>
      </Card>

      {/* Today’s meal plan */}
      <Card style={styles.card}>
        <Card.Content>
          <Text>Today’s meal plan: {todayMeal}</Text>
        </Card.Content>
      </Card>

      {/* Popular recipes */}
      <Card style={styles.card}>
        <Card.Content style={styles.cardContent}>
          <Text>Popular recipes</Text>
          <TouchableOpacity style={styles.seeAll}>
            <Text style={{ color: 'gray' }}>…see all</Text>
          </TouchableOpacity>
        </Card.Content>
      </Card>

      {/* Bottom navigation buttons */}
      <View style={styles.bottomNav}>
        <Button onPress={navigateToGenerate}>
          <Text style={styles.navText}>Generate{"\n"}recipe</Text>
        </Button>

        <Button onPress={navigateToCamera}>
          <Image
            source={{ uri: 'https://img.icons8.com/ios-filled/50/000000/camera.png' }}
            style={styles.cameraIcon}
          />
        </Button>

        <Button onPress={navigateToCommunity}>
          <Text style={styles.navText}>Community{"\n"}page</Text>
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
    borderWidth: 1,
    borderColor: '#ccc',
  },
  cardContent: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  seeAll: {
    padding: 4,
    marginTop: 4,
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
