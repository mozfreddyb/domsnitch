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

DOMSnitch.Modules.Document = function(parent) {
  this._parent = parent;
  this._targets = {
    "document.write": {
      capture: true,
      funcName: "write", 
      obj: document, 
      origPtr: document.write
    },
    "document.writeln": {
      obj: document, 
      funcName: "writeln", 
      origPtr: document.writeln,
      capture: true
    },
    "document.createElement": {
      obj: document, 
      funcName: "createElement", 
      origPtr: document.createElement
    },
    "document.cookie": {
      obj: document, 
      propName: "cookie", 
      origVal: document.cookie
    },
    "document.domain": {
      obj: document, 
      propName: "domain", 
      origVal: document.domain
    }
  };
  
  this._loaded = false;
}

DOMSnitch.Modules.Document.prototype = new DOMSnitch.Modules.Base;

DOMSnitch.Modules.Document.prototype._createElement = function() {
  var target = this._targets["document.createElement"];
  var htmlModule = this._parent.modules["Html"];
  var elem = target.origPtr.apply(target.obj, arguments);

  htmlModule.interceptElement(elem);
  
  return elem;
}

DOMSnitch.Modules.Document.prototype.generateGlobalId = function(type) {
  // Generate unique, yet reproducible global ID
  var caller = arguments.callee.caller.caller.toString();
  var token = caller.length > 50 ? caller.substring(0, 50) : caller;
  
  var baseUrl = document.location.origin + document.location.pathname + "#";
  var gid = baseUrl + type + "/" + token.replace(/\s/gg, "") + "-" + caller.length;

  return gid;
}

DOMSnitch.Modules.Document.prototype.getDocumentCookie = function() {
  return this._targets["document.cookie"].origVal;
}

DOMSnitch.Modules.Document.prototype.load = function() {
  this.config = this._parent.config;
  
  if(this._loaded) {
    this.unload();
  }
  
  if(this.config["doc.write"]) {
    this._overloadMethod("document.write", "doc.write");
    this._overloadMethod("document.writeln", "doc.write");
  }
  
  if(this.config["innerHTML"]) {
    var htmlModule = this._parent.modules["Html"];
    if(htmlModule) {
      this._overloadMethod("document.createElement", "innerHTML", this._createElement.bind(this));
    }
  }
  
  if(this.config["doc.cookie"]) {
    this._overloadProperty("document.cookie", "doc.cookie");
  }
  
  if(this.config["doc.domain"]) {
    this._overloadProperty("document.domain", "doc.domain");
  }
  
  this._loaded = true;
}

DOMSnitch.Modules.Document.prototype.unload = function() {
  for(entryName in this._targets) {
    var entry = this._targets[entryName];
    if(entry.funcName) {
      entry.obj[entry.funcName] = entry.origPtr;
    }
  }
  
  this._loaded = false;
}