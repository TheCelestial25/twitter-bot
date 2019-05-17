// Priyanshu Singh
// github/TheCelestial25

// Bot that takes a link to a tweet as input then replies to the linked tweet
// mentions the user of the provided tweet and writes text from a provided file

// Verify
console.log("Up and running...");

// Data from file
var fs = require('fs') 

// Create a Twitter object to connect to Twitter API
// npm install twit
var Twit = require('twit');

// Use request for expanding given tweet url which gets shortened by twitter by default
var Q = require("q");
var request = require("request");

// Pull all twitter account info from another file
var config = require('./config.js');

// Make a Twit object for connection to the API
var T = new Twit(config);

// Set up a user stream tracking mentions to username
var stream = T.stream('statuses/filter', { track: '@dev_celestial' });

// Now looking for tweet events
stream.on('tweet', tweetEvent);

// Code for expanding url shortened by twitter
function expandUrl(shortUrl) {
    var deferred = Q.defer();
    request( { method: "HEAD", url: shortUrl, followAllRedirects: true },
        function (error, response) {
            if (error) {
                deferred.reject(new Error(error));
            } else {
                deferred.resolve(response.request.href);
            }
        });
    return deferred.promise;
}

// Here a tweet event is triggered!
function tweetEvent(tweet) {

  // Who is this in reply to?
  var reply_to = tweet.in_reply_to_screen_name;

  // What is the text?
  var txt = tweet.text

  // Get rid of the @ mention
  short_url = txt.replace(/@dev_celestial /g,'');

  var tweet_link = '';

  // Expand the shortened url
  expandUrl(short_url)
  .then(function (longUrl) {
    var my_regex = /https:\/\/twitter\.com\/([a-zA-Z0-9_.]+)\/status\/([0-9]+)\?/g;

    var extracted_info = my_regex.exec(longUrl);

    // Username of the given tweet owner
    var name = extracted_info[1];
    
    // Id of the given tweet
    var id = extracted_info[2];

    // If this was in reply to me
    if (reply_to === 'dev_celestial') {
      var file_text = '';
      fs.readFile('Input.txt', (err, data) => { 
        if (err) throw err; 
        file_text = data.toString(); 
        // Start a reply back to the sender
        var replyText = '@'+ name + ' ' + file_text + ' Right?!';

        // Post that tweet
        T.post('statuses/update', { status: replyText, in_reply_to_status_id: id}, tweeted);

        // Make sure it worked!
        function tweeted(err, reply) {
          if (err) {
            console.log(err.message);
          } else {
            console.log('Tweeted: ' + reply.text);
          }
      }
      })
    }
  });
}