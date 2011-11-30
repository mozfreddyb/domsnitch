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
  this._availModes = [
    {flag: DOMSnitch.UI.TabManager.MODES.Passive, title: "Run DOM Snitch"}
  ];
  this._modeMap = {};
  
  this._build();
  
  chrome.tabs.onSelectionChanged.addListener(this.updateMenuForTab.bind(this));
}

DOMSnitch.UI.ContextMenu.prototype = {
  _build: function() {
    for(var i = 0; i < this._availModes.length; i++) {
      this._buildModes(this._availModes[i]);
    }
    
    chrome.contextMenus.create({type: "separator"});

    chrome.contextMenus.create({
      title: "Show the Activity Log",
      onclick: this._showActivityLog.bind(this)
    });

    chrome.contextMenus.create({
      title: "Configure...",
      onclick: this._showConfigPage.bind(this)
    });
  },
  
  _buildModes: function(mode) {
    var modeItemId = chrome.contextMenus.create({
      type: "checkbox",
      title: mode.title,
      onclick: this._setMode.bind(this)
    });
    
    this._modeMap[modeItemId] = mode.flag;
  },
  
  _setMode: function(info, tab) {
    var mode = this._modeMap[info.menuItemId];
    this._parent.tabManager.setMode(tab.id, info.checked ? mode : mode * -1);
    this._parent.tabManager.refreshConfig();

    this._parent.configManager.defaultMode = undefined;
  },
  
  _showActivityLog: function(info, tab) {
    this._parent.showActivityLog();
  },
  
  _showConfigPage: function(info, tab) {
    this._parent.showConfigPage();
  },
  
  updateMenuForTab: function(tabId, selectInfo) {
    var mode = this._parent.tabManager.getMode(tabId);
    
    for(var menuItem in this._modeMap) {
      var checked = (mode & this._modeMap[menuItem]) > 0;
      chrome.contextMenus.update(window.parseInt(menuItem), {checked: checked});
    }
  }
}