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

DOMSnitch = function(configData) {
  this.MAX_SIZE = 80 * 1024; // 80Kb
  this._json = window.JSON;
  
  this._pageToExtEvt = document.createEvent("Event");
  this._pageToExtEvt.initEvent(DOMSnitch.COMM_STR["e-page2ext"], true, true);
  
  this._htmlElem = document.childNodes[document.childNodes.length - 1];
  this._htmlElem.addEventListener(
      DOMSnitch.COMM_STR["e-ext2page"],
      this._receiveFromExt.bind(this)
    );
  
  this._modules = {};
  for(moduleName in DOMSnitch.Modules) {
    if(moduleName == "Base") {
      continue;
    }
    this._modules[moduleName] = new DOMSnitch.Modules[moduleName](this);
  }
  
  this._loadModules();  
}

DOMSnitch.prototype = {
  get config() {
    return this._hooks;
  },
  
  get JSON() {
    return this._json;
  },
  
  get modules() {
    return this._modules;
  },

  _applyConfig: function(configData) {
    var listener = this.recordCapture.bind(this);
    var interceptor = this.showPrompt.bind(this);
    this._hooks = {};
    
    for(entry in configData) {
      var handler = configData[entry] ? interceptor : listener;
      this._hooks[entry] = handler;
    }
    
    this._loadModules();
  },
  
  _loadModules: function() {
    for(module in this._modules) {
      this._modules[module].load();
    }
  },
  
  _receiveFromExt: function() {
    var msgStr = this._htmlElem.getAttribute(DOMSnitch.COMM_STR["d-ext2page"]);
    this._htmlElem.removeAttribute(DOMSnitch.COMM_STR["d-ext2page"]);

    if(!msgStr || msgStr == "") {
      return;
    }
      
    var msgObj = this._json.parse(msgStr);
    if(msgObj.type == "config") {
      this._applyConfig(msgObj.data);
    }      
  },
  
  _sendToExt: function(obj) {
    try {
      var msgStr = this._json.stringify(obj);
      this._htmlElem.setAttribute(DOMSnitch.COMM_STR["d-page2ext"], msgStr);
      this._htmlElem.dispatchEvent(this._pageToExtEvt);
    } catch(e) {}
  },

  clearConfig: function() {
    this._hooks = {};
    
    for(module in this._modules) {
      this._modules[module].unload();
    }
  },

  recordCapture: function(stack, trace, data, type, gid) {
    var caller = stack.caller;
    var documentModule = this._modules["Document"];
    var cookie = documentModule ? documentModule.getDocumentCookie() : document.cookie;
    var record = {
      documentUrl: document.location.href,
      type: type,
      data: data ? data.toString() : "",
      callStack: [],
      gid: gid,
      env: {
        location: document.location.href,
        referrer: document.referrer,
        cookie: cookie
      }
    };
    
    var traceArray = trace.split("    at ");
    for(var i = 0; i < traceArray.length - 2; i++) {
      // Convert 'arguments' to a proper array
      var args = caller ? [].slice.call(caller.arguments) : [];
      
      for(var j = 0; j < args.length; j++) {
        try {
          if(args[j] && args[j].toString() == "[object Object]") {
            args[j] = this._json.stringify(args[j]);
          }
        } catch (e) {}
      }
          
      var frame = {
        src: traceArray[i+2],
        code: (caller ? caller.toString() : "[not available]"),
        data: (args.length > 0 ? args.join(" | ") : "[not available]")
      };
      
      if(frame.code.length > this.MAX_SIZE) {
        frame.code = "[too long to record and store]";
      }
      
      if(frame.data.length > this.MAX_SIZE) {
        frame.data = "[too long to record and store]";
      }
      
      record.callStack.push(frame);
      caller = caller ? caller.caller : null;
    }

    this._sendToExt({type: "log", record: record});
  },

  showPrompt: function(stack, trace, data, type, gid) {
    var msg = "The following data is about to be used as part of a " + type;
    msg += ". Would you like to modify it?";
    
    data = prompt(msg, data);    
    this.recordCapture(stack, trace, data, type, gid);
    
    return data;
  }
}

DOMSnitch.COMM_STR = {
  "d-page2ext" : "ds-d-page2ext",
  "e-page2ext" : "ds-e-page2ext",
  "d-ext2page" : "ds-d-ext2page",
  "e-ext2page" : "ds-e-ext2page"
}

DOMSnitch.Modules = {};