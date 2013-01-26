/**
 * Copyright 2012 Google Inc. All Rights Reserved.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *    http://www.apache.org/licenses/LICENSE-2.0
 *  
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

if(!this.DOMSnitch) {
  DOMSnitch = {};
}

DOMSnitch.StorageWorker = function(parent) {
  this._parent = parent;
  this._parent.addEventListener("message", this._receiveFromParent.bind(this));
  
  var dbSize = 50 * 1024 * 1024; //50Mb
  this._database = openDatabase("DOM Snitch", "0.7", "Records store for DOM Snitch", dbSize);
  this._database.transaction(this._createTable.bind(this));
}

DOMSnitch.StorageWorker.prototype = {
  _createGetMaxId: function(cookie) {
    return function(tx) {
      tx.executeSql(
        "select max(id) from activityLog",
        [],
        function(tx, results) {
          var maxId = results.rows.item(0)["max(id)"];
          maxId = maxId ? maxId : 0;
          this._sendToParent(cookie, "maxId", maxId);
        }.bind(this),
        this._error.bind(this)
      );
    }
  },
  
  _createGetRecordCount: function(cookie) {
    return function(tx) {
      tx.executeSql(
        "select count(id) from activityLog",
        [],
        function(tx, results) {
          var count = results.rows.item(0)["count(id)"];
          count = count ? count : 0;
          this._sendToParent(cookie, "count", count);
        }.bind(this),
        this._error.bind(this)
      );
    }
  },
  
  _createInsert: function(record) {
    return function(tx) {
      tx.executeSql(
        "insert into activityLog (id, documentUrl, topLevelUrl, type, env, " +
        "data, callStack, gid, scanInfo) values (?, ?, ?, ?, ?, ?, ?, ?, ?);",
        [
           parseInt(record.id),
           record.documentUrl,
           record.topLevelUrl,
           record.type, 
           JSON.stringify(record.env), 
           record.data, 
           JSON.stringify(record.callStack),
           record.gid,
           JSON.stringify(record.scanInfo)
        ],
        null,
        this._error.bind(this)
      );
    };
  },
  
  _createSelectAll: function(cookie, orderBy, direction) {
    return function(tx) {
      tx.executeSql(
        "select * from activityLog order by " + orderBy + " " + direction,
        [],
        function(tx, results) {
          for(var i = 0; results.rows && i < results.rows.length; i++) {
            var result = results.rows.item(i);
            var record = {
              id: result.id,
              documentUrl: result.documentUrl,
              topLevelUrl: result.topLevelUrl,
              type: result.type,
              data: result.data,
              gid: result.gid
            };

            if(result.env && result.env != "undefined") {
              record.env = JSON.parse(result.env);
            }

            if(result.callStack && result.callStack != "undefined") {
              record.callStack = JSON.parse(result.callStack);
            }

            if(result.scanInfo && result.scanInfo != "undefined") {
              record.scanInfo = JSON.parse(result.scanInfo);
            }

            this._sendToParent(cookie, "result", record);
          }
        }.bind(this),
        this._error.bind(this)
      );
    };
  },
  
  _createSelectBy: function(cookie, key, value) {
    return function(tx) {
      tx.executeSql(
        "select * from activityLog where " + key + " = ? order by id asc",
        [value],
        function(tx, results) {
          for(var i = 0; results.rows && i < results.rows.length; i++) {
            var result = results.rows.item(i);
            var record = {
              id: result.id,
              documentUrl: result.documentUrl,
              topLevelUrl: result.topLevelUrl,
              type: result.type,
              data: result.data,
              gid: result.gid
            };

            if(result.env && result.env != "undefined") {
              record.env = JSON.parse(result.env);
            }

            if(result.callStack && result.callStack != "undefined") {
              record.callStack = JSON.parse(result.callStack);
            }

            if(result.scanInfo && result.scanInfo != "undefined") {
              record.scanInfo = JSON.parse(result.scanInfo);
            }

            this._sendToParent(cookie, "result", record);
          }
        }.bind(this),
        this._error.bind(this)
      );
    };
  },
  
  _createTable: function(tx) {
    tx.executeSql(
      "create table if not exists activityLog(id integer, documentUrl text," +
      " topLevelUrl text, type text, env text, data text, callStack text," +
      " gid text, scanInfo text);",
      [],
      null,
      this._error.bind(this)
    );
  },
  
  _deleteRecord: function(id, tx) {
    tx.executeSql(
      "delete from activityLog where id = ?;",
      [id],
      null,
      this._error.bind(this)
    );
  },
  
  _dropTable: function(tx) {
    tx.executeSql(
      "drop table if exists activityLog;",
      [],
      null,
      this._error.bind(this)
    );
  },
  
  _error: function(tx, error) {
    postMessage(JSON.stringify({type: "error", data: error}));
  },
  
  _receiveFromParent: function(event) {
    var input = JSON.parse(event.data);
    var func = undefined;
    var cookie = input.cookie;
    
    if(input.type == "store") {
      func = this._createInsert(input.data).bind(this);
    } else if(input.type == "query") {
      func = this._createSelectAll(cookie, input.colId, input.order).bind(this);
    } else if(input.type == "queryBy") {
      func = this._createSelectBy(cookie, input.key, input.value).bind(this);
    } else if(input.type == "maxId") {
      func = this._createGetMaxId(cookie).bind(this);
    } else if(input.type == "count") {
      func = this._createGetRecordCount(cookie).bind(this);
    } else if(input.type == "delete") {
      func = this._deleteRecord.bind(this, input.id);
    } else if(input.type == "deleteAll") {
      this._database.transaction(this._dropTable.bind(this));
      this._database.transaction(this._createTable.bind(this));
    }
    
    if(func) {
      this._database.transaction(func);
    }
  },
  
  _sendToParent: function(cookie, type, obj) {
    postMessage(JSON.stringify({type: type, data: obj, cookie: cookie}));
  },
}

worker = new DOMSnitch.StorageWorker(this);