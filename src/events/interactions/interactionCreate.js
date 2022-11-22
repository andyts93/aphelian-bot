const { handleSlashCommand } = require('../../handlers/command')

/**
 * 
 * @param {import('../../structures/BotClient')} client 
 * @param {import('discord.js').BaseInteraction} interaction 
 */
module.exports = async (client, interaction) => {
    if (interaction.isChatInputCommand()) {
        await handleSlashCommand(interaction);
    }
}