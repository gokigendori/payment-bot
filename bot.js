'use strict';
const Promise = require("bluebird");
const Botkit = require('botkit');
const moment = require('moment');
const Config = require('./src/config');
const Slack = require('./src/slack');
const Luis = require('./src/luis');

if (!process.env.token) {
    console.log('Error: Specify token in environment');
    process.exit(1);
}

const controller = Botkit.slackbot({
    json_file_store: './json_db',
    retry: 5,
    debug: true,
});
Promise.promisifyAll(controller.storage.channels);

const bot = controller.spawn({
    token: process.env.token
}).startRTM();

const slack = new Slack(bot);
const luis = new Luis();

controller.on('rtm_open', () => {
    slack.sayIntervalComment();
    aggregatePayment();
    aggregateError();
    setInterval(() => slack.sayIntervalComment() , Config.oneHour);
});

controller.on('rtm_close', () => {
    console.log("catch rtm_close event.");
});

controller.hears(
    ['done'],
    ['direct_message', 'direct_mention', 'mention', 'ambient'],
    (bot, message) => {
        slack.finishProcess(message);
    }
);

controller.hears('',
    ['direct_message', 'direct_mention', 'mention', 'ambient'],
    (bot, message) => {
        luis.request(message, processResult);
    }
);

// luis.aiの結果を処理
const processResult = (result, message) => {
    console.info(result);

    if (Luis.maxIntentType(result.intents) == 'completePayment') {
        luis.getCompleteDates(result.entities, saveDate);
        slack.finishProcess(message);
        return;
    }
    if (Luis.maxIntentType(result.intents) == 'error') {
        luis.getErrorNum(result.entities, saveError);
        return;
    }
    slack.reply(message);
};

// 集計用
const aggregateError = () => {

    const promises = [];
    for (let i = 1; i < 8; i++) {
        const d = `error_${moment().add(-i, 'days').format('YYYYMMDD')}`;
        promises.push(getPromise(d));
    }
    Promise.all(promises).then((results) => {
        let total = 0;
        (results.filter((r) => (r))).forEach((r) => {
            total += parseInt(r.num);
        });
        slack.sayAggregationErrorMessage(total);
    });
};
const aggregatePayment = () => {

    const promises = [];
    for (let i = 1; i < 8; i++) {
        const d = `payment_${moment().add(-i, 'days').format('YYYYMMDD')}`;
        promises.push(getPromise(d));
    }
    Promise.all(promises).then((results) => {
        const size = (results.filter((r) => (r))).length;
        slack.sayAggregationMessage(size);
    });
};

const getPromise = (str) => controller.storage.channels.getAsync(str).catch(() => {
});

// 結果をjsonで保存
const saveDate = (date) => {
    controller.storage.channels.save({
        id: `payment_${moment(date, 'YYYY/MM/DD').format("YYYYMMDD")}`,
        created_at: new Date()
    }, (err) => {
        console.log(err);
    });
    slack.sayCompleteReply(date);
};

const saveError = (num) => {
    const today = moment().format("YYYYMMDD");
    controller.storage.channels.save({
        id: `error_${today}`,
        num,
        created_at: new Date()
    }, (err) => {
        console.log(err);
    });
    slack.sayErrorReply(num);
};