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

DOMSnitch.UI.Config.Navigation = function(parent) {
  this._parent = parent;
  this._document = this._parent.document;
  this._menuItems = [];
  this._currentPageId = 0;
}

DOMSnitch.UI.Config.Navigation.prototype = {
  addPage: function(page) {
    this._menuItems.push(page);
  },
  
  buildMenu: function() {
    var navbar = this._document.getElementById("navbar");
    navbar.textContent = "";
    
    for(var i = 0; i < this._menuItems.length; i++) {
      var menuItem = this._menuItems[i];
      var navItem = this._document.createElement("div");
      
      // Track if the current page is the one selected.
      if(this._currentPageId == i) {
        navItem.className = "highlight";
      } else {
        navItem.addEventListener("click", this.handleClick.bind(this, i), true);
        navItem.addEventListener(
            "mouseout", this.handleMouseOut.bind(this), true);
        navItem.addEventListener(
            "mouseover", this.handleMouseOver.bind(this), true);
      }
      
      navItem.textContent = menuItem.title;
      navbar.appendChild(navItem);
    }
  },
  
  handleClick: function(itemId) {
    this._currentPageId = itemId;
    var page = this._menuItems[itemId];
    this._parent.renderPage(page);
  },
  
  handleMouseOut: function(event) {
    this._document.body.style.cursor = "auto";
  },
  
  handleMouseOver: function(event) {
    this._document.body.style.cursor = "pointer";
  },
  
  reloadPage: function() {
    var page = this._menuItems[this._currentPageId];
    this._parent.renderPage(page);
  }
}