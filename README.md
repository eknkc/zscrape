ZScrape
====================

This library uses JSDom and jQuery to create a user firnedly website parsing environment. While there are
others like this, I had to create this one for two main reasons;

 * JSDom has a memory leak problem and whenever you create a new window, using it to scrape some chunk of text and leave it be, you are leaking some memory. ZScrape spawns a child process for each request and kills it after handling the operation. Virtually making it impossible to leak any memory.
 * I had a lot of problems with character encodings on non-english websites. ZScrape performs some preprocessing on the response and utilizes Iconv to convert encoding to UTF-8 if necessary. It has proven to be effective.

You can install the library through the Node Package Manager by running
`npm install zscrape`.

Usage
====================
ZScrape exports a single function, which accepts three arguments;

    var zscrape = require("zscrape");

    // zscrape(options, parser, handler);

    zscrape({
        url: "http://www.google.com",
        maxlength: 1024 * 1024
    }, function($) {
        return $("title").text();
    }, function(err, data) {
        console.log([err, data]);
    });

 * `options`: Object defining the operation
  * `url`: The request URL of the web page to be parsed
  * `maxlength`: Maximum length of file in bytes to be processed
  * `headers`: Object containing optional request headers
 * `parser`: The parser function to be executed within the page. A jQuery instance is passed as single argument and whatever gets returned is proxied back to the handler.
 * `handler`: Handler function that is called in case of an error or successful completion. In case of no errors, second argument is populated with the data returned by parser function.


Developed By
============

* Ekin Koc - <ekin@eknkc.com>

License
=======

    Copyright 2011 Ekin Koc

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
