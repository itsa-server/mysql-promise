/*jshint maxlen:205 */

(function (global) {

    "use strict";

    var createHashMap = require('js-ext/extra/hashmap.js').createMap,
        LOST_CONNECTION = 'PROTOCOL_CONNECTION_LOST',
        connections, mySQLConnection, Connection, mysql, Classes;

    global._ITSAmodules || Object.protectedProp(global, '_ITSAmodules', createHashMap());

/*jshint boss:true */
    if (mySQLConnection=global._ITSAmodules.mySQLConnection) {
/*jshint boss:false */
        module.exports = mySQLConnection; // mySQLConnection was already created
        return;
    }

    mysql = require('mysql');
    Classes = require('js-ext/js-ext.js').Classes; // full version
    connections = {};

    /**
      * A databaseconnection using connectionpool under the hood.<br />
      * Using node-mysql https://github.com/felixge/node-mysql.<br />
      *
      * Initiate with config-object:
      * <ul>
      *   <li>host='localhost' {String} The hostname of the database you are connecting to.</li>
      *   <li>port=3306 {Int} The port number to connect to.</li>
      *   <li>socketPath {String} The path to a unix domain socket to connect to. When used host and port are ignored.</li>
      *   <li>user {String} The MySQL user to authenticate as.</li>
      *   <li>password {String} The password of that MySQL user.</li>
      *   <li>database {String} Name of the database to use for this connection.</li>
      *   <li>charset='UTF8_GENERAL_CI' {String} The charset for the connection. <b>Value needs to be all in upper case letters!</b></li>
      *   <li>timezone='local' {String} The timezone used to store local dates.</li>
      *   <li>stringifyObjects=false {Boolean} Stringify objects instead of converting to values. See <a href='https://github.com/felixge/node-mysql/issues/501'>issue #501</a>.</li>
      *   <li>insecureAuth=true {Boolean Allow connecting to MySQL instances that ask for the old (insecure) authentication method.</li>
      *   <li>typeCast=true {Boolean} Determines if column values should be converted to native JavaScript types.</li>
      *   <li>queryFormat {String} A custom query format function. See <a href='https://github.com/felixge/node-mysql#custom-format'>Custom format</a>.</li>
      *   <li>supportBigNumbers=false {Boolean} When dealing with big numbers (BIGINT and DECIMAL columns) in the database, you should enable this option.</li>
      *   <li>bigNumberStrings=false {Boolean} Enabling both supportBigNumbers and bigNumberStrings forces big numbers (BIGINT and DECIMAL columns) to be always returned as
      *                                                  JavaScript String objects. Enabling supportBigNumbers but leaving bigNumberStrings disabled will return big numbers as String
      *                                                  objects only when they cannot be accurately represented with <a href='http://ecma262-5.com/ELS5_HTML.htm#Section_8.5'>JavaScript Number objects</a>
      *                                                  (which happens when they exceed the [-2^53, +2^53] range), otherwise they will be returned as Number objects. This option is ignored
      *                                                  if supportBigNumbers is disabled.</li>
      *   <li>debug=false {Boolean|Array} Prints protocol details to stdout.</li>
      *   <li>multipleStatements=false: Allow multiple mysql statements per query. Be careful with this, it exposes you to SQL injection attacks.</li>
      *   <li>flags {Array} List of connection flags to use other than the default ones. It is also possible to blacklist default ones. For more information, check
      *                               <a href='https://github.com/felixge/node-mysql#connection-flags'>Connection Flags</a>.</li>
      *   <li>createConnection=mysql.createConnection {Function} <i>for connectionpooling</i> The function to use to create the connection.</li>
      *   <li>waitForConnections=true {Boolean} <i>for connectionpooling</i> Determines the pool's action when no connections are available and the limit has been reached.</li>
      *                                                   If true, the pool will queue the connection request and call it when one becomes available. If false, the pool will immediately
      *                                                   call back with an error.</li>
      *   <li>connectionLimit=10 {Number} <i>for connectionpooling</i> The maximum number of connections to create at once.</li>
      *   <li>queueLimit=0 {Number} <i>for connectionpooling</i> The maximum number of connection requests the pool will queue before returning an error from getConnection.
      *                                       If set to 0, there is no limit to the number of queued connection requests.</li>
      * </ul>
      * @module itsa-node-dbconnector
      * @class DatabaseConnection
      * @constructor

     **/


    /**
      * Config to be passed to node-mysql
      * @property _config
      * @type Object
      * @private
     **/

    /**
      * Internal reference to the connectionPool
      * @property _pool
      * @type Object
      * @private
     **/
    Connection = Classes.createClass(
        function(config) {
            var instance = this;
            instance._config = config.shallowClone();
            // in our system, default insecureAuth to make access work
    /*jshint expr:true */
            instance._config.insecureAuth || (instance._config.insecureAuth=true);
    /*jshint expr:false */
            instance._createPool();
        }, {
            /**
             * Executes a query to the database, returning a Promise.
             *
             * @method queryPromise
             * @param query {String} Query to execute: use '?' when using the second param (values)
             * @param values {String*} Values to safely inject into the query
             * @example
             *     dbconnection.queryPromise(
             *         'INSERT INTO sometable SET title=?, text=?, created=?',
             *         ['super cool', 'this is a nice text', '2010-08-16 10:00:23']
             *     );
             * @example
             *     newdata = {title: 'super cool', text: 'this is a nice text', created: '2010-08-16 10:00:23'};
             *     dbconnection.queryPromise(
             *         'INSERT INTO sometable SET ?',
             *         newdata
             *     );
             * @example
             *     userId = 37;
             *     dbconnection.queryPromise(
             *         'SELECT * FROM sometable WHERE id=?',
             *         userId
             *     ).then(
             *         function(response) {
             *             var result = response.result,
             *                 fields = response.fields;
             *             // result is found and ready to use here
             *         },
             *         function(reason) {
             *             // some error occured, examine 'reason'
             *         }
             *     );
             * @return {Promise} response = {result : array with objects, fields: array with qsl-info}
             * @since 0.1
            **/
            queryPromise: function(sql, values) {
                var instance = this,
                    generateQueryPromise, connectionQuery;

                connectionQuery = function(connection) {
                    return new Promise(function (resolve, reject) {
                        var callBack = function(err, result, fields) {
                                if (err) {
                                    // if error equals a 'loast connection', then re-init the promise-query, else throw an error
                                    // see https://github.com/felixge/node-mysql#server-disconnects
        /*jshint expr:true */
                                    (err.code===LOST_CONNECTION) ? resolve(generateQueryPromise()) : reject(err);
        /*jshint expr:false */
                                    // Its is said: No need to worry about releasing the connection:
                                    // With Pool, disconnected connections will be removed from the pool freeing up space
                                    // for a new connection to be created on the next getConnection call.
                                    // but that doesn't seem to be the case. We need to free the connection:
                                    connection.release();
                                }
                                else {
                                    resolve({
                                        result: result,
                                        fields: fields
                                    });
                                    // return the connection to the pool, ready to be used again by someone else:
                                    connection.release();
                                }
                            };
        /*jshint expr:true */
                        values ? connection.query(sql, values, callBack) : connection.query(sql, callBack);
        /*jshint expr:false */
                    });
                };
                generateQueryPromise = function() {
                    return instance._getConnectionPromise().then(connectionQuery);
                };
                return generateQueryPromise();
            },

            /**
             * Gets first record that returned from query, returning a Promise. When no records, the promise is rejected, when there are records,
             * the filfilled callback contains an array with the records.
             *
             * @method getRecords
             * @param query {String} Query to execute: use '?' when using the second param (values)
             * @param values {String*} Values to safely inject into the query
             * @example
             *     dbconnection.queryPromise(
             *         'INSERT INTO sometable SET title=?, text=?, created=?',
             *         ['super cool', 'this is a nice text', '2010-08-16 10:00:23']
             *     );
             * @example
             *     newdata = {title: 'super cool', text: 'this is a nice text', created: '2010-08-16 10:00:23'};
             *     dbconnection.queryPromise(
             *         'INSERT INTO sometable SET ?',
             *         newdata
             *     );
             * @example
             *     userId = 37;
             *     dbconnection.queryPromise(
             *         'SELECT * FROM sometable WHERE id=?',
             *         userId
             *     ).then(
             *         function(response) {
             *             var result = response.result,
             *                 fields = response.fields;
             *             // result is found and ready to use here
             *         },
             *         function(reason) {
             *             // some error occured, examine 'reason'
             *         }
             *     );
             * @return {Promise} fulfilled(response) --> response={record} OR reject(err) when no records (err==='no records') or runtime-error
             * @since 0.1
            **/
            getRecord: function(sql, values) {
                var limitone = new RegExp(' limit 1$', 'i');
                limitone.test(sql) || (sql += ' LIMIT 1');
                return this.getRecords(sql, values).then(
                    function(records) {
                        return records[0];
                    }
                );
            },

            /**
             * Gets records from the db, returning a Promise. When no records, the promise is rejected, when there are records,
             * the filfilled callback contains an array with the records.
             *
             * @method getRecords
             * @param query {String} Query to execute: use '?' when using the second param (values)
             * @param values {String*} Values to safely inject into the query
             * @example
             *     dbconnection.queryPromise(
             *         'INSERT INTO sometable SET title=?, text=?, created=?',
             *         ['super cool', 'this is a nice text', '2010-08-16 10:00:23']
             *     );
             * @example
             *     newdata = {title: 'super cool', text: 'this is a nice text', created: '2010-08-16 10:00:23'};
             *     dbconnection.queryPromise(
             *         'INSERT INTO sometable SET ?',
             *         newdata
             *     );
             * @example
             *     userId = 37;
             *     dbconnection.queryPromise(
             *         'SELECT * FROM sometable WHERE id=?',
             *         userId
             *     ).then(
             *         function(response) {
             *             var result = response.result,
             *                 fields = response.fields;
             *             // result is found and ready to use here
             *         },
             *         function(reason) {
             *             // some error occured, examine 'reason'
             *         }
             *     );
             * @return {Promise} fulfilled(response) --> response=[records] OR reject(err) when no records (err==='no records') or runtime-error
             * @since 0.1
            **/
            getRecords: function(sql, values) {
                return this.queryPromise(sql, values).then(
                    function(response) {
                        return response.result;
                    }
                );
            },

            /**
             * Executes the statement (which needs to be an INSERT-statement) abd returns the insered id.
             *
             * @method insertGetId
             * @param query {String} Query to execute: use '?' when using the second param (values)
             * @param values {String*} Values to safely inject into the query
             * @example
             *     dbconnection.queryPromise(
             *         'INSERT INTO sometable SET title=?, text=?, created=?',
             *         ['super cool', 'this is a nice text', '2010-08-16 10:00:23']
             *     );
             * @example
             *     newdata = {title: 'super cool', text: 'this is a nice text', created: '2010-08-16 10:00:23'};
             *     dbconnection.queryPromise(
             *         'INSERT INTO sometable SET ?',
             *         newdata
             *     );
             * @example
             *     userId = 37;
             *     dbconnection.queryPromise(
             *         'SELECT * FROM sometable WHERE id=?',
             *         userId
             *     ).then(
             *         function(response) {
             *             var result = response.result,
             *                 fields = response.fields;
             *             // result is found and ready to use here
             *         },
             *         function(reason) {
             *             // some error occured, examine 'reason'
             *         }
             *     );
             * @return {Promise} fulfilled(response) --> response=insertid OR reject(err)
             * @since 0.1
            **/
            insertGetId: function(sql, values) {
                return this.queryPromise(sql, values).then(
                    function(insertresponse) {
                        return insertresponse.result.insertId;
                    }
                );
            },

            /**
             * Gets a connection from the connectionPool, returning a Promise.
             * When retreived a valid connection, the promise is resolved, passing the connection.
             *
             * @method _getConnectionPromise
             * @private
             * @since 0.1
            **/
            _getConnectionPromise: function() {
                var instance = this;
                return new Promise(function (resolve, reject) {
                    instance._pool.getConnection(function(err, connection) {
        /*jshint expr:true */
                        err ? reject(new Error(err)) : resolve(connection);
        /*jshint expr:false */
                    });
                });
            },

            /**
             * Create a connectionPool, using the config that is passed during initialization
             *
             * @method _createPool
             * @private
             * @since 0.1
            **/
            _createPool: function() {
                var instance = this;
                instance._pool = mysql.createPool(instance._config);
            }
        }
    );

    mySQLConnection = global._ITSAmodules.mySQLConnection = {
        getConnection: function(config) {
            config || (config = {});
            if (config.database && config.user && config.password) {
                if (!connections[config.database]) {
                    connections[config.database] = new Connection(config);
                }
                return connections[config.database];
            }
            else {
                console.log('mySQLConnection.getConnection invoked without proper database/user/password');
            }
        }
    };

    module.exports = mySQLConnection;

}(typeof global !== 'undefined' ? global : /* istanbul ignore next */ this));
