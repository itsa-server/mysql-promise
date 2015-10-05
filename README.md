# mysql-promise
Mysql-connections using Promises


##Example getRecord
```js
"use strict";

var mysqlPromise = require('mysql-promise'),
    dbconfig = {
        "database": "databaseName",
        "user": "databaseUsername",
        "password": "databasePassword"
    },
    databaseConnection = mysqlPromise.getConnection(dbconfig);

// returns a Promise with response = record-object
getMember = function(id) {
    return databaseConnection.then(function(connection) {
        return connection.getRecords('SELECT * FROM members WHERE id=?', id);
    });
};
```

##Example getRecords
```js
"use strict";

var mysqlPromise = require('mysql-promise'),
    dbconfig = {
        "database": "databaseName",
        "user": "databaseUsername",
        "password": "databasePassword"
    },
    databaseConnection = mysqlPromise.getConnection(dbconfig);

// returns a Promise with response = Array of records
getMembers = function(teamid) {
    return databaseConnection.then(function(connection) {
        return connection.getRecords('SELECT * FROM members WHERE teamid=?', teamid);
    });
};
```

##Example insertGetId
```js
"use strict";

var mysqlPromise = require('mysql-promise'),
    dbconfig = {
        "database": "databaseName",
        "user": "databaseUsername",
        "password": "databasePassword"
    },
    databaseConnection = mysqlPromise.getConnection(dbconfig);

// returns a Promise with response = key of the new record
setMember = function(id, name) {
    return databaseConnection.then(function(connection) {
        return connection.insertGetId('INSERT INTO members SET id=?, name=?', [id, name]);
    });
};
```

##Example queryPromise
```js
"use strict";

var mysqlPromise = require('mysql-promise'),
    dbconfig = {
        "database": "databaseName",
        "user": "databaseUsername",
        "password": "databasePassword"
    },
    databaseConnection = mysqlPromise.getConnection(dbconfig);

// returns a Promise with response = {result : array with objects, fields: array with qsl-info}
updateMember = function(id, name) {
    return databaseConnection.then(function(connection) {
        return connection.queryPromise('UPDATE members SET name=? WHERE id=?', [name, id]);
    });
};
```

