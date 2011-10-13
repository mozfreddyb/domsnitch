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

var availOptions = JSON.parse(window.localStorage["ds-opt-config"]);

function applyModuleConfig() {
  var selectedOptions = {};
  var optItems = document.getElementById("opt-items");
  
  for(var i = 0; i < optItems.children.length; i++) {
    var checkbox = optItems.children[i].firstChild;
    selectedOptions[checkbox.id] = checkbox.checked ? 1 : 0;
  }
  
  var backgroundPage = chrome.extension.getBackgroundPage();
  backgroundPage.base.selectedOptions = selectedOptions;
}

function handleOptionChange(event) {
  if(event.target instanceof HTMLInputElement) {
    applyModuleConfig();
  }
}

function setOptions(selection) {
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
  
  applyModuleConfig();
}

function handleApplyToFlash() {
  var applyToFlash = document.getElementById("opt-origins-applyToFlash");
  localStorage["ds-origins-applyToFlash"] = applyToFlash.checked;
}

function handleSaveOrigins() {
  var originsTextbox = document.getElementById("opt-originsContent").children[0];
  var origins = [];
  if(originsTextbox.value.length > 0) {
    origins = originsTextbox.value.split("\n");
  }
  window.localStorage["ds-origins"] = JSON.stringify(origins);
}

function handleSaveScope() {
  var scopeTextbox = document.getElementById("opt-scopeContent").children[0];
  var scope = [];
  if(scopeTextbox.value.length > 0) {
    scope = scopeTextbox.value.split("\n");
  }
  window.localStorage["ds-scope"] = JSON.stringify(scope);
}

function init() {
  var optContent = document.getElementById("opt-content");
  optContent.addEventListener("click", handleOptionChange, true);
  
  var optEnableAll = document.getElementById("opt-enableAll");
  optEnableAll.addEventListener("click", setOptions.bind(this, "all"));
  
  var optDisableAll = document.getElementById("opt-disableAll");
  optDisableAll.addEventListener("click", setOptions.bind(this, "none"));
  
  setOptions();

  var scope = JSON.parse(window.localStorage["ds-scope"]);
  var scopeTextbox = document.getElementById("opt-scopeContent").children[0];
  scopeTextbox.value = scope.join("\n");
  
  var saveScopeButton = document.getElementById("saveScopeButton");
  saveScopeButton.addEventListener("click", handleSaveScope);
  
  var origins = JSON.parse(window.localStorage["ds-origins"]);
  var originsTextbox = document.getElementById("opt-originsContent").children[0];
  originsTextbox.value = origins.join("\n");
  
  var applyToFlash = document.getElementById("opt-origins-applyToFlash");
  applyToFlash.checked = localStorage["ds-origins-applyToFlash"] == "true";
  applyToFlash.addEventListener("click", handleApplyToFlash);

  var saveOriginsButton = document.getElementById("saveOriginsButton");
  saveOriginsButton.addEventListener("click", handleSaveOrigins);
}

document.addEventListener("DOMContentLoaded", init);