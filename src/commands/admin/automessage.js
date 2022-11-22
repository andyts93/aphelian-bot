const { ApplicationCommandOptionType, ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle, SelectMenuBuilder } = require('discord.js');
const { Automessage } = require('../../database/schemas/Automessage');

/**
 * @type {import('../../structures/Command')}
 */
module.exports = {
    name: 'automessage',
    description: "setup auto messages in specified channel",
    category: 'ADMIN',
    userPermissions: ["ManageGuild"],
    command: {
        enabled: false,
    },
    slashCommand: {
        enabled: true,
        ephemeral: false,
        options: [
            {
                name: 'create',
                description: 'set up new automessage',
                type: ApplicationCommandOptionType.Subcommand,
            }
        ],
        autodefer: false
    },

    async interactionRun(interaction, data) {
        const sub = interaction.options.getSubcommand();

        if (sub === 'create') {
            await interaction.showModal(
                new ModalBuilder({
                    customId: 'automessage-modalCreate',
                    title: 'New automessage',
                    components: [
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder()
                                .setCustomId('name')
                                .setLabel('Name')
                                .setStyle(TextInputStyle.Short)
                                .setRequired(true)
                        ),
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder()
                                .setCustomId('frequency')
                                .setLabel('Frequency')
                                .setPlaceholder('1h | 1d | 1w')
                                .setStyle(TextInputStyle.Short)
                                .setRequired(true)
                        ),
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder()
                                .setCustomId('message')
                                .setLabel('Message')
                                .setStyle(TextInputStyle.Paragraph)
                                .setRequired(true)
                        ),
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder()
                                .setCustomId('channel')
                                .setLabel('Channel ID')
                                .setStyle(TextInputStyle.Short)
                                .setRequired(true)
                        )
                    ]
                })
            );

            const modal = await interaction.awaitModalSubmit({
                time: 1 * 60 * 1000,
                filter: m => m.customId === 'automessage-modalCreate'
            });

            const {name, frequency, message, channel} = {
                name: modal.fields.getTextInputValue('name'),
                frequency: modal.fields.getTextInputValue('frequency'),
                message: modal.fields.getTextInputValue('message'),
                channel: modal.fields.getTextInputValue('channel'),
            };

            try {
                const model = new Automessage({
                    name,
                    frequency,
                    message,
                    channelId: channel,
                });
                model.save();
            } catch (ex) {
                modal.reply('An error occured');
                interaction.client.logger.error(ex);
            }

            modal.reply('Automessage created!');
        }
    }
}