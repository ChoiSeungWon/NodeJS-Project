var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var fs = require('fs');
var OrientDB = require('orientjs');
var server = OrientDB({
  host: 'localhost',
  port: 2424,
  username: 'root',
  password: 'aneja5374'
});
var db =server.use('o2');
app.use(bodyParser.urlencoded({ extended: false }));
app.locals.pretty = true;
app.set('views', './views_orientdb');
app.set('view engine', 'jade');

app.listen(3000, function(){
  console.log('Connencted, 3000 PORT');
});

app.get('/topic/add', function(req, res){
var sql = 'SELECT FROM topic';
db.query(sql).then(function(topics){

    res.render('add', {topics:topics});
  });
});

app.post('/topic/add', function(req, res){
  var title = req.body.title;
  var description = req.body.description;
  var author = req.body.author;
  var sql = 'INSERT INTO topic (title, description, author) VALUES(:title,:desc, :author)';
  db.query(sql, {
    params:{
      title:title,
      desc:description,
      author:author
    }
  }).then(function(results){
    res.redirect('/topic/'+encodeURIComponent(results[0]['@rid']));
  });
  // fs.writeFile('data/'+title, description, function(err){
  //   if(err){
  //     console.log(err);
  //     res.status(500).send('Internal Server Error');
  //   }
  //     res.redirect('/topic/'+title);
  // });

});

app.get('/topic/:id/edit', function(req, res){
var sql = 'SELECT FROM topic';
var id = req.params.id;
db.query(sql).then(function(topics){
    var sql = 'SELECT FROM topic WHERE @rid=:rid';
    db.query(sql, {params:{rid:id}}).then(function(topic){
      res.render('edit', {topics:topics, topic:topic[0]});
    });
  });
});

app.post('/topic/:id/edit', function(req, res){
var sql = 'UPDATE topic SET title=:t,description=:d,author:a WHERE @rid=:rid';
var id = req.params.id;
var title =req.body.title;
var desc = req.body.description;
var author = req.body.author;
console.log(author);
db.query(sql, {
  params:{
    t:title,
    d:desc,
    a:author,
    rid:id
  }
}).then(function(topics){
    res.redirect('/topic/'+encodeURIComponent(id));
  });
});

app.get(['/topic', '/topic/:id'], function(req, res){
  var sql = 'SELECT FROM topic';
  db.query(sql).then(function(topics){
    var id = req.params.id;
    if(id){
      var sql = 'SELECT FROM topic WHERE @rid=:rid';
      db.query(sql, {params:{rid:id}}).then(function(topic){
        res.render('view', {topics:topics, topic:topic[0]});
      });
    }else{
      res.render('view', {topics:topics});
    }

  });
  //   fs.readdir('data', function(err, files){
  //     if(err){
  //       console.log(err);
  //       res.status(500).send('Internal Server Error');
  //     }
  //     var id = req.params.id;
  //     if(id){
  //       // id값이 있을 때
  //       fs.readFile('data/'+id, 'utf8', function(err, data){
  //         if(err){
  //           console.log(err);
  //           res.status(500).send('Internal Server Error');
  //         }
  //         res.render('view', {topics:files, title:id, description:data});
  //       });
  //     } else{
  //       // id값이 없을 때
  //       res.render('view', {topics:files, title:'Welcome', description:'hello, javascript serverside'});
  //     }
  // });
});
