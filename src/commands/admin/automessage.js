const { ApplicationCommandOptionType, ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle, SelectMenuBuilder, EmbedBuilder, Colors } = require('discord.js');
const { default: mongoose } = require('mongoose');
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
            },
            {
                name: 'list',
                description: 'list all the automessages',
                type: ApplicationCommandOptionType.Subcommand
            },
            {
                name: 'delete',
                description: 'delete an automessage',
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: 'message_id',
                        type: ApplicationCommandOptionType.String,
                        description: 'The message ID to delete',
                        required: true
                    }
                ]
            }
        ],
        autodefer: false
    },

    async interactionRun(interaction, data) {
        const sub = interaction.options.getSubcommand();

        switch(sub) {
            case 'create':
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
            break;
            case 'list':
                const automessages = await Automessage.find();
                const embed = new EmbedBuilder()
                    .setTitle('Automessages')
                    .setColor(Colors.Aqua)
                    .setFields(automessages.map(m => (
                        [
                            {
                                name: 'ID',
                                value: m.id,
                                inline: true
                            },
                            {
                                name: 'Name',
                                value: m.name,
                                inline: true
                            },
                            {
                                name: 'Frequency',
                                value: m.frequency,
                                inline: true
                            }
                        ]
                    )).flat())
                await interaction.reply({ embeds: [embed] });
            break;
            case 'delete':
                let id = interaction.options.getString('message_id');
                try {
                    id = mongoose.Types.ObjectId(id);
                } catch (err) {
                    interaction.client.logger.warn(`ID ${id} not valid`);
                    return interaction.reply('ID not valid');
                }
                const automessage = await Automessage.findById(id);
                if (!automessage) return interaction.reply('No message found with the given ID');
                await automessage.delete();
                await interaction.reply('Automessage deleted!');
            break;
        }
    }
}