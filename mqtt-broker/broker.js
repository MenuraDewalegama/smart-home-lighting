const mqtt = require('mqtt');

const mqttClient = mqtt.connect('mqtt://broker.hivemq.com');

const roomStates = {
    livingroom: { light: false },
    kitchen: { light: false },
};

mqttClient.on('connect', () => {
    console.log('[MQTT Egress] Connected');
    mqttClient.subscribe('smarthome/rooms/+/lights/+/command');

    setInterval(() => {
        for (const room in roomStates) {
            mqttClient.publish(`smarthome/status/${room}/light/main`, JSON.stringify(roomStates[room]));
        }
    }, 5000);
});

mqttClient.on('message', (topic, message) => {
    const parts = topic.split('/');
    const room = parts[2];
    const command = message.toString();

    roomStates[room] = {
        light: command === 'on'
    };

    console.log(`[MQTT Egress] ${room} light → ${command.toUpperCase()}`);
});
