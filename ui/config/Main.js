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

DOMSnitch.UI.Config.Main = function() {
  this._menu = new DOMSnitch.UI.Config.Navigation(this);
  this._build();
}

DOMSnitch.UI.Config.Main.prototype = {
  get document() {
    return document;
  },
  
  _build: function() {
    var pages = Object.getOwnPropertyNames(DOMSnitch.UI.Config);
    pages.sort();
    for(var i = 0; i < pages.length; i++) {
      var pageName = pages[i];
      if(!!pageName.match(/\w+page$/i)) {
        var pageClass = DOMSnitch.UI.Config[pageName];
        pages[i] = new pageClass(this);
      } else {
        pages.splice(i, 1);
        i--;
      }
    }
    
    for(var i = 0; i < pages.length; i++) {
      this._menu.addPage(pages[i]);
    }
    
    this._menu.handleClick(0);
  },
  
  _getAppName: function() {
    var main = chrome.extension.getBackgroundPage();
    return main.base.appName;
  },
  
  clear: function() {
    var pageTitle = document.getElementById("page-title");
    var main = document.getElementById("main"); 
    main.textContent = "";
    main.appendChild(pageTitle);
    
    this.setTitle("");
  },
  
  reloadPage: function() {
    this._menu.reloadPage();
  },
  
  renderPage: function(page) {
    this.clear();
    this._menu.buildMenu();
    this.setTitle(page.title);
    
    var main = document.getElementById("main"); 
    page.render(document, main);
  },
  
  setTitle: function(title) {
    var pageTitle = document.getElementById("page-title");
    pageTitle.textContent = title;
    document.title = this._getAppName() + ": Preferences - " + title;
  }
}