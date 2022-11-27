const { model, Schema } = require("mongoose");

const schema = new Schema(
    {
        secretSanta: {
            enabled: { type: Boolean, default: false },
            pickDate: { type: Date }
        },
        messageCount: {
            enabled: { type: Boolean, default: false },
            delay: { type: Number, default: 0 },
            minChars: { type: Number, default: 0 }
        }
    }
);

const Model = model('settings', schema);

module.exports = {
    Settings: Model,
}