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


/**
 * Imports an exported set of records back into DOM Snitch.
 * TODO(radi): Link this code from the Activity Log.
 * 
 * Current usage (using the DevTools inside base.html):
 * var importer = new DOMSnitch.Import.GoogleDocs(base);
 * importer.load(<Google Docs spreadsheet URL>);
 */
DOMSnitch.Import = {};

DOMSnitch.Import.GoogleDocs = function(parent) {
  this._parent = parent;
}

DOMSnitch.Import.GoogleDocs.prototype = {
  _parseFile: function(fileContents) {
    var lines = fileContents.split("\n");
    var rows = [];
    
    lines.splice(0, 1); // Remove header row
    for(var i = 0; i < lines.length; i++) {
      if(lines[i] == "\"") {
        var contents = lines.splice(0, i + 1);
        rows.push(contents.join("\n"));
        i = 0;
      }
    }
    
    return rows;
  },
  
  _parseRow: function(rowContents) {
    var contents = rowContents.replace(/""/g, "[doublequote]");
    contents = contents.split(",");
    
    var fields = [];
    var store = false;
    var buffer = "";
    for(var i = 0; i < contents.length; i++) {
      var chunk = contents[i];
      
      if(!!chunk.match(/^"/)) {
        store = true;
        chunk = chunk.substring(1);
      }
      
      if(store) {
        buffer += chunk;
        
        if(chunk[chunk.length - 1] == "\"") {
          fields.push(buffer.substring(0, buffer.length - 1));
          buffer = "";
          store = false;
        } else { 
          buffer += ",";
        }
      } else {
        fields.push(chunk);
      }
    }
    
    var scanInfo = this._parseScanInfo(fields[7]);
    var record = {
      gid: fields[0],
      type: fields[1],
      topLevelUrl: fields[2],
      documentUrl: fields[3],
      data: fields[4].replace(/\[doublequote\]/g, "\""),
      env: JSON.parse(fields[5].replace(/\[doublequote\]/g, "\"")),
      callStack: JSON.parse(fields[6].replace(/\[doublequote\]/g, "\"")),
      scanInfo: scanInfo      
    };
    
    return record;
  },
  
  _parseScanInfo: function(scanInfoString) {
    var lines = scanInfoString.split("\n");
    var code = DOMSnitch.Scanner.STATUS.NONE;
    var notes = "";
    
    for(var i = 0; i < lines.length - 1; i++) {
      if(i == 0) {
        if(lines[i] == "High") {
          code = DOMSnitch.Scanner.STATUS.HIGH;
        } else if(lines[i] == "Medium") {
          code = DOMSnitch.Scanner.STATUS.MED;
        } else if(lines[i] == "Low") {
          code = DOMSnitch.Scanner.STATUS.LOW;
        }
      }
      
      if(i > 1) {
        notes += lines[i] + "\n";
      }
    }
    
    return {code: code, notes: notes};
  },
  
  load: function(url) {
    var spreadsheetId = url.match(/key=(\w+)/i);
    if(spreadsheetId) {
      spreadsheetId = spreadsheetId[1];
    } else {
      return;
    }
    
    var importUrl = "https://spreadsheets.google.com/feeds/download/" +
    		"spreadsheets/Export?key=" + spreadsheetId + "&exportFormat=csv&gid=0";
    
    console.debug(importUrl);
    
    var xhr = new XMLHttpRequest;
    xhr.open("GET", importUrl, false);
    
    try {
      xhr.send();
    } catch(e) {
      console.error("Could not retrieve spreadsheet. Possible authentication error.");
    }
    
    var parsedFile = this._parseFile(xhr.responseText);
    for(var i = 0; i < parsedFile.length; i++) {
      var record = this._parseRow(parsedFile[i]);
      
      this._parent.storage.insert(record);
      this._parent.activityLog.displayRecord(record);
    }
  }
}