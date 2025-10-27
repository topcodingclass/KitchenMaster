import React, { useEffect, useState, useLayoutEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Modal, Image } from 'react-native';
import { Text, Button, Divider } from 'react-native-paper';
import { collection, getDocs, deleteDoc, doc, query, where, updateDoc } from 'firebase/firestore';
import { db, storage as fbStorage } from '../firebase';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

const formatExpirationDate = (dateValue) => {
  if (!dateValue) return 'No date';
  if (dateValue.toDate) return dateValue.toDate().toLocaleDateString();
  if (typeof dateValue === 'string') return new Date(dateValue).toLocaleDateString();
  if (dateValue instanceof Date) return dateValue.toLocaleDateString();
  return 'Invalid date';
};

const StorageDetailScreen = ({ route, navigation }) => {
  const { storage } = route.params;
  const auth = getAuth();
  const user = auth.currentUser;

  const [items, setItems] = useState([]);
  const [allStorages, setAllStorages] = useState([]);
  const [moveModalVisible, setMoveModalVisible] = useState(false);
  const [selectedFoodId, setSelectedFoodId] = useState(null);

  const [storageDocId, setStorageDocId] = useState(storage?.id ?? null);
  const [imageurl, setImageurl] = useState(storage?.picture ?? null);
  const [uploadStatus, setUploadStatus] = useState('');

  useLayoutEffect(() => {
    navigation.setOptions({
      title: storage.name,
      headerRight: () => (
        <Button icon="plus" onPress={() => navigation.navigate('Food Scan')}>
          Add Food
        </Button>
      ),
    });
  }, [navigation, storage]);

  const ensureStorageDocId = async () => {
    if (storageDocId) return storageDocId;
    const q = query(
      collection(db, 'storages'),
      where('name', '==', storage.name),
      where('userID', '==', user.uid)
    );
    const snap = await getDocs(q);
    if (snap.empty) throw new Error('Storage doc not found');
    const d = snap.docs[0];
    setStorageDocId(d.id);
    const pic = d.data().picture || null;
    if (pic && !imageurl) setImageurl(pic);
    return d.id;
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Photo library permission is required.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.9,
      });

      if (!result.canceled && result.assets?.length > 0) {
        const uri = result.assets[0].uri;
        await uploadImage(uri);
      }
    } catch (error) {
      console.error('Error picking image: ', error);
      setUploadStatus('Pick failed');
    }
  };

  const uploadImage = async (uri) => {
    try {
      setUploadStatus('Uploading...');
      const id = await ensureStorageDocId();
      const resp = await fetch(uri);
      const blob = await resp.blob();

      const timestamp = new Date().toISOString().replace(/[:.-]/g, '');
      const filename = `${timestamp}_${uri.substring(uri.lastIndexOf('/') + 1)}`;
      const objectPath = `storages/${id}/${filename}`;

      const storageRef = ref(fbStorage, objectPath);
      await uploadBytes(storageRef, blob, { contentType: blob.type || 'image/jpeg' });
      const url = await getDownloadURL(storageRef);

      await updateDoc(doc(db, 'storages', id), { picture: url });
      setImageurl(url);
      navigation.setParams({ storage: { ...storage, id, picture: url } });
      setUploadStatus('Upload successful');
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadStatus('Upload failed');
      alert('Image upload failed. Check console for details.');
    }
  };

  const fetchItems = async () => {
    try {
      if (!user) return;
      const qFoods = query(
        collection(db, 'foods'),
        where('storage', '==', storage.name),
        where('userID', '==', user.uid)
      );
      const snapshot = await getDocs(qFoods);
      setItems(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error('Error fetching storage items: ', e);
    }
  };

  const fetchAllStorages = async () => {
    try {
      if (!user) return;
      const qStorages = query(
        collection(db, 'storages'),
        where('userID', '==', user.uid)
      );
      const snapshot = await getDocs(qStorages);
      setAllStorages(
        snapshot.docs
          .map((d) => d.data().name)
          .filter((name) => name !== storage.name)
      );
    } catch (e) {
      console.error('Error fetching storages: ', e);
    }
  };

  useEffect(() => {
    fetchItems();
    fetchAllStorages();
    if (!storageDocId || imageurl == null) {
      ensureStorageDocId().catch(() => {});
    }
  }, [storage.name, user]);

  const deleteStorage = async () => {
    if (items.length > 0) {
      alert('Cannot delete storage. Delete all items first.');
      return;
    }
    try {
      const id = await ensureStorageDocId();
      await deleteDoc(doc(db, 'storages', id));
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
      <Text variant="titleSmall" style={{ marginBottom: 2 }}>
        {item.name}
      </Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
        <Text variant="bodySmall" style={{ color: 'gray' }}>
          Quantity: {item.quantity ?? 0}
        </Text>
        <Text variant="bodySmall" style={{ color: 'gray' }}>
          Expires: {formatExpirationDate(item.expirationDate)}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Button mode="outlined" onPress={() => deleteFood(item.id)}>
          Delete
        </Button>
        <Button mode="outlined" onPress={() => { setSelectedFoodId(item.id); setMoveModalVisible(true); }}>
          Move
        </Button>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <View style={{ margin: 12, alignItems: 'center' }}>
        {imageurl ? (
          <>
            <Image source={{ uri: imageurl }} style={{ width: '100%', height: 180, borderRadius: 12 }} resizeMode="cover" />
            <Button icon="image-edit" mode="contained-tonal" style={{ marginTop: 10 }} onPress={pickImage}>
              Change Photo
            </Button>
            {!!uploadStatus && (
              <Text variant="bodySmall" style={{ marginTop: 6, color: 'gray' }}>
                {uploadStatus}
              </Text>
            )}
          </>
        ) : (
          <>
            <View
              style={{
                width: '100%',
                height: 160,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: '#ddd',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text>No image</Text>
            </View>
            <Button icon="image-plus" mode="contained-tonal" style={{ marginTop: 10 }} onPress={pickImage}>
              Add Photo
            </Button>
            {!!uploadStatus && (
              <Text variant="bodySmall" style={{ marginTop: 6, color: 'gray' }}>
                {uploadStatus}
              </Text>
            )}
          </>
        )}
      </View>

      <View style={{ margin: 7, flex: 1 }}>
        <Text variant="titleMedium" style={{ marginBottom: 10 }}>
          Food List
        </Text>
        {items.length === 0 ? (
          <Text>No items in this storage.</Text>
        ) : (
          <FlatList data={items} keyExtractor={(item) => item.id} renderItem={renderItem} ItemSeparatorComponent={Divider} />
        )}
      </View>

      <View style={{ margin: 10, paddingBottom: 20 }}>
        <Button icon="delete" mode="contained" onPress={deleteStorage}>
          Delete Storage
        </Button>
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
            <Button
              mode="contained"
              style={{ marginTop: 10 }}
              onPress={() => {
                setMoveModalVisible(false);
                setSelectedFoodId(null);
              }}
            >
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
