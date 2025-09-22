import { 
  StyleSheet, View, SafeAreaView, Image, Dimensions, ScrollView,
  KeyboardAvoidingView, Platform
} from 'react-native';
import { Text, TextInput, Button } from 'react-native-paper';
import React, { useState, useRef } from 'react';
import { signInWithEmailAndPassword } from "firebase/auth";
import { db, auth } from '../firebase';

const LoginScreen = ({ navigation, route }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginFailed, setLoginFailed] = useState(false);

  const isFromSignUp = route?.params?.isFromSignUp ?? false;
  const screenWidth = Dimensions.get('window').width;

  const scrollRef = useRef(null);

  const logIn = async () => {
    signInWithEmailAndPassword(auth, email, password)
      .then(() => {
        navigation.navigate('Main');
        setLoginFailed(false);
      })
      .catch((error) => {
        console.log(error.message);
        setLoginFailed(true);
      });
  };

  // helper to scroll to input
  const scrollToInput = (yOffset = 200) => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y: yOffset, animated: true });
    }, 200);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Image
            source={require("../assets/logo.png")}
            style={[styles.logo, { width: screenWidth, height: screenWidth }]}
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
              autoCapitalize="none"
              mode="outlined"
              outlineColor="#FF4500"
              activeOutlineColor="#FF4500"
              onFocus={() => scrollToInput(250)}   // scroll when focused
            />
            <TextInput
              style={styles.input}
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              mode="outlined"
              outlineColor="#FF4500"
              activeOutlineColor="#FF4500"
              onFocus={() => scrollToInput(350)}   // scroll lower for password
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
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  scrollContent: { alignItems: 'center', paddingHorizontal: 20, paddingBottom: 30 },
  logo: { marginTop: 40, marginBottom: 10, alignSelf: 'center' },
  inputContainer: { width: '100%', marginTop: 20 },
  input: { backgroundColor: 'white', marginBottom: 15, borderRadius: 8 },
  buttonContainer: { width: '100%', marginTop: 30 },
  signUpButton: { marginTop: 10 },
  errorText: { color: "red", fontSize: 15, textAlign: "center", marginTop: 10 },
  successText: { color: '#3c763d', fontSize: 15, textAlign: 'center', marginTop: 10 },
});
