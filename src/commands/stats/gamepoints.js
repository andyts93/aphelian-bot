const { EmbedBuilder } = require('@discordjs/builders');
const { Colors } = require('discord.js');
const { getMember } = require('../../database/schemas/Member')

/**
 * @type {import('../../structures/Command')}
 */
module.exports = {
    name: 'gamepoints',
    description: 'Show your game points',
    category: 'STATS',
    command: {
        enabled: false,
        aliases: ['gp']
    },
    slashCommand: {
        enabled: false,
        ephemeral: false,
        autodefer: true
    },

    async interactionRun(interaction) {
        return interaction.editReply({ embeds: [ await getPoints(interaction.member) ] });
    },

    async messageRun(message) {
        return message.reply({ embeds: [ await getPoints(message.member)] });
    }
}

/**
 * 
 * @param {import('discord.js').GuildMember} member
 */
const getPoints = async (member) => {
    const mongoMember = await getMember(member.user.id);

    return new EmbedBuilder()
        .setTitle(member.nickname || member.user.username)
        .setDescription(`You have **${mongoMember.game_points} Game Points!**`)
        .setColor(Colors.Blue);
}