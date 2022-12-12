const { ApplicationCommandOptionType, EmbedBuilder, Colors } = require('discord.js');
const { launch } = require('../../handlers/randomgame');

/**
 * @type {import('../../structures/Command')}
 */
module.exports = {
    name: 'startrandomgame',
    description: 'Start a random message in the specified channel right now',
    category: 'ADMIN',
    userPermissions: ['ManageGuild'],
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
                choices: [
                    {
                        name: 'First win',
                        value: 'first-win',
                    },
                    {
                        name: 'Guess the emojii',
                        value: 'guess'
                    }
                ],
            },
            {
                name: 'channel',
                required: false,
                description: 'The channel where launch the game',
                type: ApplicationCommandOptionType.Channel,
            }
        ]
    },

    async interactionRun(interaction) {
        const game = interaction.options.getString('game')
        let channel = interaction.options.getChannel('channel');

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
            launch(game, channel);
            return interaction.followUp('Game launched!');
        }, 10 * 1000);
    }
}