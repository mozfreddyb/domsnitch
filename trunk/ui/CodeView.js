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
 * Provides a view-source like functionality for obfuscated JavaScript. Places
 * markers to show where the last executed instruction took place.
 */
DOMSnitch.UI.CodeView = function(parent, url, window) {
  this._parent = parent;
  this._title = parent.appName + ": Code view for " + url;
  this._columnTitles = [{title: ""},{title: "Code view for " + url}];
  this._window = window;
  
  this._getScript(url);
}

DOMSnitch.UI.CodeView.prototype = new DOMSnitch.UI.BasicUI;

DOMSnitch.UI.CodeView.prototype._getMarkers = function(rawUrl) {
  // TODO(radi): Extract url, line, and char from URLs such as
  // https://www.example.com/script.js:2178:16
  var parsedUrl = rawUrl;
  var line = 1;
  var char = 1;
  
  var urlBlock = rawUrl.match(/([\w-]+:\/\/.*):(\d+):(\d+)/);
  if(urlBlock) {
    parsedUrl = urlBlock[1];
    line = urlBlock[2];
    char = urlBlock[3];
  }
  
  return {url: parsedUrl, line: line, char: char};
}

DOMSnitch.UI.CodeView.prototype._getScript = function(rawUrl) {
  //TODO(radi): Fetch the script
  var markers = this._getMarkers(rawUrl);
  var xhr = new XMLHttpRequest;
  xhr.open("GET", markers.url, true);
  xhr.addEventListener(
      "readystatechange", this._parseScript.bind(this, markers), true);
  xhr.send();
}

DOMSnitch.UI.CodeView.prototype._beautifyScript = function(script) {
  //TODO(radi): Insert the appropriate new-lines. Indent as appropriate.
  
  script = script.replace(/\n/g, "/*DS_LINE*/\n");
  script = script.replace(/\{\n{0,1}/g, "{\n");
  script = script.replace(/\n{0,1}\}\n{0,1}/g, "\n}\n");
  script = script.replace(/;(.)/g, ";\n$1");
  script = script.replace(/\n\/\*DS_MARKER\*\//, "/*DS_MARKER*/");
  script = script.replace(/\}\n;/g, "};");
  
  var scriptLines = script.split("\n");
  
  // Insert new line for statements without {}
  for(var i = 0; i < scriptLines.length; i++) {
    var scriptLine = scriptLines[i].trim();
    
    var stRegex = /^(if|\}{0,1}\s*(else|catch)|for|while|try|with|switch)\b/;
    if(!!scriptLine.match(stRegex) && !scriptLine.match(/\{$/)) {
      scriptLine = scriptLine.replace(/(else|catch|\))(\s*\w.+)$/, "$1{\n$2\n}");
    }

    scriptLines[i] = scriptLine;
  }
  
  // Refresh the lines array.
  script = scriptLines.join("\n");
  scriptLines = script.split("\n");
  
  // Keep strings in tact.
  for(var i = 0; i < scriptLines.length; i++) {
    var scriptLine = scriptLines[i];
    
    var countQ = scriptLine.match(/'/g);
    countQ = countQ ? countQ.length : 0;
    var countDQ = scriptLine.match(/"/g);
    countDQ = countDQ ? countDQ.length : 0;
    
    /*
    if(!!scriptLine.match(/\/.*['].*\//) || !!scriptLine.match(/".*'.*"/)) {
      countQ--;
    }
    
    if(!!scriptLine.match(/\/.*["].*\//) || !!scriptLine.match(/'.*".*'/)) {
      countDQ--;
    }

    
    if((countQ % 2 > 0 || countDQ % 2 > 0) && i < scriptLines.length - 1) {
      scriptLine += scriptLines[i + 1].trim();
      scriptLines[i] = scriptLine;
      scriptLines.splice(i + 1, 1);
      i--;
    }
    */
  }
  
  // Indent lines.
  var indent = "";
  for(var i = 0; i < scriptLines.length; i++) {
    var scriptLine = scriptLines[i].trim();
     
    if(!!scriptLine.match(/^\s*\}/) && indent.length > 3) {
      indent = indent.substring(0, indent.length - 4);
    }
    
    scriptLines[i] = indent + scriptLine;
    
    if(!!scriptLine.match(/\{$/)) {
      indent += "    ";
    }
  }
  
  
  return scriptLines.join("\n");
}

DOMSnitch.UI.CodeView.prototype._parseScript = function(markers, event) {
  //TODO(radi): Place markers. Beautify and print the script.
  var xhr = event.target;
  if(xhr.readyState != 4) {
    return;
  }
  
  var scriptLines = xhr.responseText.split("\n");
  if(scriptLines.length >= markers.line) {
    var scriptLine = scriptLines[markers.line - 1].trim();
    scriptLine = scriptLine.substring(0, markers.char - 1)
        + "/*DS_MARKER*/" 
        + scriptLine.substring(markers.char - 1);
    scriptLines[markers.line - 1] = scriptLine;
  }
  
  var script = this._beautifyScript(scriptLines.join("\n"));
  this._printScript(script);
  
  this.document.location.hash = "#line" + markers.line;
}

DOMSnitch.UI.CodeView.prototype._printScript = function(script) {
  if(this._window.closed) {
    return;
  }
  
  var document = this.document;
  var contentTable = document.getElementById("contentTable");
  var scriptLines = script.split("/*DS_LINE*/");
  
  for(var i = 0; i < scriptLines.length; i++) {
    var scriptLine = scriptLines[i].replace(/^\n*/, "");
    var contentRow = document.createElement("tr");
    contentRow.className = "code";
    if(!!scriptLine.match(/\/\*DS_MARKER\*\//)) {
      contentRow.style.backgroundColor = "#e7e7e7";
    }
    contentTable.appendChild(contentRow);
    
    
    var counter = document.createElement("td");
    counter.textContent = (i + 1);
    contentRow.appendChild(counter);
    
    var anchor = document.createElement("a");
    anchor.name = "line" + (i + 1);
    counter.appendChild(anchor);
    
    var contentBody = document.createElement("td");
    contentRow.appendChild(contentBody);
    
    var fragments = scriptLine.split("/*DS_MARKER*/");
    if(fragments.length > 1) {
      var exec = document.createElement("pre");
      exec.style.display = "inline";
      exec.textContent = fragments[0];
      contentBody.appendChild(exec);
      
      
      var breakpoint = document.createElement("pre");
      breakpoint.style.display = "inline";
      breakpoint.style.color = "red";
      breakpoint.style.weight = "bold";
      breakpoint.textContent = " /* BREAKPOINT */ ";
      contentBody.appendChild(breakpoint);
      
      
      var rest = document.createElement("pre");
      rest.style.display = "inline";
      rest.textContent = fragments[1];
      contentBody.appendChild(rest);

    } else {
      var content = document.createElement("pre");
      content.textContent = scriptLine;
      contentBody.appendChild(content);
    }
  }
}