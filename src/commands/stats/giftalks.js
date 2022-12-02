const { EmbedBuilder } = require('@discordjs/builders');
const { Colors } = require('discord.js');
const { getMember } = require('../../database/schemas/Member')

/**
 * @type {import('../../structures/Command')}
 */
module.exports = {
    name: 'giftalks',
    description: 'Get how many GIFs you sent in gif-talks',
    command: {
        enabled: true,
        aliases: ['gt'],
    },
    slashCommand: {
        enabled: true,
        ephemeral: false,
        autodefer: true
    },

    async interactionRun(interaction) {
        return interaction.editReply({
            embeds: [
                await getPoints(interaction.member),
            ]
        });
    },
    
    async messageRun(message) {
        return message.reply({
            embeds: [
                await getPoints(message.member),
            ]
        })
    }
}

/**
 * 
 * @param {import('discord.js').GuildMember} member 
 */
const getPoints = async (member) => {
    const mongoMember = await getMember(member.id);

    return new EmbedBuilder()
        .setTitle(member.nickname || member.user.username)
        .setDescription(`You have sent **${mongoMember.gifTalks} GIFs** in gif-talks!`)
        .setColor(Colors.Blue);
}