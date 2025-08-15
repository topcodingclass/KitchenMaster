import React, { useEffect, useState, useLayoutEffect } from 'react';
import { StyleSheet, View, SafeAreaView, FlatList, Modal, TouchableOpacity } from 'react-native';
import { Text, Divider, Button, TextInput } from 'react-native-paper';
import { collection, getDocs, addDoc, deleteDoc, updateDoc, doc, query, where } from 'firebase/firestore';
import { db } from '../firebase';

const StorageListScreen = ({ navigation }) => {
  const [storages, setStorages] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [storageNameInput, setStorageNameInput] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <View style={{ flex: 1, flexDirection: "row", alignItems: 'flex-start' }}>
          <Text variant="titleMedium">Storage List</Text>
        </View>
      ),
      headerRight: () => (
        <Button icon="fridge" mode="elevated" onPress={() => navigation.navigate('Food List')} style={{ marginBottom: 6 }}>
          Food List
        </Button>
      )
    });
  }, [navigation]);

  const fetchStorages = async () => {
    try {
      const storageSnap = await getDocs(collection(db, "storages"));
      const loadedStorages = storageSnap.docs.map(doc => ({ id: doc.id, ...doc.data(), itemCount: 0 }));

      const foodSnap = await getDocs(collection(db, "foods"));
      const foods = foodSnap.docs.map(doc => doc.data());

      const storagesWithCounts = loadedStorages.map(storage => {
        const count = foods.filter(food => food.storage === storage.name).length;
        return { ...storage, itemCount: count };
      });

      setStorages(storagesWithCounts);
    } catch (e) {
      console.error("Error fetching storages or foods: ", e);
    }
  };

  useEffect(() => {
    fetchStorages();
  }, []);

  const addStorage = async () => {
    try {
      const name = storageNameInput.trim();
      if (!name) return;
      await addDoc(collection(db, 'storages'), { name });
      fetchStorages();
      setStorageNameInput('');
    } catch (e) {
      console.error('Error adding storage: ', e);
    }
  };

  const deleteStorage = async (storageName) => {
    try {
      const q = query(collection(db, 'storages'), where('name', '==', storageName));
      const snapshot = await getDocs(q);
      const deletePromises = snapshot.docs.map((docItem) => deleteDoc(docItem.ref));
      await Promise.all(deletePromises);
      fetchStorages();
    } catch (e) {
      console.error('Error deleting storage: ', e);
    }
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditName(item.name);
  };

  const saveEdit = async (itemId) => {
    try {
      await updateDoc(doc(db, 'storages', itemId), { name: editName });
      fetchStorages();
      setEditingId(null);
      setEditName('');
    } catch (e) {
      console.error('Error updating storage: ', e);
    }
  };

  const renderStorageItemInPopup = ({ item }) => (
    <View style={styles.storageRow}>
      {editingId === item.id ? (
        <>
          <TextInput
            value={editName}
            onChangeText={setEditName}
            mode="outlined"
            style={{ flex: 1, marginRight: 10 }}
          />
          <Button mode="contained-tonal" onPress={() => saveEdit(item.id)}>
            Save
          </Button>
        </>
      ) : (
        <View style={{ flex: 1 }}>
          <Text variant="bodyLarge">{item.name}</Text>
          <Text variant="bodySmall" style={{ color: 'gray' }}>
            {item.itemCount} {item.itemCount === 1 ? 'item' : 'items'}
          </Text>
        </View>
      )}
      {editingId !== item.id && (
        <View style={{ flexDirection: 'row' }}>
          <Button
            mode="contained-tonal"
            style={{ marginRight: 8 }}
            onPress={() => startEdit(item)}
          >
            Edit
          </Button>
          <Button
            mode="contained"
            buttonColor="red"
            onPress={() => deleteStorage(item.name)}
          >
            Delete
          </Button>
        </View>
      )}
    </View>
  );

  const renderStorageItemInMainList = ({ item }) => (
    <View>
      <TouchableOpacity
        style={styles.storageCard}
        onPress={() => navigation.navigate('StorageDetail', { storage: item })}
      >
        <Text variant="titleMedium">{item.name}</Text>
        <Text variant="bodySmall" style={{ color: 'gray' }}>
          {item.itemCount} {item.itemCount === 1 ? 'item' : 'items'}
        </Text>
      </TouchableOpacity>
      <Divider />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={storages}
        renderItem={renderStorageItemInMainList}
        keyExtractor={(item) => item.id}
      />

      <View style={{ flexDirection: "row", justifyContent: 'space-around' }}>
        <Button icon="file-cabinet" mode="contained" onPress={() => setModalVisible(true)}>
          Manage Storages
        </Button>
      </View>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text variant="titleMedium">Manage Storages</Text>

            <FlatList
              data={storages}
              keyExtractor={(item) => item.id}
              renderItem={renderStorageItemInPopup}
            />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, alignItems: "center" }}>
              <TextInput
                placeholder="New Storage Name"
                value={storageNameInput}
                onChangeText={setStorageNameInput}
                mode="outlined"
                style={{ flex: 1, marginRight: 10 }}
              />
              <Button icon="archive-plus-outline" mode="contained-tonal" onPress={addStorage}>
                Add Storage
              </Button>
            </View>

            <Button mode="contained" style={styles.closeButton} onPress={() => setModalVisible(false)}>
              Close
            </Button>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default StorageListScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    margin: 7
  },
  storageCard: {
    paddingVertical: 12,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderColor: '#ccc',
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContainer: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 10,
    padding: 20,
  },
  storageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  closeButton: {
    marginTop: 20
  }
});
