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

var menuItems = [
  {title:"Basics", href:"domsnitch.html"},
  {title:"Ignore Rules", href:"ignoreRules.html"}
];


function init() {
  var navbar = document.getElementById("navbar");
  for(var i = 0; i < menuItems.length; i++) {
    var option = document.createElement("div");
    option.setAttribute("href", menuItems[i].href);
    
    if(location.href.indexOf(menuItems[i].href) > 0) {
      option.className = "highlight";
      var title = document.getElementById("page-title");
      title.textContent = menuItems[i].title;

      document.title = "DOM Snitch: Preferences - " + menuItems[i].title;
    } else {
      option.addEventListener("mouseover", mouseOverMenuItem, true);
      option.addEventListener("mouseout", mouseOutMenuItem, true);
    }
    option.addEventListener("click", mouseClickMenuItem, true);
    option.textContent = menuItems[i].title;
    
    navbar.appendChild(option);
  }
}


function mouseOverMenuItem(event) {
  document.body.style.cursor = "pointer";
}

function mouseOutMenuItem(event) {
  document.body.style.cursor = "auto";
}

function mouseClickMenuItem(event) {
  var href = event.target.getAttribute("href");
  
  if(href && href != "") {
    window.location = href;
  }
}

document.addEventListener("DOMContentLoaded", init);