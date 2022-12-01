const { model, Schema } = require("mongoose");

const ReqString = {
    type: String,
    required: true,
};

const schema = new Schema(
    {
        member_id: ReqString,
        messages: {
            type: Number,
            default: 0
        },
        game_points: {
            type: Number,
            default: 0
        },
        crew3Id: {
            type: String
        }
    }
);

const Model = model('members', schema);

module.exports = {
    getMember: async(member_id) => {
        let member = await Model.findOne({ member_id});
        if (!member) {
            member = new Model({
                member_id
            });
        }

        return member;
    }
}