'use strict';
const sprintf = require('sprintf').sprintf;
const Promise = require("bluebird");
const Botkit = require('botkit');
const Config = require('./config');
const rp = require('request-promise');
const moment = require('moment');
const co = require('co');
require('date-utils');

if (!process.env.token) {
    console.log('Error: Specify token in environment');
    process.exit(1);
}

const controller = Botkit.slackbot({
    json_file_store: './json_db',
    debug: false,
});
const luisAPI = sprintf(
    'https://api.projectoxford.ai/luis/v1/application?id=%s&subscription-key=%s&q=',
    process.env.luisId,
    process.env.luisSubscriptionKey
);

const jsonGet = (uri) => {
    const options = {
        uri: uri,
        transform: (body) => {
            return JSON.parse(body);
        },
    };
    return rp(options);
};

Promise.promisifyAll(controller.storage.channels);

controller.spawn({
    token: process.env.token
}).startRTM();

controller.on('rtm_open', (bot) => {
    sayPushPhrase(bot);
    setInterval(() => sayIntervalComment(bot), Config.oneHour);
});

controller.hears('',
    ['direct_message', 'direct_mention', 'mention', 'ambient'],
    function (bot, message) {
        jsonGet(luisAPI + encodeURI(message.text))
            .then((result) => processResult(result, bot, message));
    }
);

// 定期的なつぶやき
function sayIntervalComment(bot) {
    const hour = ( new Date()).toFormat("HH24");
    if (hour < Config.untilHour) {
        sayPushPhrase(bot);
        return;
    }

    const text = sprintf(Config.lastMessage, Config.channel, process.env.mention);
    bot.say({text: text, channel: process.env.channelId}, null);
    stopProcess();
}

// luis.aiの結果を処理
function processResult(result, bot, message) {
    console.info(result);

    const maxIntent = result.intents.sort((a, b) => {
        return a.score - b.score
    }).pop();

    if (maxIntent.intent == 'completePayment') {
        saveCompleteDate(result.entities);
        finishProcess(bot, message);
        return;
    }
    reply(bot, message);
}

function saveCompleteDate(entities) {
    const year = ( new Date()).toFormat("YYYY");
    let month = ( new Date()).toFormat("MM");

    entities.forEach((entity) => {
        // 全角数字等を正規化
        entity.entity = entity.entity.normalize('NFKC')
    });

    entities.forEach((entity) => {
        let date;
        if (entity.type == 'monthAndDay') {
            month = entity.entity.split('/')[0];
            date = sprintf("%s/%s", year, entity.entity);
            if (isLastYear(date)) {
                date = sprintf("%s/%s/%s", year - 1, month, entity.entity);
            }
            saveDate(date);
        }
        if (entity.type == 'day') {

            const nearEntity = entities
                .filter((element)=> {
                    return (element.type == 'monthAndDay' && (entity.startIndex - element.startIndex ) > 0 )
                }).pop();

            if (nearEntity) {
                month = nearEntity.entity.split('/')[0];
            }
            date = sprintf("%s/%s/%s", year, month, entity.entity);
            if (isLastYear(date)) {
                date = sprintf("%s/%s/%s", year - 1, month, entity.entity);
            }
            saveDate(date);
        }
    });
}
function aggregatePayment(bot) {

    var promises = [];
    for (let i = 1; i < 8; i++) {
        var d = sprintf('payment_%s', moment().add(-i, 'days').format('YYYYMMDD'));
        promises.push(getPromise(d));
    }

    co(function*() {
        return yield promises;
    }).then((results)=> {
        const size = (results.filter((r)=>(r))).length;
        bot.say({text: `先週の振込件数は${size}ね。よく頑張りました。`, channel: process.env.channelId}, null);
    });

}

function getPromise(str) {
    return controller.storage.channels.getAsync(str).catch(()=> {
    });
}

function isLastYear(date1) {
    const diff = (new Date(date1)).getTime() - (new Date()).getTime();
    const days = Math.ceil(Math.abs(diff) / (1000 * 3600 * 24));
    return (days > 300);
}

function reply(bot, message) {

    aggregatePayment(bot);

    if (message.channel != process.env.channelId) {
        return;
    }
    // 日本語が入っていればtiqavで返信してみる
    const text = (message.text.match(/[亜-熙ぁ-んァ-ヶ]+/)) ? `http://${message.text}.tiqav.com` : Config.coolMessage;
    bot.reply(message, text);
}

function saveDate(date) {

    controller.storage.channels.save({
        id: sprintf('payment_%s', (new Date(date)).toFormat("YYYYMMDD")),
        created_at: new Date()
    }, (err) => {
        console.log(err);
    });
    console.log(sprintf("[%s]の振込完了を保存", date));
}

function finishProcess(bot, message) {
    if (message.channel != process.env.channelId) {
        return;
    }
    const comment = (( new Date()).toFormat("HH24") < Config.talkStartHour) ? Config.pleasureReply : Config.displeasureReply;

    bot.reply(message, comment);
    stopProcess();
}

function sayPushPhrase(bot) {

    if (( new Date()).toFormat("HH24") < Config.talkStartHour) {
        return;
    }
    const text = sprintf(Config.reminderMessage, process.env.mention);
    bot.say({text: text, channel: process.env.channelId}, null);
}

function stopProcess() {
    setTimeout(() => {
        process.exit();
    }, 100);
}