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

  // for(var i = 0; i < 5; i++){
  //       console.log('item'+i+'.txt');
  // fs.readFile('C:\\Users\\win\\Desktop\\item'+i+'.txt', 'utf8', function(err, data){
  //   if(err){
  //     console.log(err);
  //   }
  //   var filedata = data;
  //   var dataArray = filedata.split('^');
  //   console.log(dataArray);
  // });
  //}
  var path = 'C:/Users/win/Desktop/test/';
  var i = 0;
  var testInterval = setInterval(function(){
    console.log("setInterval"+i++);

    fs.readdir(path,function(err,files){
      if(err){
        console.log(err);
      }
      console.log(files);
      if(files.length !== 0){
        console.log(files[0]);
        files.forEach(function(file){
          fs.readFile(path+file, 'utf8', function(err, data){
            console.log(path+file);
            console.log(data);
            var dataArray = data.split('\r\n');
            dataArray.forEach(function(data){
              var data2 = data.split('^');
              console.log(data2[0]+data2[1]);
              var sql = 'INSERT INTO cpu (num, cpu, model, price) VALUES(:num, :cpu, :model, :price)';
              db.query(sql, {
                params:{
                  num:data2[0],
                  cpu:data2[1],
                  model:data2[2],
                  price:data2[3]
                }
              }).then(function(results){
                console.log(results);
              });
            });
          });
        });
        // fs.readFile()
      }else{
        console.log('file 없다.');
      }
    });
},3000);
});
