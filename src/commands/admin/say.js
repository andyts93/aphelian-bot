const { ApplicationCommandOptionType } = require('discord.js');

/**
 * @type {import('../../structures/Command'}
 */
module.exports = {
    name: 'say',
    description: 'say something',
    category: 'ADMIN',
    command: {
        enabled: false,
    },
    slashCommand: {
        enabled: true,
        autodefer: true,
        ephemeral: true,
        options: [
            {
                name: 'sentence',
                description: 'The sentence to say',
                type: ApplicationCommandOptionType.String,
                required: true,
            },
            {
                name: 'channel',
                description: 'Channel where to speak',
                type: ApplicationCommandOptionType.Channel,
                required: false,
            }
        ]
    },

    async interactionRun(interaction) {
        const sentence = interaction.options.getString('sentence');
        let channel = interaction.options.getChannel('channel');

        if (!channel) {
            channel = interaction.channel;
        }

        await channel.send({
            content: sentence,
        });

        return await interaction.followUp('Sent');
    }
}