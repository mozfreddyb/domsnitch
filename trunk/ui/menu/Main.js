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

DOMSnitch.UI.Menu.Main = function() {
  this._parent = chrome.extension.getBackgroundPage().base;
  var menu = document.getElementById("menu");
  menu.appendChild(
    this._createMenuItem("Show Activity Log", this._showActivityLog.bind(this))
  );
  menu.appendChild(
    this._createMenuItem("Configure...", this._showConfigPage.bind(this))
  );
  menu.appendChild(
    this._createMenuItem("Disable...", this._showExtensionsPage.bind(this))
  );
  
  this._extendMenu();
}

DOMSnitch.UI.Menu.Main.prototype = {
  _createMenuItem: function(title, handler) {
    var elem = document.createElement("div");
    elem.className = "item";
    elem.textContent = title;
    elem.addEventListener("click", handler, true);
    elem.addEventListener("mouseover", this._hoverOver, true);
    elem.addEventListener("mouseout", this._hoverOut, true);
    
    return elem;
  },
  
  _extendMenu: function() {
    // This is a stub method for extensibility purposes.
  },
  
  _hoverOut: function(event) {
    document.body.style.cursor = "auto";
  },
  
  _hoverOver: function(event) {
    document.body.style.cursor = "pointer";
  },
  
  _showActivityLog: function() {
    this._parent.showActivityLog();
  },
  
  _showConfigPage: function() {
    this._parent.showConfigPage();
  },
  
  _showExtensionsPage: function() {
    chrome.tabs.create({url: "chrome://extensions"});
  }
}