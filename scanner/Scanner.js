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

DOMSnitch.Scanner = function() {
  var scriptSource = new DOMSnitch.Scanner.ScriptSource;
  
  this._scanners = {
    "Untrusted code": [scriptSource]
  };  
}

DOMSnitch.Scanner.prototype = {
  checkOnCapture: function(record) {
    if(record.scanInfo) {
      return record.scanInfo;
    }
    
    var code = DOMSnitch.Scanner.STATUS.NONE;
    var notes = "";
    
    var scanners = this._scanners[record.type];
    for(var i = 0; scanners && i < scanners.length; i++) {
      if(scanners[i]) {
        var check = scanners[i].check(record);
        if(check) {
          code = code > check.code ? code : check.code;
          notes += check.notes;
        }
      }
    }
    
    if(notes.length > 0) {
      return {code: code, notes: notes};
    } else {
      return null;
    }
  },
  
  checkOnDisplay: function(record) {
    var ignoreList = new DOMSnitch.Scanner.IgnoreList();
    if(ignoreList.checkGid(record.gid)) {
      return {code: DOMSnitch.Scanner.STATUS.IGNORED, notes: ""};
    }
    
    return record.scanInfo;
  },

  stringifyStatusCode: function(status) {
    switch(status) {
      case DOMSnitch.Scanner.STATUS.HIGH:
        return "High";
      case DOMSnitch.Scanner.STATUS.MED:
        return "Medium";
      case DOMSnitch.Scanner.STATUS.LOW:
        return "Low";
      default:
        return "";
    }
  }
}

DOMSnitch.Scanner.STATUS = {
  HIGH: 3,
  MED: 2,
  LOW: 1,
  NONE: 0,
  IGNORED: -1
}

DOMSnitch.Scanner.MIN_PARAM_LENGTH = 2;