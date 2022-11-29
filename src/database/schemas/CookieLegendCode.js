const { model, Schema } = require("mongoose");

const ReqString = {
    type: String,
    required: true,
};

const schema = new Schema(
    {
        code: ReqString,
    }
);

const Model = model('cookieLegendCode', schema);

module.exports = {
    CookieLegendCode: Model,
}