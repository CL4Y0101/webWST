#include <ArduinoJson.h>
#include <DHT.h>
#include <HTTPClient.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <time.h>

#include "google_root_cas.h"
#include "secrets.h"

constexpr uint8_t DHT_PIN = 4;
constexpr unsigned long SEND_INTERVAL_MS = 60'000;
constexpr time_t MIN_VALID_UNIX_TIME = 1'700'000'000;

DHT dht(DHT_PIN, DHT22);
String idToken;
unsigned long tokenIssuedAtMs = 0;
unsigned long tokenValidForMs = 0;
unsigned long lastSentAtMs = 0;
bool sentOnce = false;
bool timeReadyPrinted = false;

bool validTime() {
  return time(nullptr) >= MIN_VALID_UNIX_TIME;
}

bool postJson(const String &url, const String &body, String &response, int &statusCode) {
  WiFiClientSecure client;
  client.setCACert(GOOGLE_ROOT_CAS);
  HTTPClient http;
  http.setTimeout(15'000);
  if (!http.begin(client, url)) return false;
  http.addHeader("Content-Type", "application/json");
  statusCode = http.POST(body);
  if (statusCode > 0) response = http.getString();
  http.end();
  return statusCode > 0;
}

bool signIn() {
  JsonDocument request;
  request["email"] = FIREBASE_DEVICE_EMAIL;
  request["password"] = FIREBASE_DEVICE_PASSWORD;
  request["returnSecureToken"] = true;
  String body;
  serializeJson(request, body);

  const String url = String("https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=") + FIREBASE_API_KEY;
  String response;
  int statusCode = 0;
  if (!postJson(url, body, response, statusCode) || statusCode != HTTP_CODE_OK) {
    Serial.printf("Firebase Auth gagal (HTTP %d). Periksa akun perangkat dan WiFi.\n", statusCode);
    return false;
  }

  JsonDocument result;
  if (deserializeJson(result, response) || !result["idToken"].is<const char *>()) {
    Serial.println("Respons Firebase Auth tidak valid.");
    return false;
  }

  const unsigned long expiresInSeconds = result["expiresIn"].as<String>().toInt();
  if (expiresInSeconds <= 300) {
    Serial.println("Masa berlaku token Firebase tidak valid.");
    return false;
  }
  idToken = result["idToken"].as<String>();
  tokenIssuedAtMs = millis();
  tokenValidForMs = (expiresInSeconds - 300) * 1000UL;
  Serial.println("Firebase Auth berhasil.");
  return true;
}

bool sendReading(float temperature, float humidity) {
  const uint64_t timestamp = static_cast<uint64_t>(time(nullptr)) * 1000ULL;
  JsonDocument reading;
  reading["temperature"] = temperature;
  reading["humidity"] = humidity;
  reading["timestamp"] = timestamp;
  String body;
  serializeJson(reading, body);

  String databaseUrl = FIREBASE_DATABASE_URL;
  if (databaseUrl.endsWith("/")) databaseUrl.remove(databaseUrl.length() - 1);
  char readingId[32];
  snprintf(readingId, sizeof(readingId), "esp32-%llu", static_cast<unsigned long long>(timestamp));
  const String url = databaseUrl + "/readings/" + readingId + ".json?auth=" + idToken;

  WiFiClientSecure client;
  client.setCACert(GOOGLE_ROOT_CAS);
  HTTPClient http;
  http.setTimeout(15'000);
  if (!http.begin(client, url)) {
    Serial.println("Gagal membuka koneksi ke Realtime Database.");
    return false;
  }
  http.addHeader("Content-Type", "application/json");
  const int statusCode = http.PUT(body);
  http.end();

  if (statusCode == HTTP_CODE_OK) {
    Serial.printf("Terkirim: %.1f C, %.1f %%\n", temperature, humidity);
    return true;
  }
  Serial.printf("Gagal mengirim ke Realtime Database (HTTP %d).\n", statusCode);
  if (statusCode == HTTP_CODE_UNAUTHORIZED) idToken = "";
  return false;
}

void setup() {
  Serial.begin(115200);
  dht.begin();
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Menghubungkan WiFi");
  const unsigned long wifiStartedAtMs = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - wifiStartedAtMs < 20'000) {
    Serial.print(".");
    delay(500);
  }
  Serial.println(WiFi.status() == WL_CONNECTED ? " terhubung." : " belum terhubung; akan dicoba lagi.");

  configTime(0, 0, "pool.ntp.org", "time.google.com");
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi terputus; mencoba menyambung ulang.");
    WiFi.reconnect();
    delay(5'000);
    return;
  }
  if (!validTime()) {
    Serial.println("Waktu belum tersinkron; data belum dikirim.");
    delay(5'000);
    return;
  }
  if (!timeReadyPrinted) {
    Serial.println("Waktu tersinkron.");
    timeReadyPrinted = true;
  }
  if (idToken.isEmpty() || millis() - tokenIssuedAtMs >= tokenValidForMs) {
    if (!signIn()) {
      delay(10'000);
      return;
    }
  }
  if (sentOnce && millis() - lastSentAtMs < SEND_INTERVAL_MS) {
    delay(1'000);
    return;
  }

  const float humidity = dht.readHumidity();
  const float temperature = dht.readTemperature();
  lastSentAtMs = millis();
  sentOnce = true;
  if (isnan(humidity) || isnan(temperature)) {
    Serial.println("DHT22 gagal dibaca. Periksa kabel sensor.");
    return;
  }
  sendReading(temperature, humidity);
}
