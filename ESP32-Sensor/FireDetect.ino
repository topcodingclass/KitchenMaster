#include <WiFi.h>
#include <Firebase_ESP_Client.h>
#include <addons/TokenHelper.h>
#include "DHT.h"


#define WIFI_SSID     "Jos Home"
#define WIFI_PASSWORD "joeljoann37"

#define API_KEY       "AIzaSyBHaiRVMug-oIs9uaKmaJYyRP9Yus1jFeg"
#define DATABASE_URL  "kitchenmaster-73e91.firebaseio.com"
#define FIREBASE_PROJECT_ID "kitchenmaster-73e91"

#define USER_EMAIL "test@email.com"
#define USER_PASSWORD "test1234"

#define LED_PIN 2   // use GPIO2 for LED
const int ledPin = 5;

// DHT
#define DPIN 4
#define DTYPE DHT11
DHT dht(DPIN, DTYPE);



FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

String uid;

bool lastFireState = false;
bool lastWaterState = false;

String formatUnixToRFC3339(uint64_t t) {
  time_t raw = t;
  struct tm* timeinfo = gmtime(&raw);
  char buf[30];
  strftime(buf, sizeof(buf), "%Y-%m-%dT%H:%M:%SZ", timeinfo);
  return String(buf);
}

void setup() {
  Serial.begin(115200);
  //For led 
  pinMode(LED_PIN, OUTPUT);
  pinMode(ledPin, OUTPUT);

  dht.begin();

  configTime(-8 * 3600, 3600, "pool.ntp.org", "time.nist.gov");

  Serial.print("Waiting for NTP time sync");
  time_t now = time(nullptr);
  int retries = 0;
  while (now < 100000 && retries < 20) {
    delay(500);
    Serial.print(".");
    now = time(nullptr);
    retries++;
  }
  Serial.println();

  if (now < 100000) {
    Serial.println("❌ Failed to sync time.");
  } else {
    Serial.println("✅ Time synced successfully!");
    struct tm timeinfo;
    gmtime_r(&now, &timeinfo);
    Serial.printf("Current time: %s\n", asctime(&timeinfo));
  }

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to Wi-Fi");
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(300);
  }
  Serial.println();
  Serial.println("Connected with IP: " + WiFi.localIP().toString());

  config.api_key = API_KEY;
  auth.user.email = USER_EMAIL;
  auth.user.password = USER_PASSWORD;
  config.token_status_callback = tokenStatusCallback;

  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);

  Serial.println("Getting User UID...");
  while (auth.token.uid == "") {
    Serial.print(".");
    delay(1000);
  }
  uid = auth.token.uid.c_str();
  Serial.println("\nUser UID: " + uid);
}

void loop() {
  delay(3000);
  unsigned long timestamp = millis();

  // ---------------- FIRE ----------------
  float tf = dht.readTemperature(true);
  Serial.printf("Temp: %.2f °F\n", tf);
  digitalWrite(LED_PIN, LOW);
  digitalWrite(ledPin, LOW);

  bool fireDetected = tf > 86.0;

  if(fireDetected)
  {
    // LED ON 
    Serial.print("LED ON ");
    digitalWrite(LED_PIN, HIGH); 
    digitalWrite(ledPin, HIGH);
  }

  if (fireDetected != lastFireState) {
    // Only update Firebase if fire status changed
    Serial.println(fireDetected ? "🔥 Fire Detected!" : "✅ Fire cleared");
    lastFireState = fireDetected;

    uint64_t now = Firebase.getCurrentTime();
    String timestamp = formatUnixToRFC3339(now);

    Serial.print("Firebase updating-fire");
    FirebaseJson fireJson;
    fireJson.set("fields/fire/mapValue/fields/isOn/booleanValue", fireDetected);
    fireJson.set("fields/fire/mapValue/fields/timestamp/timestampValue", timestamp);
    String path = "alerts/" + uid;

    if (Firebase.Firestore.patchDocument(&fbdo, FIREBASE_PROJECT_ID, "", path.c_str(),
                                         fireJson.raw(), "fire")) {
      Serial.println("✅ Fire status updated");
    } else {
      Serial.println("❌ Error (fire): " + fbdo.errorReason());
    }
  } else {
    Serial.println("No change in fire status");
  }

}
