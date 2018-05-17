/**
 * @desc unicode字符串或者字符串转换emoji表情
 * 使用方法: 1.引入本js文件
 *          2.根据不同模块化方式调用返回的对象的transfer 例: window.mi.emojiParser.transfer(string)
 *          3.transfer方法会自动进行unicode转换并返回可以匹配到string中的emoji->url的关系object, 有多个则会返回多个
 *            例: '[smile][cool]' = {'[smile]': url, '[cool]': url }
 */
;(function () {
    var mSmileyV6Texts = [],
        mSmileyV6TextsGlobal = [],
        sInstance = null,
        mSmileyTextRes = {},
        mLocalToGlobalMap = {},
        mGlobalToLocalMap = {},
        mSmileyV6Ids = [],
        mLocalToGlobalPattern = null,
        mGlobalToLocalPattern = null,
        host = 'http://cnbj1-inner-fds.api.xiaomi.net/live/activity/emoji/img/';

    var Parser = function () {
        if (!(this instanceof Parser)) {
            throw new Error('Cannot invoke this Class without keyword "new".');
        }

        //init mSmileyV6Ids url array
        for(var i = 1; i <= 62; i++) {
            if(i < 10) {
                mSmileyV6Ids.push(host + 'mm00' + i + '.png');
            }
            else {
                mSmileyV6Ids.push(host + 'mm0' + i + '.png');
            }
        }

        for(var j = 1; j <= 44; j++) {
            mSmileyV6Ids.push(host + 'e' + j + '.png');
        }
    };

    /**
     * @method init
     * @desc 从xml文件中读取数据并初始化数组存储
     */
    function init () {
        var jsonData,
            self = this;

        try {
            //get json data of emoji string
            if(window.XMLHttpRequest) {
                xmlHttp = new XMLHttpRequest();
            }
            else {
                xmlHttp = new ActiveXObject('Microsoft.XMLHTTP');
            }

            xmlHttp.open('GET', 'arrays-smiley.json', false);
            xmlHttp.send();
            jsonData = JSON.parse(xmlHttp.responseText);

            jsonData['resources']['string-array'].forEach(function (element) {
                if(element.name == 'smiley_v6_texts') {
                    mSmileyV6Texts = element.item;
                }
                else if(element.name == 'smiley_v6_texts_global') {
                    mSmileyV6TextsGlobal = element.item;
                }
            });

            //set object contains relationship which desc mSmileyV6Texts -> url & mSmileyV6Texts <-> mSmileyV6TextsGlobal
            buildSmileyToRes();
            //set pattern string
            buidPattern();
        }
        catch (e) {
            console.error(e);
        }
    }

    /**
     * @method buildSmileyToRes
     * @desc 设置资源与key的对应关系
     */
    function buildSmileyToRes () {
        for(var i = 0; i < mSmileyV6Ids.length; i++) {
            mSmileyTextRes[mSmileyV6Texts[i]] = mSmileyV6Ids[i];
        }

        for(var j = 0; j < mSmileyV6TextsGlobal.length; j++) {
            mLocalToGlobalMap[mSmileyV6Texts[j].toString()] = mSmileyV6TextsGlobal[j];
            mGlobalToLocalMap[mSmileyV6TextsGlobal[j].toString()] = mSmileyV6Texts[j];
        }
    }

    /**
     * @method buidPattern
     * @desc 设置local->global正则表达式&global->local正则表达式
     */
    function buidPattern () {
        var patternString = '';

        for(var i = 0; i < mSmileyV6Texts.length; i++) {
            patternString += mSmileyV6Texts[i];

            if(i != (mSmileyV6Texts.length - 1)) {
                patternString += '|';
            }
        }

        mLocalToGlobalPattern = new RegExp(patternString);

        patternString = '';

        for(var j = 0; j < mSmileyV6TextsGlobal.length; j++) {
            patternString += mSmileyV6TextsGlobal[j].replace('[', '\\[').replace(']', '\\]');

            if(j != (mSmileyV6TextsGlobal.length - 1)) {
                patternString += '|';
            }
        }

        mGlobalToLocalPattern = new RegExp(patternString, 'g');
    }

    /**
     * @method unicodeToString
     * @desc 格式化unicode字符串
     * @param {String} unicodeStr
     * @returns {String}
     */
    function unicodeToString (unicodeStr) {
        var self = this;

        return unicodeStr.replace(/\\u[\dA-Fa-f]{4}/g, function (match) {
            return String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16));
        });
    }

    /**
     * @method destroy
     * @desc 销毁初始化的对象
     */
    Parser.prototype.destroy = function () {
        sInstance = null;
        window.mi.emojiParser = null;
    };

    /**
     * @method transfer
     * @desc 将字符串转换为资源链接
     * @param {String} str
     * @returns {Object}
     */
    Parser.prototype.transfer = function (str) {
        var self = this;

        str = unicodeToString(str);
        try {
            var gblMatch = str.match(mGlobalToLocalPattern),
                localMatch = str.match(mLocalToGlobalPattern);

            if(gblMatch) {
                var temp = {};

                for(var i = 0; i < gblMatch.length; i++) {
                    temp[gblMatch[i]] = mSmileyTextRes[mGlobalToLocalMap[gblMatch[i]]];
                }
                return temp;
            }
            else if(localMatch) {
                var temp = {};

                for(var j = 0; j < localMatch.length; j++) {
                    temp[localMatch[j]] = mSmileyTextRes[localMatch[j]];
                }
                return temp;
            }
            else return str;
        }
        catch (e) {
            console.error(e);
            return str;
        }
    };

    var emojiParser = (function () {
        if(sInstance == null) {
            sInstance = new Parser();
            init();
        }

        return sInstance;
    })();

    //设置向外部暴露的方式
    try {
        if (typeof define === 'function' && define.amd) {
            define([], function () {
                return emojiParser;
            });
        } else if (module && typeof module != void 0 && module.exports) {
            module.exports = emojiParser;
        }
        else {
            window.mi.emojiParser = emojiParser;
        }
    }
    catch(e) {
        window.mi = window.mi || {};
        window.mi.emojiParser = emojiParser;
    }
})();