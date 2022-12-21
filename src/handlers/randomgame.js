const { EmbedBuilder } = require('@discordjs/builders');
const { Colors, Embed } = require('discord.js');
const sample = require('lodash/sample');
const { getMember } = require('../database/schemas/Member');
const { Settings } = require('../database/schemas/Settings');
const { getRandomInt } = require('../helpers/Utils');

const games = [
    'first-win',
    'guess-emoji',
    'guess-number',
    'guess-word'
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
 * @param {integer} max
 * @param {integer} points
 */
const guessNumber = async (channel, max, points) => {
    if (!max) max = 100;
    if (!points) points = 1;

    const timer = 5 * 60 * 1000;
    const number = getRandomInt(0, max);

    /**
     * @type {import('discord.js').Message}
     */
    const message = await channel.send({
        embeds: [
            new EmbedBuilder()
                .setTitle('Guess the number!')
                .setColor(Colors.Blurple)
                .setDescription(`Gotta be fast Aphelian! The first user who guess the number between 0 and ${max} will earn **${points} Game Point**!
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
            m.reply({ embeds: [
                new EmbedBuilder()
                    .setTitle('Congratulations!')
                    .setColor(Colors.Green)
                    .setDescription(`Congratulations <@${m.author.id}> you're the fastest ever! ${points} GP for you`)
                    .setTimestamp(),
            ]});
            collector.stop('winner');
            const member = await getMember(m.author.id);
            member.game_points += points;
            member.save();
        }
        else if (parseInt(m.content) > number) {
            m.reply({ embeds: [
                new EmbedBuilder()
                    .setDescription('Too high!')
                    .setColor(Colors.Red)
            ]});
        }
        else if (parseInt(m.content) < number) {
            m.reply({ embeds: [
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
 * @param {import('discord.js').GuildBasedChannel)} channel 
 * @param {string|null} word 
 * @param {integer|null} points
 */
const guessWord = async (channel, word, points) => {
    String.prototype.replaceAt = function(index, replacement) {
        return this.substring(0, index) + replacement + this.substring(index + replacement.length);
    };

    const timer = 10 * 60 * 1000;
    if (!points) points = 1

    if (!word) {
        const axios = require('axios').default;
        try {
            const response = await axios.get('https://random-word-api.herokuapp.com/word?lang=en');
            word = response?.data[0];
        }
        catch (err) {
            channel.client.logger.error('Unable to get random word', err);
        }
    }

    /**
     * @type {import('discord.js').Message}
     */
     const message = await channel.send({
        embeds: [
            new EmbedBuilder()
                .setTitle('Guess the word!')
                .setColor(Colors.Blurple)
                .setDescription(`Gotta be fast Aphelian! The first user who guess the word will earn **${points} Game Point**!
You have **${timer / 60 / 1000} minutes**`)
                .setTimestamp()
        ]
    });

    let guess = `${'・'.repeat(word.length)}`;

    await channel.send({
        embeds: [
            new EmbedBuilder()
                .setTitle('First clue!')
                .setDescription(`${word.length} letters!
                
${guess}`),
        ]
    });

    channel.setRateLimitPerUser(5, 'minigame');

    const collector = channel.createMessageCollector({
        filter: m => !m.member.user.bot,
        time: timer,
    });
    console.log(word);

    const said = [];

    const errorImages = [
        'https://i.ibb.co/cJRp88x/bar-1.png',
        'https://i.ibb.co/G7m2W3C/bar-2.png',
        'https://i.ibb.co/wCwSGGG/bar-3.png',
        'https://i.ibb.co/S7yVjBg/bar-4.png',
        'https://i.ibb.co/d4J0wtS/bar-5.png',
        'https://i.ibb.co/9Zwymm4/bar-6.png',
        'https://i.ibb.co/cLc3Yz6/bar-7.png',
        'https://i.ibb.co/MBbxLNT/bar-8.png',
        'https://i.ibb.co/6b3DKYB/bar-9.png',
        'https://i.ibb.co/vqZFrCC/bar-10.png',
    ];
    let errors = 0;

    collector.on('collect', async m => {
        let winner = false;
        if (m.content.length === 1) {
            // Check if already said
            if (said.indexOf(m.content.toLowerCase()) >= 0) {
                return m.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle(`${m.content.toUpperCase()} ALREADY SAID!`)
                            .setColor(Colors.Red)
                            .setDescription(`${guess}

\`\`\`
Already said:
${said.map(el => el.toUpperCase()).join(', ')}
\`\`\``)
                    ]
                })
            }

            said.push(m.content.toLowerCase());
            said.sort()
            // check if the letter is in the word
            const positions = [...word.matchAll(new RegExp(m.content, 'gi'))].map(a => a.index);
            if (positions.length > 0) {

                positions.forEach(p => {
                    guess = guess.replaceAt(p, m.content);
                });

                if (guess.toLowerCase() === word.toLowerCase()) {
                    winner = true;
                }
                else {
                    m.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setTitle('YES!')
                                .setColor(Colors.Green)
                                .setDescription(`${guess}

\`\`\`
Already said:
${said.map(el => el.toUpperCase()).join(', ')}
\`\`\``),
                        ]
                    });
                }
            } else {
                m.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('NOPE!')
                            .setColor(Colors.Red)
                            .setDescription(`${guess}

\`\`\`
Already said:
${said.map(el => el.toUpperCase()).join(', ')}
\`\`\``)
                            .setImage(errorImages[errors])
                    ]
                });
                errors++;
            }
        } else if (m.content.toLowerCase() === word) {
            winner = true;
        } else {
            m.channel.send({
                embeds: [
                    new EmbedBuilder()
                        .setTitle('NOPE!')
                        .setColor(Colors.Red)
                        .setDescription(`${guess}

\`\`\`
Already said:
${said.map(el => el.toUpperCase()).join(', ')}
\`\`\``)
                        .setImage(errorImages[errors])
                ]
            });
            errors++;
        }

        if (winner) {
            m.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle('Congratulations!')
                        .setColor(Colors.Green)
                        .setDescription(`Congratulations <@${m.author.id}> you're the winner! ${points} GP for you

The word was **${word.toUpperCase()}**`)
                        .setTimestamp(),
                ]
            });
            collector.stop('winner');
            const member = await getMember(m.author.id);
            member.game_points += points;
            member.save();
        } else if (errors === errorImages.length) {
            m.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle('You lost!')
                        .setDescription(`Nobody has guessed! The word was **${word.toUpperCase()}**`)
                        .setColor(Colors.Red)
                ],
            });
            collector.stop('loser');
        }
    });

    collector.on('end', (collected, reason) => {
        channel.setRateLimitPerUser(0);
        if (reason === 'time') {
            message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle('Time is up!')
                        .setDescription(`Nobody has guessed! The word was **${word.toUpperCase()}**`)
                        .setColor(Colors.Red)
                ]
            });
        }
    });
}

/**
 * 
 * @param {string} game 
 * @param {import('discord.js').GuildBasedChannel)} channel
 * @param {object} options
 */
const launch = async (game, channel, options) => {
    switch (game) {
        case 'first-win':
            await firstWin(channel);
            break;
        case 'guess-emoji':
            await guess(channel);
            break;
        case 'guess-number':
            await guessNumber(channel, options?.max, options?.points);
            break;
        case 'guess-word':
            await guessWord(channel, options?.word);
            break;
    }
};

const handle = async (client, settings) => {
    const random = Math.random();
    if (random >= settings.randomGames.probability) {
        const game = sample(games);
        const channel = await client.guilds.cache.get(process.env.GUILD_ID).channels.fetch(process.env.GAME_CHANNEL);
        
        await launch(game, channel);
    }
}

module.exports = {
    /**
     * 
     * @param {import('../structures/BotClient')} client 
     */
    start: async (client) => {
        const settings = await Settings.findOne();

        if (settings.randomGames.enabled) {
            await handle(client, settings);
            client.randomGameInterval = setInterval(async () => {
                await handle(client, settings);
            }, 10 * 60 * 1000);
        }
    },
    launch,
    games,
}