'use strict';
const Config = require('./config');
const Reply = require('./reply');
const moment = require('moment');

class Slack {
    constructor(bot) {
        this.bot = bot;
    }

    // 定期的なつぶやき
    sayIntervalComment() {
        const hour = moment().format("k");
        if (hour < Config.untilHour) {
            sayPushPhrase(this.bot);
            return;
        }
        const text = Reply.lastMessage(Config.channel, process.env.mention);
        this.bot.say({text, channel: process.env.channelId});
        stopProcess();
    }

    reply(message) {

        if (message.channel != process.env.channelId) {
            return;
        }
        // 日本語が入っていればtiqavで返信してみる
        const text = (message.text.match(/[亜-熙ぁ-んァ-ヶ]+/)) ?
            `http://${message.text.replace(/[、。！]/g,'')}.tiqav.com` :
            Reply.cool();

        this.bot.reply(message, text);
    }

    sayAggregationMessage(size) {
        this.bot.say({text: Reply.aggregationSuccess(size), channel: process.env.channelId}, null);
    }

    sayAggregationErrorMessage(size) {
        this.bot.say({text: Reply.aggregationError(size), channel: process.env.channelId}, null);
    }

    sayCompleteReply(date) {
        this.bot.say({text: Reply.complete(date), channel: process.env.channelId}, null);
    }

    sayErrorReply(size) {
        this.bot.say({text: Reply.error(size), channel: process.env.channelId}, null);
    }

    finishProcess(message) {
        if (message.channel != process.env.channelId) {
            return;
        }
        const comment = (moment().format("k") < Config.talkStartHour) ?
            Reply.pleasure() :
            Reply.displeasure();

        this.bot.reply(message, comment);
        stopProcess();
    }
}

const sayPushPhrase = (bot) => {
    if (moment().format("k") < Config.talkStartHour) {
        return;
    }
    const text = Reply.reminder(process.env.mention);
    bot.say({text, channel: process.env.channelId});
};

const stopProcess = () => {
    setTimeout(() => {
        process.exit();
    }, 100);
};

module.exports = Slack;