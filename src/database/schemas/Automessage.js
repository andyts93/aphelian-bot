const { model, Schema } = require("mongoose");

const ReqString = {
    type: String,
    required: true,
};

const schema = new Schema(
    {
        name: ReqString,
        message: ReqString,
        frequency: ReqString,
        channelId: ReqString,
        lastSent: {
            type: Date
        }
    }
);

const Model = model('automessages', schema);

module.exports = {
    Automessage: Model,
}