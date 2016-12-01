'use strict';

var util = require('util');
var path = require('path');
var fs = require('fs');
var SQLite = require('sqlite3').verbose();
var Bot = require('slackbots');
var reactions = {};

/**
 * Constructor function. It accepts a settings object which should contain the following keys:
 *      token : the API token of the bot (mandatory)
 *      name : the name of the bot (will default to "norrisbot")
 *
 * @param {object} settings
 * @constructor
 *
 * @author Luciano Mammino <lucianomammino@gmail.com>
 */
var NorrisBot = function Constructor(settings) {
    this.settings = settings;
    this.settings.name = this.settings.name || 'benedictbot';
    this.user = null;
};

// inherits methods and properties from the Bot constructor
util.inherits(NorrisBot, Bot);

/**
 * Run the bot
 * @public
 */
NorrisBot.prototype.run = function () {
    NorrisBot.super_.call(this, this.settings);
    this.on('start', this._onStart);
    this.on('message', this._onMessage);
};

/**
 * On Start callback, called when the bot connects to the Slack server and access the channel
 * @private
 */
NorrisBot.prototype._onStart = function () {
    this._loadBotUser();
    this._firstRunCheck();
};

/**
 * On message callback, called when a message (of any type) is detected with the real time messaging API
 * @param {object} message
 * @private
 */
NorrisBot.prototype._onMessage = function (message) {
    if (this._isChatMessage(message) && this._isChannelConversation(message) && !this._isFromBenedictBot(message)) {
        if (this._isMentioningBenedict(message)) {
            // if mentioning benedict reply with name joke
            this._replyWithRandomJoke(message);
        } else {
            // if not mentioning benedect see if there is a dumb response
            this._customMessages(message);
        }
    }
    if (this._isReaction(message)) {
        this._doSomethingWithAReactionEvent(message)
    }
};

var attachments = {
    "as_user": true,
    "attachments": JSON.stringify([
        {
            "text": "Would you like to make a JIRA ticket?",
            "fallback": "You are unable to choose a game",
            "callback_id": "wopr_game",
            "color": "#3AA3E3",
            "attachment_type": "default",
            "actions": [
                {
                    "name": "yes",
                    "text": "Yes",
                    "type": "button",
                    "value": "yes"
                },
                {
                    "name": "no",
                    "text": "No",
                    "type": "button",
                    "value": "no"
                },
                {
                    "name": "naff_off",
                    "text": "Naff Off",
                    "style": "danger",
                    "type": "button",
                    "value": "no",
                    "confirm": {
                        "title": "Are you sure?",
                        "text": "I'm quite helpful really",
                        "ok_text": "Yes",
                        "dismiss_text": "No"
                    }
                }
            ]
        }
    ])
}

NorrisBot.prototype._doSomethingWithAReactionEvent = function (message) {
    var item = message.item;
    var key = item.channel+"-"+item.ts;
    var count = reactions[key] || 0;

    if (message.type === 'reaction_added') {
        count++;
    } else if (message.type === 'reaction_removed') {
        count--;
    }
    reactions[key] = count < 0 ? 0 : count;

    let txt = key+" reaction count is "+reactions[key]+" newest reaction was "+message.reaction;
    console.log(txt);

    if (count == 5) {
        let good = "I see that "+key+" got more than a few reactions, should this be in jira?";
        this.postMessageToChannel("bot-testing", good, attachments);
    }
}

/**
 * Replies to a message with a random name
 * @param {object} originalMessage
 * @private
 */
NorrisBot.prototype._replyWithRandomJoke = function (originalMessage) {
    var self = this;

    var firstnamelist = ["Bumblebee", "Bandersnatch", "Broccoli", "Rinkydink", "Bombadil", "Boilerdang", "Bandicoot", "Fragglerock", "Muffintop", "Congleton", "Blubberdick", "Buffalo", "Benadryl", "Butterfree", "Burberry", "Whippersnatch", "Buttermilk", "Beezlebub", "Budapest", "Boilerdang", "Blubberwhale", "Bumberstump", "Bulbasaur", "Cogglesnatch", "Liverswort", "Bodybuild", "Johnnycash", "Bendydick", "Burgerking", "Bonaparte", "Bunsenburner", "Billiardball", "Bukkake", "Baseballmitt", "Blubberbutt", "Baseballbat", "Rumblesack", "Barister", "Danglerack", "Rinkydink", "Bombadil", "Honkytonk", "Billyray", "Bumbleshack", "Snorkeldink", "Anglerfish", "Beetlejuice", "Bedlington", "Bandicoot", "Boobytrap", "Blenderdick", "Bentobox", "Anallube", "Pallettown", "Wimbledon", "Buttercup", "Blasphemy", "Syphilis", "Snorkeldink", "Brandenburg", "Barbituate", "Snozzlebert", "Tiddleywomp", "Bouillabaisse", "Wellington", "Benetton", "Bendandsnap", "Timothy", "Brewery", "Bentobox", "Brandybuck", "Benjamin", "Buckminster", "Bourgeoisie", "Bakery", "Oscarbait", "Buckyball", "Bourgeoisie", "Burlington", "Buckingham", "Barnoldswick"];

    var lastnamelist = ["Coddleswort", "Crumplesack", "Curdlesnoot", "Calldispatch", "Humperdinck", "Rivendell", "Cuttlefish", "Lingerie", "Vegemite", "Ampersand", "Cumberbund", "Candycrush", "Clombyclomp", "Cragglethatch", "Nottinghill", "Cabbagepatch", "Camouflage","Creamsicle", "Curdlemilk", "Upperclass", "Frumblesnatch", "Crumplehorn", "Talisman", "Candlestick", "Chesterfield", "Bumbersplat", "Scratchnsniff", "Snugglesnatch", "Charizard", "Carrotstick", "Cumbercooch", "Crackerjack", "Crucifix", "Cuckatoo", "Cockletit", "Collywog", "Capncrunch", "Covergirl", "Cumbersnatch", "Countryside","Coggleswort", "Splishnsplash", "Copperwire", "Animorph", "Curdledmilk", "Cheddarcheese", "Cottagecheese", "Crumplehorn", "Snickersbar", "Banglesnatch", "Stinkyrash", "Cameltoe", "Chickenbroth", "Concubine", "Candygram", "Moldyspore", "Chuckecheese", "Cankersore", "Crimpysnitch", "Wafflesmack", "Chowderpants", "Toodlesnoot", "Clavichord", "Cuckooclock", "Oxfordshire", "Cumbersome", "Chickenstrips", "Battleship", "Commonwealth", "Cunningsnatch", "Custardbath", "Kryptonite", "Curdlesnoot", "Cummerbund", "Coochyrash", "Crackerdong", "Crackerdong", "Curdledong", "Crackersprout", "Crumplebutt", "Colonist", "Coochierash", "Slapptyback"];

    var randomFirstName = parseInt(Math.random() * firstnamelist.length);
    var randomLastName = parseInt(Math.random() * lastnamelist.length);

    var name = firstnamelist[randomFirstName] + " " + lastnamelist[randomLastName];

    var channel = self._getChannelById(originalMessage.channel);

    var messages = [
        "Did you mean {name}?",
        "I think you'll find my name is {name}.",
        "The name's {lastname}. {name}.",
        "My name is {name}. It is my business to know what other people don't know.",
        "If people ask, 'Are you {name}?', it's horribly naff, but I say, 'I'm not, I just look a bit like him'."
    ];
    var randomMessage = parseInt(Math.random() * messages.length);

    var message = messages[randomMessage].replace('{name}', name).replace('{lastname}', lastnamelist[randomLastName]);

    self.postMessageToChannel(channel.name, message, {as_user: true});
};

