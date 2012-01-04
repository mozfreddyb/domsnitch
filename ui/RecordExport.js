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

DOMSnitch.UI.RecordExport = function(parent, recordId) {
  this._parent = parent;
  this._title = parent.appName + ": Plain text export for record #" + recordId;
  this._columnTitles = [{title: "Plain text export for record #" + recordId}];
  
  this.showViewer();
  this._parent.storage.selectBy("id", recordId, this.displayRecord.bind(this));
}

DOMSnitch.UI.RecordExport.prototype = new DOMSnitch.UI.BasicUI;

DOMSnitch.UI.RecordExport.prototype._stringifyCodeSection = function(title, content) {
  var body = title + ":\n";
  if(content instanceof Array) {
    body += "(most recent)\n"
    for(var i = 0; i < content.length; i++) {
      body += "[Frame " + (i + 1) + "]\n";
      
      if(content[i].src) {
        body += "*source url*\n" + content[i].src + "\n";
      }
      
      if(content[i].data) {
        body += "*arguments*\n";
        
        var args = content[i].data.split(" | ");
        for(var j = 0; j < args.length; j++) {
          body += (j + 1) + ": " + args[j] + "\n";
        }
      }
      
      if(content[i].code) {
        body += "\n*code*\n" + content[i].code;
      }
      
      body += "\n--------------------------\n\n";
    }
  } else {
    var i = 1;
    for(var key in content) {
      body += i++ + ": " + key + ":\n" + content[key] + "\n\n";
    }
  }
  
  return body + "========================\n\n";
}

DOMSnitch.UI.RecordExport.prototype._stringifyTextSection = function(title, content) {
  return title + ":\n" + content + "\n========================\n\n";
}

DOMSnitch.UI.RecordExport.prototype.displayRecord = function(record) {
  if(this._window.closed) {
    return;
  }

  var document = this.document;
  var contentTable = document.getElementById("contentTable");
  var recordRow = document.createElement("tr");
  var recordBody = document.createElement("td");
  recordBody.id = "recordBody";
  
  var scanResults = this._scanner.checkOnDisplay(record);
  scanResults.code = this._scanner.stringifyStatusCode(scanResults.code);
  //record.env.cookie = "";
  
  recordBody.innerText = this._stringifyTextSection("Global ID", record.gid);
  recordBody.innerText += this._stringifyCodeSection("Passive checks", scanResults);
  recordBody.innerText += this._stringifyTextSection("Type", record.type);
  recordBody.innerText += this._stringifyTextSection("Top level URL", record.topLevelUrl);
  recordBody.innerText += this._stringifyTextSection("Document URL", record.documentUrl);
  recordBody.innerText += this._stringifyTextSection("Data", record.data);
  recordBody.innerText += this._stringifyCodeSection("Environment variables", record.env);
  recordBody.innerText += this._stringifyCodeSection("Call stack", record.callStack);
  
  recordRow.appendChild(recordBody);
  contentTable.appendChild(recordRow);
}