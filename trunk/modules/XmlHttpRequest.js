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
  
  this._htmlElem = document.documentElement;
  this._xhrEvt = document.createEvent("Event");
  this._xhrEvt.initEvent("XMLHttpRequest", true, true);
}

DOMSnitch.Modules.XmlHttpRequest.prototype = new DOMSnitch.Modules.Base;

DOMSnitch.Modules.XmlHttpRequest.prototype._createXhrOpen = function() {
  var target = this._targets["XMLHttpRequest.open"];
  var module = this;
  return function() {
    this.addEventListener("readystatechange", 
      module.handleXhrStateChange.bind(module), true);
    this.globalId = module.generateGlobalId("XMLHttpRequest");
    this.requestMethod = arguments[0];
    this.requestUrl = arguments[1];
    this.requestHeaders = [];
    
    target.origPtr.apply(this, arguments);
  };
}

DOMSnitch.Modules.XmlHttpRequest.prototype._createXhrSend = function() {
  var target = this._targets["XMLHttpRequest.send"];
  return function() {
    this.requestBody = arguments[0];
    target.origPtr.apply(this, arguments);
  };
}

DOMSnitch.Modules.XmlHttpRequest.prototype._createXhrSetRequestHeader = function() {
  var target = this._targets["XMLHttpRequest.setRequestHeader"];
  return function() {
    var header = arguments[0];
    var value = arguments[1];
    this.requestHeaders.push(header + ": " + value);
    
    target.origPtr.apply(this, arguments);
  };
}

DOMSnitch.Modules.XmlHttpRequest.prototype.generateGlobalId = function(type) {
  // Generate unique, yet reproducible global ID
  try {
    var callerPtr = arguments.callee.caller;
    
    var name = "(inline)";
    if(callerPtr.caller) {
      var caller = callerPtr.caller.toString();
      var match = caller.match(/^(function\s+){0,1}(\w*)(\([\w,]*\))/);
      name = match ? match[0] : name;
    }
    
    var baseUrl = document.location.origin + document.location.pathname + "#";
    var gid = baseUrl + type + "/" + name;

    return gid;
  } catch (e) {
    return "#xhr";
  }
}

DOMSnitch.Modules.XmlHttpRequest.prototype.handleXhrStateChange = function(event) {
  var xhr = event.target;
  if(xhr.readyState == 4) {
    var xhrData = {
      globalId: xhr.globalId,
      requestBody: xhr.requestBody,
      requestHeaders: xhr.requestHeaders.join("\n"),
      requestMethod: xhr.requestMethod.toUpperCase(),
      requestUrl: xhr.requestUrl.toString(),
      responseBody: xhr.responseText,
      responseHeaders: xhr.getAllResponseHeaders(),
      responseStatus: xhr.status + " " + xhr.statusText
    };
    
    this._htmlElem.setAttribute("xhrData", this._parent.JSON.stringify(xhrData));
    document.dispatchEvent(this._xhrEvt);
  }
}

DOMSnitch.Modules.XmlHttpRequest.prototype.load = function() {
  this.config = this._parent.config;
  
  if(this._loaded) {
    return;
  }
  
  this._overloadMethod("XMLHttpRequest.open", "xhr.open", this._createXhrOpen());
  this._overloadMethod("XMLHttpRequest.send", "xhr.send", this._createXhrSend());
  this._overloadMethod("XMLHttpRequest.setRequestHeader",
    "xhr.requestHeader", this._createXhrSetRequestHeader());
  
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