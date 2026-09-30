#include <DHT.h>

// Uji awal untuk ESP32 DevKit dan DHT22. Sesuaikan GPIO jika pin 4 tidak tersedia.
constexpr uint8_t DHT_PIN = 4;
DHT dht(DHT_PIN, DHT22);

void setup() {
  Serial.begin(115200);
  dht.begin();
  Serial.println("Memulai uji DHT22...");
  delay(2000);
}

void loop() {
  const float humidity = dht.readHumidity();
  const float temperature = dht.readTemperature();

  if (isnan(humidity) || isnan(temperature)) {
    Serial.println("DHT22 gagal dibaca. Periksa kabel DATA, daya, GND, dan resistor pull-up.");
  } else {
    Serial.print("Suhu: ");
    Serial.print(temperature, 1);
    Serial.print(" C | Kelembapan: ");
    Serial.print(humidity, 1);
    Serial.println(" %");
  }

  delay(3000);
}
