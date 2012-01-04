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

if(!window.DOMSnitch) {
  DOMSnitch = {};
}

DOMSnitch.Notifier = function() {
  //TODO
  this.showNotification();
}

DOMSnitch.Notifier.prototype = {
  hideNotification: function() {
    //TODO
    var document = window.top.document;
    var note = document.getElementById("ds-note");
    document.body.removeChild(note);
  },
  
  permanentlyHideNotification: function() {
    chrome.extension.sendRequest({type: "hideNotification"});
    this.hideNotification();    
  },
  
  showNotification: function() {
    //TODO
    var document = window.top.document;
    var note = document.getElementById("ds-note");
    if(!note) {
      note = document.createElement("div"); 
      note.id = "ds-note";
    }
    note.textContent = 
        window.APP_NAME + " is currently running on this page. [";
    
    var dismiss = document.createElement("a");
    dismiss.textContent = "Dismiss this message";
    dismiss.addEventListener("click", this.hideNotification.bind(this), true);
    note.appendChild(dismiss);

    var space = document.createTextNode();
    space.textContent = "] [";
    note.appendChild(space);

    //TODO(radi): Find the proper place for this link (if any).
    var pDismiss = document.createElement("a");
    pDismiss.textContent = "Dismiss this message permanently";
    pDismiss.addEventListener("click", this.permanentlyHideNotification.bind(this), true);
    note.appendChild(pDismiss);

    var closingBracket = document.createTextNode();
    closingBracket.textContent = "]";
    note.appendChild(closingBracket);

    document.body.appendChild(note);
  }
}

var notifier = new DOMSnitch.Notifier();