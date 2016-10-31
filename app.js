require('dotenv').config();
const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const logger = require('morgan');
const path = require('path');

const app = express()

app.set('port', (process.env.PORT || 5000))

// Process application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}))

// Process application/json
app.use(bodyParser.json())

app.use(logger('dev'));
app.use(express.static(path.join(__dirname, 'public'), { maxAge: 31557600000 }));

// Index route
app.get('/', function (req, res) {
    res.send('getpaid chatbot')
})


app.get('/makepayment', function(req,res) {
    res.sendFile(path.join(__dirname+'/views/makepayment.html'))
})

app.post('/makepayment', function(req, res){
    setTimeout(function() {
        lel(req, res)
    }, 2500);
})

const lel = (req, res) => {res.redirect('/paymentconfirmed')}

app.get('/paymentconfirmed', function(req, res) {
    res.sendFile(path.join(__dirname+'/views/paymentconfirmed.html'))
})

app.get('/verifypayment', function(req, res) {
    res.sendFile(path.join(__dirname+'/views/verifypayment.html'))
})

// for Facebook verification
app.get('/webhook/', function (req, res) {
    if (req.query['hub.verify_token'] === 'david_mayyie') {
        res.send(req.query['hub.challenge'])
    } else {
        res.send('Error, wrong token')
    }
    
})

const contains = (originalString, subStringArray) => {
    // console.log(1233)
    // console.log(originalString.indexOf(subString))
    // let cleanString = originalString.toLowerCase();
    // cleanString = cleanString.toString();
    let cleanString = originalString.toString();
    cleanString = cleanString.toLowerCase();
    let status = false
    for (let i = 0; i < subStringArray.length; i++) {
        if (cleanString.indexOf(subStringArray[i]) !== -1) {
            status = true
        }
    }
    return status
}

app.post('/webhook/', function (req, res) {
    let messaging_events = req.body.entry[0].messaging
    for (let i = 0; i < messaging_events.length; i++) {
        let event = req.body.entry[0].messaging[i]
        let sender = event.sender.id
        if (event.message && event.message.text) {
            let text = event.message.text
            if (text === 'may yie') {
                sendGenericMessage(sender)
                continue
            } else if (contains(text, ['hello', 'hi', 'hey', 'wassup', 'yo', 'apa khabar'])) {
                sendTextMessage(sender, "Hello! Before we proceed further, could you please let me know your preferred language of communication?")
                sendStructuredMessage(sender, 'Please pick your preferred language', 'English', 'Bahasa Malaysia')
            } else if (contains(text, ['payment'])) {
                // sendTextMessage(sender, "Ok sure!")
                // setTimeout(function() {sendTextMessage(sender, "May I know what is the name of the item that you like to receive payment for?")}, 5000)
                sendTextMessage(sender, "Ok sure. May I know what is the name of the item that you like to receive payment for?")
            } else if (contains(text, ['air zam zam', 'handmade clock', 'chocolate brownie'])) {
                // sendTextMessage(sender, "Got it.")
                sendTextMessage(sender, "How much would like to charge customers?")    
            } else if (contains(text, ['usd', 'myr', 'rm', '$'])) {
                
                
                sendTextMessage(sender, "Any Celcom/Dialog/Smart user will be able to purchase your product by scanning the QR code on their phone")     
                sendTextMessage(sender, "Thanks for providing me with the details. Here is the QR code for your product.")
                sendImage(sender)                       
            } else if (contains(text, ['english'])) {
                sendTextMessage(sender, 'Ok got it!')

                sendStructuredMessage(sender, 'What would you like to talk to us about today?', 'Product or service', 'Complaint')
            } else if (contains(text, ['complaint'])) {

                sendTextMessage(sender, 'Sure thing. Could you please let us know your IC and phone number?')
            } else if (contains(text, ['930219075299'])) {
                console.log('boss is here')
            } else if (contains(text, ['0132522041'])) {
                sendTextMessage(sender, 'Thank you for providing me with the information. Could you please let me know the nature of your complaint?')
            } else if(event.postback) {
                receivedPostback(event.postback)
            }
            else {
                sendTextMessage(sender, "I am sorry but I did not understand that. Could you please repeat yourself? " + text.substring(0, 200))
            }
            
        }
    }
    res.sendStatus(200)
})

// Spin up the server
app.listen(app.get('port'), function() {
    console.log('running on port', app.get('port'))
})

const postMessage = (sender, messageData) => {
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token:process.env.FB_PAGE_ACCESS_TOKEN},
        method: 'POST',
        json: {
            recipient: {id:sender},
            message: messageData,
        }
    }, function(error, response, body) {
        if (error) {
            console.log('Error sending messages: ', error)
        } else if (response.body.error) {
            console.log('Error: ', response.body.error)
        }
    })  
}

function sendTextMessage(sender, text) {
    let messageData = { text:text }
    postMessage(sender, messageData)
}

function sendImage(sender) {
    let messageData = {
        "attachment": {
            "type": "image",
            "payload": {
                "url":"https://dl.dropboxusercontent.com/u/43355605/qr_code_tadhack.jpg"
            }
        }
    }
    postMessage(sender, messageData)
}

function sendGenericMessage(sender) {
    let messageData = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "generic",
                "elements": [{
                    "title": "First card",
                    "subtitle": "Element #1 of an hscroll",
                    "image_url": "http://messengerdemo.parseapp.com/img/rift.png",
                    "buttons": [{
                        "type": "web_url",
                        "url": "https://www.messenger.com",
                        "title": "web url"
                    }, {
                        "type": "postback",
                        "title": "Postback",
                        "payload": "Payload for first element in a generic bubble",
                    }],
                }, {
                    "title": "Second card",
                    "subtitle": "Element #2 of an hscroll",
                    "image_url": "http://messengerdemo.parseapp.com/img/gearvr.png",
                    "buttons": [{
                        "type": "postback",
                        "title": "Postback",
                        "payload": "Payload for second element in a generic bubble",
                    }],
                }]
            }
        }
    }
    postMessage(sender, messageData)
}

function sendStructuredMessage(sender, question, opt1, opt2) {
    let messageData = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "generic",
                "elements": [{
                    "title": question,
                    // "subtitle": "Element #1 of an hscroll",
                    // "image_url": "http://messengerdemo.parseapp.com/img/rift.png",
                    "buttons": [{
                        "type": "postback",
                        "title": opt1,
                        "payload": opt1
                    }, {
                        "type": "postback",
                        "title": opt2,
                        "payload": opt2
                    }],
                }]
            }
        }
    }
    postMessage(sender, messageData)
}

function receivedPostback(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfPostback = event.timestamp;

  // The 'payload' param is a developer-defined field which is set in a postback 
  // button for Structured Messages. 
  var payload = event.postback.payload;

  console.log("Received postback for user %d and page %d with payload '%s' " + 
    "at %d", senderID, recipientID, payload, timeOfPostback);

  // When a postback is called, we'll send a message back to the sender to 
  // let them know it was successful
  sendTextMessage(senderID, "Postback called");
}