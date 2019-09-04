const http = require('http')
const url = require('url')
const querystring = require('querystring')
var express = require('express')
var mysql = require('mysql2/promise')
/*
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : 'toor',
  database : 'progetto'
});
*/
// Create the connection pool. The pool-specific settings are the defaults
const connection = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'toor',
  database: 'progetto',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
})

var app = express()

const hostname = '127.0.0.1'
const port = 8000
const address = 'http://' + hostname + ':' + port

app.get('/run', function (req, res) {
  // Website you wish to allow to connect
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8080')

  // Request methods you wish to allow
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE')

  // Request headers you wish to allow
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type')

  const parsedUrl = url.parse(address + req.url)
  const parsedQs = querystring.parse(parsedUrl.query)
  // prettyJSON(parsedQs);

  var righe, pianoesecuzione
  var data =	{ rows: [{}], explain: [{}] }

  // Object.keys(parsedQs).forEach(function(key) {
  const key = 'query'
  const explain_sql = 'EXPLAIN ' + parsedQs[key]
  console.log(explain_sql)
  connection.query(parsedQs[key], function (err, rows_1, fields) {
    if (err) { console.log('Error while performing Query.' + err) }

    data.rows = rows_1

    connection.query(explain_sql, function (err, rows_2, fields) {
      if (err) { console.log('Error while performing Query.' + err) }
      data.explain = rows_2

      res.statusCode = 200
      // res.setHeader('Content-Type', 'text/plain');
      res.send(data)
    })
  })
})

app.get('/getall', function (req, res) {
  // Website you wish to allow to connect
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8080')

  // Request methods you wish to allow
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE')

  // Request headers you wish to allow
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type')
  /*
	connection.connect(function(err){
		if(!err) {
			console.log("Database is connected ... nn");
		} else {
			console.log("Error connecting database ... nn");
		}
	});
	*/

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
      res.send() // Fail (stops after first error)
    })
  })
})
app.get('/fields', function (req, res) {
  // Website you wish to allow to connect
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8080')

  // Request methods you wish to allow
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE')

  // Request headers you wish to allow
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type')

  var ret = { Table: '', Rows: [{}] }

  const parsedUrl = url.parse(address + req.url)
  const parsedQs = querystring.parse(parsedUrl.query)

  var sql = 'describe ' + parsedQs.table
  ret.Table = parsedQs.table
  connection.query(sql, function (err, ris) {
    if (err) { console.log(sql + ' Error while performing Query.' + err) }

    // prettyJSON(ris);
    res.statusCode = 200
    // res.setHeader('Content-Type', 'text/plain');
    ret.Rows = ris
    res.send(ret)
  })
})
app.listen(port)

function prettyJSON (obj) {
  console.log(JSON.stringify(obj, null, 2))
}
