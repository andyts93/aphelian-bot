module.exports = {
    /**
     * 
     * @param {import('discord.js').ChatInputCommandInteraction} interaction
     */
    handleSlashCommand: async function (interaction) {
        /**
         * @type {import('../structures/Command')}
         */
        const cmd = interaction.client.slashCommands.get(interaction.commandName);
        if (!cmd) interaction.reply({ content: 'An error has occured', ephemeral: true}).catch(() => {});

        // User permissions
        if (interaction.member && cmd.userPermissions?.length > 0) {
            if (!interaction.member.permissions.has(cmd.userPermissions)) {
                return interaction.reply({
                    content: `You need ${cmd.userPermissions} for this command`,
                    ephemeral: true
                });
            }
        }

        try {
            if (cmd.slashCommand.autodefer) await interaction.deferReply({ ephemeral: cmd.slashCommand.ephemeral });
            await cmd.interactionRun(interaction);
        } catch (ex) {
            await interaction.followUp('Oops! An error occured while running the command');
            interaction.client.logger.error('interactionRun', ex);
        }
    }
}