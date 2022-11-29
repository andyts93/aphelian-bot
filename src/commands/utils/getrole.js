const { EmbedBuilder } = require('@discordjs/builders');
const { Colors, ApplicationCommandOptionType } = require('discord.js');
const { CookieLegendCode } = require('../../database/schemas/CookieLegendCode');

/**
 * @type {import('../../structures/Command')}
 */
module.exports = {
    name: 'getrole',
    description: 'Get a role by code',
    category: 'UTILITY',
    command: {
        enabled: true,
        minArgsCount: 1
    },
    slashCommand: {
        enabled: true,
        ephemeral: false,
        autodefer: true,
        options: [
            {
                name: 'code',
                required: true,
                description: 'The code to redeem your role',
                type: ApplicationCommandOptionType.String,
            }
        ]
    },

    async messageRun(message, args) {
        const code = args[0];

        const found = await CookieLegendCode.findOne({ code });

        if (!found) {
            return message.reply({ embeds: [message.client.errorEmbed({ description: 'Code not valid, try again'})]});
        }

        const embed = await assignRole(message, found);

        message.reply({ embeds: [ embed ] });
    },

    async interactionRun(interaction) {
        const code = interaction.options.getString('code');
        
        const found = await CookieLegendCode.findOne({ code });

        if (!found) {
            return interaction.editReply({ embeds: [interaction.client.errorEmbed({ description: 'Code not valid, try again'})]});
        }

        const embed = await assignRole(interaction, found);

        return interaction.editReply({
            embeds: [ embed ],
        });
    }
}

/**
 * 
 * @param {import('discord.js').Message | import('discord.js').Interaction} interaction
 * @param {any} found
 * @returns {EmbedBuilder}
 */
const assignRole = async (interaction, found) => {
    let role = interaction.guild.roles.cache.get(process.env.COOKIE_LEGEND_ROLE);
    if (!role) {
        role = await interaction.guild.roles.fetch(process.env.COOKIE_LEGEND_ROLE);
    }

    interaction.member.roles.add(role);

    await found.delete();

    return new EmbedBuilder()
        .setTitle('You legend!')
        .setDescription(`Congratulations! You obtained the ${role.name} role!`)
        .setColor(Colors.Green);
}