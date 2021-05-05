const express = require('express');
const router = express.Router();

// Bring in Article Model
let Article = require('../models/article');
// Bring in User Model
let User = require('../models/user');


// Add route
router.get('/add', ensureAuthenticated, (req, res) => {
    res.render('add_article', {
        title: 'Add Article'
    })
});

// Add Submit POST Route
router.post('/add', (req, res) => {
    req.checkBody('title', 'Title is required').notEmpty();
    //req.checkBody('author', 'Author is required').notEmpty();
    req.checkBody('body', 'Body is required').notEmpty();

    // GET validation errors
    let errors = req.validationErrors();

    if(errors) {
        res.render('add_article', {
            title: 'Add Article',
            errors: errors
        });
    } else {
        let article = new Article();
        article.title = req.body.title;
        // automatically put id as the author
        article.author = req.user._id;
        article.body = req.body.body;

        article.save(err => {
            if(err) {
                console.log(err);
                return;
            } else {
                req.flash('success', 'Article Added');
                res.redirect('/');
            }
        });
    }
});

// Load Edit form
router.get('/edit/:id', ensureAuthenticated,(req, res) => {
    Article.findById(req.params.id, (err, article) => {
        if(article.author != req.user._id) { //prevent direct URL input edit form
            req.flash('danger', 'Not Authorized');
            return res.redirect('/'); // be careful of "return"
        }
        res.render('edit_article', {
            title: 'Edit Article',
            article: article
        });
    });
});

// Update Submit POST Route
router.post('/edit/:id', (req, res) => {
    let article = {};
    article.title = req.body.title;
    article.author = req.body.author;
    article.body = req.body.body;

    let query = {_id:req.params.id};
    Article.updateOne(query, article, function(err){
        if(err) {
            console.log(err);
            return;
        } else {
            req.flash('success', 'Article Updated')
            res.redirect('/');
        }
    });
});

// Delete Article
router.delete('/:id', (req, res) => {
    if(!req.user._id) {
        res.status(500).send();
    }

    let query = {_id:req.params.id};

    Article.findById(req.params.id, (err, article) => {
        if(article.author != req.user._id) {
            res.status(500).send();
        } else {
            Article.remove(query, err => {
                if(err) {
                    console.log(err);
                }
                res.send('Success');
            });
        }

    });
});

// Get Single Article
router.get('/:id', (req, res) => {
    Article.findById(req.params.id, (err, article) => {
        User.findById(article.author, (err, user) => {
            res.render('article', {
                article: article,
                author: user.name
            });
        });
    });
});

// Access Control
// can be put in any route to protect authentication
function ensureAuthenticated(req, res, next) {
    if(req.isAuthenticated()){
        return next();
    } else {
        req.flash('danger', 'Please login');
        res.redirect('/users/login');
    }
}

// make the router accessible from outside
module.exports = router;