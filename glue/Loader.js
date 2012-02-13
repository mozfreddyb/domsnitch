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

window.DIR_PATH = "";
window.USE_DEBUG = true;

DOMSnitch.Loader = function() {
  this._modules = {};
  this._codeBuff = [];
}

DOMSnitch.Loader.prototype = {
  _loadCode: function(jscode) {
    this._codeBuff.push(jscode);
    if(document.documentElement) {
      var scriptElem = document.createElement("script");
      scriptElem.textContent = this._codeBuff.join("\n");
      this._codeBuff = [];
      document.documentElement.appendChild(scriptElem);
      document.documentElement.removeChild(scriptElem);
    } else {
      window.setTimeout(this._loadCode.bind(this, ""), 100);
    }
  },
  
  load: function() {
    this._loadCode("if(!window.snitch) { snitch = new DOMSnitch({})} else { snitch.loadModules()}");
  },
  
  loadModule: function(moduleName, moduleSource) {
    if(window.DIR_PATH) {
      moduleSource = window.DIR_PATH + moduleSource;
    }
    var xhr = new XMLHttpRequest;
    var moduleUrl = chrome.extension.getURL(moduleSource)
    xhr.open("GET", moduleUrl, false);
    xhr.send();

    var jscode = xhr.responseText;
    this._loadCode(jscode);
  }
}