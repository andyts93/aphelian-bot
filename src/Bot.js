const BotClient = require("./structures/BotClient");
require('dotenv').config();
const { initializeDb } = require('./database/mongoose');

const client = new BotClient();

client.loadCommands("src/commands");
client.loadEvents('src/events');

(async () => {
    await initializeDb();
})();

client.login(process.env.TOKEN);