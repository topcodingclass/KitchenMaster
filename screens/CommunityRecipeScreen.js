import { StyleSheet, Text, View, FlatList } from 'react-native'
import React from 'react'
import { collection , getDocs, addDoc } from "firebase/firestore"; 
import { db } from '../firebase';
import { FlatList, SafeAreaView } from 'react-native-web';
import { Item } from 'react-native-paper/lib/typescript/components/Drawer/Drawer';

const CommunityRecipeScreenState = () => {
  const [todoList, setTodoList] = useState([]);

    useEffect (()=>{
        const readTodos = async () => {
            const querySnapshot = await getDocs(collection(db, "book"));

            setToDolist(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            
        }
        readTodos()

    }, [])

  

  return (
    <SafeAreaView>
      <View>
        <Text>Top Ten Best Rated Dishes</Text>
        <FlatList data = {setTodoList} renderItem={renderToDoItem} keyExtractor={Item}/>
      </View>
      
    </SafeAreaView>
  )

}

const CommunityRecipeScreen = () => {
  return (
    <View>
      <Text>CommunityRecipeScreen</Text>
      
    </View>
  )
}



export default CommunityRecipeScreen

const styles = StyleSheet.create({})
