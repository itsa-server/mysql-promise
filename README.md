# mysql-promise
Mysql-connections using Promises


##Example
```js
"use strict";

var mysqlPromise = require('mysql-promise'),
    dbconfig = {
        "database": "databaseName",
        "user": "databaseUsername",
        "password": "databasePassword"
    },
    databaseConnection = mysqlPromise.getConnection(dbconfig);

getMembers = function(teamid) {
    return databaseConnection.then(function(connection) {
        return connection.getRecords('SELECT * FROM members WHERE teamid=?', teamid);
    });
};
```

