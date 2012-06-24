var cp = require("child_process");
var path = require("path");
var request = require('request');

var defUserAgent = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/535.21 (KHTML, like Gecko) Chrome/19.0.1042.0 Safari/535.21";

module.exports = function(options, func, next) {
    var child = cp.fork(__dirname + '/child.js');
    var finished = false;

    if (!options.url) return next(new Error("No URL specified."));

    child.on("message", function(msg) {
        switch(msg.event) {
            case "online": {
                child.send({
                    "event": "fetch",
                    "url": options.url,
                    "func": func.toString(),
                    "headers": options.headers,
                    "timeout": options.timeout || 2500,
                    "maxlength": options.maxlength
                });
                break;
            }
            case "result": {
                finished = true;
                if (msg.error) return next(new Error(msg.error));
                next(null, msg.data);
            }
        }
    });

    child.on("exit", function() {
        if (finished) return;
        next(new Error("Unknown error."));
    });
};

module.exports.scraper = {
    openGraph: function($) {
        var result = {
            title: $("meta[property='og:title']").attr("content") || $("meta[name=title]").attr("content") || $("title").text() || null,
            desc: $("meta[property='og:description']").attr("content") || $("meta[name=description]").attr("content") || $("meta[http-equiv='description']").attr("content") || null,
            image: $("meta[property='og:image']").attr("content") || null
        };

        var video = null;

        if (/^application\/x-shockwave-flash$/i.test($("meta[property='og:video:type']").attr("content"))) {
            var video = $("meta[property='og:video']").attr("content");
        }

        if (!video && /^application\/x-shockwave-flash$/i.test($("meta[name='og:video:type']").attr("content"))) {
            var video = $("meta[property='og:video']").attr("content");
        }

        video = video || $("link[rel=video_src]").attr("href");

        if (video != null) {
            var qmark = video.indexOf("?");
            if (qmark >= 0) {
                var query = qs.parse(video.substr(qmark + 1));
                video = video.substr(0, qmark) + "?" + qs.stringify(query);
            }

            result.video = video;
        }

        if (result.title)
            result.title = $.trim(result.title);

        if (result.desc)
            result.desc = $.trim(result.desc).replace(/<(?:.|\n)*?>/gm, '');

        return result;
    }
};
