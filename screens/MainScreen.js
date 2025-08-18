import React, { useLayoutEffect, useState } from 'react';
import { View, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Text, Card, Button } from 'react-native-paper';
import { db, auth } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

const MainScreen = ({ navigation, route }) => {
  const userID = auth.currentUser.uid;
  const [userName, setUserName] = useState('');

  useLayoutEffect(() => {
    const fetchUserName = async () => {
      try {
        const userRef = doc(db, 'users', userID);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          setUserName(userSnap.data().name || 'Guest');
        } else {
          console.log('No such user document!');
        }
      } catch (error) {
        console.error('Error fetching user name:', error);
      }
    };

    fetchUserName();
  }, [userID]);

  useLayoutEffect(() => {
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

  const navigateToGenerate = () => {
    console.log('Generate recipe pressed');
  };

  const navigateToCamera = () => {
    console.log('Camera Button pressed');
  };

  const navigateToCommunity = () => {
    console.log('Community page pressed');
  };

  return (
    <View style={styles.container}>
      <Text>{userID}</Text>

      {/* expiring food */}
      <Card style={styles.card}>
        <Card.Content style={styles.cardContent}>
          <Text>Food that expires soon</Text>
          <TouchableOpacity style={styles.seeAll}>
            <Text style={{ color: 'gray' }}>…see all</Text>
          </TouchableOpacity>
        </Card.Content>
      </Card>

      {/* meal plan area */}
      <Card style={styles.card}>
        <Card.Content>
          <Text>Today’s meal plan…</Text>
        </Card.Content>
      </Card>

      {/* viral recipes */}
      <Card style={styles.card}>
        <Card.Content style={styles.cardContent}>
          <Text>Popular recipes</Text>
          <TouchableOpacity style={styles.seeAll}>
            <Text style={{ color: 'gray' }}>…see all</Text>
          </TouchableOpacity>
        </Card.Content>
      </Card>

      {/* buttons */}
      <View style={styles.bottomNav}>
        <TouchableOpacity onPress={navigateToGenerate}>
          <Text style={styles.navText}>Generate{"\n"}recipe</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={navigateToCamera}>
          <Image
            source={{ uri: 'https://img.icons8.com/ios-filled/50/000000/camera.png' }}
            style={styles.cameraIcon}
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={navigateToCommunity}>
          <Text style={styles.navText}>Community{"\n"}page</Text>
        </TouchableOpacity>
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
    borderRadius: 24,
  },
  card: {
    backgroundColor: '#f2f2f2',
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  seeAll: {
    padding: 4,
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
});
