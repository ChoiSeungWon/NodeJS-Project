
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var fs = require('fs');
var sql = require('mssql');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var MssqlStore = require('connect-mssql')(session);
var bkfd2Password = require("pbkdf2-password");
var hasher = bkfd2Password();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var config = {
  user : 'vUser',
  password : '1234',
  server : 'localhost',
  database :'mydb',

  options: {
    encrypt : true
  }
};
var options = {
    table : 'sessions',
    ttl: 3600,
    reapInterval: 3600,
    reapCallback: function() { console.log('expired sessions were removed'); }
};

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
app.use(session({
  secret: '23879ASDF234sdf@!#$a',
  resave: false,
  saveUninitialized: true,
  store:new MssqlStore(config, options)
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(express.static('public'));//정적파일이 디렉터리 저장느낌
app.use(cookieParser('23879ASDF234sdf@!#$a'));
app.use(bodyParser.urlencoded({ extended : false}));
app.locals.pretty = true;
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);

app.listen(3000, function(req,res){
  console.log('Connencted, 3000 PORT');
  sql.connect(config, function(err){
    if(err){
      console.error('mssql connection error');
      console.error(err);
    }else{
      console.log('mssql connection');
    }
  });
});
var users = [{
  authId:'local:charles@winforsys.com',
  username: 'charles@winforsys.com',
  password: 'yYGzVvyEIOqeSLs0J6qRQWG712p0YSZmgikivLBac2KHkFnRK4PiwBhvmq/lPdrN+paiewSOXqvcXuMVU+kTxi806gET1DizgYmfulMdyL6XXKfXl5R3UU4JHHAu72pvU+JXRbcsZ/hOna6eOpncQIv3KUpBWA/rYPZi++nfFfw=',
  displayName:'Charles',
  salt:'WusfAdIhTvPdhRWDtwjQ1HoxOblQfg4fTNsj2wMoErtEjda7h251k+2LHZuiXatvkTBj8VhSY/sXIIMq/4jJZg=='
}];
app.post('/auth/register', function(req, res){
  hasher({password:req.body.password}, function(err, pass, salt, hash){
    var user = {
      authId:'local:'+req.body.username,
      username:req.body.username,
      password:hash,
      salt:salt,
      displayName:req.body.displayName
    };
    users.push(user);
    req.login(user, function(err){
        req.session.save(function(){
          res.redirect('/welcome');
        });
    });
  });
});
// app.post('/login', function(req, res){
//     var email = req.body.inputEmail;
//     var pwd = req.body.inputPassword;
//     if(email === user.username){
//       console.log(user.salt);
//       return hasher({password:pwd, salt:user.salt}, function(err, pass, salt, hash){
//         if(user.password === hash){
//           req.session.displayName = user.displayName;
//           req.session.save(function(){
//
//             res.render('index20', {user : req.session.displayName, products:null});
//           });
//         }else{
//           res.send('Who are you? <a href="/loginForm">login</a>');
//         }
//       });
//     }else{
//     res.send('Who are you? <a href="/loginForm">login</a>');
//     }
// });

// app.post('/auth/login', function(req, res){
//
//   var uname = req.body.username;
//   var pwd =req.body.password;
//   for(var i=0; i<users.length; i++){
//     var user = users[i];
//     if(uname === user.username){
//       return hasher({password:pwd, salt:user.salt}, function(err, pass, salt, hash){
//         if(hash === user.password){
//           req.session.displayName = user.displayName;
//           req.session.save(function(){
//             res.redirect('/welcome');
//           });
//         }else{
//           res.send('Who are you? <a href="/auth/login">login</a>');
//         }
//       });
//     }
//     // if(uname === user.username && sha256(pwd+user.salt) === user.password){
//     //   req.session.displayName = user.displayName;
//     //    return req.session.save(function(){
//     //       res.redirect('/welcome');
//     //   });
//     // }
//   }
//
// });
// login 성공하면 serializeUser 함수 실행,세션에 저장이 된다.
passport.serializeUser(function(user, done) {
  console.log('serializeUser',user);
  done(null, user.authId);
});
//
passport.deserializeUser(function(id, done) {
  console.log('deserializeUser', id);
  for(var i=0; i<users.length; i++){
    var user = users[i];
    if(user.authId === id){
      return done(null, user);
    }
  }
  done('There is no user');
});
//로컬방식
passport.use(new LocalStrategy(
  function(username, password, done){
      var uname = username;
      var pwd = password;
      for(var i=0; i<users.length; i++){
        var user = users[i];
        if(uname === user.username){
          return hasher({password:pwd, salt:user.salt}, function(err, pass, salt, hash){
            if(hash === user.password){
              console.log('LocalStrategy', user);
              done(null, user);
            }else{
              done(null, false);

            }
          });
        }
    }
    done(null, false);
  }
));
//페이스북방식
passport.use(new FacebookStrategy({
    clientID: '1077452632377761',
    clientSecret: '3867fb35f10ca94700f8d16cfb444897',
    callbackURL: "/auth/facebook/callback",
    profileFields:['id', 'emails', 'gender', 'link', 'locale',
    'name', 'timezone', 'updated_time', 'verified', 'displayName']
  },
  function(accessToken, refreshToken, profile, done) {
    console.log(profile);
    var authId = "facebook:"+profile.id;
    //등록된 사용자
    for(var i = 0; i < users.length; i++){
      var user = users[i];
      if(user.authId === authId){
         return done(null, user);
      }
    }
    var newuser ={
      'authId':authId,
      'displayName':profile.displayName,
    };
    users.push(newuser);
    done(null, newuser);
  }
));
//로컬 전략으로 동작한다.
app.post('/auth/login',
        passport.authenticate(
          'local',
          {
            successRedirect: '/welcome',
            failureRedirect: '/auth/login',
            failureFlash: false
          }
        )
  );
  //facebook 전략 동작한다.
app.get('/auth/facebook',
        passport.authenticate(
          'facebook',
          { scope: 'email'}
        )
  );
  app.get('/auth/facebook/callback',
        passport.authenticate(
          'facebook',
          {
            successRedirect: '/welcome',
            failureRedirect: '/auth/login'
          }
      )
);
app.get('/logout', function(req,res){
    delete req.session.displayName;
    req.session.save(function(){
      res.redirect('/loginForm');
    });
});
app.get('/auth/logout', function(req,res){
  req.logout();
  req.session.save(function(){
      res.redirect('/welcome');
  });
});
app.get('/hh', function(req,res){
  req.logout();
  console.log('hh');
});
app.get('/auth/register', function(req, res){
  var output = `
  <h1>Register</h1>
  <form action="/auth/register" method="post">
    <p>
      <input type="text" name="username" placeholder="username">
    </p>
    <p>
      <input type="password" name="password" placeholder="password">
    </p>
    <p>
      <input type="text" name="displayName" placeholder="displayName">
    </p>
    <p>
      <input type="submit">
    </p>
  </form>
  `;
  res.send(output);
});
app.get('/welcome', function(req, res){
  if(req.user && req.user.displayName){
    res.send(`
        <h1>Hello, ${req.user.displayName}</h1>
        <a href="/auth/logout">logout</a>
      `);
  }else{
    res.send(`
      <h1>Welcome</h1>
      <a href="/auth/login">Login</a><br>
      <a href="/auth/register">Register</a>
    `);
  }

});
app.get('/auth/login', function(req, res){
  var output = `
  <h1>Login</h1>
  <form action="/auth/login" method="post">
    <p>
      <input type="text" name="username" placeholder="username">
    </p>
    <p>
      <input type="password" name="password" placeholder="password">
    </p>
    <p>
      <input type="submit">
    </p>
  </form>
  <a href="/auth/facebook">facebook</a>
  `;
  res.send(output);
});
app.get('/sCount', function(req, res){
  if(req.session.count){
    req.session.count++;
  }else{
    req.session.count = 1;
  }
  res.send('count : '+req.session.count);
});

app.get('/tmp', function(req, res){
  res.send('result : '+req.session.count);
});

app.get('/count', function(req, res){
  var count;
  if(req.signedCookies.count){
    count = parseInt(req.signedCookies.count);
  } else{
    count = 0;
  }
  count = count+1;
  res.cookie('count', count, {signed:true});
  res.send('count : '+count);
});
var products = {
  1:{title:'The history of web 1'},
  2:{title:'The next web'}
};
app.get('/products',function(req, res){
  var output = '';
  for(var name in products){
    output += `
      <li>
        <a href="/cart/${name}">${products[name].title}</a>
      </li>`;
  }
  res.send(`<h1>Products</h1><ul>${output}</ul><a href="/cart">Cart</a>`);
});

app.get('/cart/:id', function(req, res){
  var id = req.params.id;
  var cart;
  if(req.signedCookies.cart){
    cart = req.signedCookies.cart;
  }else{
    cart = {};
  }
  if(!cart[id]){
    cart[id] = 0;
  }
  cart[id] = parseInt(cart[id])+1;
  res.cookie('cart', cart, {signed:true});
  res.redirect('/cart');
});

app.get('/cart', function(req, res){
  var cart = req.signedCookies.cart;
  if(!cart){
    res.send('Empty!');
  }else{
    var output = '';
    for(var id in cart){
      output += `<li>${products[id].title} (${cart[id]})</li>`;
    }
  }
  res.send(`
    <h1>Cart</h1>
    <ul>${output}</ul><a href="/products">Products List</a>`);
});

app.get('/loginForm', function(req, res){
  res.render('loginForm');
});



app.sql = function (dateStart,dateEnd,productId,res){
  new sql.Request().input('dateStart',dateStart).input('dateEnd',dateEnd).input('productId',productId).query('SELECT PNL_INF.GLS_ID,ROUND(PNL_Good_COUNT/Convert(float,COUNT(*))*100, 2) AS GLSID_Pre_Good,'+
                ' ROUND(PNL_Rj_COUNT/Convert(float,COUNT(*))*100, 2) AS PNL_Rj,ROUND(PNL_Rp_COUNT/Convert(float,COUNT(*))*100,2) AS PNL_Rp ' +
                ' FROM PNL_INF , (SELECT GLS_ID,COUNT(*) AS PNL_Good_COUNT FROM PNL_INF WHERE CT_GRADE != \'N\' AND CT_GRADE != \'P\' AND END_TIME between @dateStart AND @dateEnd GROUP BY ALL GLS_ID,PRODUCT_ID HAVING PRODUCT_ID = @productId) Good, '+
                ' (SELECT GLS_ID,COUNT(*) AS PNL_Rj_COUNT FROM PNL_INF WHERE CT_GRADE = \'N\' AND END_TIME between @dateStart AND @dateEnd GROUP BY ALL GLS_ID,PRODUCT_ID HAVING PRODUCT_ID = @productId) AS RJ, '+
                ' (SELECT GLS_ID,COUNT(*) AS PNL_Rp_COUNT FROM PNL_INF WHERE CT_GRADE = \'P\' AND END_TIME between @dateStart AND @dateEnd GROUP BY ALL GLS_ID,PRODUCT_ID HAVING PRODUCT_ID = @productId) AS RP '+
                ' WHERE PNL_INF.GLS_ID = Good.GLS_ID AND PNL_INF.GLS_ID = RJ.GLS_ID AND PNL_INF.GLS_ID = RP.GLS_ID AND END_TIME between @dateStart AND @dateEnd GROUP BY PNL_INF.GLS_ID,PNL_Good_COUNT,PNL_Rj_COUNT,PNL_Rp_COUNT ORDER BY PNL_INF.GLS_ID ').then(function(recordset){
                        //console.dir(recordset);
                        var GLS_Pre_Goods = recordset;
                        new sql.Request().input('dateStart',dateStart).input('dateEnd',dateEnd).input('productId',productId).query('select  count(distinct PNL_ID) as \'totalPnl_Count\','+
                        "(select count(distinct PNL_ID) from PNL_INF where (ct_grade = 'P' OR ct_grade = 'N') AND  end_time between @dateStart and @dateEnd AND PRODUCT_ID = @productId) as 't_p_n_Count',"+
                        "(select count(distinct PNL_ID) from PNL_INF where ct_grade = 'E' AND end_time between @dateStart AND @dateEnd AND PRODUCT_ID = @productId) as 't_e_Count',"+
                        "(select count(distinct PNL_ID) from PNL_INF where (ct_grade = 'P' OR ct_grade ='N') AND repair_repeat = 0 AND end_time between @dateStart AND @dateEnd AND PRODUCT_ID = @productId) as 'r_p_n_Count',"+
                        "(select count(distinct PNL_ID) from PNL_INF where repair_repeat = 0 AND  end_time between @dateStart AND @dateEnd AND PRODUCT_ID = @productId) as 'rTotalPnl_Count',"+
                        "(select ISNULL(SUM(DFT_COUNT),0) from PNL_INF where CT_GRADE ='E' AND  END_TIME between @dateStart AND @dateEnd AND PRODUCT_ID = @productId) AS 'e_DFT_Count',"+
                        "(select ISNULL(SUM(DFT_COUNT),0) from PNL_INF where CT_GRADE ='N' AND  END_TIME between @dateStart AND @dateEnd AND PRODUCT_ID = @productId) AS 'n_DFT_Count',"+
                        "(select ISNULL(SUM(DFT_COUNT),0) from PNL_INF where CT_GRADE ='P' AND  END_TIME between @dateStart AND @dateEnd AND PRODUCT_ID = @productId) AS 'p_DFT_Count'"+
                        "from PNL_INF where end_time between @dateStart and @dateEnd AND PRODUCT_ID = @productId;" +
                        'SELECT Good.GLS_ID,PNL_COUNT/Convert(float,COUNT(*))*100 AS GLSID_Pre_Good'+
                                      ' FROM PNL_INF , (SELECT GLS_ID,COUNT(*) AS PNL_COUNT FROM PNL_INF WHERE CT_GRADE = \'E\' AND END_TIME between @dateStart AND @dateEnd GROUP BY ALL GLS_ID,PRODUCT_ID HAVING PRODUCT_ID = @productId) Good'+
                                      ' WHERE PNL_INF.GLS_ID = Good.GLS_ID GROUP BY Good.GLS_ID,PNL_COUNT').then(function(recordset){
                                                              //console.dir(recordset);
                                                              var total = recordset;
                                                              console.log(GLS_Pre_Goods);
                                                              console.log(total);
                                                              res.send({total:total, GLS_Pre_Goods: GLS_Pre_Goods});
                                                        }).catch(function(err){
                                                              console.log(err);
                                                        });
                        //res.send({GLS_Pre_Goods:arr});
                  }).catch(function(err){
                        console.log(err);
                  });
};


app.sql1 = function (dateStart,dateEnd,productId,res){
  new sql.Request().input('dateStart',dateStart).input('dateEnd',dateEnd).input('productId',productId).query('SELECT DEFECT_CODE,COUNT(*) CODE_COUNT'+
                          ' FROM DFT_INF JOIN PNL_INF ON PNL_INF.PNL_ID = DFT_INF.PNL_ID' +
                          ' WHERE  PNL_INF.CT_GRADE = \'N\' AND PNL_INF.PRODUCT_ID = @productId AND' +
	                        ' END_TIME between @dateStart AND @dateEnd GROUP BY ALL DEFECT_CODE ORDER BY DEFECT_CODE').then(function(recordset){
                            console.dir(recordset);
                            var rj = recordset;
                            new sql.Request().input('dateStart',dateStart).input('dateEnd',dateEnd).input('productId',productId).query('SELECT DEFECT_CODE,COUNT(*) CODE_COUNT'+
                                                    ' FROM DFT_INF JOIN PNL_INF ON PNL_INF.PNL_ID = DFT_INF.PNL_ID' +
                                                    ' WHERE  PNL_INF.CT_GRADE = \'P\' AND PNL_INF.PRODUCT_ID = @productId AND' +
                          	                        ' END_TIME between @dateStart AND @dateEnd GROUP BY ALL DEFECT_CODE ORDER BY DEFECT_CODE').then(function(recordset){
                                                      console.dir(recordset);
                                                      var rp = recordset;
                                                      res.send({RJ:rj, RP:rp});
                                                  }).catch(function(err){
                                                      console.log(err);
                                                  });

                        }).catch(function(err){
                            console.log(err);
                        });
};

app.sql2 = function(dateStart,dateEnd,code,productId,res){
  new sql.Request().input('dateStart',dateStart).input('dateEnd',dateEnd).input('code',code).input('productId',productId).query('SELECT GLS_ID,PNL_INF.PNL_ID,PRODUCT_ID,STEP_ID,'+
                  'EQP_ID,CT_GRADE,END_TIME,DFT_INF.* FROM PNL_INF JOIN DFT_INF ON PNL_INF.PNL_ID = DFT_INF.PNL_ID '+
                  'WHERE DFT_INF.DEFECT_CODE = @code AND PNL_INF.CT_GRADE = \'N\' AND PNL_INF.PRODUCT_ID = @productId AND '+
	                'END_TIME between @dateStart AND @dateEnd').then(function(recordeset){
                    console.log(recordeset);
                    var rjCodeDefects = recordeset;
                    new sql.Request().input('dateStart',dateStart).input('dateEnd',dateEnd).input('code',code).input('productId',productId).query('SELECT PNL_INF.END_TIME,COUNT(DFT_INF.PNL_ID) DEFECT' +
                                      ' FROM PNL_INF JOIN DFT_INF ON PNL_INF.PNL_ID = DFT_INF.PNL_ID WHERE DFT_INF.DEFECT_CODE = @code AND '+
                                      ' PNL_INF.CT_GRADE = \'N\' AND PNL_INF.PRODUCT_ID = @productId AND  END_TIME between @dateStart AND @dateEnd '+
                                      ' GROUP BY PNL_INF.END_TIME').then(function(recordeset){
                                        console.dir(recordeset);
                                        var rjCodeDate = recordeset;
                                        res.send({
                                            rjCodeDefects : rjCodeDefects,
                                            rjCodeDate : rjCodeDate,
                                            code : code
                                        });
                                      }).catch(function (err){
                                              console.log(err);
                                      });


                  }).catch(function(err){
                    console.log(err);
                  });
};

app.sql3 = function(dateStart,dateEnd,code,productId,res){
  new sql.Request().input('dateStart',dateStart).input('dateEnd',dateEnd).input('code',code).input('productId',productId).query('SELECT GLS_ID,PNL_INF.PNL_ID,PRODUCT_ID,STEP_ID,'+
                  'EQP_ID,CT_GRADE,END_TIME,DFT_INF.* FROM PNL_INF JOIN DFT_INF ON PNL_INF.PNL_ID = DFT_INF.PNL_ID '+
                  'WHERE DFT_INF.DEFECT_CODE = @code AND PNL_INF.CT_GRADE = \'P\' AND PNL_INF.PRODUCT_ID = @productId AND '+
	                'END_TIME between @dateStart AND @dateEnd').then(function(recordeset){
                    console.log(recordeset);
                    var rpCodeDefects = recordeset;
                    new sql.Request().input('dateStart',dateStart).input('dateEnd',dateEnd).input('code',code).input('productId',productId).query('SELECT PNL_INF.END_TIME,COUNT(DFT_INF.PNL_ID) DEFECT' +
                                      ' FROM PNL_INF JOIN DFT_INF ON PNL_INF.PNL_ID = DFT_INF.PNL_ID WHERE DFT_INF.DEFECT_CODE = @code AND '+
                                      ' PNL_INF.CT_GRADE = \'P\' AND PNL_INF.PRODUCT_ID = @productId AND  END_TIME between @dateStart AND @dateEnd '+
                                      ' GROUP BY PNL_INF.END_TIME').then(function(recordeset){
                                        console.dir(recordeset);
                                        var rpCodeDate = recordeset;
                                        res.send({
                                            rpCodeDefects : rpCodeDefects,
                                            rpCodeDate : rpCodeDate,
                                            code : code
                                        });
                                      }).catch(function (err){
                                              console.log(err);
                                      });
                  }).catch(function(err){
                    console.log(err);
                  });
};

app.sql4 = function(dateStart,dateEnd,res){
  new sql.Request().input('dateStart',dateStart).input('dateEnd',dateEnd).query('select PRODUCT_ID FROM PNL_INF WHERE END_TIME between ' +
                ' @dateStart and @dateEnd GROUP BY PRODUCT_ID').then(function(recordeset){
                    var products = recordeset;
                    console.dir(recordeset);
                    res.send({
                        products : products
                    });
                  }).catch(function(err){
                    console.log(err);
                  });
};


app.post('/productId_ajax', function(req, res){
  if(req.session.displayName){
      var data = req.body;
      app.sql4(req.body.dateStart,req.body.dateEnd,res);
    }else{
        res.send('Who are you? <a href="/loginForm">login</a>');
    }
});

app.post('/rjTrend', function(req,res){
  if(req.session.displayName){
      console.log(req.body.productId);
      //app.sql2(data.dateStart,data.dateEnd,data.code,res);
      res.render('rjTrend',{
          dateStart : req.body.dateStart,
          dateEnd : req.body.dateEnd,
          code : req.body.code,
          productId : req.body.productId,
          user:req.session.displayName
      });
    }else{
        res.send('Who are you? <a href="/loginForm">login</a>');
    }
});

app.post('/rpTrend', function(req,res){
//  app.sql3(data.dateStart,data.dateEnd,data.code,res);
console.log(req.body.productId);
if(req.session.displayName){
  res.render('rpTrend',{
      dateStart : req.body.dateStart,
      dateEnd : req.body.dateEnd,
      code : req.body.code,
      productId : req.body.productId,
      user:req.session.displayName
  });
}else{
  res.send('Who are you? <a href="/loginForm">login</a>');
}
});

app.post('/rpCodeAjax', function(req,res){
  console.log(req.body.dateStart+","+req.body.dateEnd+","+req.body.code+","+req.body.productId);
  app.sql3(req.body.dateStart,req.body.dateEnd,req.body.code,req.body.productId,res);
});

app.post('/rjCodeAjax', function(req,res){
  console.log(req.body.dateStart+","+req.body.dateEnd+","+req.body.code+","+req.body.productId);
  app.sql2(req.body.dateStart,req.body.dateEnd,req.body.code,req.body.productId,res);
});

app.post('/trendAjax', function(req,res){
  console.log(req.body.dateStart+","+req.body.dateEnd+","+req.body.product_id);
  app.sql1(req.body.dateStart,req.body.dateEnd,req.body.product_id,res);
});

app.post('/totalAjax', function(req, res){
  console.log(req.body.dateStart+","+req.body.dateEnd+","+req.body.product_id);
  app.sql(req.body.dateStart,req.body.dateEnd,req.body.product_id,res);
});

app.get('/', function(req, res){
  if(req.session.displayName){
    res.render('index20' ,{user:req.session.displayName,products:null});
  }else{
    res.render('loginForm');
  }
});


app.get('/index2', function(req, res){
  res.sendFile(__dirname + '/index2.html');
});

app.get('/index20', function(req, res){
  if(req.session.displayName){
  res.sendFile(__dirname + '/index20.html');
}else{
  res.send('Who are you? <a href="/loginForm">login</a>');
}
});

app.get('/index3', function(req, res){
  res.sendFile(__dirname + '/index3.html');
});

app.get('/index4', function(req, res){
  res.sendFile(__dirname + '/index4.html');
});
