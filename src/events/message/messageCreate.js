const { Settings } = require('../../database/schemas/Settings');
const { trackMessages } = require('../../handlers/stats');

/**
 * 
 * @param {import('../../structures/BotClient')} client 
 * @param {import('discord.js').Message} message 
 */
module.exports = async (client, message) => {
    if (!message.guild || message.author.bot) return;

    const settings = await Settings.findOne();

    if (settings.messageCount.enabled) {
        await trackMessages(message, settings);
    }
}