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

DOMSnitch.Scanner.Json = function() {
  this._checks = {
    "win.eval": this._checkJsonValidity.bind(this)
  };
}

DOMSnitch.Scanner.Json.prototype = new DOMSnitch.Scanner.Base;

DOMSnitch.Scanner.Json.prototype._checkJsonValidity = function(record) {
  var code = DOMSnitch.Scanner.STATUS.NONE;
  var notes = "";
 
  var jsData = record.data;
  var canParse = true;
  var hasCode = false;
  var isEnclosed = false;
  
  if(jsData[0] == "(" && jsData[jsData.length - 1] == ")") {
    jsData = jsData.substring(1, jsData.length - 1);
    isEnclosed = true;
  }

  var seemsJSON = /^\{.+\}$/.test(jsData) || /^\[.+\]$/.test(jsData);
  seemsJSON = /this\.[\w_\s]+=['"\w\s]+;/.test(jsData) ? false : seemsJSON;

  if(seemsJSON) {
    try {
      JSON.parse(jsData);
    } catch (e) {
      canParse = false;
    }
    
    jsData = jsData.replace(/,\]/g, ",null]");
    jsData = jsData.replace(/\[,/g, "[null,");
    jsData = jsData.replace(/,,/g, ",null,");
    jsData = jsData.replace(/,,/g, ",null,");
    jsData = jsData.replace(/{([\w_]+):/g, "{\"$1\":");
    jsData = jsData.replace(/,([\w_]+):/g, ",\"$1\":");
    jsData = jsData.replace(/'(\w+)'/g, "\"$1\"");
    
    try {
      JSON.parse(jsData);
    } catch (e) {
      hasCode = true;
    }

    if(isEnclosed) {
      code = DOMSnitch.Scanner.STATUS.LOW;
      notes = "JSON data found to be enclosed in parentheses.\n";
    }

    if(!canParse) {
      code = DOMSnitch.Scanner.STATUS.MED;
      notes += "Malformed JSON object.\n";
    }
    
    if(!canParse && hasCode) {
      code = DOMSnitch.Scanner.STATUS.HIGH;
      notes += "Found code in JSON object.\n";
    }
  }

  return {code: code, notes: notes};
}