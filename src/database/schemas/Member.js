const { model, Schema } = require("mongoose");

const ReqString = {
    type: String,
    required: true,
};

const schema = new Schema(
    {
        member_id: ReqString
    }
);

const Model = model('members', schema);

module.exports = {
    getMember: async(guild_id, member_id) => {
        let member = await Model.findOne({ guild_id, member_id});
        if (!member) {
            member = new Model({
                guild_id,
                member_id
            });
        }

        return member;
    }
}