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

DOMSnitch.Modules.XmlHttpRequest = function(parent) {
  this._parent = parent;
  this._targets = {
    "XMLHttpRequest.open": {
      capture: true,
      funcName: "open", 
      obj: XMLHttpRequest.prototype, 
      origPtr: XMLHttpRequest.prototype.open
    },
    "XMLHttpRequest.send": {
      capture: true,
      funcName: "send", 
      obj: XMLHttpRequest.prototype, 
      origPtr: XMLHttpRequest.prototype.send
    },
    "XMLHttpRequest.setRequestHeader": {
      capture: true,
      funcName: "setRequestHeader", 
      obj: XMLHttpRequest.prototype, 
      origPtr: XMLHttpRequest.prototype.setRequestHeader
    },
  };
  
  this._loaded = false;
}

DOMSnitch.Modules.XmlHttpRequest.prototype = new DOMSnitch.Modules.Base;

DOMSnitch.Modules.XmlHttpRequest.prototype._createMethod = function(module, type, target, callback) {
  return function() {
    var args = [].slice.call(arguments);
    
    if(type == "xhr.open") {
      this.reqIsAsync = args[2] != undefined ? args[2] : true;
    }

    var handler = module.config[type];
    if(handler && target.capture) {  
      var trace = "";
      try {
        module.dummyFunctionThatDoesNotExist();
      } catch(e) {
        trace = e.stack.toString();
      }

      var gid = module.generateGlobalId(type);
      var modifiedArgs = handler(arguments.callee, trace, args.join(" | "), type, gid);
      args = modifiedArgs ? modifiedArgs.split(" | ") : args;      
    }
    
    var handler = module.config["xhr.recv"];
    if(handler && this.reqIsAsync) {
      var _recvTarget = {funcName: "onreadystatechange", obj: this, origPtr: this.onreadystatechange};
      var _recvGid = module.generateGlobalId("xhr.recv");
      this.onreadystatechange = function() {
        if(this.readyState == 4) {
          var _recvTrace = "";
          try {
            module.dummyFunctionThatDoesNotExist();
          } catch(e) {
            _recvTrace = e.stack.toString();
          }
          
          handler(arguments.callee, _recvTrace, this.responseText, "xhr.recv", _recvGid);
        }
        
        _recvTarget.origPtr.apply(this, arguments);
      };
    }
    
    var retVal = target.origPtr.apply(this, args);
    
    if(handler && !this.reqIsAsync) {
      var _recvGid = module.generateGlobalId("xhr.recv");
      handler(arguments.callee, trace, this.responseText, "xhr.recv", _recvGid);
    }
    
    if(callback) {
      callback();
    }
    
    return retVal;
  };
}

DOMSnitch.Modules.XmlHttpRequest.prototype.generateGlobalId = function(type) {
  // Generate unique, yet reproducible global ID
  var caller = arguments.callee.caller.caller.toString();
  var token = caller.length > 50 ? caller.substring(0, 50) : caller;
  
  var baseUrl = document.location.origin + document.location.pathname + "#";
  var gid = baseUrl + type + "/" + token.replace(/\s/gg, "") + "-" + caller.length;

  return gid;
}

DOMSnitch.Modules.XmlHttpRequest.prototype.load = function() {
  this.config = this._parent.config;
  
  if(this._loaded) {
    this.unload();
  }
  
  if(this.config["xhr.open"]) {
    this._overloadMethod("XMLHttpRequest.open", "xhr.open");
  }
  
  if(this.config["xhr.send"]) {
    this._overloadMethod("XMLHttpRequest.send", "xhr.send");
  }

  if(this.config["xhr.requestHeader"]) {
    this._overloadMethod("XMLHttpRequest.setRequestHeader", "xhr.requestHeader");
  }

  if(this.config["xhr.recv"]) {
    this._overloadMethod("XMLHttpRequest.open", "xhr.open");
    this._overloadMethod("XMLHttpRequest.send", "xhr.send");
  }
  
  this._loaded = true;
}

DOMSnitch.Modules.XmlHttpRequest.prototype.unload = function() {
  for(entryName in this._targets) {
    var entry = this._targets[entryName];
    if(entry.funcName) {
      entry.obj[entry.funcName] = entry.origPtr;
    }
  }
  
  this._loaded = false;
}