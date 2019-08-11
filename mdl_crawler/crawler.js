var request = require('request');
var cheerio = require('cheerio');
var URL = require('url-parse');
var fs = require("fs");


// var START_URL = "http://www.arstechnica.com";
var START_URL = "https://openlayers.org/en/latest/apidoc/";

var SEARCH_WORD = "stemming";
var MAX_PAGES_TO_VISIT = 100;

var pagesVisited = {};
var numPagesVisited = 0;
var pagesToVisit = [];
var url = new URL(START_URL);
// var baseUrl = url.protocol + "//" + url.hostname;
var baseUrl = START_URL;

pagesToVisit.push(START_URL);

console.log('start crawl');
crawl();
console.log('end crawl');

function crawl() {
  if(numPagesVisited >= MAX_PAGES_TO_VISIT) {
    console.log("Reached max limit of number of pages to visit.");
    return;
  }
  var nextPage = pagesToVisit.pop();
  if (nextPage != undefined && nextPage != null) {
	if (nextPage in pagesVisited) {
		// We've already visited this page, so repeat the crawl
		crawl();
	  } else {
		// New page we haven't visited
		visitPage(nextPage, crawl);
	  }
  } else {
	  console.log("Cannot visit undefined page!")
  }
  
}

function visitPage(url, callback) {
  // Add page to our set
  pagesVisited[url] = true;
  numPagesVisited++;

  // return if last path
  if (url.includes("#")) {
    return;
  }

  // Make the request
  console.log("Visiting page " + url);
  request(url, function(error, response, body) {
     // Check status code (200 is HTTP OK)
     console.log("Status code: " + response.statusCode);
     if(response.statusCode !== 200) {
       callback();
       return;
     }
     // Parse the document body
     var $ = cheerio.load(body);
     var isWordFound = searchForWord($, SEARCH_WORD);
     if(isWordFound) {
       console.log('Word ' + SEARCH_WORD + ' found at page ' + url);
     } else {
       collectInternalLinks($);
       // In this short program, our callback is just calling crawl()
       callback();
     }
  });
}

function searchForWord($, word) {
  var bodyText = $('html > body').text().toLowerCase();
  return(bodyText.indexOf(word.toLowerCase()) !== -1);
}

function collectInternalLinks($) {
    // var relativeLinks = $("a[href^='/']");
    var relativeLinks = $("a[href^='module']");
    console.log("Found " + relativeLinks.length + " relative links on page");
    relativeLinks.each(function() {
      var extendPath = $(this).attr('href');
      pagesToVisit.push(baseUrl + extendPath);

      if (extendPath.includes("#")) {
        // Write log - full path
        writeLog("crawler_fullpath.log", "\n  " + baseUrl + extendPath);

        // Write log - function list format
        writeLog("crawler_functionlist.log", "\n  " + extendPath.substring(extendPath.indexOf("#"), extendPath.length));
      } else {
        // Write log - full path
        writeLog("crawler_fullpath.log", "\n\n" + baseUrl + extendPath + "\n|_");

        // Write log - function list format
        writeLog("crawler_functionlist.log", "\n\n" + extendPath.replace(".html","") + "\n|_");
      }
    });
}

function writeLog(logfile, data) {
  // console.log("Going to write "+ data + " into existing log file");
  fs.appendFileSync(logfile, data, function(err) {
    if (err) {
        return console.error(err);
    }
    
    // console.log("Data written successfully!");
    // console.log("Let's read newly written data");
    
    // fs.readFile('input.txt', function (err, data) {
    //     if (err) {
    //       return console.error(err);
    //     }
    //     console.log("Asynchronous read: " + data.toString());
    // });
  });
}