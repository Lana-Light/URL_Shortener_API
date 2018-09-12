'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');

var cors = require('cors');

var app = express();
// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
// mongoose.connect(process.env.MONGOLAB_URI);

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
var bodyParser = require("body-parser");
var parser = bodyParser.urlencoded({extended: false});
app.use("/", parser);
var dns = require("dns");
var url = require("url");

var mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI);

app.use('/public', express.static(process.cwd() + '/public'));
app.get('/', function(req,res) {
res.sendFile(process.cwd() + '/views/index.html');
});
var captcha = 0;
app.get("/captcha.png", function (req, res, next) {
    var captchapng = require("captchapng");
    captcha = parseInt(Math.random() * 9000 + 1000);
    var p = new captchapng(80, 30, captcha); // width,height,numeric captcha
    p.color(80, 255, 0, 255);  // First color: background (red, green, blue, alpha)
    p.color(80, 80, 80, 255); // Second color: paint (red, green, blue, alpha)
    var img = p.getBase64();
    var imgbase64 = new Buffer.from(img, "base64");
    res.send(imgbase64);
});

var Schema = mongoose.Schema;
var Links = new Schema({
  longUrl: {
type: String,
unique: true,
required: true   
  },
  shortUrl: {
type: Number,
unique: true,
required: true   
  }
});
var Link = mongoose.model("Link", Links);
 
app.post("/api/shorturl/new", function(req, res) {
  if(req.body.captcha==captcha) {
   var exp=/^https?:\/\//;
  if(exp.test(req.body.url)) {
   var longUrl = new URL(req.body.url);
   dns.lookup(longUrl.hostname, function(err, link, ipType) {
  if(link) {
  Link.find({longUrl: longUrl.href}, function(err, data) {
    if(err) { return res.json({error: err}); }
  if(data.length===0) {
    Link.find(function(err, data) {
    if(err) { return res.json({error: err}); }
     function save() {
   var l = new Link({longUrl: longUrl.href, shortUrl: shortUrl}); 
   l.save(function(err, data) { 
    if(err) { return res.json({error: err}); }
     res.json({"original_url": longUrl.href,"short_url": shortUrl});
   });
      } 
   var shortUrl = data.length+1;
      if(data.length>9) { 
        shortUrl = data[0].shortUrl;
        Link.deleteOne({shortUrl: shortUrl}, function(err, data) {
        if(err) { return res.json({error: err}); }
          save();
        });
      } else { save(); }
    }); } else {
      res.json({status: "this url has already been saved", longUrl: data[0].longUrl, shortUrl: data[0].shortUrl});
    } 
});  
     } else { res.json({"error": "Invalid Hostname"}); }
 }); 
  } else { res.json({"error": "invalid URL"}); } 
  } else { res.redirect("/"); }
});

app.get("/api/shorturl/:new", function(req, res) {
 Link.find({shortUrl: req.params.new}, function(err, data) {
  if(err) { return res.json({error: err}); }
   data.length>0 ? res.redirect(data[0].longUrl) : res.json({error: "Not Found"});
 });
});

app.listen(port, function () {
  console.log('Node.js listening ...');
});
