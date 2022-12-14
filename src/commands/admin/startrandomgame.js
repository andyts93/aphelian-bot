const { ApplicationCommandOptionType, EmbedBuilder, Colors } = require('discord.js');
const { launch, games } = require('../../handlers/randomgame');

/**
 * @type {import('../../structures/Command')}
 */
module.exports = {
    name: 'startrandomgame',
    description: 'Start a random game in the specified channel right now',
    category: 'ADMIN',
    command: {
        enabled: false
    },
    slashCommand: {
        enabled: true,
        autodefer: true,
        ephemeral: true,
        options: [
            {
                name: 'game',
                required: true,
                description: 'The game to start',
                type: ApplicationCommandOptionType.String,
                choices: games.map(g => (
                    {
                        name: g,
                        value: g,
                    }
                )),
            },
            {
                name: 'channel',
                required: false,
                description: 'The channel where launch the game',
                type: ApplicationCommandOptionType.Channel,
            },
            {
                name: 'points',
                required: false,
                description: 'Amount of points to reward',
                type: ApplicationCommandOptionType.Integer
            },
            {
                name: 'max',
                required: false,
                description: 'Max number in "guess the number"',
                type: ApplicationCommandOptionType.Integer
            },
            {
                name: 'word',
                required: false,
                description: 'The word to guess',
                type: ApplicationCommandOptionType.String,
            }
        ]
    },

    async interactionRun(interaction) {
        const game = interaction.options.getString('game')
        let channel = interaction.options.getChannel('channel');
        const points = interaction.options.getInteger('points');
        const max = interaction.options.getInteger('max');
        const word = interaction.options.getString('word');

        if (!channel) {
            channel = await interaction.client.guilds.cache.get(process.env.GUILD_ID).channels.fetch(process.env.GAME_CHANNEL);
        }

        await interaction.channel.send({ embeds: [
            new EmbedBuilder()
                .setTitle(`A minigame is starting!`)
                .setDescription(`A minigame launched by <@${interaction.user.id}> will start soon! Stay tuned!`)
                .setTimestamp()
                .setColor(Colors.Green),
        ] })

        setTimeout(() => {
            launch(game, channel, {max, points, word});
            return interaction.followUp('Game launched!');
        }, 1 * 1000);
    }
}