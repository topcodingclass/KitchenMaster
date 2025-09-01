import React, { useEffect, useState, useLayoutEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Modal } from 'react-native';
import { Text, Button, Divider } from 'react-native-paper';
import { collection, getDocs, deleteDoc, doc, query, where, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

const formatExpirationDate = (dateValue) => {
  if (!dateValue) return "No date";
  if (dateValue.toDate) return dateValue.toDate().toLocaleDateString();
  if (typeof dateValue === "string") return new Date(dateValue).toLocaleDateString();
  if (dateValue instanceof Date) return dateValue.toLocaleDateString();
  return "Invalid date";
};

const StorageDetailScreen = ({ route, navigation }) => {
  const { storage } = route.params;
  const [items, setItems] = useState([]);
  const [allStorages, setAllStorages] = useState([]);
  const [moveModalVisible, setMoveModalVisible] = useState(false);
  const [selectedFoodId, setSelectedFoodId] = useState(null);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: storage.name,
      headerRight: () => (
        <Button icon="plus" mode="elevated" onPress={() => navigation.navigate('Food Scan')}>
          Add Food
        </Button>
      ),
    });
  }, [navigation, storage]);

  const fetchItems = async () => {
    try {
      const q = query(collection(db, 'foods'), where('storage', '==', storage.name));
      const snapshot = await getDocs(q);
      setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (e) {
      console.error('Error fetching storage items: ', e);
    }
  };

  const fetchAllStorages = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'storages'));
      setAllStorages(snapshot.docs.map(doc => doc.data().name).filter(name => name !== storage.name));
    } catch (e) {
      console.error('Error fetching storages: ', e);
    }
  };

  useEffect(() => {
    fetchItems();
    fetchAllStorages();
  }, [storage.name]);

  const deleteStorage = async () => {
    if (items.length > 0) {
      alert("Cannot delete storage. Delete all items first.");
      return;
    }
    try {
      const q = query(collection(db, 'storages'), where('name', '==', storage.name));
      const snapshot = await getDocs(q);
      snapshot.forEach(async (docItem) => {
        await deleteDoc(docItem.ref);
      });
      navigation.goBack();
    } catch (e) {
      console.error('Error deleting storage: ', e);
    }
  };

  const deleteFood = async (foodId) => {
    try {
      await deleteDoc(doc(db, 'foods', foodId));
      fetchItems();
    } catch (e) {
      console.error('Error deleting food: ', e);
    }
  };

  const moveFood = async (foodId, targetStorage) => {
    try {
      await updateDoc(doc(db, 'foods', foodId), { storage: targetStorage });
      setMoveModalVisible(false);
      setSelectedFoodId(null);
      fetchItems();
    } catch (e) {
      console.error('Error moving food: ', e);
    }
  };

  const renderItem = ({ item }) => (
    <View style={{ paddingVertical: 10, paddingHorizontal: 5 }}>
      <Text variant="titleSmall" style={{ marginBottom: 2 }}>{item.name}</Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
        <Text variant="bodySmall" style={{ color: 'gray' }}>Quantity: {item.quantity ?? 0}</Text>
        <Text variant="bodySmall" style={{ color: 'gray' }}>Expires: {formatExpirationDate(item.expirationDate)}</Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Button mode="contained" buttonColor="red" onPress={() => deleteFood(item.id)}>Delete</Button>
        <Button mode="contained" onPress={() => { setSelectedFoodId(item.id); setMoveModalVisible(true); }}>Move</Button>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <View style={{ margin: 7, flex: 1 }}>
        <Text variant="headlineSmall" style={{ marginBottom: 10 }}>Food List</Text>
        {items.length === 0 ? (
          <Text>No items in this storage.</Text>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            ItemSeparatorComponent={Divider}
          />
        )}
      </View>
      <View style={{ paddingBottom: 20 }}>
        <Button icon="delete" mode="contained" onPress={deleteStorage}>Delete Storage</Button>
      </View>
          
      <Modal visible={moveModalVisible} transparent animationType="slide">
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text variant="titleMedium">Select Target Storage</Text>
            <FlatList
              data={allStorages}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity style={{ padding: 10 }} onPress={() => moveFood(selectedFoodId, item)}>
                  <Text>{item}</Text>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={Divider}
            />
            <Button mode="contained" style={{ marginTop: 10 }} onPress={() => { setMoveModalVisible(false); setSelectedFoodId(null); }}>
              Cancel
            </Button>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  modalBackground: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalContainer: { backgroundColor: 'white', marginHorizontal: 20, borderRadius: 10, padding: 20 },
});

export default StorageDetailScreen;
