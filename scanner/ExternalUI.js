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
 
/**
 * Checks whether rendered UI elements come from a trusted origin. 
 */
DOMSnitch.Scanner.ExternalUI = function() {
  this._checks = {
    "External UI": this._checkIFrameSource.bind(this)
  };
}

DOMSnitch.Scanner.ExternalUI.prototype = new DOMSnitch.Scanner.Base;

DOMSnitch.Scanner.ExternalUI.prototype._checkIFrameSource = function(record) {
  var safeOrigins = JSON.parse(window.localStorage["ds-origins"]);
  var url = record.data.split("\n")[1];
  
  if(url == "") {
    return;
  }
  
  var code = DOMSnitch.Scanner.STATUS.LOW; 
  var notes = "Displaying UI elements from an untrusted origin.\n";

  var isTrustedSource = false;
  for(var i = 0; i < safeOrigins.length; i++) {
    var regexStr = safeOrigins[i];
    regexStr = regexStr.replace(/\/$/, "");
    regexStr = regexStr.replace(/\\/g, "\\\\");
    regexStr = regexStr.replace(/\*/g, "[\\w\\.-]*");
    var regex = new RegExp("^(https{0,1}:){0,1}//" + regexStr, "i");

    isTrustedSource = url.match(regex) ? true : isTrustedSource;
  }
                   
  if(!isTrustedSource) {
    return {
      code: code, 
      notes: notes
    };
  }
}