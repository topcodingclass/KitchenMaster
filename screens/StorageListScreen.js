import React, { useEffect, useState, useLayoutEffect } from 'react';
import { StyleSheet, View, SafeAreaView, FlatList, Modal, TouchableOpacity } from 'react-native';
import { Text, Divider, Button, TextInput } from 'react-native-paper';
import { collection, getDocs, addDoc, deleteDoc, updateDoc, doc, query, where } from 'firebase/firestore';
import { db } from '../firebase';

const StorageListScreen = ({ navigation }) => {
  const [storages, setStorages] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [storageID, setStorageID] = useState('');
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
        <Button mode="elevated" onPress={() => navigation.navigate('Food List')} style={{ marginBottom: 6 }}>
          Food List
        </Button>
      )
    });
  }, [navigation]);

  const fetchStorages = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "storages"));
      const loadedStorages = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStorages(loadedStorages);
    } catch (e) {
      console.error("Error fetching storages: ", e);
    }
  };

  useEffect(() => {
    fetchStorages();
  }, []);

  const addStorage = async () => {
    try {
      const name = storageID.trim();
      if (!name) return;
      await addDoc(collection(db, 'storages'), { name });
      fetchStorages();
      setStorageID('');
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

  const renderStorageItem = ({ item }) => (
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
        <>
          <Text variant="bodyLarge">{item.name}</Text>
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
        </>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={storages}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.storageCard}
            onPress={() => navigation.navigate('StorageDetail', { storage: item })}>
            <Text variant="titleMedium">{item.name}</Text>
          </TouchableOpacity>
          )}
        keyExtractor={(item) => item.id}/>

      <View style={{ flexDirection: "row", justifyContent: 'space-around' }}>
        <Button mode="contained" onPress={() => setModalVisible(true)}>
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
              renderItem={renderStorageItem}
            />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, alignItems: "center" }}>
              <TextInput
                placeholder="New Storage Name"
                value={storageID}
                onChangeText={setStorageID}
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
