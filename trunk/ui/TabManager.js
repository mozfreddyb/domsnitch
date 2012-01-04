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

DOMSnitch.UI.TabManager = function(parent) {
  this._parent = parent;
  this._activeTabs = {};
  this._currentTab = window.NaN;
  
  chrome.tabs.onSelectionChanged.addListener(this._updateCurrentTab.bind(this));
}

DOMSnitch.UI.TabManager.prototype = {
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
    
    return this._parent.configManager.defaultMode;
  },
  
  hasFlag: function(mode, flag) {
    return mode % flag == 0;
  },
  
  refreshConfig: function() {
    for(var tab in this._activeTabs) {
      var tabId = window.parseInt(tab);
      var tabMode = this.getMode(tabId);

      //TODO(radi): Potentially dead code. Investigate if needed. 
      if(tabMode & DOMSnitch.UI.TabManager.MODES.Passive) {
        var configFlags = {};
        for(var option in this._parent.selectedOptions) {
          configFlags[option] = false;
        }

        chrome.tabs.sendRequest(tabId, {type: "config", data: configFlags});
      }
    }
  },
  
  setMode: function(tabId, mode) {
    if(!(tabId in this._activeTabs)) {
      this._activeTabs[tabId] = DOMSnitch.UI.TabManager.MODES.Unknown;
    }
    
    var currentMode = this._activeTabs[tabId];
    if(mode > 0) {
      this._activeTabs[tabId] = currentMode * mode;
    } else if(currentMode % mode == 0) {
      this._activeTabs[tabId] = currentMode / mode;
    }
  }
}

/** Flags are set as prime numbers. */
DOMSnitch.UI.TabManager.MODES = {
  Unknown: 0,
  Standby: 3,
  Passive: 5
}