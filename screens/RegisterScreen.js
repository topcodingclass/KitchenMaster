import { StyleSheet, View, SafeAreaView} from 'react-native'
import {Text, TextInput,Button} from 'react-native-paper'
import React, {useState, useEffect} from 'react'
import { createUserWithEmailAndPassword } from "firebase/auth";
import {db, auth} from '../firebase'
import {collection, setDoc, doc, getDocs } from "firebase/firestore"; 



const RegisterScreen = ({navigation}) => {
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [weight, setWeight] = useState("")
    const [password, setPassword] = useState("")
    const [yob, setYob] = useState("")
    const [city, setCity] = useState("")
    const [zip, setZip] = useState("")
    const [height, setHeight] = useState("")

    
    const signUp = async () => {
        createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            // Signed up 
            const userId = userCredential.user.uid;
            // Add user data to Firestore
            addUser(userId)
            navigation.navigate('Login')
            
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            console.log(errorMessage)
        });
    }

    const addUser = async (userId) => { 
        try{
        await setDoc(doc(db, "users", userId), {
            name,
            email,
            weight,
            height,
            yob,
            password,
            city,
            zip
          });


      console.log("Document written with ID: ", userId);
    } catch (e) {
      console.error("Error adding document: ", e);
    }
  }


  return (
    <SafeAreaView style={{flex:1, padding:15,}}>
      <TextInput style={styles.input} label="Email" value={email} onChangeText={setEmail} autoCapitalize='none'/>
      <TextInput style={styles.input} label="Password" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize='none'/>
      <TextInput style={styles.input} label="Name" value={name} onChangeText={setName} />
      <TextInput style={styles.input} label="Year Of Birth" value={yob} onChangeText={setYob} />     
      <TextInput style={styles.input} label="City" value={city} onChangeText={setCity} /> 
      <TextInput style={styles.input} label="Zip" value={zip} onChangeText={setZip} /> 
      <TextInput style={styles.input} label="Weight" value={weight} onChangeText={setWeight} />
      <TextInput style={styles.input} label="Height" value={height} onChangeText={setHeight} />


      
      <View style={{marginTop:30, marginHorizontal:20}}>
      <Button icon="clipboard-account-outline" mode="contained" onPress={signUp}>
                Sign Up
      </Button>  
      <Button icon="login" style={{marginTop:5}}mode="contained" onPress={() => { navigation.navigate('Login') }}>
          Go to Login
      </Button>
      </View>
    </SafeAreaView>
  )
}

export default RegisterScreen

const styles = StyleSheet.create({
    input:{backgroundColor:'white', marginVertical:3}
})
