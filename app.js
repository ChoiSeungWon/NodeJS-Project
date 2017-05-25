var express = require('express');
var app = express();
var bodyParser = require('body-parser');

app.use(express.static('public'));//정적파일이 디렉터리 저장느낌
app.use(bodyParser.urlencoded({ extended: false }));
app.locals.pretty = true;
app.set('view engine', 'jade'); // 제이드 템플릿 연결!
app.set('views', './views');

app.get('/', function (req, res){
  res.send('Hello World');
  console.log('Hello World');
});

app.get('/form', function (req, res){
    res.render('form');
});

app.get('/form_receiver', function (req, res){
  var title = req.query.title;
  var description = req.query.description;
  res.send(title+','+description);
});

app.post('/form_receiver', function (req, res){
  var title = req.body.title;
  var description = req.body.description;
  res.send(title+','+description);
});

app.get('/topic/:id', function (req, res){
  var topics = [
    'Javascript is....',
    'Nodejs is...',
    'Express is ...'
  ];
  // var output = `
  //   <a href="/topic/0">JavaScript</a><br>
  //   <a href="/topic/1">Nodejs</a><br>
  //   <a href="/topic/2">Express</a><br>
  //   ${topics[req.params.id]}
  // `;

  res.send(output);
});
app.get('/topic/:id/:mode', function(req, res){
  res.send(req.params.id+','+req.params.mode);
});
app.get('/template', function (req, res){
  res.render('temp', {time:Date(), title:'Jade'});//랜더링
});

app.get('/dynamic', function (req, res){
  var lis = '';
  for(var i=0; i<5; i++){
    lis = lis +'<li>coding</li>';
  }
  var date = new Date();
  var output = `<!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8">
      <title></title>
      </head>
      <body>
      Heloo, Dynamic!
      <ul>
      ${lis}
      </ul>
      ${date}
      </body>
      </html>`;
    res.send(output);
});

app.get('/route', function (req, res){
  res.send('Hello Router, <img src="/route.png">');
});

app.get('/login', function (req, res){
  res.send('Login please');
});

app.listen(3000, function (){
  console.log('Example app listening on port 3000!');
});
