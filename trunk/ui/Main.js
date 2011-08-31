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

DOMSnitch.UI.Main = function() {
  this._inject = true;
  this._noInjectList = {};
  this._storage = new DOMSnitch.Storage(this);
  this._tabManager = new DOMSnitch.UI.TabManager(this);
  this._contextMenu = new DOMSnitch.UI.ContextMenu(this);
  this._activityLog = new DOMSnitch.UI.ActivityLog(this);
  this._scanner = new DOMSnitch.Scanner();
  chrome.extension.onRequest.addListener(this._handleConfigRequest.bind(this));
  chrome.extension.onRequest.addListener(this._handleRecordCapture.bind(this));
  chrome.extension.onRequest.addListener(this._handlePingPong.bind(this));
  chrome.tabs.onCreated.addListener(this._handleNewTab.bind(this));
  
  var optionsConfigStr = window.localStorage["ds-opt-config"];
  if(optionsConfigStr && optionsConfigStr.length > 0) {
    this._optionsConfig = JSON.parse(optionsConfigStr);
  } else {
    this._optionsConfig = this.setDefaultOptionsConfig();
  }
  
  var scope = window.localStorage["ds-scope"];
  if(!scope || scope.length == 0) {
    window.localStorage["ds-scope"] = JSON.stringify([]);
  }
  
  var safeOrigins = window.localStorage["ds-origins"];
  if(!safeOrigins || safeOrigins.length == 0) {
    window.localStorage["ds-origins"] = JSON.stringify([]);
  }

}

DOMSnitch.UI.Main.prototype = {
  get selectedOptions() {
    var selectedOptions = {};
    for(option in this._optionsConfig) {
      if(this._optionsConfig[option] == 1) {
        selectedOptions[option] = false;
      }
    }
    
    return selectedOptions;
  },
  
  set selectedOptions(options) {
    this._optionsConfig = options;
    window.localStorage["ds-opt-config"] = JSON.stringify(options);
  },
  
  get storage() {
    return this._storage;
  },
  
  get tabManager() {
    return this._tabManager;
  },
  
  _fetchModule: function(moduleSource) {
    var url = chrome.extension.getURL(moduleSource);
    var xhr = new XMLHttpRequest;
    xhr.open("GET", url, false);
    xhr.send(null);
    
    return window.JSON.stringify(xhr.responseText);
  },
  
  _handleConfigRequest: function(request, sender, sendResponse) {
    if(request.type != "config") {
      return;
    }

    var tabMode = this._tabManager.getMode(sender.tab.id);
    if(tabMode & DOMSnitch.UI.TabManager.MODES.Passive) {
      var configData = this.selectedOptions;
      var modules = request.modules;
      var inject = sender.tab.id in this._noInjectList ? false : this._inject;
      if(!this._inject) {
        this._inject = true;
        this._noInjectList[sender.tab.id] = false;
      }
        
      for(moduleName in modules) {
        var module = modules[moduleName]; 
        module.code = this._fetchModule(module.src);
      }
        
      sendResponse({
        type: "config", 
        data: window.JSON.stringify(configData), 
        modules: modules,
        inject: inject
      });
    } else {
      sendResponse({type: "config", inject: false});
    }
  },
  
  _handleNewTab: function(tab) {
    //TODO(radi): Determine if it's reasonable to enable DOM Snitch by default in
    //newly opened windows
    this._tabManager.setMode(tab.id, DOMSnitch.UI.TabManager.MODES.Passive);
  },
  
  _handleRecordCapture: function(request, sender, sendResponse) {
    if(request.type != "log") {
      return;
    }

    var mode = this._tabManager.getMode(sender.tab.id);
    if(mode == DOMSnitch.UI.TabManager.MODES.Standby) {
      return;
    }
    
    var record = {
      documentUrl: request.record.documentUrl,
      topLevelUrl: sender.tab.url,
      type: request.record.type,
      env: request.record.env,
      data: request.record.data,
      callStack: request.record.callStack,
      gid: request.record.gid,
      scanInfo: request.record.scanInfo
    };
    
          
    if(typeof record.callStack == "string") {
      record.callStack = window.JSON.parse(record.callStack);
    }
    
    for(prop in record) {
      if(!record[prop]) {
        record[prop] = "";
      }
    }
    
    var inScope = record.type in this.selectedOptions;
    
    if(inScope && this._isInScope(sender.tab.url)) {
      record.scanInfo = this._scanner.checkOnCapture(record);
      
      if(record.scanInfo) {
        this._storage.insert(record);
        this._activityLog.displayRecord(record);
      }
    }
  },
  
  _handlePingPong: function(request, sender, sendResponse) {
    if(request.type != "pingPong") {
      return;
    }
    
    sendResponse(DOMSnitch.UI.TabManager.MODES.Standby != this._tabManager.getMode(sender.tab.id));
  },
  
  _isInScope: function(url) {
    var scope = JSON.parse(window.localStorage["ds-scope"]);
    
    if(scope.length == 0) {
      return true;
    }
    
    for(var i = 0; i < scope.length; i++) {
      var regexStr = scope[i];
      regexStr = regexStr.replace(/\\/g, "\\\\");
      regexStr = regexStr.replace(/\*/g, ".*");
      var regex = new RegExp("^" + regexStr + "$", "i");
      if(regex.test(url)) {
        return true;
      }
    }
    
    return false;
  },
  
  setDefaultOptionsConfig: function() {
    var availOptions = {
      "Invalid JSON": 1,
      "Mixed content": 1,
      "Reflected input": 1,
      "Untrusted code": 1,
      "Script Inclusion": 1
    };
    
    window.localStorage["ds-opt-config"] = JSON.stringify(availOptions);
    
    return availOptions;
  },
  
  showActivityLog: function() {
    this._activityLog.hideViewer();
    this._activityLog = new DOMSnitch.UI.ActivityLog(this);
  },
  
  showConfigPage: function() {
    chrome.tabs.create({url: "ui/config/domsnitch.html"});
  },
  
  skipNextInjection: function() {
    this._inject = false;
  }
}