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
 
DOMSnitch.Scanner.ScriptSource = function() {
  this._checks = {
    "Untrusted code": this._checkScriptSource.bind(this)
  };
}

DOMSnitch.Scanner.ScriptSource.prototype = new DOMSnitch.Scanner.Base;

DOMSnitch.Scanner.ScriptSource.prototype._checkScriptSource = function(record) {
  var safeOrigins = JSON.parse(window.localStorage["ds-origins"]);
  var applyToFlash = window.localStorage["ds-origins-applyToFlash"];
  var url = record.data.split("\n")[1];
  
  if(url == "") {
    return;
  }
  
  var code = safeOrigins.length > 0 ?
    DOMSnitch.Scanner.STATUS.HIGH :
    DOMSnitch.Scanner.STATUS.MED; 
  var filetype = url.match(/\.(\w+)$/);
  var notes = "";
  if(filetype && filetype[1] == "swf") {
    notes = "Loading of Flash movies from an untrusted origin.\n";
    if(applyToFlash != "true") {
      safeOrigins = [];
    }
  } else if(filetype && filetype[1] == "css") {
    notes = "Loading of CSS from an untrusted origin.\n";
  } else {
    notes = "Loading of scripts from an untrusted origin.\n";
  }

  var isTrustedSource = false;
  for(var i = 0; i < safeOrigins.length; i++) {
    var regexStr = safeOrigins[i];
    regexStr = regexStr.replace(/\/$/, "");
    regexStr = regexStr.replace(/\\/g, "\\\\");
    regexStr = regexStr.replace(/\*/g, "[\\w\\.-]*");
    var regex = new RegExp("^(https{0,1}:){0,1}//" + regexStr, "i");

    
    
    //var regex = new RegExp("^((http|https):){0,1}\\/\\/[\\w\\.-]*" +
    //  safeOrigins[i].replace(".", "\\."), "i");
    isTrustedSource = url.match(regex) ? true : isTrustedSource;
  }
                   
  if(!isTrustedSource) {
    return {
      code: code, 
      notes: notes
    };
  }
}