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

DOMSnitch.Loader = function() {
  this._htmlElem = document.childNodes[document.childNodes.length - 1];
  this._modules = {};
  
  this._extToPageEvt = document.createEvent("Event");
  this._extToPageEvt.initEvent(DOMSnitch.COMM_STR["e-ext2page"], true, true);
  this._htmlElem.addEventListener(DOMSnitch.COMM_STR["e-page2ext"], this._receiveFromPage.bind(this));
  chrome.extension.onRequest.addListener(this._receiveFromExt.bind(this));
  
  var dsloader = function() {
    var htmlElem = document.childNodes[document.childNodes.length - 1];
    htmlElem.addEventListener(
      "dsloader",
      function() {
        var htmlElem = document.childNodes[document.childNodes.length - 1];
        var code = JSON.parse(htmlElem.getAttribute("dscode"));

        eval(code);

        htmlElem.removeAttribute("dscode");
      }
    );
  };
  
  this._runCodeThroughRootElement("dsloader = " + dsloader.toString());
  this._runCodeThroughRootElement("dsloader()");
}

DOMSnitch.Loader.prototype = {
  _asyncLoad: function(jscode) {
    this._runCodeThroughNewElement(jscode);
    this._runCodeThroughNewElement("snitch = new DOMSnitch({})");
  },
  
  _loadCode: function(jscode) {
    if(document.body) {
      this._runCodeThroughNewElement(jscode);
    } else {
      this._runCodeThroughEvent(jscode);
    }
  },

  _receiveFromExt: function(request, sender, sendResponse) {
    this._alive = request.type == "config" ? true : this._alive;
    this._sendToPage(request);
  },
  
  _receiveFromPage: function() {
    var objAsStr = this._htmlElem.getAttribute(DOMSnitch.COMM_STR["d-page2ext"]);

    if(!objAsStr || objAsStr == "") {
      return;
    }
    
    var obj = window.JSON.parse(objAsStr);
    if(obj.type == "log") {
      this._sendToExt(obj);
    }
    
    this._htmlElem.removeAttribute(DOMSnitch.COMM_STR["d-page2ext"]);
  },
  
  _runCodeThroughEvent: function(jscode) {
    this._htmlElem.setAttribute("dscode", JSON.stringify(jscode));
    var event = document.createEvent("Event");
    event.initEvent("dsloader", true, true);
    this._htmlElem.dispatchEvent(event);
  },
  
  _runCodeThroughNewElement: function(jscode) {
    var scriptElem = document.createElement("script");
    scriptElem.textContent = jscode;
    document.body.appendChild(scriptElem);
    document.body.removeChild(scriptElem);
  },
  
  _runCodeThroughRootElement: function(jscode) {
    this._htmlElem.setAttribute("oncut", "(function(){eval(" + jscode + ")}).call()");
    this._htmlElem.oncut();
    this._htmlElem.removeAttribute("oncut");
  },
  
  _sendToExt: function(obj) {
    chrome.extension.sendRequest(obj);
  },
  
  _sendToPage: function(obj) {
    try {
      var objAsStr = window.JSON.stringify(obj);
      this._htmlElem.setAttribute(DOMSnitch.COMM_STR["d-ext2page"], objAsStr);
      this._htmlElem.dispatchEvent(this._extToPageEvt);
    } catch (e) {
      console.error("DOM Snitch: " + e.toString());
    }
  },
  
  load: function() {
    this._loadCode("snitch = new DOMSnitch({})");
  },
  
  loadModule: function(moduleName, moduleSource, needsDOM) {
    if(window.DIR_PATH) {
      moduleSource = window.DIR_PATH + moduleSource;
    }
    var xhr = new XMLHttpRequest;
    var moduleUrl = chrome.extension.getURL(moduleSource)
    xhr.open("GET", moduleUrl, false);
    xhr.send();

    var jscode = xhr.responseText;
    if(needsDOM) {
      document.addEventListener(
        "DOMContentLoaded",this._asyncLoad.bind(this, jscode), true);
    } else {
      this._loadCode(jscode);
    }
  }
}

loader= new DOMSnitch.Loader();
loader.loadModule("DOMSnitch", "glue/DOMSnitch.js", false);
loader.loadModule("DOMSnitch.Modules.Base", "modules/Base.js", false);
loader.loadModule("DOMSnitch.Modules.Document", "modules/Document.js", false);
loader.loadModule("DOMSnitch.Modules.Window", "modules/Window.js", false);
loader.loadModule("DOMSnitch.Modules.XmlHttpRequest", "modules/XmlHttpRequest.js", false);
loader.load();