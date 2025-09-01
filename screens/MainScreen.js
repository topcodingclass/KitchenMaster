//2025-8-31 fixed navigation errors and screen design



import React, { useEffect, useState, useLayoutEffect } from 'react';
import {View,StyleSheet,Image,TouchableOpacity,ActivityIndicator,} from 'react-native';
import { Text, Card, Button } from 'react-native-paper';
import { db, auth } from '../firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';

const MainScreen = ({ navigation }) => {
  const userID = auth.currentUser?.uid;

  const [userName, setUserName] = useState('');
  const [todayMeal, setTodayMeal] = useState('');
  const [todayName, setTodayName] = useState(''); // store current day name
  const [expiringFood, setExpiringFood] = useState([]);
  const [allExpiringFood, setAllExpiringFood] = useState([]);
  const [showAllExpiring, setShowAllExpiring] = useState(false);
  const [loading, setLoading] = useState(true);

  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
    headerBackVisible: false,   // 🔹 hides the back arrow (RN v6+)
      headerLeft: () => null,     // extra safeguard
      headerRight: () => (
        <TouchableOpacity
          style={styles.notificationButton}
          onPress={() => setShowNotifications(prev => !prev)}
        >
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
  }, [navigation, notifications]);

  // Fetch user name
  useEffect(() => {
    if (!userID) return;

    const fetchUserName = async () => {
      try {
        const userRef = doc(db, 'users', userID);
        const userSnap = await getDoc(userRef);
        setUserName(userSnap.exists() ? userSnap.data().name || 'Guest' : 'Guest');
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
            'Sunday', 'Monday', 'Tuesday', 'Wednesday',
            'Thursday', 'Friday', 'Saturday'
          ];
          const today = days[new Date().getDay()];

          setTodayName(today); // ✅ save the day
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

  // Fetch expiring food
  useEffect(() => {
    if (!userID) return;

    const fetchExpiringFood = async () => {
      try {
        const expiringColRef = collection(db, 'users', userID, 'expiring');
        const expiringSnapshot = await getDocs(expiringColRef);

        if (!expiringSnapshot.empty) {
          const expiringDoc = expiringSnapshot.docs[0];
          const data = expiringDoc.data();
          const sortedKeys = Object.keys(data).sort((a, b) => parseInt(a) - parseInt(b));
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

  // Fetch notifications
  useEffect(() => {
    if (!userID) return;

    const fetchNotifications = async () => {
      try {
        const notifColRef = collection(db, 'users', userID, 'notifications');
        const notifSnapshot = await getDocs(notifColRef);

        if (!notifSnapshot.empty) {
          const notifDoc = notifSnapshot.docs[0]; 
          const data = notifDoc.data();
          const sortedKeys = Object.keys(data).sort();
          const notifList = sortedKeys.map(key => data[key]);
          setNotifications(notifList);
        } else {
          setNotifications([]);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
        setNotifications([]);
      }
    };

    fetchNotifications();
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

  // Navigation functions
  const navigateToGenerate = () => navigation.navigate('Recipe List');
  const navigateToCamera = () => navigation.navigate('Food Scan');
  const navigateToCommunity = () => navigation.navigate('Community Recipes');
  const navigateToPlanner = () => navigation.navigate('Meal Planner');
  const navigateToStorage = () => navigation.navigate('Storage List');

  // Toggle expiring items view
  const handleSeeAllExpiring = () => {
    setShowAllExpiring(prev => {
      const next = !prev;
      setExpiringFood(next ? allExpiringFood : allExpiringFood.slice(0, 3));
      return next;
    });
  };

  return (
    <View style={styles.container}>
      {/* Notifications Tab */}
      {showNotifications && (
        <Card style={styles.notificationsTab}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Notifications</Text>
            {notifications.length > 0 ? (
              notifications.map((item, index) => (
                <Text key={index} style={styles.itemText}>• {item}</Text>
              ))
            ) : (
              <Text>No notifications</Text>
            )}
          </Card.Content>
        </Card>
      )}

      {/* Expiring food section */}
      <Card style={styles.card}>
        <Card.Content style={styles.cardContent}>
          <Text style={styles.sectionTitle}>Expiring Soon</Text>
          {expiringFood.map((item, index) => (
            <Text key={index} style={styles.itemText}>• {item}</Text>
          ))}
          {allExpiringFood.length > 3 && (
            <TouchableOpacity style={styles.seeAll} onPress={handleSeeAllExpiring}>
              <Text style={styles.seeAllText}>
                {showAllExpiring ? '…see less' : '…see all'}
              </Text>
            </TouchableOpacity>
          )}
          <Button mode="outlined" onPress={navigateToStorage}>Storage Screen</Button>
        </Card.Content>
      </Card>

      {/* Today's meal plan section */}
      <Card style={styles.card}>
        <Card.Content style={styles.cardContent}>
          <Text style={styles.sectionTitle}>Today’s Meal Plan</Text>
          <Text style={styles.itemText}>
            {todayName ? `${todayName}: ${todayMeal}` : todayMeal}
          </Text>
          <Button mode="outlined" onPress={navigateToPlanner}>Meal Planner</Button>
        </Card.Content>
      </Card>

      {/* Community recipes section */}
      <Card style={styles.card}>
        <Card.Content style={styles.cardContent}>
          <Text style={styles.sectionTitle}>Popular Recipes</Text>
          <Button mode="outlined" onPress={navigateToCommunity}>Community Page</Button>
        </Card.Content>
      </Card>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <Button style={{width:'170'}}onPress={navigateToGenerate}mode="contained" icon="pot-steam" ustifyContent="center">Generate Recipe
        </Button>

        <Button style={{width:'170'}}onPress={navigateToCamera}mode="contained" icon="camera" justifyContent="center">Scan Food
        </Button>
      </View>
    </View>
  );
};

export default MainScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#eee', padding: 7, },
  card: { backgroundColor: '#f2f2f2', marginVertical: 10, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#ccc' },
  cardContent: { flexDirection: 'column', gap: 8 },
  sectionTitle: { fontWeight: 'bold', fontSize: 16, marginBottom: 8 },
  itemText: { fontSize: 14, marginBottom: 4 },
  seeAll: { marginTop: 4, marginBottom: 10 },
  seeAllText: { color: 'gray', fontStyle: 'italic' },
  bottomNav: { position: 'absolute', bottom: 20, width: '100%', paddingHorizontal: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  navText: { fontSize: 12, textAlign: 'center' },
  cameraIcon: { width: 40, height: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  notificationButton: { flexDirection: 'row', alignItems: 'center', position: 'relative' },
  notifBadge: { position: 'absolute', top: -4, right: -4, backgroundColor: 'red', borderRadius: 10, paddingHorizontal: 5, paddingVertical: 1 },
  notifBadgeText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  notificationsTab: { backgroundColor: 'white', marginBottom: 10, borderRadius: 8, borderWidth: 1, borderColor: '#ccc' },
});
