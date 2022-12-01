const { EmbedBuilder } = require('@discordjs/builders');
const { Colors } = require('discord.js');
const sample = require('lodash/sample');
const { getMember } = require('../database/schemas/Member');
const { Settings } = require('../database/schemas/Settings');

const games = [
    'first-win',
    'guess'
];

/**
 * 
 * @param {import('discord.js').Channel} channel 
 */
const firstWin = async (channel) => {
    const timer = 5 * 60 * 1000;
    /**
     * @type {import('discord.js').Message}
     */
    const message = await channel.send({
        embeds: [
            new EmbedBuilder()
                .setTitle('Who is the fastest?')
                .setColor(Colors.DarkAqua)
                .setDescription(`Gotta be fast Aphelian! The first user who react with 🏁 to this message will earn **1 Game Point**!
                You have **${timer / 60 / 1000} minutes**`)
                .setTimestamp()
                .setFooter({
                    text: `You have ${timer / 60 / 1000} minutes`
                })
        ]
    });
    await message.react('🏁');
    
    const collector = message.createReactionCollector({
        filter: reaction => reaction.emoji.name === '🏁',
        time: timer
    });

    collector.on('collect', async (reaction, user) => {
        if (!user.bot) {
            channel.send({ embeds: [
                new EmbedBuilder()
                    .setTitle('Congratulations!')
                    .setColor(Colors.Green)
                    .setDescription(`Congratulations <@${user.id}> you're the fastest ever! 1 GP for you`)
                    .setTimestamp(),
            ]});
            collector.stop('winner');
            const member = await getMember(user.id);
            member.game_points++;
            member.save();
        }
    });

    collector.on('end', (collected, reason) => {
        if (reason === 'time') {
            message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setDescription('Nobody wants to play with me :(')
                        .setColor(Colors.Red)
                ]
            });
        }
    });
};

/**
 * 
 * @param {import('../structures/BotClient')} client
 * @param {import('discord.js').Channel} channel 
 */
const guess = async (client, channel) => {
    const timer = 5 * 60 * 1000;

    /**
     * @type {import('discord.js').Message}
     */
    const message = await channel.send({
        embeds: [
            new EmbedBuilder()
                .setTitle('Guess the emoji!')
                .setColor(Colors.DarkGold)
                .setDescription(`Gotta be fast Aphelian! The first user who react with the right emoji to this message will earn **1 Game Point**!
                You have **${timer / 60 / 1000} minutes**`)
                .setTimestamp()
        ]
    });

    const randomemojis = require('../helpers/RandomEmoji')(10);
    const winnerEmoji = sample(randomemojis);
    console.log(winnerEmoji);

    const collector = message.createReactionCollector({
        filter: reaction => randomemojis.includes(reaction.emoji.name),
        time: timer,
    });

    collector.on('collect', async (reaction, user) => {
        if (!user.bot && reaction.emoji.name === winnerEmoji) {
            channel.send({ embeds: [
                new EmbedBuilder()
                    .setTitle('Congratulations!')
                    .setColor(Colors.Green)
                    .setDescription(`Congratulations <@${user.id}> you're the fastest ever! 1 GP for you`)
                    .setTimestamp(),
            ]});
            collector.stop('winner');
            const member = await getMember(user.id);
            member.game_points++;
            member.save();
        }
    });

    collector.on('end', (collected, reason) => {
        if (reason === 'time') {
            message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setDescription('Nobody wants to play with me :(')
                        .setColor(Colors.Red)
                ]
            });
        }
    });

    randomemojis.forEach(async em => await message.react(em));
}

module.exports = {
    /**
     * 
     * @param {import('../structures/BotClient')} client 
     */
    start: async (client) => {
        const settings = await Settings.findOne();

        if (settings.randomGames.enabled) {
            client.randomGameInterval = setInterval(async () => {
                const random = Math.random();
                if (random >= settings.randomGames.probability) {
                    const game = sample(games);
                    const channel = await client.guilds.cache.get(process.env.GUILD_ID).channels.fetch(process.env.GAME_CHANNEL);

                    switch (game) {
                        case 'first-win':
                            await firstWin(channel);
                            break;
                        case 'guess':
                            await guess(client, channel);
                            break;
                    }
                }
            }, 10 * 60 * 1000);
        }
    }
}