/**
 * Loads the user object representing the bot
 * @private
 */
NorrisBot.prototype._loadBotUser = function () {
    var self = this;
    this.user = this.users.filter(function (user) {
        return user.name === self.name;
    })[0];
};

/**
 * Check if the first time the bot is run. It's used to send a welcome message into the channel
 * @private
 */
NorrisBot.prototype._firstRunCheck = function () {
    var self = this;
    self._welcomeMessage();
};

/**
 * Sends a welcome message in the channel
 * @private
 */
NorrisBot.prototype._welcomeMessage = function () {
    this.postMessageToChannel(this.channels[0].name,
        'Hi guys! You might know me from such films as The Hobbit and Sherlock Holmes: A Game of Shadows. Just say `Benedict Cumberbatch` or `' + this.name + '` to invoke me!',
        {as_user: true});
};

/**
 * Util function to check if a given real time message object represents a chat message
 * @param {object} message
 * @returns {boolean}
 * @private
 */
NorrisBot.prototype._isChatMessage = function (message) {
    return message.type === 'message' && Boolean(message.text);
};

NorrisBot.prototype._isReaction = function (message) {
    if (message.type === 'reaction_added' || message.type === 'reaction_removed') {
        return Boolean(message.reaction);
    }
};

/**
 * Util function to check if a given real time message object is directed to a channel
 * @param {object} message
 * @returns {boolean}
 * @private
 */
NorrisBot.prototype._isChannelConversation = function (message) {
    return typeof message.channel === 'string' &&
        message.channel[0] === 'C'
        ;
};

/**
 * Util function to check if a given real time message is mentioning Chuck Norris or the norrisbot
 * @param {object} message
 * @returns {boolean}
 * @private
 */
NorrisBot.prototype._isMentioningBenedict = function (message) {
    return message.text.toLowerCase().indexOf('benedict') > -1 ||
        message.text.toLowerCase().indexOf('cumberbatch') > -1 ||
        message.text.toLowerCase().indexOf('@' + this.name) > -1 ||
        message.text.toLowerCase().indexOf(this.name) > -1;
};

function christmasDetection() {
    var d = new Date();
    var n = d.getMonth();
    if (n < 11) {
        return "I have detected christmas outside of December. :warning::warning:";
    }
}

/**
 * Util function to respond to specific keys with custom messages
 * @param {object} message
 * @private
 */
NorrisBot.prototype._customMessages = function (originalMessage) {
    var self = this;

    var christmasResponse = christmasDetection();

    var keyResponseDict = {
        "cake": "Baker Street!?",
        "christmas" : christmasResponse,
        "xmas" : christmasResponse,
        "santa" : christmasResponse
    };

    for(var key in keyResponseDict){
        if (originalMessage.text.toLowerCase().indexOf(key) > -1) {
            var channel = self._getChannelById(originalMessage.channel);
            self.postMessageToChannel(channel.name, keyResponseDict[key], {as_user: true});
            break;
        }
    }

};

/**
 * Util function to check if a given real time message has ben sent by the norrisbot
 * @param {object} message
 * @returns {boolean}
 * @private
 */
NorrisBot.prototype._isFromBenedictBot = function (message) {
    return message.user === this.user.id;
};

/**
 * Util function to get the name of a channel given its id
 * @param {string} channelId
 * @returns {Object}
 * @private
 */
NorrisBot.prototype._getChannelById = function (channelId) {
    return this.channels.filter(function (item) {
        return item.id === channelId;
    })[0];
};

module.exports = NorrisBot;
