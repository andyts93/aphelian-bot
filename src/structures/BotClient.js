const { Client, GatewayIntentBits, Partials, Collection, ApplicationCommandType, EmbedBuilder, Colors } = require("discord.js");
const path = require("path");
const { schemas } = require("../database/mongoose");
const Logger = require("../helpers/Logger");
const { recursiveReadDirSync } = require("../helpers/Utils");
const { table } = require('table');

module.exports = class BotClient extends Client {

    constructor() {
        super({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
            ],
            partials: [
                Partials.User,
                Partials.Message,
                Partials.Reaction
            ],
            allowedMentions: {
                repliedUser: false
            },
            rest: {
                timeout: 20000
            }
        })

        this.logger = Logger;

        this.database = schemas;

        /**
         * @type {import('./structures/Command'))[]}
         */
        this.commands = [];
        this.commandIndex = new Collection();

        /**
         * @type {Collection<string, import('./structures/Command')>}}
         */
        this.slashCommands = new Collection();
    }

    loadEvents(directory) {
        this.logger.log('Loading events...');

        let success = 0;
        let failed = 0;
        const clientEvents = [];

        recursiveReadDirSync(directory).forEach((filePath) => {
            const file = path.basename(filePath);
            try {
                const eventName = path.basename(file, ".js");
                const event = require(filePath);

                this.on(eventName, event.bind(null, this));
                clientEvents.push([file, "✓"]);

                delete require.cache[require.resolve(filePath)];
                success += 1;
            } catch (ex) {
                failed += 1;
                this.logger.error(`loadEvent - ${file}`, ex);
            }
            });

            console.log(
                table(clientEvents, {
                    header: {
                    alignment: "center",
                    content: "Client Events",
                    },
                    singleLine: true,
                    columns: [{ width: 25 }, { width: 5, alignment: "center" }],
            })
        );

        this.logger.log(`Loaded ${success + failed} events. Success (${success}) Failed (${failed})`);
    }

    /**
     * Find command matching the invoke
     * 
     * @param {string} invoke
     * @returns {import('@structures/Command')|undefined} 
     */
    getCommand(invoke) {
        const index = this.commandIndex.get(invoke.toLowerCase());
        return index !== undefined ? this.commands[index] : undefined;
    }

    /**
     * 
     * @param {import('./Command')} cmd
     */
    loadCommand(cmd) {
        if (cmd.command?.enabled) {
            // TODO
        }

        if (cmd.slashCommand?.enabled) {
            if (this.slashCommands.has(cmd.name)) throw new Error(`Slash command ${cmd.name} already registered`);
            this.slashCommands.set(cmd.name, cmd);
        }
    }

    /**
     * 
     * @param {string} directory 
     */
    loadCommands(directory) {
        this.logger.log('Loading commands...');
        const files = recursiveReadDirSync(directory);

        for (const file of files) {
            try {
                const cmd = require(file);
                if (typeof cmd !== 'object') continue;
                this.loadCommand(cmd);
            } catch (ex) {
                this.logger.error(`Failed to load ${file} Reason: ${ex.message}`);
            }
        }

        this.logger.success(`Loaded ${this.commands.length} commands`);
        this.logger.success(`Loaded ${this.slashCommands.length} slash commands`);

        if (this.slashCommands.size > 100) throw new Error("A maximum of 100 slash commands can be enabled");
    }

    /**
     * 
     * @param {string} guildId 
     */
    async registerInteractions(guildId) {
        const toRegister = [];

        this.slashCommands.map(cmd => ({
            name: cmd.name,
            description: cmd.description,
            type: ApplicationCommandType.ChatInput,
            options: cmd.slashCommand.options,
        })).forEach(s => toRegister.push(s));

        if (!guildId) {
            await this.application.commands.set(toRegister);
        } else if (guildId && typeof guildId === 'string') {
            const guild = this.guilds.cache.get(guildId);
            if (!guild) {
                this.logger.error(`Failed to register interactions in guild ${guildId}`, new Error("No matching guild"));
                return;
            }
            await guild.commands.set(toRegister);
        } else {
            throw new Error("Did you provide a valid guildId to register interactions");
        }
        this.logger.success("Successfully registered interactions");
    }

    errorEmbed({title, description}) {
        const embed = new EmbedBuilder()
            .setColor(Colors.DarkRed)
            .setTitle(title || 'Error')
            .setDescription(description || '');
        
        return embed;
    }
}