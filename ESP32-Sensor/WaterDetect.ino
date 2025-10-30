#include <WiFi.h>
#include <Firebase_ESP_Client.h>
#include <addons/TokenHelper.h>



#define WIFI_SSID     ""
#define WIFI_PASSWORD ""

#define API_KEY       ""
#define DATABASE_URL  ""
#define FIREBASE_PROJECT_ID ""

#define USER_EMAIL "test@email.com"
#define USER_PASSWORD "test1234"

#define POWER_PIN 25         // GPIO to power the sensor
#define SIGNAL_PIN 34        // GPIO2, also known as D2

#define LED_PIN 12   // use GPIO2 for LED
const int ledPin = 5;

FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

String uid;

bool lastFireState = false;
bool lastWaterState = false;

int waterAnalogValue = 0;   

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

  pinMode(POWER_PIN, OUTPUT);
  digitalWrite(POWER_PIN, LOW);  // keep sensor off initially

  // Sync time from NTP
  // Timezone offset = -8 hours (Pacific Time), DST = 1 hour
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
  digitalWrite(POWER_PIN, HIGH);  // turn sensor ON
  delay(10);                      // wait for it to stabilize
  unsigned long timestamp = millis();

  waterAnalogValue = analogRead(SIGNAL_PIN);  // get analog value (0–4095)
  digitalWrite(POWER_PIN, LOW);    // turn OFF to prevent corrosion

  Serial.print("Water sensor analog value: ");
  Serial.println(waterAnalogValue);

  bool waterDetected = (waterAnalogValue > 1000);

  if(waterDetected)
  {
    // LED ON 
    Serial.print("LED ON ");
    digitalWrite(LED_PIN, HIGH); 
    digitalWrite(ledPin, HIGH);
  }

  if (waterDetected != lastWaterState) {
    // Only update Firebase if water status changed
    Serial.println(waterDetected ? "💧 Water Detected!" : "✅ Water Cleared");
    lastWaterState = waterDetected;

    uint64_t now = Firebase.getCurrentTime();
    String timestamp = formatUnixToRFC3339(now);

    FirebaseJson waterJson;
    waterJson.set("fields/water/mapValue/fields/isDetected/booleanValue", waterDetected);
    waterJson.set("fields/water/mapValue/fields/timestamp/timestampValue", timestamp);

    String path = "alerts/" + uid;

    if (Firebase.Firestore.patchDocument(&fbdo, FIREBASE_PROJECT_ID, "", path.c_str(),
                                         waterJson.raw(), "water")) {
      Serial.println("✅ Water status updated");
    } else {
      Serial.println("❌ Error (water): " + fbdo.errorReason());
    }
  } else {
    Serial.println("No change in water status");
  }

  delay(1000);
}

