const http = require('http')
const url = require('url')
const querystring = require('querystring')

var app = require('express')();
app.use(require('morgan')('dev'));

var session = require('express-session');
var FileStore = require('session-file-store')(session);


var bodyParser = require('body-parser');
var cors = require('cors')

var mysql = require('mysql2/promise')

const hostname = 'localhost';
var port = process.env.PORT || 8000;
const address = 'http://' + hostname + ':' + port;


//app.use(cors())
app.use(cors({credentials: true, origin: 'http://localhost:8080'}));
app.use(bodyParser.urlencoded({ extended: true }));

let sessionMiddleware = session({
  secret: 'veryverysecretsecret',
  saveUninitialized: true,
  resave: false
});

app.use(sessionMiddleware);
app.use(function printSession(req, res, next) {
	
	res.header('Access-Control-Allow-Origin', req.headers.origin);

	//res.header("Access-Control-Allow-Origin", "*");
	//res.header("Access-Control-Allow-Origin", "http://localhost:8080");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, authorization");
    res.header("Access-Control-Allow-Methods", "GET,POST,DELETE,PUT,OPTIONS");
	
	//res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8080')
	//res.setHeader('Access-Control-Allow-Credentials', 'true')
	//res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	//res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

	//console.log('req.session.id ->'+ req.session.id,'req.session', req.session);
  return next();
});


app.post('/setconnection',function(req,res){

  req.session.host     = req.body.host;
  req.session.user     = req.body.user;
  req.session.password = req.body.password;
  req.session.database = req.body.database;
  
  
  	console.log('req.session.id ->'+ req.session.id,'req.session', req.session);

	/*
	 req.session.save(function(err) {
		 if(err)
			console.log(err);

		return res.status(200).send();
	})
	*/
	
	return res.status(200).send();
});
app.get('/destroyconnection',function(req,res){
  console.log("DESTROY");
  req.session.destroy(function(err) {
    if(err) {
      console.log(err);
    } else {
      res.redirect('/');
	  return res.end();
    }
  });
});

app.get('/run', function (req, res) {
  	console.log('req.session.id ->'+ req.session.id,'req.session', req.session);

	if (!req.session.host){
		//return   res.status(406).send('Parametri non impostati!');
		res.status(406);
		return res.end(406+"");
	}

  const connection = mysql.createPool( {
	  host     : req.session.host,
	  user     : req.session.user,
	  password : req.session.password,
	  database : req.session.database
	  } )
	  
  const parsedUrl = url.parse(address + req.url)
  const parsedQs = querystring.parse(parsedUrl.query)
  // prettyJSON(parsedQs);

  var righe, pianoesecuzione
  var data =	{ rows: [{}], explain: [{}], error:"" }

  // Object.keys(parsedQs).forEach(function(key) {
  const key = 'query'
  const explain_sql = 'EXPLAIN ' + parsedQs[key]
  console.log(explain_sql)
  
  connection.query(parsedQs[key], function (err, rows_1, fields) {
	if(err) {data.error=err}
    if (err) { console.log('Error while performing Query.' + err) }

    data.rows = rows_1

    connection.query(explain_sql, function (err, rows_2, fields) {
      if (err) { console.log('Error while performing Query.' + err) }
      data.explain = rows_2

      //res.statusCode = 200
      // res.setHeader('Content-Type', 'text/plain');
      //res.send(data)
	  res.end(data);
    })
  })
  
  
  connection.end();
})

app.get('/tables', function (req, res) {
  	console.log('req.session.id ->'+ req.session.id,'req.session', req.session);

	if (!req.session.host){
		//return   res.status(406).send('Parametri non impostati!');
		res.status(406);
		return res.end(406+"");
	}

  const connection = mysql.createPool( {
	  host     : req.session.host,
	  user     : req.session.user,
	  password : req.session.password,
	  database : req.session.database
	  } )
	  
  var sql = 'SHOW TABLES'
  var ris = []


  connection.query(sql, function (err, tables, fields) {
    if (err) { console.log(sql + ' Error while performing Query.' + err) }

    // Make an array of promises
    var promises = tables.map(function (table) {
		   return new Promise(function (pass, fail) {

        sql = 'DESCRIBE ' + table.Tables_in_progetto

        connection.query(sql, function (err, rows, fields2) {
          if (err) { console.log(sql + ' Error while performing Query.' + err) }

			connection.end();
          ris.push({ tablename: table.Tables_in_progetto, fields: rows })
          pass()
        }).catch(fail)
		   })
    })

    // Wait for all to complete before responding
    Promise.all(promises).then(function () {
      // prettyJSON(ris);
      res.statusCode = 200
      // res.setHeader('Content-Type', 'text/plain');
      res.send(ris)

    }).catch(function (err) {
      console.log(sql + ' Error while performing Query.' + err)
	  
	  res.end();
      //res.send() // Fail (stops after first error)
    })
  })
})
app.get('/fields', function (req, res) {

	if (!req.session.host){
		//return res.redirect('http://localhost:8080/parametri.html');
		return   res.end(406+"");
	}

  const connection = mysql.createPool( {
	  host     : req.session.host,
	  user     : req.session.user,
	  password : req.session.password,
	  database : req.session.database
	  } )
	  
  var ret = { Table: '', Rows: [{}] }

  const parsedUrl = url.parse(address + req.url)
  const parsedQs = querystring.parse(parsedUrl.query)

  var sql = 'describe ' + parsedQs.table
  ret.Table = parsedQs.table
  

  connection.query(sql, function (err, ris) {
    if (err) { console.log(sql + ' Error while performing Query.' + err) }

	connection.end();
    // prettyJSON(ris);
    res.statusCode = 200
    // res.setHeader('Content-Type', 'text/plain');
    ret.Rows = ris
    //res.send(ret)
	res.send(ris);
  })
  
})

app.listen(port, function() {
    console.log("Listening on " + port);
});
function prettyJSON (obj) {
  console.log(JSON.stringify(obj, null, 2))
}


class Database {
    constructor( config ) {
        this.connection = mysql.createPool( config );
    }
    query( sql, args ) {		
        return new Promise( ( resolve, reject ) => {
            this.connection.query( sql, args, ( err, rows, fields ) => {
                if ( err )
                    return reject( err );
                resolve( err, rows, fields );
            } );
        } );
    }
    close() {
        return new Promise( ( resolve, reject ) => {
            this.connection.end( err => {
                if ( err )
                    return reject( err );
                resolve();
            } );
        } );
    }
}