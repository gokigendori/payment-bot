let staticConfig = {
    channel: '<!channel>',
    oneHour: 60 * 60 * 1000,
    // おしゃべり終了する時間
    untilHour: 22,
    // 喋り始める時間
    talkStartHour: 16,
    lastMessage: '%s %sからへんじがない 振込のことが気がかりねっ:exclamation:',
    pleasureReply: 'きょうもよくがんばりました :two_hearts:',
    displeasureReply: '普通の人間の相手をしているヒマはないの :exclamation:',
    reminderMessage: '%s べ、別にあんたが振り込み忘れたって知らないんだからねっ...:exclamation:',
    coolMessage:'何でそんなことあなたに言わなきゃいけないの？',
};

module.exports = staticConfig;
