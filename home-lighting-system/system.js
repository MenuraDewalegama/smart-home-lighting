const mqtt = require('mqtt');

const mqttClient = mqtt.connect('mqtt://broker.hivemq.com');
const activeRooms = {};

mqttClient.on('connect', () => {
    console.log('[Automation] Connected to MQTT');
    mqttClient.subscribe('smarthome/ingress/sensor');
    mqttClient.subscribe('smarthome/ingress/manual');
});

mqttClient.on('message', (topic, payload) => {
    const { topic: targetTopic, message } = JSON.parse(payload.toString());
    const parts = targetTopic.split('/');
    const room = parts[2];

    // Manual light ON/OFF
    if (topic === 'smarthome/ingress/manual') {
        handleManual(room, message);
    }

    // Motion detected
    if (topic === 'smarthome/ingress/sensor' && message === 'active') {
        handleMotion(room);
    }
});

function handleMotion(room) {
    const cmd = {
        topic: `smarthome/rooms/${room}/lights/main/command`,
        message: 'on'
    };
    mqttClient.publish('smarthome/egress/light', JSON.stringify(cmd));
    console.log(`[Automation] Motion in ${room} → Light ON`);
    resetTimer(room, 'motion');
}

function handleManual(room, message) {
    const cmd = {
        topic: `smarthome/rooms/${room}/lights/main/command`,
        message
    };
    mqttClient.publish('smarthome/egress/light', JSON.stringify(cmd));
    console.log(`[Manual] Light ${message.toUpperCase()} in ${room}`);

    if (message === 'on') {
        resetTimer(room, 'manual');
    } else if (message === 'off') {
        if (activeRooms[room]?.timer) {
            clearTimeout(activeRooms[room].timer);
            delete activeRooms[room];
            console.log(`[Manual] Light OFF → Timer cleared for ${room}`);
        }
    }
}

function resetTimer(room, source) {
    if (activeRooms[room]?.timer) {
        clearTimeout(activeRooms[room].timer);
    }

    activeRooms[room] = {
        source,
        timer: setTimeout(() => {
            const cmd = {
                topic: `smarthome/rooms/${room}/lights/main/command`,
                message: 'off'
            };
            mqttClient.publish('smarthome/egress/light', JSON.stringify(cmd));
            console.log(`[AUTO-OFF] No activity in ${room} for 30s → Light OFF`);
            delete activeRooms[room];
        }, 30000)
    };

    console.log(`[${source.toUpperCase()}] Light ON → Timer started for ${room}`);
}
