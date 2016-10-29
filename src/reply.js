class Reply {
    static lastMessage(mention,name){
        return `${mention} ${name}からへんじがない 振込のことが気がかりねっ:exclamation:`
    }
    static pleasure(){
        return `きょうもよくがんばりました :two_hearts:`;
    }
    static displeasure(){
        return `普通の人間の相手をしているヒマはないの :exclamation:`;
    }
    static reminder(name){
        return `${name} べ、別にあんたが振り込み忘れたって知らないんだからねっ...:exclamation:`
    }
    static cool(){
        return `何でそんなことあなたに言わなきゃいけないの？`;
    }
    static aggregationSuccess(size){
        return `:koala:先週の振込件数は${size}件ね。よく頑張りました。`
    }
    static aggregationError(size){
        return `:honeybee:先週のエラー件数は${size}件ね。よく頑張りました。`
    }
    static complete(date) {
        return `${date}の振込が完了したのね:sparkles: 覚えておくわ:sparkles::sparkles:`
    }
    static error(size) {
        return `${size} 件のエラーですって:question: 許さないんだからっ:exclamation:`
    }
}

module.exports = Reply;

