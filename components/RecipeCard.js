import React from 'react'
import { StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native'
import { BlurView } from 'expo-blur'

const RecipeCard = ({ recipe, onPress }) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      {/* Image */}
      <Image
        source={{
          uri: recipe.imageURL
            ? recipe.imageURL
            : "https://www.georgeinstitute.org/sites/default/files/styles/image_ratio_2_1_large/public/2020-10/world-food-day-2020.png.webp?itok=-h1y_Rz0"
        }}
        resizeMode="cover"
        style={styles.image}
      />

      {/* Title (Period Info) */}
      <View style={styles.nameView}>
        <Text style={{ color: "white", fontSize: 14 }}>{recipe.name}</Text>
      </View>

      {/* Info */}
      <View style={styles.infoView}>
        <BlurView intensity={30} tint="dark" style={styles.blurView}>
            <View style={styles.overlay}>
            <Text style={{ fontSize: 15, fontWeight: "600", color: "white" }}>
                Type: {recipe.type}
            </Text>
            <Text style={{ color: "#f0f0f0", fontSize: 13 }}>
                Difficulty: {recipe.difficulty}
            </Text>
            <Text style={{ color: "#f0f0f0", fontSize: 13 }}>
                Time: {recipe.totalTime}
            </Text>
            </View>
        </BlurView>
        </View>
    </TouchableOpacity>
  )
}

export default RecipeCard

const styles = StyleSheet.create({
  container: {
    height: 260,   // slightly bigger
    width: 180,
    marginTop: 12,
    marginRight: 18,
    borderRadius: 12,
  },
  image: {
    height: 260,
    width: 180,
    borderRadius: 12,
  },
  nameView: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "#696969",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  infoView: {
    position: "absolute",
    bottom: 8,
    left: 8,
    right: 8,
    height: 70,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "transparent",
  },
  blurView: {
    flex: 1,
    padding: 8,
    justifyContent: "space-between",
  },
})
