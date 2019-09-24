const url = require('url')
const querystring = require('querystring')

var app = require('express')();
//app.use(require('morgan')('dev'));

var session = require('express-session');

var bodyParser = require('body-parser');
var cors = require('cors')

var mysql = require('mysql2/promise')

const hostname = 'localhost';
var port = process.env.PORT || 8000;
const address = 'http://' + hostname + ':' + port;

//app.use(cors())
app.use(cors({
	credentials: true,
	origin: 'http://localhost:8080'
}));
app.use(bodyParser.urlencoded({
	extended: true
}));

let sessionMiddleware = session({
	secret: 'veryverysecretsecret',
	saveUninitialized: true,
	resave: false
});

app.use(sessionMiddleware);
app.use(function printSession(req, res, next) {

	res.header('Access-Control-Allow-Origin', req.headers.origin);
	//res.header("Access-Control-Allow-Origin", "http://localhost:8080");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, authorization");
	res.header("Access-Control-Allow-Methods", "GET,POST,DELETE,PUT,OPTIONS");

	return next();
});


app.post('/setconnection', function(req, res) {

	req.session.host = req.body.host;
	req.session.user = req.body.user;
	req.session.password = req.body.password;
	req.session.database = req.body.database;

	console.log('req.session.id ->' + req.session.id, 'req.session', req.session);
	return res.status(200).send();
});
app.get('/destroyconnection', function(req, res) {
	console.log("DESTROY");
	req.session.destroy(function(err) {
		if (err) {
			console.log(err);
		} else {
			res.redirect('/');
			return res.end();
		}
	});
});

app.get('/run', function(req, res) {
	console.log('req.session.id ->' + req.session.id, 'req.session', req.session);

	if (!req.session.host) {
		return res.status(406).send();
	}

	const connection = mysql.createPool({
		host: req.session.host,
		user: req.session.user,
		password: req.session.password,
		database: req.session.database
	})

	const parsedUrl = url.parse(address + req.url)
	const parsedQs = querystring.parse(parsedUrl.query)

	var righe, pianoesecuzione
	var data = {
		rows: [{}],
		explain: [{}],
		error: ""
	}

	const key = 'query';
	//rimuovo doppi spazi
	parsedQs[key] = parsedQs[key].replace(/ +(?= )/g, '');

	let tables = parsedQs[key].toLowerCase().match(/(from|update)\s+(\w+)/g).map(e => e.split(' ')[1])
	const select_sql = "SELECT * FROM " + tables.toString();
	console.log(select_sql);
	connection.query(parsedQs[key], function(err, rows_1, fields) {
		if (err) {
			data.error = err
		}
		if (err) {
			console.log('Error while performing Query.' + err)
		}

		data.rows = rows_1
		if (!parsedQs[key].toLowerCase().startsWith("select")) {
			connection.query(select_sql, function(err, rows_2, fields) {
				if (err) {
					console.log('Error while performing Query.' + err)
				}
				data.rows = rows_2

				connection.end();
				res.send(data);
			})
		} else
			res.send(data);
	})
})

app.get('/tables', function(req, res) {
	console.log('req.session.id ->' + req.session.id, 'req.session', req.session);

	if (!req.session.host) {
		return res.status(406).send();
	}

	const connection = mysql.createPool({
		host: req.session.host,
		user: req.session.user,
		password: req.session.password,
		database: req.session.database
	})

	var sql = 'SHOW TABLES'
	var ris = []


	connection.query(sql, function(err, tables, fields) {
		if (err) {
			console.log(sql + ' Error while performing Query.' + err)
		}

		console.log(tables);

		var promises = tables.map(function(table) {
			return new Promise(function(pass, fail) {

				let tblname = eval('table.Tables_in_' + req.session.database);
				sql = 'DESCRIBE ' + tblname

				connection.query(sql, function(err, rows, fields2) {
					if (err) {
						console.log(sql + ' Error while performing Query.' + err)
					}

					connection.end();
					ris.push({
						tablename: tblname,
						fields: rows
					})
					pass()
				}).catch(fail)
			})
		})

		// Wait for all to complete before responding
		Promise.all(promises).then(function() {
			res.statusCode = 200
			res.send(ris)

		}).catch(function(err) {
			console.log(sql + ' Error while performing Query.' + err)

			res.end();
		})
	})
})
app.get('/fields', function(req, res) {

	if (!req.session.host) {
		return res.status(406).send();
	}

	const connection = mysql.createPool({
		host: req.session.host,
		user: req.session.user,
		password: req.session.password,
		database: req.session.database
	})

	var ret = {
		Table: '',
		Rows: [{}]
	}

	const parsedUrl = url.parse(address + req.url)
	const parsedQs = querystring.parse(parsedUrl.query)

	var sql = 'describe ' + parsedQs.table
	ret.Table = parsedQs.table


	connection.query(sql, function(err, ris) {
		if (err) {
			console.log(sql + ' Error while performing Query.' + err)
		}

		connection.end();
		res.statusCode = 200
		ret.Rows = ris
		res.send(ret);
	})
})
app.get('/testconnection', function(req, res) {

	if (!req.session.host) {
		return res.status(406).send();
	}

	const connection = mysql.createPool({
		host: req.session.host,
		user: req.session.user,
		password: req.session.password,
		database: req.session.database
	})
	connection.query("SELECT 1", function(err, ris) {
		if (err) return res.status(406).send();
		else return res.status(200).send();
	})
})

app.listen(port, function() {
	console.log("Listening on " + port);
});

function prettyJSON(obj) {
	console.log(JSON.stringify(obj, null, 2))
}