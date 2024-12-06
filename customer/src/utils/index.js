const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const amqplib = require("amqplib");

const { APP_SECRET, QUEUE_NAME, MESSAGE_BROKER_URL, EXCHANGE_NAME, CUSTOMER_BINDING_KEY } = require("../config");
const RECONNECT_INTERVAL = 5000; // 5 sekund

//Utility functions
module.exports.GenerateSalt = async () => {
  return await bcrypt.genSalt();
};

module.exports.GeneratePassword = async (password, salt) => {
  return await bcrypt.hash(password, salt);
};

module.exports.ValidatePassword = async (
  enteredPassword,
  savedPassword,
  salt
) => {
  return (await this.GeneratePassword(enteredPassword, salt)) === savedPassword;
};

module.exports.GenerateSignature = async (payload) => {
  try {
    return await jwt.sign(payload, APP_SECRET, { expiresIn: "30d" });
  } catch (error) {
    console.log(error);
    return error;
  }
};

module.exports.ValidateSignature = async (req) => {
  try {
    const signature = req.get("Authorization");
    console.log(signature);
    const payload = await jwt.verify(signature.split(" ")[1], APP_SECRET);
    req.user = payload;
    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
};

module.exports.FormateData = (data) => {
  if (data) {
    return { data };
  } else {
    throw new Error("Data Not found!");
  }
};

/* -------------- Message broker -------------- */

// create channel
// Ustawienia dla mechanizmu ponawiania połączenia

module.exports.CreateChannel = async () => {
  try {
    const connection = await amqplib.connect(MESSAGE_BROKER_URL);
    const channel = await connection.createChannel();
    await channel.assertExchange(EXCHANGE_NAME, 'direct', false);

    // Obsługa nieoczekiwanych zamknięć połączenia
    connection.on('close', () => {
      console.error('RabbitMQ connection closed unexpectedly. Reconnecting...');
      setTimeout(() => this.CreateChannel(), RECONNECT_INTERVAL);
    });

    connection.on('error', (err) => {
      console.error('RabbitMQ connection error:', err);
      // Możesz zamknąć połączenie, jeśli jeszcze nie zostało zamknięte
      try {
        connection.close();
      } catch (closeErr) {
        console.error('Error closing RabbitMQ connection:', closeErr);
      }
    });

    return channel;
  } catch (error) {
    console.error('Failed to create RabbitMQ channel:', error);
    console.error(`Retrying connection in ${RECONNECT_INTERVAL / 1000} seconds...`);
    setTimeout(() => this.CreateChannel(), RECONNECT_INTERVAL);
  }
};

// subscribe messages
module.exports.SubscribeMessages = async (channel, service) => {
  const appQueue = await channel.assertQueue(QUEUE_NAME);
  channel.bindQueue(appQueue.queue, EXCHANGE_NAME, CUSTOMER_BINDING_KEY);
  channel.consume(appQueue.queue, data => {
    try {
      console.log('received data');
      console.log(data.content.toString());
      console.log(data);

      service.SubscribeEvents(data.content.toString());
      // Potwierdzenie odbioru wiadomości
      channel.ack(data);
    } catch (error) {
      console.error('Error processing message:', error);
      // Można użyć channel.nack(data, false, true) do ponownego próby przetworzenia
      channel.nack(data, false, false); // Odrzuć wiadomość bez ponownej kolejki
    }
  });
};
