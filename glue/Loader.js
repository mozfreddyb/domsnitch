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
  this._loadCode("dsloader = eval");
  this._modules = {};
  
  this._extToPageEvt = document.createEvent("Event");
  this._extToPageEvt.initEvent(DOMSnitch.COMM_STR["e-ext2page"], true, true);
  this._htmlElem.addEventListener(DOMSnitch.COMM_STR["e-page2ext"], this._receiveFromPage.bind(this));
  chrome.extension.onRequest.addListener(this._receiveFromExt.bind(this));
  
  this._alive = true;
  this._pingPongTimer = window.setInterval(this._pingPong.bind(this), 15000);
}

DOMSnitch.Loader.prototype = {
  get modules() {
    return this._modules;
  },
  
  _asyncLoad: function() {
    for(moduleName in this._modules) {
      var module = this._modules[moduleName];
      if(module.needsDOMTree && !module.loaded) {
        this._loadCode(module.code);
        this._loadCode("snitch.modules[" + moduleName + "] = new DOMSnitch.Modules." + moduleName);
        this._loadCode("snitch.modules[" + moduleName + "].load()");
      }
    }
  },
  
  _loadCode: function(jscode) {
    if(document.body) {
      this._runCodeThroughNewElement(jscode);
    } else {
      this._runCodeThroughRootElement(jscode);
    }
  },
  
  _pingPong: function() {
    if(this._alive) {
      this._alive = false;
      var callback = function(pingPong) {
        this._alive = pingPong;
      }
      
      try {
        chrome.extension.sendRequest({type: "pingPong"}, callback.bind(this));
      } catch(e) {
        this._loadCode("snitch.clearConfig()");
        window.clearInterval(this._pingPongTimer);
      }
    } else {
      this._loadCode("snitch.clearConfig()");
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
  
  _runCodeThroughNewElement: function(jscode) {
    var scriptElem = document.createElement("script");
    scriptElem.textContent = "dsloader(" + jscode + ")";
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
  
  load: function(configData) {
    if(!configData.inject) {
      window.clearInterval(this._pingPongTimer);
      return;
    }
    
    this._loadCode("configData = " + configData.data);
    this._modules = configData.modules;
    
    for(moduleName in this._modules) {
      var module = this._modules[moduleName];
      if(!module.needsDOMTree || document.body) {
        this._loadCode(module.code);
        module.loaded = true;
      }
    }
    
    this._loadCode("snitch = new DOMSnitch(configData)");
    //document.addEventListener("DOMContentLoaded", this._asyncLoad.bind(this));
  },
  
  loadModule: function(moduleName, moduleSource, needsDOMTree) {
    this._modules[moduleName] = {src: moduleSource, needsDOMTree: needsDOMTree, loaded: false};
  }  
}

loader= new DOMSnitch.Loader();
loader.loadModule("DOMSnitch", "glue/DOMSnitch.js", false);
loader.loadModule("DOMSnitch.Modules.Base", "modules/Base.js", false);
loader.loadModule("DOMSnitch.Modules.Document", "modules/Document.js", false);
loader.loadModule("DOMSnitch.Modules.Window", "modules/Window.js", false);
loader.loadModule("DOMSnitch.Modules.Storage", "modules/Storage.js", false);
loader.loadModule("DOMSnitch.Modules.XmlHttpRequest", "modules/XmlHttpRequest.js", false);
loader.loadModule("DOMSnitch.Modules.Html", "modules/Html.js", true);

chrome.extension.sendRequest(
  {type: "config", modules: loader.modules}, loader.load.bind(loader));

//Blocking for 500ms. This is dirty, but there isn't a clean way to block 
//rendering in Chrome until the extension has been queried.
var now = new Date;
while(new Date - now < 1000);