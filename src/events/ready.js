const moment = require('moment');
const { Automessage } = require('../database/schemas/Automessage');
const { Settings } = require('../database/schemas/Settings');

/**
 * 
 * @param {string} freq 
 */
const convertFreq = (freq) => {
    const unit = freq.charAt(freq.length - 1);
    const num = freq.substring(0, freq.length - 1);

    let seconds = 60;
    switch (unit.toLowerCase()) {
        case 'h':
            seconds *= 60;
            break;
        case 'd':
            seconds *= 60 * 24;
            break;
        case 'w':
            seconds *= 60 * 24 * 7;
            break;
    }

    return num * seconds;
}

/**
 * 
 * @param {import('../structures/BotClient')} client 
 */
const processMessages = async (client) => {
    const automessages = await Automessage.find({});
    automessages.forEach(async m => {
        const secondsFreq = convertFreq(m.frequency);

        if (!m.lastSent || moment().diff(moment(m.lastSent)) >= secondsFreq * 1000) {
            let channel;
            try {
                channel = await client.channels.fetch(m.channelId);
                m.lastSent = new Date();
                m.save();
                channel.send(m.message);
            } catch (ex) {
                m.delete();
                client.logger.warn('Channel not found');
            }
        }         
    })
}

/**
 * 
 * @param {import('../structures/BotClient')} client 
 */
module.exports = async (client) => {
    client.logger.success(`Logged in as ${client.user.tag}!`);

    // Register interactions
    client.registerInteractions(process.env.GUILD_ID);

    await processMessages(client);

    // Automessages
    setInterval(async () => {
        processMessages(client);
    }, 60000);

    if ((await Settings.find()).length === 0) await (new Settings()).save();
}