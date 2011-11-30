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
  this._appName = "DOM Snitch";
  this._configManager = new DOMSnitch.UI.ConfigManager(this);
  this._checkVersion();

  this._registeredHeuristics = [];
  this._storage = new DOMSnitch.Storage(this);
  this._tabManager = new DOMSnitch.UI.TabManager(this);
  this._contextMenu = new DOMSnitch.UI.ContextMenu(this);
  this._activityLog = new DOMSnitch.UI.ActivityLog(this);
  this._scanner = new DOMSnitch.Scanner();
  chrome.extension.onRequest.addListener(this._handleRecordCapture.bind(this));
  chrome.tabs.onUpdated.addListener(this._handleUpdatedTab.bind(this));
  
  this._configManager.applyConfig();
}

DOMSnitch.UI.Main.prototype = {
  get activityLog() {
    return this._activityLog;
  },
  
  get appName() {
    return this._appName;
  },
  
  get configManager() {
    return this._configManager;
  },
  
  get registeredHeuristics() {
    return this._registeredHeuristics;
  },

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
  
  _checkVersion: function() {
    var version = window.localStorage["version"];
    
    var xhr = new XMLHttpRequest;
    xhr.open("GET", "manifest.json", false);
    xhr.send();
    
    var manifestFile = xhr.responseText.split("\n");
    for(var i = 0; i < manifestFile.length; i++) {
      if(manifestFile[i].trim().match(/^(\/\/|\*|\/\*)/)) {
        manifestFile.splice(i, 1);
        i--;
      }
    }
    
    var manifest = JSON.parse(manifestFile.join(""));
    if(version != manifest.version) {
      window.localStorage["ds-config-enable"] = true;
      this.configManager.applyConfig();
      window.localStorage["version"] = manifest.version;
    }
    
    this._appName = manifest.name;
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
    
    for(var prop in record) {
      if(!record[prop]) {
        record[prop] = "";
      }
    }
    
    if(this._configManager.isInScope(sender.tab.url, record.type, false)) {
      record.scanInfo = this._scanner.checkOnCapture(record);
      
      if(record.scanInfo) {
        this._storage.insert(record);
        this._activityLog.displayRecord(record);
      }
    }
  },
  
  _handleUpdatedTab: function(tabId, selectInfo) {
    if(this._configManager.defaultMode != undefined) {
      this._tabManager.setMode(tabId, this._configManager.defaultMode);
      this._contextMenu.updateMenuForTab(tabId, selectInfo);
    }
  },
  
  showActivityLog: function() {
    this._activityLog.hideViewer();
    this._activityLog = new DOMSnitch.UI.ActivityLog(this);
  },
  
  showConfigPage: function() {
    chrome.tabs.create({url: "ui/config/config.html"});
  }
}