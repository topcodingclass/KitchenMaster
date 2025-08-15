import React, { useEffect, useState } from 'react';
import { FlatList, View } from 'react-native';
import { Text, Divider } from 'react-native-paper';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';

const formatExpirationDate = (dateValue) => {
  if (!dateValue) return "No date";
  if (dateValue.toDate) return dateValue.toDate().toLocaleDateString();
  if (typeof dateValue === "string") return new Date(dateValue).toLocaleDateString();
  if (dateValue instanceof Date) return dateValue.toLocaleDateString();
  return "Invalid date";
};

const StorageDetailScreen = ({ route }) => {
  const { storage } = route.params;
  const [items, setItems] = useState([]);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const q = query(collection(db, 'foods'), where('storage', '==', storage.name));
        const snapshot = await getDocs(q);
        setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (e) {
        console.error('Error fetching storage items: ', e);
      }
    };
    fetchItems();
  }, [storage.name]);

  const renderItem = ({ item }) => (
    <View style={{ paddingVertical: 10, paddingHorizontal: 5 }}>
      <Text variant="titleMedium" style={{ marginBottom: 2 }}>
        {item.name}
      </Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text variant="bodySmall" style={{ color: 'gray' }}>
          Quantity: {item.quantity ?? 0}
        </Text>
        <Text variant="bodySmall" style={{ color: 'gray' }}>
          Expires: {formatExpirationDate(item.expirationDate)}
        </Text>
      </View>
    </View>
  );

  return (
    <>
      <Text variant="headlineSmall" style={{ marginBottom: 10 }}>
        {storage.name}
      </Text>
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
    </>
  );
};

export default StorageDetailScreen;
