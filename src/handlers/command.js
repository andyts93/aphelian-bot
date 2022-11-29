module.exports = {
    /**
     * 
     * @param {import('discord.js').Message} message 
     * @param {import('../structures/Command')} cmd
     * @param {object} settings 
     */
    handlePrefixCommand: async function (message, cmd, settings) {
        const prefix = process.env.BOT_PREFIX;
        const args = message.content.replace(prefix, "").split(/\s+/);
        const invoke = args.shift().toLowerCase();

        const data = {};
        data.prefix = prefix;
        data.invoke = invoke;

        if (!message.channel.permissionsFor(message.guild.members.me).has('SendMessages')) return;

        // user permissions
        if (cmd.userPermissions && cmd.userPermissions.length > 0) {
            if (!message.channel.permissionsFor(message.member).has(cmd.userPermissions)) {
                return message.reply(`You need ${cmd.userPermissions} for this command`)
            }
        }

        try {
            await cmd.messageRun(message, args, data);
        }
        catch (ex) {
            message.client.logger.error('messagRun', ex);
            message.reply('An error occured while running this command');
        }
    },

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
            if (cmd.slashCommand.autodefer) await interaction.followUp('Oops! An error occured while running the command');
            else await interaction.reply('Oops! An error occured while running the command');
            interaction.client.logger.error('interactionRun', ex);
        }
    }
}