/**
 * @typedef {"get-user"|"give-xp"|"remove-xp"|"leaderboard"|"sprint-leaderboard"} crew3Operation
 */

const { getMember } = require('../database/schemas/Member');

const axios = require('axios').default;

const axInstance = axios.create({
    baseURL: process.env.CREW3_BASE_PATH,
    headers: {
        common: {
            'x-api-key': process.env.CREW3_API_KEY,
            'Accept-Encoding': 'application/json',
        }
    },
    timeout: 5000,
});

/**
 * 
 * @param {crew3Operation} op 
 * @param {*} params 
 */
const crew3Call = async (op, params) => {
    let url = process.env.CREW3_BASE_PATH;
    let method = 'GET';

    switch (op) {
        case 'get-user':
            url += 'users';
            break;
        case 'give-xp':
            method = 'POST';
            url += `users/${params.user_id}/xp`;
        break;
    }

    return await axInstance.request({
        method,
        url,
        data: params.body || null,
        timeout: 5000,
        params: params.query || null,
    });
}

const getCrew3Id = async (user_id) => {
    const member = await getMember(user_id);
    
    if (member.crew3Id) return member.crew3Id;

    try {
        const response = await crew3Call('get-user', {
            query: {
                discordId: user_id
            }
        });

        const data = response.data;
        
        member.crew3Id = data.id;
        await member.save();
        return data.id;
    } catch (err) {
        console.log(err);
        throw new Error('Cannot retrieve crew3id');
    }
}

module.exports = {
    /**
     * 
     * @param {string|number} user_id 
     * @param {number} xp
     */
    giveXP: async (user_id, xp) => {
        const crew3Id = await getCrew3Id(user_id);
        await crew3Call('give-xp', {
            user_id: crew3Id,
            body: {
                xp,
                label: 'test',
                description: 'prova',
            }
        });
    }
}