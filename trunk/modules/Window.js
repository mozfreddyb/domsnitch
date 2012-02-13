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

DOMSnitch.Modules.Window = function(parent) {
  this._parent = parent;
  this._targets = {
    "window.eval": {
      capture: true,
      funcName: "eval", 
      obj: window, 
      origPtr: window.eval
    }
  };
  
  this._loaded = false;
  
  this.htmlElem = document.documentElement;
  this.evalEvt = document.createEvent("Event");
  this.evalEvt.initEvent("Eval", true, true);
}

DOMSnitch.Modules.Window.prototype = new DOMSnitch.Modules.Base;

DOMSnitch.Modules.Window.prototype._createEval = function() {
  var module = this;
  var target = this._targets["window.eval"];
  var type = "win.eval";
  return function() {
    module.htmlElem.setAttribute("evalArgs", module._parent.JSON.stringify(arguments));
    module.htmlElem.setAttribute("evalGid", module.generateGlobalId(type));
    document.dispatchEvent(module.evalEvt);
    return target.origPtr.apply(this, arguments);
  };
}

DOMSnitch.Modules.Window.prototype.generateGlobalId = function(type) {
  // Generate unique, yet reproducible global ID
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
}

DOMSnitch.Modules.Window.prototype.load = function() {
  this.config = this._parent.config;
  
  if(this._loaded) {
    return;
  }

  //this._overloadMethod("window.eval", "win.eval", this._createEval());
  this._loaded = true;
}

DOMSnitch.Modules.Window.prototype.unload = function() {
  for(entryName in this._targets) {
    var entry = this._targets[entryName];
    if(entry.funcName) {
      entry.obj[entry.funcName] = entry.origPtr;
    }
  }
  
  this._loaded = false;
}