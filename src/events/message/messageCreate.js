const { Settings } = require('../../database/schemas/Settings');
const { trackMessages } = require('../../handlers/stats');
const { handlePrefixCommand } = require('../../handlers/command');
const { getMember } = require('../../database/schemas/Member');
const { EmbedBuilder } = require('@discordjs/builders');

/**
 * 
 * @param {import('../../structures/BotClient')} client 
 * @param {import('discord.js').Message} message 
 */
module.exports = async (client, message) => {
    if (!message.guild || message.author.bot) return;

    const settings = await Settings.findOne();

    if (settings.onlyGifChannels.length > 0) {
        const channelSettings = settings.onlyGifChannels.find(el => el.channelId === message.channel.id.toString());
        if (channelSettings?.enabled) {
            if (!message.content.includes('https://tenor.com')) {
                await message.delete();
                message.channel.send({
                    embeds: [
                        new EmbedBuilder()
                            .setDescription(`<@${message.member.id}> Sorry, only GIFs are allowed in this channel`)
                            .setImage('https://media.tenor.com/VnKRqdXWHVgAAAAC/thats-not-what-we-do-here-goliath.gif')
                    ]
                }).then(botMessage => {
                    setTimeout(() => botMessage.delete(), 10 * 1000);
                });
            } else {
                const member = await getMember(message.member.id);
                member.gifTalks++;
                await member.save();
            }
        }
    }

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