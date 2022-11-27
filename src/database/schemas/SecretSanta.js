const { model, Schema } = require("mongoose");

const schema = new Schema(
    {
        member_id: {
            type: String,
            required: true,
            unique: true,
            dropDus: true,
        },
        wallets: {
            type: String,
        },
        email: {
            type: String,
        },
        address: {
            type: String,
        },
        giftee: {
            type: String,
        },
    }
);

const Model = model('secret_santa', schema);

module.exports = {
    SecretSanta: Model,
}