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

DOMSnitch.Scanner.Xss = function() {
  this._checks = {
    "innerHTML": this._checkHtml.bind(this, -1),
    "doc.write": this._checkHtml.bind(this, -1),
    "script.src": this._checkScriptSource.bind(this),
    "anchor.href": this._checkHtml.bind(this, 0),
    "iframe.src": this._checkHtml.bind(this, 0)
  };
}

DOMSnitch.Scanner.Xss.prototype = new DOMSnitch.Scanner.Base;

DOMSnitch.Scanner.Xss.prototype._checkHtml = function(specPos, record) {
  var code = DOMSnitch.Scanner.STATUS.NONE;
  var notes = "";
  var check = undefined;

  if(record.data.length == 0) {
    return {code: code, notes: notes};
  }
  
  var ref = this._extractLocation(record.env.referrer);
  check = this._checkParams(
    record.data, ref.search.substring(1).split("&"), "HTTP Referrer", specPos);
  code = code > check.code ? code : check.code;
  notes += check.notes;
  
  check = this._checkParams(
    record.data, ref.hash.substring(1).split("&"), "HTTP Referrer", specPos);
  code = code > check.code ? code : check.code;
  notes += check.notes;
  
  var href = this._extractLocation(record.env.location);
  check = this._checkParams(
    record.data, href.search.substring(1).split("&"), "address bar", specPos);
  code = code > check.code ? code : check.code;
  notes += check.notes;
  
  check = this._checkParams(
    record.data, href.hash.substring(1).split("&"), "address bar", specPos);
  code = code > check.code ? code : check.code;
  notes += check.notes;
  
  var cookies = this._extractCookieParams(record.env.cookie);
  for(var i = 0; i < cookies.length; i++) {
    var cookie = cookies[i];
   
    if(/\w=\w:/.test(cookie.value)) {
      check = this._checkParams(record.data, cookie.value.split(":"), "cookie");
    } else {
      check = this._checkParams(record.data, [cookie], "cookie");
    }
    
    code = code > check.code ? code : check.code;
    notes += check.notes;
  }
  
  return {code: code, notes: notes};
}

DOMSnitch.Scanner.Xss.prototype._checkParams = function(recordData, params, typeCheck, specPos) {
  var code = DOMSnitch.Scanner.STATUS.NONE;
  var notes = "";
  
  for(var i = 0; i < params.length; i++) {
    var param = params[i].param ? params[i] : this._extractParam(params[i], "=");
    
    if(!param.value || param.value <= DOMSnitch.Scanner.MIN_PARAM_LENGTH) {
      continue;
    }
    
    var flagParam = (param.value && param.value.length > DOMSnitch.Scanner.MIN_PARAM_LENGTH);
    if(specPos > -1) {
      flagParam &= (param.value && recordData.indexOf(param.value) == specPos);
    } else {
      flagParam &= (param.value && recordData.indexOf(param.value) > -1);
    }
    
    if(flagParam) {
      code = code > DOMSnitch.Scanner.STATUS.MED ? code : DOMSnitch.Scanner.STATUS.MED;
      notes += "Found " + typeCheck + " data in output ";
      notes += "[variable: " + param.param + ", value: " + param.value + "].\n";
      
      if(this._hasEscChars(param.value)) {
        code = DOMSnitch.Scanner.STATUS.HIGH;
        notes += "Found escape characters in " + typeCheck + ".\n";
      }
    }
  }
  
  return {code: code, notes: notes};
}

DOMSnitch.Scanner.Xss.prototype._checkScriptSource = function(record) {
  var code = DOMSnitch.Scanner.STATUS.NONE;
  var notes = "";
  
  if(record.data == "about:blank") {
    return {code: code, notes: notes};
  }

  var location = this._extractLocation(record.env.location);
  if(record.data.indexOf("//") == 0) {
    record.data = location.protocol + record.data;
  } else if(record.data.indexOf("/") == 0) {
    return {code: code, notes: notes};
  }
  
  var isHttp = (record.data.indexOf("http://") > -1 || record.data.indexOf("https://") > -1);
  if(!isHttp) {
    code = DOMSnitch.Scanner.STATUS.LOW;
    notes = "Found non-HTTP(S) protocol being used.\n";
    return {code: code, notes: notes};
  }
  
  //TODO: Provide interface to pre-populate this list
  var tldList = [];
  var currentPageTld = /(\w+\.)*(\w+\.\w+)/.exec(location.hostname)[2];
  tldList.push(currentPageTld);
  
  var scriptLocation = this._extractLocation(record.data);
  var scriptTldInList = false;
  for(var i = 0; i < tldList.length; i++) {
    var tldPosition = scriptLocation.hostname.indexOf(tldList[i]);
    var hostnameDiff = scriptLocation.hostname.length - tldList[i].length; 
    if(tldPosition == hostnameDiff) {
      scriptTldInList = true;
    }
  }

  if(!scriptTldInList) {
    code = DOMSnitch.Scanner.STATUS.HIGH;
    notes = "Found scripts running from a non-trusted top level domain.\n";
  }
  
  return {code: code, notes: notes};
}

DOMSnitch.Scanner.Xss.prototype._checkUrl = function(record) {
  //TODO
}

DOMSnitch.Scanner.Xss.prototype._extractCookieParams = function(cookies) {
  var params = [];
  var cookieJar = cookies.split(";");
  
  for(var i = 0; i < cookieJar.length; i++) {
    cookie = this._extractParam(cookieJar[i].trim(), "=");
    if(cookie.value) {
      params.push(cookie);
    }
  }
  
  return params;
}

DOMSnitch.Scanner.Xss.prototype._hasEscChars = function(string) {
  return string.indexOf(">") > -1 ? true : 
    (string.indexOf("<") > -1 ? true : 
      (string.indexOf("\"") > -1 ? true : 
        (string.indexOf("'") > -1 ? true : false)
      )
    );     
}