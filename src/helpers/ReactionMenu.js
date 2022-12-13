const { ButtonBuilder, ActionRowBuilder, EmbedBuilder } = require('@discordjs/builders');
const { ButtonStyle } = require('discord.js');

module.exports = class ReactionMenu {
    /**
     * 
     * @param {import('../structures/BotClient')} client
     * @param {import('discord.js').ChatInputCommandInteraction | import('discord.js').Message} trigger 
     * @param {import('discord.js').GuildMember} member 
     * @param {import('discord.js').Embed} embed 
     * @param {array} rows 
     * @param {integer} interval 
     * @param {integer} timeout 
     */
    constructor(client, trigger, member, embed, rows, interval, timeout) {
        this.client = client;
        this.rows = rows;
        this.interval = interval;
        this.timeout = timeout;
        this.memberId = member.id;
        this.embed = embed;

        this.forwardButton = new ButtonBuilder()
            .setStyle(ButtonStyle.Secondary)
            .setEmoji({ name: '⏩' })
            .setCustomId('forward');
        this.backButton = new ButtonBuilder()
            .setStyle(ButtonStyle.Secondary)
            .setEmoji({ name: '⏪' })
            .setCustomId('back');

        const components = [];
        if (this.rows.length > interval) {
            components.push(new ActionRowBuilder().setComponents([this.forwardButton]));
        }

        trigger.editReply({
            embeds: [
                this.generateEmbed(0)
            ],
            components,
        }).then(message => {
            this.message = message;
            this.createCollector();
        })
    }

    generateEmbed(start) {
        const current = this.rows.slice(start, start + this.interval);

        return new EmbedBuilder(this.embed.toJSON())
            .setTitle(`${this.embed.data.title} | ${start + 1}-${start + current.length} of ${this.rows.length}`)
            .setDescription(current.length > 0 ? current.join('\n') : 'Nothing to see here!');     
    }

    createCollector() {
        const collector = this.message.createMessageComponentCollector({
            filter: ({ user }) => user.id === this.memberId,
            time: this.timeout,
        });

        let currentIndex = 0;

        collector.on('collect', async interaction => {
            if (interaction.customId === 'back') {
                currentIndex -= this.interval;
            } else {
                currentIndex += this.interval;
            }

            const components = [];

            const pagination = [
                ...(currentIndex ? [this.backButton] : []),
                ...(currentIndex + this.interval < this.rows.length ? [this.forwardButton] : []),
            ];

            if (pagination.length > 0) {
                components.push(new ActionRowBuilder().setComponents(pagination))
            }

            await interaction.update({
                embeds: [this.generateEmbed(currentIndex)],
                components,
            });
        });

        collector.on('end', () => {
            this.message.editReply({
                embeds: [
                    this.generateEmbed(currentIndex)
                ],
                components: []
            });
        });
    }
}