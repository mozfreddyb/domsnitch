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
  chrome.extension.onRequest.addListener(this._handleConfigRequest.bind(this));
  chrome.extension.onRequest.addListener(this._handleRecordCapture.bind(this));
  chrome.extension.onRequest.addListener(this._handlePingPong.bind(this));
  chrome.tabs.onCreated.addListener(this._handleNewTab.bind(this));
}

DOMSnitch.UI.Main.prototype = {
  get selectedOptions() {
    return this._contextMenu.selectedOptions;
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

    var configData = this._contextMenu.selectedOptions;
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
  },
  
  _handleNewTab: function(tab) {
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
      visible: 1
    };
    
          
    if(typeof record.callStack == "string") {
      record.callStack = window.JSON.parse(record.callStack);
    }
    
    for(prop in record) {
      if(!record[prop]) {
        record[prop] = "";
      }
    }
    
    this._storage.insert(record);
    this._activityLog.displayRecord(record);
  },
  
  _handlePingPong: function(request, sender, sendResponse) {
    if(request.type != "pingPong") {
      return;
    }
    
    sendResponse(DOMSnitch.UI.TabManager.MODES.Standby != this._tabManager.getMode(sender.tab.id));
  },
  
  showActivityLog: function() {
    this._activityLog.hideViewer();
    this._activityLog = new DOMSnitch.UI.ActivityLog(this);
  },
  
  skipNextInjection: function() {
    this._inject = false;
  }
}