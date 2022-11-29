const { EmbedBuilder } = require('@discordjs/builders');
const { Colors } = require('discord.js');
const { getMember } = require('../../database/schemas/Member');
const { Settings } = require('../../database/schemas/Settings');


/**
 * @type {import('../../structures/Command')}
 */
module.exports = {
    name: 'messages',
    description: 'Get your messages sent',
    category: 'STATS',
    command: {
        enabled: false,
    },
    slashCommand: {
        enabled: true,
        ephemeral: false,
        autodefer: true,
    },

    async interactionRun(interaction) {
        const member = await getMember(interaction.member.id);
        const settings = await Settings.findOne();

        const embed = new EmbedBuilder()
            .setTitle(interaction.member.nickname || interaction.member.user.username)
            .setColor(Colors.Blue)
            .setDescription(`You sent **${member.messages}** messages!

            \`There's a ${settings.messageCount.delay} seconds cooldown between messages\``);

        return interaction.editReply({ embeds: [embed] });
    }
}