import { CameraView, useCameraPermissions } from "expo-camera";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button, Text, ActivityIndicator } from "react-native-paper";
import axios from "axios";

export default function FoodScanScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState(null);
  const [cameraKey, setCameraKey] = useState(0);

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.message}>
          We need your permission to use the camera
        </Text>
        <Button mode="contained" onPress={requestPermission}>
          Grant Permission
        </Button>
      </View>
    );
  }

  const simplifyCategory = (raw) => {
    if (!raw) return "Other";
    raw = raw.toLowerCase();
    if (raw.includes("beverage") || raw.includes("drink") || raw.includes("soda")) return "Beverages";
    if (raw.includes("snack") || raw.includes("chips") || raw.includes("candy") || raw.includes("cookie")) return "Snacks";
    if (raw.includes("meat") || raw.includes("poultry") || raw.includes("fish") || raw.includes("seafood")) return "Meat & Fish";
    if (raw.includes("dairy") || raw.includes("cheese") || raw.includes("milk") || raw.includes("yogurt")) return "Dairy";
    if (raw.includes("cereal") || raw.includes("grain") || raw.includes("bread") || raw.includes("pasta")) return "Grains";
    if (raw.includes("fruit") || raw.includes("vegetable") || raw.includes("plant") || raw.includes("veggie")) return "Produce";
    if (raw.includes("sauce") || raw.includes("condiment") || raw.includes("dressing")) return "Condiments & Sauces";
    if (raw.includes("frozen")) return "Frozen Foods";
    if (raw.includes("bakery") || raw.includes("cake") || raw.includes("pastry")) return "Bakery";
    if (raw.includes("drink powder") || raw.includes("powder")) return "Powders & Mixes";
    return "Other";
  };

  const handleBarcodeScanned = async ({ data }) => {
    if (scanned) return;
    setScanned(true);
    setLoading(true);

    try {
      const response = await axios.get(
        `https://world.openfoodfacts.org/api/v0/product/${data}.json`
      );

      let parsedResult = {
        name: "Unknown",
        quantity: 1,
        expirationDate: "N/A",
        type: "Other",
        mass: "N/A",
      };

      if (response.data.status === 1) {
        const p = response.data.product;

        let cleanName = (p.product_name || "Unknown").replace(/\s*imp\.?$/i, "").trim();

        let quantity = 1;
        if (p.packaging_quantity) {
          const q = parseInt(p.packaging_quantity);
          if (!isNaN(q) && q > 0) quantity = q;
        }

        let mass = "N/A";
        if (p.product_quantity && p.product_quantity_unit) {
          let value = parseFloat(p.product_quantity);
          const unit = p.product_quantity_unit.toLowerCase();

          if (!isNaN(value)) {
            if (unit.includes("kg")) value = value * 2.20462;
            else if (unit.includes("g")) value = value * 0.035274;
            else if (unit.includes("oz")) value = value;
            else if (unit.includes("lb")) value = value;
            if (unit.includes("g") || (unit.includes("oz") && value >= 16)) {
              mass = `${Math.round(value / 16 * 10) / 10} lb`;
            } else if (unit.includes("kg") || unit.includes("lb") || value >= 16) {
              mass = `${Math.round(value * 10) / 10} lb`;
            } else {
              mass = `${Math.round(value * 10) / 10} oz`;
            }
          }
        }

        let categoriesEn = p.categories_tags?.filter(c => c.startsWith("en:"));
        let typeValue = categoriesEn && categoriesEn.length ? simplifyCategory(categoriesEn[0]) : "Other";

        parsedResult = {
          name: cleanName,
          quantity,
          expirationDate: p.expiration_date || "N/A",
          type: typeValue,
          mass,
        };
      }

      setProduct(parsedResult);
      navigation.navigate("Scan Result", { result: JSON.stringify(parsedResult) });
    } catch (error) {
      console.error("API error:", error.message);
      const fallback = {
        name: "Not found",
        quantity: 1,
        expirationDate: "N/A",
        type: "Other",
        mass: "N/A",
      };
      setProduct(fallback);
      navigation.navigate("Scan Result", { result: JSON.stringify(fallback) });
    } finally {
      setLoading(false);
    }
  };

  const handleScanAgain = () => {
    setScanned(false);
    setProduct(null);
    setCameraKey(prev => prev + 1);
  };

  return (
    <View style={styles.container}>
      <CameraView
        key={cameraKey}
        style={styles.camera}
        facing="back"
        onBarcodeScanned={handleBarcodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e"],
        }}
      />

      {scanned && (
        <View style={styles.resultContainer}>
          {loading ? (
            <ActivityIndicator size="large" />
          ) : (
            <>
              <Text variant="titleMedium">{product?.name}</Text>
              <Text>Category: {product?.type}</Text>
              <Text>Quantity: {product?.quantity}</Text>
              <Text>Expiration: {product?.expirationDate}</Text>
              <Text>Mass: {product?.mass}</Text>

              <Button
                mode="contained"
                style={{ marginTop: 10 }}
                onPress={handleScanAgain}
              >
                Scan Again
              </Button>
            </>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  message: { marginBottom: 16 },
  camera: { flex: 1 },
  resultContainer: {
    position: "absolute",
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: "white",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
});
