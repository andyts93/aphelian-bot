const { Settings } = require('../../database/schemas/Settings');
const { trackMessages } = require('../../handlers/stats');
const { handlePrefixCommand } = require('../../handlers/command');

/**
 * 
 * @param {import('../../structures/BotClient')} client 
 * @param {import('discord.js').Message} message 
 */
module.exports = async (client, message) => {
    if (!message.guild || message.author.bot) return;

    const settings = await Settings.findOne();

    let isCommand = false;
    if (message.content.includes(`${client.user.id}`)) {
        message.channel.send(`> My prefix is \`${process.env.BOT_PREFIX}\``);
    }

    if (message.content && message.content.startsWith(process.env.BOT_PREFIX)) {
        const invoke = message.content.replace(`${process.env.BOT_PREFIX}`, '').split(/\s+/)[0];
        const cmd = client.getCommand(invoke);
        if (cmd) {
            isCommand = true;
            handlePrefixCommand(message, cmd, settings);
        }
    }

    if (settings.messageCount.enabled) {
        await trackMessages(message, settings);
    }
}