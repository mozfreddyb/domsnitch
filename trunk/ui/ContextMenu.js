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

DOMSnitch.UI.ContextMenu = function(parent) {
  this._parent = parent;
  this._availOptions = [
    "anchor.href",
    "doc.write",
    "doc.cookie",
    "doc.domain",
    "event/all",
    "event/message",
    "iframe.src",
    "innerHTML",
    "localStorage",
    "script.src",
    "sessionStorage",
    "win.eval",
    "win.location",
    "win.setTimeout",
    "win.setInterval",
    "xhr.open",
    "xhr.send",
    "xhr.recv",
    "xhr.requestHeader"
  ];
  this._defaultOptions = [
    "doc.write",
    "doc.domain",
    "event/message",
    "innerHTML",
    "script.src",
    "win.eval"
  ];
  this._selectedOptions = {};
  this._moduleMap = {};
  
  this._availModes = [
    {flag: DOMSnitch.UI.TabManager.MODES.Passive, title: "Passive Mode"},
    {flag: DOMSnitch.UI.TabManager.MODES.Invasive, title: "Invasive Mode"},
    {flag: DOMSnitch.UI.TabManager.MODES.Standby, title: "Standby"}
  ];
  this._modeMap = {};
  
  this._build();
  
  chrome.tabs.onSelectionChanged.addListener(this._updateMenuForTab.bind(this));
}

DOMSnitch.UI.ContextMenu.prototype = {
  get selectedOptions() {
    return this._selectedOptions;
  },
  
  _build: function() {
    for(var i = 0; i < this._availModes.length; i++) {
      this._buildModes(this._availModes[i], i == 0);
    }
    
    chrome.contextMenus.create({type: "separator"});

    this._buildModules();
    
    chrome.contextMenus.create({type: "separator"});
    
    chrome.contextMenus.create({
      title: "Show the Activity Log",
      onclick: this._showActivityLog.bind(this)
    });
  },
  
  _buildModes: function(mode, selected) {
    var modeItemId = chrome.contextMenus.create({
      type: "radio",
      title: mode.title,
      checked: selected,
      onclick: this._setMode.bind(this)
    });
    
    this._modeMap[modeItemId] = mode.flag;
  },
  
  _buildModules: function() {
    var modulesMenu = chrome.contextMenus.create({type: "normal", title: "Modules"});
    chrome.contextMenus.create({
      type: "normal",
      title: "Enable all",
      onclick: this._createToggleAllModules(true).bind(this),
      parentId: modulesMenu
    });
    
    chrome.contextMenus.create({
      type: "normal",
      title: "Enable default",
      onclick: this._createToggleDefaultModules().bind(this),
      parentId: modulesMenu
    });
    
    chrome.contextMenus.create({
      type: "normal",
      title: "Disable all",
      onclick: this._createToggleAllModules(false).bind(this),
      parentId: modulesMenu
    });
    chrome.contextMenus.create({type: "separator", parentId: modulesMenu});
    
    for(var i = 0; i < this._availOptions.length; i++) {
      var moduleItemId = chrome.contextMenus.create({
        type: "checkbox",
        title: this._availOptions[i],
        checked: false,
        onclick: this._createToggleModule(this._availOptions[i]).bind(this),
        parentId: modulesMenu
      });
      
      this._moduleMap[this._availOptions[i]] = moduleItemId;
    }
  },
  
  _createToggleAllModules: function(flag) {
    return function(info, tab) {
      this._selectedOptions = {};
      
      for(var i = 0; i < this._availOptions.length; i++) {
        if(flag) {
          this._selectedOptions[this._availOptions[i]] = false;
        }
        
        var menuItemId = window.parseInt(this._moduleMap[this._availOptions[i]]);
        chrome.contextMenus.update(menuItemId, {checked: flag});
      }
      
      this._parent.tabManager.refreshConfig();
    };
  },
  
  _createToggleDefaultModules: function() {
    return function(info, tab) {
      this._selectedOptions = {};
      
      for(var i = 0; i < this._defaultOptions.length; i++) {
        this._selectedOptions[this._defaultOptions[i]] = false;
        
        var menuItemId = window.parseInt(this._moduleMap[this._defaultOptions[i]]);
        chrome.contextMenus.update(menuItemId, {checked: true});
      }
      
      this._parent.tabManager.refreshConfig();
    };
  },
  
  _createToggleModule: function(moduleId) {
    return function(info, tab) {
      if(info.checked) {
        this._selectedOptions[moduleId] = false;
      } else {
        delete this._selectedOptions[moduleId];
      }
      
      this._parent.tabManager.refreshConfig();
    };
  },
  
  _setMode: function(info, tab) {
    var mode = this._modeMap[info.menuItemId];
    this._parent.tabManager.setMode(tab.id, mode);
    this._parent.tabManager.refreshConfig();
  },
  
  _showActivityLog: function(info, tab) {
    this._parent.showActivityLog();
  },
  
  _updateMenuForTab: function(tabId, selectInfo) {
    var mode = this._parent.tabManager.getMode(tabId);
    var selectedMenuItem = -1;
    
    for(menuItem in this._modeMap) {
      if(mode == this._modeMap[menuItem]) {
        selectedMenuItem = window.parseInt(menuItem);
      }
      
      chrome.contextMenus.update(window.parseInt(menuItem), {checked: false});
    }

    chrome.contextMenus.update(selectedMenuItem, {checked: true});
  }
}
