const { getMember } = require("../database/schemas/Member");

const cooldownCache = new Map();

module.exports = {
    /**
     * 
     * @param {import("discord.js").Message} message 
     * @param {object} settings
     */
    async trackMessages(message, settings) {
        const member = await getMember(message.member.id);

        const key = message.member.id;

        if (cooldownCache.has(key)) {
            const difference = (Date.now() - cooldownCache.get(key)) / 1000;
            if (difference < settings.messageCount.delay) return;
        }

        if (message.content.length <= settings.messageCount.minChars) return;

        member.messages++;
        await member.save();
        cooldownCache.set(key, Date.now());
    }
}