const { EmbedBuilder } = require('@discordjs/builders');
const { Colors, Embed } = require('discord.js');
const sample = require('lodash/sample');
const { getMember } = require('../database/schemas/Member');
const { Settings } = require('../database/schemas/Settings');
const { getRandomInt } = require('../helpers/Utils');

const games = [
    'first-win',
    'guess-emoji',
    'guess-number'
];

/**
 * 
 * @param {import('discord.js').Channel} channel 
 */
const firstWin = async (channel) => {
    const timer = 20 * 60 * 1000;
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
 * @param {import('discord.js').Channel} channel 
 */
const guess = async (channel) => {
    const timer = 20 * 60 * 1000;

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

    const randomemojis = require('../helpers/RandomEmoji')(20);
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

/**
 * @param {import('discord.js').GuildBasedChannel)} channel
 */
const guessNumber = async (channel) => {
    const timer = 5 * 60 * 1000;
    const number = getRandomInt(0, 100);

    /**
     * @type {import('discord.js').Message}
     */
    const message = await channel.send({
        embeds: [
            new EmbedBuilder()
                .setTitle('Guess the emoji!')
                .setColor(Colors.Blurple)
                .setDescription(`Gotta be fast Aphelian! The first user who guess the number between 0 and 100 will earn **1 Game Point**!
You have **${timer / 60 / 1000} minutes**`)
                .setTimestamp()
        ]
    });

    channel.setRateLimitPerUser(5, 'minigame');

    const collector = channel.createMessageCollector({
        filter: m => /^\d+$/.test(m.content.trim()),
        time: timer,
    });

    collector.on('collect', async m => {
        if (parseInt(m.content) === number) {
            channel.send({ embeds: [
                new EmbedBuilder()
                    .setTitle('Congratulations!')
                    .setColor(Colors.Green)
                    .setDescription(`Congratulations <@${m.author.id}> you're the fastest ever! 1 GP for you`)
                    .setTimestamp(),
            ]});
            collector.stop('winner');
            const member = await getMember(m.author.id);
            member.game_points++;
            member.save();
        }
        else if (parseInt(m.content) > number) {
            channel.send({ embeds: [
                new EmbedBuilder()
                    .setDescription('Too high!')
                    .setColor(Colors.Red)
            ]});
        }
        else if (parseInt(m.content) < number) {
            channel.send({ embeds: [
                new EmbedBuilder()
                    .setDescription('Too low!')
                    .setColor(Colors.Red)
            ]});
        }
    });

    collector.on('end', (collected, reason) => {
        channel.setRateLimitPerUser(0);
        if (reason === 'time') {
            message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setDescription('Nobody wants to play with me :(')
                        .setColor(Colors.Red)
                ]
            });
        }
    })

}

/**
 * 
 * @param {string} game 
 * @param {import('discord.js').GuildBasedChannel)} channel
 */
const launch = async (game, channel) => {
    switch (game) {
        case 'first-win':
            await firstWin(channel);
            break;
        case 'guess-emoji':
            await guess(channel);
            break;
        case 'guess-number':
            await guessNumber(channel);
            break;
    }
};

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
                    
                    await launch(game, channel);
                }
            }, 10 * 60 * 1000);
        }
    },
    launch,
    games,
}