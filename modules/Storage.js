/**
 * Copyright 2011 Google Inc. All Rights Reserved.
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

DOMSnitch.Modules.Storage = function(parent) {
  this._parent = parent;
  this._targets = {
    "storage.clear": {
      capture: true,
      funcName: "clear", 
      obj: Storage.prototype, 
      origPtr: Storage.prototype.clear
    },
    "storage.getItem": {
      capture: true,
      funcName: "getItem", 
      obj: Storage.prototype, 
      origPtr: Storage.prototype.getItem
    },
    "storage.key": {
      capture: true,
      funcName: "key", 
      obj: Storage.prototype, 
      origPtr: Storage.prototype.key
    },
    "storage.removeItem": {
      capture: true,
      funcName: "removeItem", 
      obj: Storage.prototype, 
      origPtr: Storage.prototype.removeItem
    },
    "storage.setItem": {
      capture: true,
      funcName: "setItem", 
      obj: Storage.prototype, 
      origPtr: Storage.prototype.setItem
    },
    "window.localStorage": {
      obj: window, 
      propName: "localStorage", 
      origVal: window.localStorage
    },
    "window.sessionStorage": {
      obj: window,
      propName: "sessionStorage", 
      origVal: window.sessionStorage
    }
  };
  
  this._loaded = false;
}

DOMSnitch.Modules.Storage.prototype = new DOMSnitch.Modules.Base;

DOMSnitch.Modules.Storage.prototype._createMethod = function(module, type, target, callback) {
  return function(data) {
    var storage = module.isSessionStorage(this) ? "sessionStorage" : "localStorage";
    var args = [].slice.call(arguments);
    var handler = module.config[storage];
    if(handler && target.capture) {
      var trace = "";
      try {
        module.dummyFunctionThatDoesNotExist();
      } catch(e) {
        trace = e.stack.toString();
      }

      var gid = module.generateGlobalId(type);
      var modifiedArgs = 
        handler(arguments.callee, trace, args.join(" | "), storage + "/" + type, gid);
      args = modifiedArgs ? modifiedArgs.split(" | ") : args;
    }
    var retVal = target.origPtr.apply(this, args);
    
    if(callback) {
      callback();
    }
    return retVal;
  };
}

DOMSnitch.Modules.Storage.prototype.generateGlobalId = function(type) {
  // Generate unique, yet reproducible global ID
  var caller = arguments.callee.caller.caller.toString();
  var token = caller.length > 50 ? caller.substring(0, 50) : caller;
  
  var baseUrl = document.location.origin + document.location.pathname + "#";
  var gid = baseUrl + type + "/" + token.replace(/\s/gg, "") + "-" + caller.length;

  return gid;
}

DOMSnitch.Modules.Storage.prototype.isSessionStorage = function(storageObj) {
  return storageObj == this._targets["window.sessionStorage"].origVal;
}

DOMSnitch.Modules.Storage.prototype.load = function() {
  this.config = this._parent.config;
  
  if(this._loaded) {
    this.unload();
  }
  
  if(this.config["localStorage"]) {
    this._overloadProperty("window.localStorage", "localStorage");
  }
  
  if(this.config["sessionStorage"]) {
    this._overloadProperty("window.sessionStorage", "sessionStorage");
  }
  
  if(this.config["localStorage"] || this.config["sessionStorage"]) {
    this._overloadMethod("storage.clear", "clear");
    this._overloadMethod("storage.getItem", "getItem");
    this._overloadMethod("storage.key", "key");
    this._overloadMethod("storage.removeItem", "removeItem");
    this._overloadMethod("storage.setItem", "setItem");
  }
  
  this._loaded = true;
}

DOMSnitch.Modules.Storage.prototype.unload = function() {
  for(entryName in this._targets) {
    var entry = this._targets[entryName];
    if(entry.funcName) {
      entry.obj[entry.funcName] = entry.origPtr;
    }
  }
  
  this._loaded = false;
}