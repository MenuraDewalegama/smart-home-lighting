const mqtt = require('mqtt');

const mqttClient = mqtt.connect('mqtt://broker.hivemq.com');

mqttClient.on('connect', () => {
    console.log('[MQTT Ingress] Connected');
    mqttClient.subscribe('smarthome/rooms/+/sensors/+/state');
});

mqttClient.on('message', (topic, message) => {
    const payload = JSON.stringify({ topic, message: message.toString() });
    mqttClient.publish('smarthome/ingress/sensor', payload);
    console.log('[MQTT Ingress] Forwarded to smarthome/ingress/sensor:', payload);
});
