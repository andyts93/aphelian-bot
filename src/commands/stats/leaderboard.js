/**
 * @typedef {"gamepoints"|"giftalks"} LeaderboardType
 */

const { ApplicationCommandOptionType, EmbedBuilder, Colors } = require('discord.js');
const { Member } = require('../../database/schemas/Member');
const ReactionMenu = require('../../helpers/ReactionMenu');
const { retrieveMember } = require('../../helpers/Utils');

/**
 * @type {LeaderBoardType}
 */
const lbTypes = [
    'gamepoints',
    'giftalks',
];

/**
 * @type {import('../../structures/Command')}
 */
module.exports = {
    name: 'leaderboard',
    description: 'Show server leaderboard',
    category: 'STATS',
    command: {
        enabled: false,
    },
    slashCommand: {
        enabled: true,
        ephemeral: false,
        autodefer: true,
        options: [
            {
                name: 'type',
                required: true,
                type: ApplicationCommandOptionType.String,
                description: 'The leaderboard type',
                choices: lbTypes.map(l => (
                    {
                        name: l,
                        value: l
                    }
                ))
            }
        ]
    },

    async interactionRun(interaction) {
        const type = interaction.options.getString('type');

        await leaderboard(interaction, type);
    },
}

/**
 * 
 * @param {import('discord.js').ChatInputCommandInteraction | import('discord.js').Message} trigger
 * @param {LeaderboardType} type
 */
const leaderboard = async (trigger, type) => {
    let schemaField;
    let embedTitle;
    let um;
    switch (type) {
        case 'gamepoints':
            schemaField = 'game_points';
            embedTitle = 'Game points';
            um = 'game points won.'
            break;
        case 'giftalks':
            schemaField = 'gifTalks';
            embedTitle = 'Gif talks';
            um = 'gif sent.'
            break;
    }

    const members = await Member.find({}).sort({ [schemaField]: -1 });

    const embed = new EmbedBuilder()
        .setTitle(`**${embedTitle} leaderboard**`)
        .setColor(Colors.Grey);

    return new ReactionMenu(
        trigger.client,
        trigger,
        trigger.member,
        embed,
        members.map(async (row, index) => {
            let position;
            switch (index) {
                case 0:
                    position = ':first_place:  ';
                    break;
                case 1:
                    position = ':second_place:  ';
                    break;
                case 2:
                    position = ':third_place:  ';
                    break;
                default:
                    position = `\`${index + 1}.  \``;
                    break;
            }
            await retrieveMember(row.member_id);
            return `${position} <@${row.member_id}>・**${row[schemaField]}** ${um}`; 
        }),
        10,
        15 * 60 * 1000
    );
}