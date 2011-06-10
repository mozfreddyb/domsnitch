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

DOMSnitch.UI.TabManager = function(parent) {
  this._parent = parent;
  this._activeTabs = {};
  this._currentTab = window.NaN;
  
  chrome.tabs.onSelectionChanged.addListener(this._updateCurrentTab.bind(this));
}

DOMSnitch.UI.TabManager.prototype = {
  _getConfigFlags: function(mode) {
    var configFlags = {};
    var modeFlag = undefined;
    
    switch(mode) {
      case DOMSnitch.UI.TabManager.MODES.Passive:
        modeFlag = false;
        break;
      case DOMSnitch.UI.TabManager.MODES.Invasive:
        modeFlag = true;
        break;
      default:
        modeFlag = undefined;
    }
    
    if(modeFlag != undefined) {
      for(option in this._parent.selectedOptions) {
        configFlags[option] = modeFlag;
      }
    }
    
    return configFlags;
  },
  
  _processNewTab: function(tab) {
    this._currentTab = tab.id;
    this.setMode(tab.id, DOMSnitch.UI.TabManager.MODES.Passive);
    this.refreshConfig();
  },
  
  _updateCurrentTab: function(tabId, selectInfo) {
    this._currentTab = tabId;
  },
  
  getCurrentTab: function() {
    return this._currentTab;
  },
  
  getMode: function(tabId) {
    if(tabId in this._activeTabs) {
      return this._activeTabs[tabId];
    }
    
    return DOMSnitch.UI.TabManager.MODES.Standby;
  },
  
  refreshConfig: function() {
    for(tab in this._activeTabs) {
      var tabId = window.parseInt(tab);
      var configFlags = this._getConfigFlags(this.getMode(tabId));
      chrome.tabs.sendRequest(tabId, {type: "config", data: configFlags});
    }
  },
  
  setMode: function(tabId, mode) {
    if(mode == DOMSnitch.UI.TabManager.MODES.Standby) {
      delete this._activeTabs[tabId];
    } else {
      this._activeTabs[tabId] = mode;
    }
  }
}

DOMSnitch.UI.TabManager.MODES = {
  Standby: 0,
  Passive: 1,
  Invasive: 2
}