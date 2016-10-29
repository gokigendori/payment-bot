'use strict';
const fetch = require('node-fetch');

const luisAPI = `https://api.projectoxford.ai/luis/v1/application?id=${process.env.luisId}&subscription-key=${process.env.luisSubscriptionKey}&q=`;
class Luis {
    request(message, cb) {
        fetch(luisAPI + encodeURI(message.text))
            .then((res) => res.json())
            .then((result) => {
                result.entities.forEach((entity) => {
                    // 全角数字等を正規化
                    entity.entity = entity.entity.normalize('NFKC')
                });

                cb(result, message)
            });
    }

    static maxIntentType(intents) {
        const maxIntent = intents.sort((a, b) => {
            return b.score - a.score
        })[0];

        return maxIntent.intent;
    }

    getCompleteDates(entities, cb) {
        const year = ( new Date()).toFormat("YYYY");
        let month = ( new Date()).toFormat("MM");

        entities.forEach((entity) => {
            let date;
            if (entity.type == 'monthAndDay') {
                month = entity.entity.split('/')[0];

                date = `${year}/${entity.entity}`;
                if (isLastYear(date)) {
                    date = `${year - 1}/${month}/${entity.entity}`;
                }
                cb(date);
            }
            if (entity.type == 'day') {

                const nearEntity = entities
                    .filter((element) =>
                        (element.type == 'monthAndDay' && (entity.startIndex - element.startIndex ) > 0 ))
                    .pop();

                if (nearEntity) {
                    month = nearEntity.entity.split('/')[0];
                }
                date = `${year}/${month}/${entity.entity}`;
                if (isLastYear(date)) {
                    date = `${year - 1}/${month}/${entity.entity}`;
                }
                cb(date);
            }
        });
    }

    getErrorNum(entities, cb) {
        entities.forEach((entity) => {
            if (entity.type == 'errorNum') {
                cb(entity.entity.replace(/件/g, ''));
            }
        });
    }
}

const isLastYear = (date) => {
    const diff = (new Date(date)).getTime() - (new Date()).getTime();
    const days = Math.ceil(Math.abs(diff) / (1000 * 3600 * 24));
    return (days > 300);
};

module.exports = Luis;