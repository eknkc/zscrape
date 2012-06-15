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
