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

DOMSnitch.UI.Config.BasicsPage = function(parent) {
  this._title = "Basics";
  this._parent = parent;
}

DOMSnitch.UI.Config.BasicsPage.prototype = new DOMSnitch.UI.Config.Page;

DOMSnitch.UI.Config.BasicsPage.prototype._buildUpdates = function(document) {
  var parent = this._parent;
  var enableConf = function() {
    var confEnable = document.getElementById("conf-enable");
    window.localStorage["ds-config-enable"] = confEnable.checked;
  };
  
  var getConf = function() {
    var configUrl = window.localStorage["ds-config-url"];
    return configUrl ? configUrl : "";
  };
  
  var saveConf = function() {
    var confUrl = document.getElementById("conf-url");
    window.localStorage["ds-config-url"] = confUrl.value;

    var backgroundPage = chrome.extension.getBackgroundPage();
    backgroundPage.base.configManager.applyConfig(null, setFeedback);
  };
  
  var getFeedback = function() {
    var message = window.localStorage["config-load-msg"];
    message = message ? message : "";
    delete window.localStorage["config-load-msg"];
    
    var color = "red"; 
    if(message.indexOf("successfully") > 0) {
      color = "green";
    }
    
    return {tag: "div", attr: ["style=color:" + color], text: message};
  };
  
  var setFeedback = function(configData) {
    var keys = configData ? Object.getOwnPropertyNames(configData) : [];
    var msg = "The configuration attempt has failed!"
    if(keys.length > 0) {
      msg = "The configuration profile (" + configData.profile + 
          ") has loaded successfully.";
    }
    
    var configUrl = window.localStorage["ds-config-url"];
    if(configUrl && configUrl != "") {
      window.localStorage["config-load-msg"] = msg;
    }

    parent.reloadPage();
  };
  
  // This is simplified HTML of the section.
  var contents = [
    {
      tag: "input", 
      attr: [
        "type=checkbox", 
        "id=conf-enable",
        "checked=" + window.localStorage["ds-config-enable"]
      ], 
      click: enableConf
    },
    {
      tag: "label", 
      attr: ["for=conf-enable"], 
      text: "Enable automatic configuration updates."
    },
    {tag: "br"},
    {tag: "br"},
    {tag: "br"},
    {tag: "div", text: "Update URL:"},
    {tag: "input", attr: ["type=text", "id=conf-url", "value=" + getConf()]},
    {tag: "br"},
    {tag: "br"},
    {tag: "button", text: "Save", click: saveConf},
    getFeedback()
  ];
  
  return this._createSection(document, "Config updates", contents);  
}

DOMSnitch.UI.Config.BasicsPage.prototype._buildHeuristics = function(document) {
  var availOptions = JSON.parse(window.localStorage["ds-opt-config"]);
  
  // Apply configuration changes throughout the extension.
  var applyConfig = function() {
    var selectedOptions = {};
    var optItems = document.getElementById("opt-items");
    
    for(var i = 0; i < optItems.children.length; i++) {
      var checkbox = optItems.children[i].firstChild;
      selectedOptions[checkbox.id] = checkbox.checked ? 1 : 0;
    }
    
    var backgroundPage = chrome.extension.getBackgroundPage();
    backgroundPage.base.selectedOptions = selectedOptions;
  };
  
  // Handle single option changes.
  var changeOption = function() {
    if(event.target instanceof HTMLInputElement) {
      applyConfig();
    }
  };
  
  // Handle bulk option changes.
  var setOptions = function(selection) {
    var optItems = document.getElementById("opt-items");
    optItems.textContent = "";
    
    for(var option in availOptions) {
      var paragraph = document.createElement("p");
      var label = document.createElement("label");
      label.setAttribute("for", option);
      label.textContent = option;
      
      var checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.id = option;
      
      if(selection == "all") {
        checkbox.checked = true;
      } else if(selection == "none") {
        checkbox.checked = false;
      } else {
        checkbox.checked = availOptions[option] == 1;
      }
      
      paragraph.appendChild(checkbox);
      paragraph.appendChild(label);
      optItems.appendChild(paragraph);
    }
    
    applyConfig();
  };
  
  // This is simplified HTML of the section.
  var contents = [
    {tag: "div", attr: ["id=opt-items"], click: changeOption},
    {tag: "button", text: "Enable all", click: setOptions.bind(this, "all")},
    {tag: "button", text: "Disable all", click: setOptions.bind(this, "none")}
  ];
  
  window.setTimeout(setOptions, 10);
  return this._createSection(document, "Enabled heuristics", contents);  
}

