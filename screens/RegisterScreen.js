import { StyleSheet, View, SafeAreaView, ScrollView, Text, KeyboardAvoidingView, Platform } from 'react-native'
import { TextInput, Button } from 'react-native-paper'
import React, { useState } from 'react'
import { createUserWithEmailAndPassword } from "firebase/auth";
import { db, auth } from '../firebase'
import { setDoc, doc } from "firebase/firestore";

const RegisterScreen = ({ navigation }) => {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [weight, setWeight] = useState("")
  const [password, setPassword] = useState("")
  const [yob, setYob] = useState("")
  const [city, setCity] = useState("")
  const [zip, setZip] = useState("")
  const [height, setHeight] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  const signUp = async () => {
    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        const userId = userCredential.user.uid;
        addUser(userId)
        setSuccessMessage("Account created! Please proceed to login.")
      })
      .catch((error) => {
        console.log(error.message)
      });
  }

  const addUser = async (userId) => {
    try {
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
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={{ padding: 15, paddingBottom: 150 }}>
          <TextInput style={styles.input} label="Email" value={email} onChangeText={setEmail} autoCapitalize='none' />
          <TextInput style={styles.input} label="Password" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize='none' />
          <TextInput style={styles.input} label="Name" value={name} onChangeText={setName} />
          <TextInput style={styles.input} label="Year Of Birth" value={yob} onChangeText={setYob} />
          <TextInput style={styles.input} label="City" value={city} onChangeText={setCity} />
          <TextInput style={styles.input} label="Zip" value={zip} onChangeText={setZip} />
          <TextInput style={styles.input} label="Weight" value={weight} onChangeText={setWeight} />
          <TextInput style={styles.input} label="Height" value={height} onChangeText={setHeight} />
        </ScrollView>

        <View style={styles.bottomContainer}>
          {successMessage ? (
            <Text style={{ color: 'green', fontSize: 16, marginBottom: 10 }}>
              {successMessage}
            </Text>
          ) : null}

          <Button icon="clipboard-account-outline" mode="contained" onPress={signUp} style={{ marginBottom: 10 }}>
            Sign Up
          </Button>
          <Button icon="login" mode="contained" onPress={() => { navigation.navigate('Login') }}>
            Go to Login
          </Button>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

export default RegisterScreen

const styles = StyleSheet.create({
  input: { backgroundColor: 'white', marginVertical: 3 },
  bottomContainer: {
    position: 'absolute',
    bottom: 20,
    left: 15,
    right: 15
  }
})
