var qs = require("querystring");
var fs = require("fs");
var path = require("path");
var jsdom = require("jsdom");
var request = require('request');
var Iconv = require("iconv").Iconv;
var Buffer = require('buffer').Buffer;

var jquery = fs.readFileSync(path.join(__dirname, "../external/jquery-1.7.2.js")).toString();

process.on("message", function(msg) {
    if (msg.event == "fetch") {
        eval("function _fetchFunc($, window) { return (" + msg.func + ")($, window); };");

        function cb(err, window) {
            if (err) {
                process.send({
                    "event": "result",
                    "error": err.message
                });
            } else if (window && window.$) {
                process.send({
                    "event": "result",
                    "data": _fetchFunc(window.$, window)
                });
            }

            process.exit();
        };

        msg.headers = msg.headers || {};

        msg.headers["User-Agent"] = msg.headers["User-Agent"] || "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/535.21 (KHTML, like Gecko) Chrome/19.0.1042.0 Safari/535.21";
        msg.headers["Accept"] = msg.headers["Accept"] || "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8";

        var stream = request({
            encoding: "binary",
            url: msg.url,
            headers: msg.headers,
            timeout: msg.timeout
        });

        var response = null;
        var length = 0;
        var body = [];

        stream.on("response", function(resp) {
            if (resp.statusCode != 200) {
                stream.abort();
                cb(new Error("Unknown error."));
            }

            response = resp;
        });

        stream.on("data", function(data) {
            body.push(data);
            length += data.length;

            if (msg.maxlength && length > msg.maxlength) {
                stream.abort();
                cb(new Error("Remote data too large."));
            }
        });

        stream.on("error", function(error) {
            stream.abort();
            cb(error);
        });

        stream.on("end", function() {
            var charset = "utf-8";
            var charsetrgx = /charset=((iso|windows|utf)[0-9-]+)/i;
            var ctype = response.headers["content-type"];

            body = new Buffer(body.join(""), "binary");
            var bodyText = body.toString();

            if (ctype && charsetrgx.test(ctype)) {
                charset = charsetrgx.exec(ctype)[1];
            } else {
                var match = charsetrgx.exec(bodyText);

                if (match) {
                    charset = match[1];
                }
            }

            if (!/^utf-8$/i.test(charset)) {
                try {
                    var iconv = new Iconv(charset, "UTF-8//TRANSLIT//IGNORE");
                    bodyText = iconv.convert(body).toString();
                } catch (e) {
                }
            }

            bodyText = bodyText.replace(/<!--[\s\S]*?-->/g, "");

            var zsdata = {
                request: {
                    redirects: response.request.redirects,
                    href: response.request.href,
                    headers: response.request.headers
                },
                response: {
                    status: response.statusCode,
                    headers: response.headers
                }
            };

            jsdom.env({
                html: bodyText,
                src: [
                    jquery,
                    "(function() { window.zscrape = " + JSON.stringify(zsdata) + "; })();"
                ],
                done: cb
            });
        });
    }
});

process.send({
    event: "online"
});
