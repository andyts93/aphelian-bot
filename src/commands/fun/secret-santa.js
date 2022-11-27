const { EmbedBuilder } = require('@discordjs/builders');
const { Colors, ApplicationCommandOptionType, ActionRow, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { SecretSanta } = require('../../database/schemas/SecretSanta');
const { Settings } = require('../../database/schemas/Settings');

/**
 * @type {import('../../structures/Command')}
 */
module.exports = {
    name: 'secretsanta',
    description: 'Manage the secret santa event',
    category: 'FUN',
    // userPermissions: ["KickMembers"],
    command: {
        enabled: false,
    },
    slashCommand: {
        enabled: true,
        ephemeral: true,
        autodefer: true,
        options: [
            {
                name: 'start',
                description: 'Start your Secret Santa!',
                type: ApplicationCommandOptionType.Subcommand,
            },
            {
                name: 'pick',
                description: 'Pick a user to whom give a gift',
                type: ApplicationCommandOptionType.Subcommand,
            },
        ]
    },

    async interactionRun(interaction) {
        const settings = await Settings.findOne();
        if (!settings.secretSanta.enabled) {
            return interaction.editReply('Command disabled');
        }
        const sub = interaction.options.getSubcommand();
        if (sub === 'start') {
            // Check if user already exists
            let ssParticipant = await SecretSanta.findOne({member_id: interaction.member.id});

            await interaction.followUp(
                { 
                embeds: [
                    new EmbedBuilder()
                        .setTitle('Welcome Aphelian to our Secret Santa!')
                        .setDescription(`Secret Santa is a tradition in which members of a community are randomly assigned a person whom they give a gift. The identity of the gift giver is to remain a secret and should not be revelead until the day of the gift exchange happens.
                        
                        **Eligibility**
                        To be eligible to partecipate your account in the server must be at least a week old and you have to send at least 50 messages.
                        
                        **How to participate**
                        To partecipate click the button below, you will be prompted to insert some of your information that permit your secret santa to gift you something. You can choose which information to give, the more you give, the more possibilities will have your gift giver.
                        **None of the fields are mandatory, but you have to compile at least one**
                        
                        :warning: **WARNING** :warning:
\`\`\`diff
- Aphelium doesn't have responsability on the gifts, we can't assure your secret santa will actually send you a gift, participate only if you are willing to gift a member, please respect each other.
\`\`\`
                        `)
                        .setColor(Colors.Green)
                        .setTimestamp()
                ],
                components: [
                    new ActionRowBuilder()
                        .setComponents([
                            new ButtonBuilder()
                                .setCustomId('start-santa')
                                .setLabel(ssParticipant ? 'Edit information': 'Start')
                                .setStyle(ssParticipant ? ButtonStyle.Primary : ButtonStyle.Success)
                        ])
                ]
            });

            // Manage the user button click
            const res = await interaction.channel.awaitMessageComponent({
                componentType: ComponentType.Button,
                time: 10 * 60 * 1000,
                filter: i => i.member.id === interaction.member.id
            }).catch(err => {
                if (err.message.includes('time')) return;
            });
            if (!res) return interaction.editReply({ content: 'Timed out, try again', components: []});
            
            // Show information modal
            await res.showModal(
                new ModalBuilder({
                    custom_id: 'secret-santaStart',
                    title: 'Secret Santa participation',
                    components: [
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder()
                                .setCustomId('wallets')
                                .setLabel('Wallet address')
                                .setPlaceholder('One or more wallet addresses. Remember to add the chains your wallet support!')
                                .setStyle(TextInputStyle.Paragraph)
                                .setRequired(false)
                                .setValue(ssParticipant ? ssParticipant.wallets : '')
                        ),
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder()
                                .setCustomId('email')
                                .setLabel('Email')
                                .setPlaceholder('Your email address for other digital gifts')
                                .setStyle(TextInputStyle.Short)
                                .setRequired(false)
                                .setValue(ssParticipant ? ssParticipant.email : '')
                        ),
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder()
                                .setCustomId('address')
                                .setLabel('Address')
                                .setPlaceholder('Your address for physical goods. Remember to add all the info such name, address, zip code, state')
                                .setStyle(TextInputStyle.Paragraph)
                                .setRequired(false)
                                .setValue(ssParticipant ? ssParticipant.address : '')
                        ),
                    ]
                })
            );

            // Wait for modal submission
            const modal = await res.awaitModalSubmit({
                time: 20 * 60 * 1000,
                filter: m => m.customId === 'secret-santaStart' && m.member.id === res.member.id
            }).catch(err => {
                if (err.message.includes('time')) return;
            });
            if (!modal) return interaction.followUp({ content: 'Timed out, try again', components: [], ephemeral: true});

            const {wallets, email, address} = {
                wallets: modal.fields.getTextInputValue('wallets'),
                email: modal.fields.getTextInputValue('email'),
                address: modal.fields.getTextInputValue('address')
            }

            // If none of the fields are compiled throw error
            if (wallets?.length === 0 && email?.length === 0 && address?.length === 0) {
                return modal.reply({ embeds: [interaction.client.errorEmbed({description: 'You have to compile at least one field'})], ephemeral: true });
            }

            if (!ssParticipant) {
                ssParticipant = new SecretSanta({
                    member_id: modal.member.id
                });
            }

            ssParticipant.wallets = wallets;
            ssParticipant.email = email;
            ssParticipant.address = address;
            
            try {
                await ssParticipant.save();
            } catch (err) {
                interaction.logger.err('Unable to save secret santa member', err);
                return modal.reply({ embeds: [interaction.client.errorEmbed({description: 'An error occured while saving your application, please try again or contact the support'})], ephemeral: true });
            }
            return modal.reply({ embeds: [
                new EmbedBuilder()
                    .setTitle('Congratulations!')
                    .setDescription('You are now a participant of the Aphelium Secret Santa!')
                    .setColor(Colors.Green)
                    .setTimestamp()
            ], ephemeral: true});
        } else if (sub === 'pick') {
            // Check if user is participant
            const participant = await SecretSanta.findOne({member_id: interaction.member.id});
            if (!participant) {
                return interaction.editReply({ embeds: [
                    interaction.client.errorEmbed({ description: 'You are not a pariticipant, use `/secretsanta start` to participate!' })
                ]});
            }

            if (participant.giftee) {
                const giftReceiver = await interaction.guild.members.fetch(participant.giftee);
                const gifteeInfo = await SecretSanta.findOne({member_id: giftReceiver.id});
                return interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('Secret santa')
                            .setColor(Colors.Green)
                            .setDescription(`Your **secret giftee** is ||<@${giftReceiver.id}>||! Here's the information:
    
                            **Wallets**: ${gifteeInfo.wallets}
                            **Email**: ${gifteeInfo.email}
                            **Address**: ${gifteeInfo.address}
                            `)
                            .setThumbnail('https://img.freepik.com/free-vector/beautiful-artistic-decorative-christmas-tree-holiday-background_1035-25734.jpg?w=740&t=st=1669308098~exp=1669308698~hmac=bf3ae6563376f21759be10bf9111485cf40af392558120911581778bb11aa42b'),
                    ]
                });
            }

            const freeMembers = await SecretSanta.aggregate([
                {
                    "$lookup": {
                        from: "secret_santas",
                        localField: "member_id",
                        foreignField: "giftee",
                        as: "member_giftee"
                    }
                },
                {
                    "$match": {"member_giftee.0": { "$exists": false }, member_id: { "$ne": interaction.member.id }}
                },
                {
                    "$limit": 1
                },
                {
                    "$sample": { size: 1 }
                }
            ]);

            if (freeMembers.length === 0) {
                return interaction.editReply({ embeds: [
                    interaction.client.errorEmbed({ description: 'Oh no! Seems like there are no free giftee :(' })
                ]});
            }

            const giftee = await interaction.guild.members.fetch(freeMembers.at(0).member_id);

            try {
                participant.giftee = giftee.id;
                await participant.save();
            } catch (err) {
                interaction.client.logger.error('Unable to save giftee', err);
                return interaction.editReply({ embeds: [
                    interaction.client.errorEmbed({ description: 'An error occured while saving your giftee' }),
                ]});
            }

            return interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle('Secret santa')
                        .setColor(Colors.Green)
                        .setDescription(`Your **secret giftee** is ||<@${giftee.id}>||! Here's the information:

                        **Wallets**: ${freeMembers.at(0).wallets}
                        **Email**: ${freeMembers.at(0).email}
                        **Address**: ${freeMembers.at(0).address}
                        `)
                        .setThumbnail('https://img.freepik.com/free-vector/beautiful-artistic-decorative-christmas-tree-holiday-background_1035-25734.jpg?w=740&t=st=1669308098~exp=1669308698~hmac=bf3ae6563376f21759be10bf9111485cf40af392558120911581778bb11aa42b'),
                ]
            });
        }
    }
}