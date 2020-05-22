var express = require('express');
let crypto = require('crypto');
let mysql = require('../database');
var router = express.Router();

/* 首页. */
router.get('/', function(req, res, next) {
  let query = 'select * from article order by articleID desc';
  mysql.query(query, (err, rows, fields) => {
    let articles = rows;
    articles.forEach(element => {
      let year = element.articleTime.getFullYear();
      let month = element.articleTime.getMonth() + 1 > 10 ? (element.articleTime.getMonth() + 1) : '0' + (element.articleTime.getMonth() + 1);
      let date = element.articleTime.getDate() > 10 ?  element.articleTime.getDate() : '0' + element.articleTime.getDate();
      element.articleTime = `${year}-${month}-${date}`;
    });
    res.render('index', {articles: articles, user: req.session.user});
  })
});

// 登录页
router.get('/login', function(req, res, next) {
  res.render('login', {message: ''});
});

// 登录信息验证
router.post('/login', (req, res, next) => {
  let name = req.body.name;
  let password = req.body.password;
  // let password = '123456';
  let hash = crypto.createHash('md5');
  hash.update(password);
  password = hash.digest('hex');

  let query = 'select * from author where authorName=' + mysql.escape(name) + 'and authorPassword=' + mysql.escape(password);
  mysql.query(query, (err, rows, fields) => {
    if(err) {
      console.log(err);
      return;
    }
    let user = rows[0];
    if(!user) {
      res.render('login', {message: '用户名或密码错误'});
      return;
    }
    // req.session.userSign = true;
    // req.session.userID = user.authorID
    req.session.user = user;
    res.redirect('/');
  })
});

// 文章内容页
router.get('/aticles/:articleID', (req, res, next) => {
  let articleID = req.params.articleID;
  let query = `select * from article where articleID=${mysql.escape(articleID)}`;
  mysql.query(query, (err, rows, fields) => {
    if(err) {
      console.log(err);
      return;
    }
    let query = `update article set articleClick=articleClick+1 where articleID=${mysql.escape(articleID)}`;
    let article = rows[0];
    mysql.query(query, (err, rows, fields) => {
      if(err) {
        console.log('更新错误信息：' + err);
        return;
      }
      let year = article.articleTime.getFullYear();
      let month = article.articleTime.getMonth() + 1 > 10 ? (article.articleTime.getMonth() + 1) : '0' + (article.articleTime.getMonth() + 1);
      let date = article.articleTime.getDate() > 10 ?  article.articleTime.getDate() : '0' + article.articleTime.getDate();
      article.articleTime = `${year}-${month}-${date}`;
      res.render('article', {article: article, user: req.session.user});
    });
  });
});

// 添加文章
router.get('/edit', (req, res, next) => {
  let user = req.session.user;
  if(!user) {
    res.redirect('/login');
    return;
  }
  res.render('edit', {user: req.session.user});
})

// 开始添加文章
router.post('/edit', (req, res, next) => {
  let title = req.body.title;
  let content = req.body.content;
  let author = req.session.user.authorName;
  
  let query = `insert article set articleTitle=${mysql.escape(title)},articleAuthor=${mysql.escape(author)},articleContent=${mysql.escape(content)},articleTime=CURDATE()`;
  mysql.query(query, (err, rows, fields) => {
    if(err) {
      console.log(err);
      return;
    }
    res.redirect('/');
  });
});

// 友情链接
router.get('/friends', (req, res, next) => {
  res.render('friends', {user: req.session.user});
})

// 关于博客
router.get('/about', (req, res, next) => {
  res.render('about', {user: req.session.user});
})

// 退出博客
router.get('/logout', (req, res, next) => {
  req.session.user = null;
  res.redirect('/');
})

module.exports = router;
