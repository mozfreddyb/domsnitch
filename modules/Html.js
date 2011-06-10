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

DOMSnitch.Modules.Html = function(parent) {
  this._parent = parent;
  this._loaded = false;
}

DOMSnitch.Modules.Html.prototype = new DOMSnitch.Modules.Base;

DOMSnitch.Modules.Html.prototype._createAddEventListener = function(module, target) {
  return function(eventType, eventListener, useCapture) {
    target.origPtr.call(target.obj, eventType, module.captureEvents.bind(module, target.obj), false);
    target.origPtr.call(target.obj, eventType, eventListener, useCapture);
  };
}

DOMSnitch.Modules.Html.prototype._createAppendChild = function(module, target) {
  return function(child) {
    module.interceptAttributes(child);
    return target.origPtr.call(target.obj, child);
  };
}

DOMSnitch.Modules.Html.prototype._createInnerHtmlGet = function() {
  return function() {
    var innerHtml = "";
    for(var i = 0; i < this.childNodes.length; i++) {
      var node = this.childNodes[i];
      innerHtml += node.outerHTML ? node.outerHTML : node.textContent;
    }
    
    return innerHtml;
  };
}

DOMSnitch.Modules.Html.prototype._createInnerHtmlSet = function(module) {
  return function(data) {
    var type = "innerHTML";
    var handler = module.config[type];
    if(handler) {
      var trace = "";
      try {
        module.dummyFunctionThatDoesNotExist();
      } catch(e) {
        trace = e.stack.toString();
      }
      
      var modifiedData = handler(arguments.callee, trace, data, type, this.gid);
      data = modifiedData ? modifiedData : data;
    }
    
    var newElem = document.createElement("div");
    this.textContent = "";
    this.targets["appendChild"].origPtr.call(this, newElem);
    newElem.outerHTML = data;
    
    for(var i = 0; i < this.children.length; i++) {
      module.interceptElement(this.children.item(i));
    }
    
    return data;
  };
}

DOMSnitch.Modules.Html.prototype._createPropertyGet = function(module, type, target) {
  return function() {
    var data = this.getAttribute(target.propName);
    if(target.isUrl) {
      return module.formatUrl(data);
    } else {
      return data;
    }
  };
}

DOMSnitch.Modules.Html.prototype._createPropertySet = function(module, type, target, callback) {
  return function(data) {
    var handler = module.config[type];
    if(handler) {
      var trace = "";
      try {
        module.dummyFunctionThatDoesNotExist();
      } catch(e) {
        trace = e.stack.toString();
      }
      
      var modifiedData = handler(arguments.callee, trace, data, type, this.gid);
      data = modifiedData ? modifiedData : data;
    }
    
    return this.setAttribute(target.propName, data);
  };
}

DOMSnitch.Modules.Html.prototype.captureEvents = function(elem, event) {
  var type = "event/all";
  var handler = this.config[type];
  
  if(handler) {
    var trace = "";
    try {
      this.dummyFunctionThatDoesNotExist();
    } catch(e) {
      trace = e.stack.toString();
    }
    
    var gid = elem.gid + "/" + event.type;
    handler(arguments.callee, trace, this.stringifyEvent(event), "event/" + event.type, gid);
  }
}

DOMSnitch.Modules.Html.prototype.formatUrl = function(url) {
  if(!url) {
    return "";
  }
  
  if(/[\w-]+:(\/)*[\w-]+/.test(url)) {
    return url;
  }
  
  if(url.indexOf("//") == 0) {
    return window.location.protocol + url;
  }
  
  if(url.indexOf("/") == 0) {
    return window.location.origin + "/" + url;
  }
  
  var idx = window.location.pathname.lastIndexOf("/");
  var path = window.location.pathname.substring(0, idx);
  
  return window.location.origin + path + (path.length > 0 ? "/" : "") + url;
}

DOMSnitch.Modules.Html.prototype.interceptAttributes = function(elem) {
  elem.gid = this.generateGlobalId(elem);
  elem.targets = {
    "href": {obj: elem, propName: "href", isUrl: true},
    "innerHTML": {obj: elem, propName: "innerHTML", isUrl: false},
    "src": {obj: elem, propName: "src", isUrl: true},
    "appendChild": {
      obj: elem, 
      funcName: "appendChild", 
      origPtr: elem.appendChild, 
      capture: false
    },
    "addEventListener": {
      obj: elem, 
      funcName: "addEventListener", 
      origPtr: elem.addEventListener, 
      capture: false
    }
  };
  
  if(elem instanceof HTMLIFrameElement) {
    this._overloadProperty(elem.targets["src"], "iframe.src");
  } else if(elem instanceof HTMLScriptElement) {
    this._overloadProperty(elem.targets["src"], "script.src");
  } else if(elem instanceof HTMLAnchorElement) {
    this._overloadProperty(elem.targets["href"], "anchor.href");
  }  
  this._overloadProperty(
    elem.targets["innerHTML"], 
    "innerHTML", 
    this._createInnerHtmlGet(), 
    this._createInnerHtmlSet(this)
  );
  this._overloadMethod(
    elem.targets["addEventListener"], 
    "event/all", 
    this._createAddEventListener(this, elem.targets["addEventListener"])
  );

  this._overloadMethod(
    elem.targets["appendChild"], 
    "innerHTML", 
    this._createAppendChild(this, elem.targets["appendChild"])
  );
}

DOMSnitch.Modules.Html.prototype.interceptDocument = function() {
  if(document.body && !this._loaded) {
    var htmlDocument = document.childNodes[document.childNodes.length - 1];
    this.interceptElement(htmlDocument);
  }
}

DOMSnitch.Modules.Html.prototype.interceptElement = function(elem) {
  this.interceptAttributes(elem);
  for(var i = 0; elem.children && i < elem.children.length; i++) {
    this.interceptElement(elem.children.item(i));
  }
}

DOMSnitch.Modules.Html.prototype.generateGlobalId = function(elem) {
  var baseUrl = document.location.origin + document.location.pathname + "#"; 
  var gid = elem.id;
  if(gid && gid.length > 0) {
    return baseUrl + gid;
  }
  
  gid = elem.parentElement ? elem.parentElement.gid : "";
  if(!gid || gid.length == 0) {
    gid = baseUrl;
  }
  
  if(elem.className && elem.className.length) {
    return gid + elem.className;
  }
  
  return gid + elem.nodeName;
}

DOMSnitch.Modules.Html.prototype.load = function() {
  this.config = this._parent.config;
  
  if(document.readyState == "complete") {
    this.interceptDocument();
  } else {
    window.addEventListener("load", this.interceptDocument.bind(this), true);
  }
}

DOMSnitch.Modules.Html.prototype.stringifyEvent = function(event) {
  var propStorage = {};
  
  for(prop in event) {
    if(event[prop] && typeof event[prop] != "function") {
      propStorage[prop] = event[prop].toString();
    }
  }
  
  return this._parent.JSON.stringify(propStorage);
}

DOMSnitch.Modules.Html.prototype.unload = function() {
  //TODO
}