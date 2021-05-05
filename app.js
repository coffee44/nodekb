const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const expressValidator = require('express-validator');
const flash = require('connect-flash');
const session = require('express-session');
const passport = require('passport');
const config = require('./config/database');


mongoose.connect(config.database,
    { useNewUrlParser: true, useUnifiedTopology: true});
let db = mongoose.connection;

db.once('open', () => {
    console.log('~~~Connected to MongoDB~~~');
});

// Check for DB errors
db.on('error', err => {
    console.log(err);
});

// init app
const app = express();

// Bring in Models
let Article = require('./models/article');

// Load view engine
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// Middleware Body Parser
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());

// Set public (static) folder which can be public,client or static
app.use(express.static(path.join(__dirname, 'public')));

// Express Session Middleware
app.use(session({
    secret: 'keyboard cat',
    resave: true,
    saveUninitialized: true
}));

// Express Messages Middleware
app.use(require('connect-flash')());
app.use((req, res, next) => {
    res.locals.messages = require('express-messages')(req, res);
    next();
})

// Express Validator Middleware
app.use(expressValidator({
    errorFormatter: (param, msg, value) => {
        let namespace = param.split('.'), root = namespace.shift(), formParam = root;

            while(namespace.length) {
                formParam += '[' + namespace.shift() + ']';
            }
            return {
                param: formParam,
                msg: msg,
                value: value
            };
    }
}));

// Passport Config
require('./config/passport')(passport);
// Passport Middleware
app.use(passport.initialize());
app.use(passport.session());

app.get('*', (req, res, next) => {
    res.locals.user = req.user || null;
    next();
});

// Home route
app.get('/', (req, res) => {
    let article = Article.find({}, (err, articles) => {
        if(err) {
            console.log(err);
        } else {
            res.render('index', {
                title: 'Articles',
                articles: articles
            });
        }
    });
});

// Route Files
let articles = require('./routes/articles');
let users = require('./routes/users');
// this means anything that goes to '/articles' is gonna to the file articles (./routes/articles)
app.use('/articles', articles);
// this means anything that goes to '/users' is gonna to the file articles (./routes/users)
app.use('/users', users);


// start server
app.listen(3000, () => {
    console.log('Server has started on port 3000...');
});