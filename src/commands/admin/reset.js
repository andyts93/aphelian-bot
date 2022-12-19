const { ApplicationCommandOptionType } = require('discord.js');
const { Member } = require('../../database/schemas/Member');

/**
 * @type {import('../../structures/Command')}
 */
module.exports = {
    name: 'reset',
    description: 'Reset',
    userPermissions: ['ManageGuild'],
    category: 'ADMIN',
    command: {
        enabled: false
    },
    slashCommand: {
        enabled: true,
        autodefer: true,
        ephemeral: false,
        options: [
            {
                name: 'gamepoints',
                type: ApplicationCommandOptionType.Subcommand,
                description: 'Reset all gamepoints'
            }
        ]
    },

    async interactionRun(interaction) {
        await Member.find().updateMany({
            game_points: 0
        })

        return interaction.editReply({
            content: 'All points reset!'
        });
    }
}