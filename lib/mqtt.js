import mqtt from 'mqtt';

export function createMQTTClient(onMessage) {
  // Replace with actual broker details (e.g., HiveMQ Cloud)
  const brokerUrl = 'wss://broker.hivemq.com:8884/mqtt'; 
  const options = {
    clientId: `coinflow_web_${Math.random().toString(16).slice(3)}`,
    clean: true,
    connectTimeout: 4000,
  };

  const client = mqtt.connect(brokerUrl, options);

  client.on('connect', () => {
    console.log('Connected to MQTT Broker');
    client.subscribe('coinflow/coin-detected');
    client.subscribe('coinflow/slot-status');
  });

  client.on('message', (topic, message) => {
    const payload = JSON.parse(message.toString());
    onMessage(topic, payload);
  });

  return client;
}
