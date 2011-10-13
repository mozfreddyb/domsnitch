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

DOMSnitch.UI.ConfigManager = function(parent) {
  this._parent = parent;
  this._defaultMode = undefined;
}

DOMSnitch.UI.ConfigManager.prototype = {
  get defaultMode() {
    return this._defaultMode;
  },
  
  set defaultMode(value) {
    this._defaultMode = value;
  },
  
  _getConfigData: function() {
    // Attempt 1: Get stored config data
    var configData = window.localStorage["ds-config-data"];
    if(configData) {
      try {
        JSON.parse(configData);
        return configData;
      } catch (e) {
        delete window.localStorage["ds-config-data"];
      }
    }
    
    // Attempt 2: Get config data from a file
    var url = window.localStorage["ds-config-url"];
    if(!url || url.length == 0) {
      url = chrome.extension.getURL("/ui/config/defaultConfig.json");
    }
    
    var xhr = new XMLHttpRequest;
    xhr.open("GET", url, false);
    xhr.send();
    
    
    var config = null;
    try {
      config = xhr.responseText.replace(/\n/g, "");
      config = JSON.parse(config.replace(/\/\*.*\*\//, ""));
    } catch (e) {
      window.alert("The specified configuration is malformed. Reverting to the default configuration.");
      window.localStorage["ds-config-url"] = "";
      config = this._getConfigData();
    }
    
    return config;
  },
  
  _isTypeInScope: function(type) {
    console.debug(type);
    var selected = JSON.parse(window.localStorage["ds-opt-config"]);
    
    var inScope = selected[type];
    if(inScope == undefined) {
      selected[type] = 0;
      window.localStorage["ds-opt-config"] = JSON.stringify(selected);
    }
    
    return !!inScope;
  },
  
  _isUrlInScope: function(url) {
    var scope = JSON.parse(window.localStorage["ds-scope"]);
    
    if(scope.length == 0) {
      return true;
    }
    
    for(var i = 0; i < scope.length; i++) {
      var regexStr = scope[i];
      regexStr = regexStr.replace(/\\/g, "\\\\");
      regexStr = regexStr.replace(/\*/g, "[\\w\\.-]*");
      var regex = new RegExp("^https{0,1}://" + regexStr + "/", "i");
      if(regex.test(url)) {
        return true;
      }
    }
    
    return false;
  },
  
  applyConfig: function(config) {
    if(!config) {
      config = this._getConfigData();
    }
    
    if(config.heuristics) {
      // Set the list of available heuristics and indicate the heuristics that
      // have been applied.
      var availHeuristics = {};
      
      for(var i = 0; i < config.heuristics.length; i++) {
        var heuristic = config.heuristics[i];
        availHeuristics[heuristic] = 1;
      }
      
      window.localStorage["ds-opt-config"] = JSON.stringify(availHeuristics);
    }
    
    if(config.ignoreRules) {
      // Set the ignore rules that need to be enabled.
      window.localStorage["ds-ignoreRules"] = JSON.stringify(config.ignoreRules);
    }
    
    if(config.safeOrigins) {
      // Set the list of safe origins.
      window.localStorage["ds-origins"] = JSON.stringify(config.safeOrigins);
    }
    
    if(config.scope) {
      // Define the scope for testing.
      window.localStorage["ds-scope"] = JSON.stringify(config.scope);
    }
    
    if(config.components) {
      this._defaultMode = 0;
      for(var i = 0; i < config.components.length; i++) {
        var component = config.components[i]
        if(component == "DOMSnitch") {
          this._defaultMode += DOMSnitch.UI.TabManager.MODES.Passive;
        }
      }
      console.debug('called config.components');
    }
  },
  
  isInScope: function(url, type, ignoreType) {
    return this._isUrlInScope(url) && (ignoreType || this._isTypeInScope(type));
  },
  
  setConfigUrl: function(configUrl) {
    window.localStorage["ds-config-url"] = configUrl;
  }
}