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

DOMSnitch.Storage = function(parent) {
  this._parent = parent;
    
  var dbSize = 50 * 1024 * 1024; //50Mb
  var database = window.openDatabase(
    "DOM Snitch", "0.7", "Records store for DOM Snitch", dbSize);
  this._worker = new Worker("StorageWorker.js");
  this._worker.onerror = this._workerCompileError;
  this._worker.addEventListener("message", this._workerStatus.bind(this));
  this._callbackMap = {};
  this._cookie = 1;
  
  this._id = 0;
  this.getMaxId(this._setId.bind(this));
  this.getRecordCount(this._parent.setFindingsCount.bind(this._parent));
}

DOMSnitch.Storage.prototype = {
  _setId: function(id) {
    this._id = id > 0 ? id : 0;
    this._id++;
  },
  
  _workerCompileError: function(event) {
    console.error("DOM Snitch: " + event.message);
  },
  
  _workerStatus: function(event) {
    var input = JSON.parse(event.data);
    if(input.type == "error") {
      console.error("DOM Snitch: ");
      console.error(input.data);
    }
    
    if(input.cookie) {
      var callback = this._callbackMap[input.cookie];
      callback(input.data);
    }
  },
  
  deleteAll: function() {
    this._worker.postMessage(JSON.stringify({type: "deleteAll"}));
    this.getMaxId(this._setId.bind(this));
    this._parent.setFindingsCount(0);
  },
  
  deleteRecord: function(record) {
    //TODO(radi): Remove an individual record.
    this._worker.postMessage(JSON.stringify({type: "delete", id: record.id}));
    this.getRecordCount(this._parent.setFindingsCount);
  },
  
  getMaxId: function(callback) {
    var cookie = this._cookie++;
    this._callbackMap[cookie] = callback;
    this._worker.postMessage(JSON.stringify({type: "maxId", cookie: cookie}));
  },
  
  getRecordCount: function(callback) {
    var cookie = this._cookie++;
    this._callbackMap[cookie] = callback;
    this._worker.postMessage(JSON.stringify({type: "count", cookie: cookie}));
  },
  
  insert: function(record) {
    record.id = this._id++;
    this._worker.postMessage(JSON.stringify({type: "store", data: record}));
    this.getRecordCount(this._parent.setFindingsCount);
  },
  
  selectAll: function(colId, order, callback) {
    var cookie = this._cookie++;
    this._callbackMap[cookie] = callback;
    this._worker.postMessage(
      JSON.stringify(
        {type: "query", colId: colId, order: order, cookie: cookie}));
  },
  
  selectBy: function(key, value, callback) {
    var cookie = this._cookie++;
    this._callbackMap[cookie] = callback;
    this._worker.postMessage(
      JSON.stringify(
        {type: "queryBy", key: key, value: value, cookie: cookie}));
  }
}