DOMSnitch.UI.Config.BasicsPage.prototype._buildScope = function(document) {
  var scope = JSON.parse(window.localStorage["ds-scope"]);
  var saveScope = function() {
    var scopeTextbox = document.getElementById("scope");
    var scope = [];
    if(scopeTextbox.value.length > 0) {
      scope = scopeTextbox.value.split("\n");
    }
    window.localStorage["ds-scope"] = JSON.stringify(scope);
  };
  
  // This is simplified HTML of the section.
  var contents = [
    {
      tag: "textarea",
      attr: ["id=scope"],
      text: scope.join("\n")
    },
    {
      tag: "div", 
      text: "Use this text area to specify the regular expressions (one per " +
      		"line) that describe the scope (URLs) of your testing (e.g. " +
      		"*.example.com). If left empty, a catch all rule will be applied."
    },
    {tag: "button", text: "Save", click: saveScope}
  ];

  return this._createSection(document, "Scope", contents);  
}

DOMSnitch.UI.Config.BasicsPage.prototype._buildOrigins = function(document) {
  var origins = JSON.parse(window.localStorage["ds-origins"]);
  
  var applyToFlash = function() {
    var applyToFlash = document.getElementById("origins-applyToFlash");
    localStorage["ds-origins-applyToFlash"] = applyToFlash.checked;
  };
  
  var saveOrigins = function() {
    var originsTextbox = document.getElementById("origins");
    var origins = [];
    if(originsTextbox.value.length > 0) {
      origins = originsTextbox.value.split("\n");
    }
    window.localStorage["ds-origins"] = JSON.stringify(origins);
  };
  
  // This is simplified HTML of the section.
  var contents = [
    {
      tag: "textarea", 
      attr: ["id=origins"], 
      text: origins.join("\n")
    },
    {
      tag: "div", 
      text: "Use this text area to specify the origins/TLDs from which it " +
      		"is safe to load JavaScript code into your product (e.g. " +
      		"example.com). Separate multiple entries with a new line."
    },
    {tag: "br"},
    {tag: "br"},
    {
      tag: "input", 
      attr: [
        "id=origins-applyToFlash", 
        "type=checkbox", 
        "checked=" + localStorage["ds-origins-applyToFlash"]
      ], 
      click: applyToFlash
    },
    {
      tag: "label",
      attr: ["for=origins-applyToFlash"], 
      text:"Apply the trusted origin settings to Flash movies." +
      		" (Not recommended)"
    },
    {tag: "br"},
    {tag: "button", text: "Save", click: saveOrigins}
  ];
  
  return this._createSection(document, "Trusted origins", contents);  
}

DOMSnitch.UI.Config.BasicsPage.prototype._buildExpDialog = function(document) {
  //TODO
  var contents = [
    {tag: "textarea", attr: ["id=exportedConfig"]},
    {tag: "button", text: "Close", click: this._hideExport.bind(this, document)}
  ];
  
  var dialog = this._createDialog(
      document, "Exporting current configuration", contents);
  dialog.id = "exportDialog";
  dialog.style.display = "none";
  
  return dialog;
}

DOMSnitch.UI.Config.BasicsPage.prototype._buildExpSection = function(document) {
  var contents = [{
    tag: "button", 
    text: "Export current configuration", 
    click: this._showExport.bind(this, document)
  }];
  
  return this._createSection(document, "Export config", contents);
}

/** Export dialog visibility */
DOMSnitch.UI.Config.BasicsPage.prototype._hideExport = function(document) {
  var exportDialog = document.getElementById("exportDialog");
  exportDialog.style.display = "none";
}

DOMSnitch.UI.Config.BasicsPage.prototype._showExport = function(document) {
  var exportArea = document.getElementById("exportedConfig");
  var main = chrome.extension.getBackgroundPage();
  var config = main.base.configManager.exportConfig();
  
  if(config) {
    exportArea.textContent = JSON.stringify(config);
  } else {
    exportArea.textContent = "An error has occured. Please try again.";
  }
  
  var exportDialog = document.getElementById("exportDialog");
  var leftOffset = document.width / 2 - exportDialog.offsetWidth / 2;
  var topOffset = document.height / 2 - exportDialog.offsetHeight / 2;
  exportDialog.style.display = "block";
  exportDialog.style.left = leftOffset + "px";
  exportDialog.style.top = topOffset + "px";
}

DOMSnitch.UI.Config.BasicsPage.prototype.render = function(document, canvas) {
  canvas.appendChild(this._buildUpdates(document));
  canvas.appendChild(this._buildHeuristics(document));
  canvas.appendChild(this._buildScope(document));
  canvas.appendChild(this._buildOrigins(document));
  canvas.appendChild(this._buildExpSection(document));
  canvas.appendChild(this._buildExpDialog(document));
}