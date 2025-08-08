import React from 'react';
import { View, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Text, Card, IconButton } from 'react-native-paper';

const MainScreen = () => {
  const navigateToGenerate = () => {
    console.log('Generate recipe pressed');
  };

  const navigateToCamera = () => {
    console.log('Camera icon pressed');
  };

  const navigateToCommunity = () => {
    console.log('Community page pressed');
  };

  return (
    <View style={styles.container}>
      {/* header */}
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome, (name)</Text>
        <IconButton icon="bell-outline" size={24} />
      </View>

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

      {/*buttons */}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: '500',
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
