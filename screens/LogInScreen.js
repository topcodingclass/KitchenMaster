import { StyleSheet, View, SafeAreaView, Image, Dimensions } from 'react-native';
import { Text, TextInput, Button } from 'react-native-paper';
import React, { useState } from 'react';
import { signInWithEmailAndPassword } from "firebase/auth";
import { db, auth } from '../firebase';
import { setDoc, doc } from "firebase/firestore"; 

const LogInScreen = ({ navigation, route }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginFailed, setLoginFailed] = useState(false);

  let isFromSignUp = route?.params?.isFromSignUp ?? false;
  const screenWidth = Dimensions.get('window').width;

  const logIn = async () => {
    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        navigation.navigate('Main');
        setLoginFailed(false);
      })
      .catch((error) => {
        console.log(error.message);
        setLoginFailed(true);
      });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Image
        source={require("../assets/logo.png")}
        style={[styles.logo, { width: screenWidth , height: screenWidth  }]}
        resizeMode="contain"
      />

      {loginFailed && (
        <Text style={styles.errorText}>Login failed. Please try again.</Text>
      )}

      {isFromSignUp && (
        <Text style={styles.successText}>
          🎉 You have signed up successfully. Please log in.
        </Text>
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize='none'
          mode="outlined"
          outlineColor="#FF4500"
          activeOutlineColor="#FF4500"
        />
        <TextInput
          style={styles.input}
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize='none'
          mode="outlined"
          outlineColor="#FF4500"
          activeOutlineColor="#FF4500"
        />
      </View>

      <View style={styles.buttonContainer}>
        <Button
          icon="login-variant"
          mode="contained"
          onPress={logIn}
          buttonColor="#FF4500"
          textColor="white"
        >
          Log In
        </Button>
        <Button
          icon="clipboard-account-outline"
          mode="contained"
          style={styles.signUpButton}
          onPress={() => navigation.navigate('Register')}
          buttonColor="#FFA07A"
          textColor="white"
        >
          Sign Up
        </Button>
      </View>
    </SafeAreaView>
  );
};

export default LogInScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    alignItems: 'center',
    paddingHorizontal: 20,
    margin:9
  },
  logo: {
    marginTop: 40,
    marginBottom: 10,
    alignSelf: 'center',
  },
  inputContainer: {
    width: '100%',
    marginTop: 20,
  },
  input: {
    backgroundColor: 'white',
    marginBottom: 15,
    borderRadius: 8,
  },
  buttonContainer: {
    width: '100%',
    marginTop: 30,
  },
  signUpButton: {
    marginTop: 10,
  },
  errorText: {
    color: "red",
    fontSize: 15,
    textAlign: "center",
    marginTop: 10,
  },
  successText: {
    color: '#3c763d',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 10,
  }
});
