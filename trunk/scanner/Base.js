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

DOMSnitch.Scanner.Base = function() {
  //TODO
}

DOMSnitch.Scanner.Base.prototype = {
  _extractCookieData: function(cookie, delim) {
    //TODO
  },
  
  _extractLocation: function(url) {
    var idx = url.indexOf(":");
    var protocol = url.substring(0, idx + 1);
    var href = url;
    var host = "";
    var origin = "null";
    var port = "";
    var path = "";
    var search = "";
    var hash = "";
    
    url = url.substring(idx + 1);
    if(url.indexOf("//") > -1) {
      url = url.substring(2);
      idx = url.indexOf("/");
      host = idx > 0 ? url.substring(0, idx) : url;
      path = idx > 0 ? url.substring(idx) : "";
      
      idx = host.indexOf(":");
      if(idx > 0) {
        port = host.substring(idx + 1);
        host = host.substring(0, idx);
      }
      
      origin = protocol + "//" + host + (port.length > 0 ? ":" + port : "");
      
      idx = path.indexOf("?");
      if(idx > 0) {
        search = path.substring(idx);
        path = path.substring(0, idx);
      }
      
      if(search.length > 0) {
        idx = search.indexOf("#");
        if(idx > 0) {
          hash = search.substring(idx);
          search = search.substring(0, idx);
        }
      } else {
        idx = path.indexOf("#");
        if(idx > 0) {
          hash = path.substring(idx);
          path = path.substring(0, idx);
        }
      }
    } else {
      path = url;
    }
    
    return {
      protocol: protocol, 
      href: href,
      hostname: host, 
      origin: origin,
      port: port, 
      pathname: path,
      search: search,
      hash: hash
    };
  },
  
  _extractParam: function(container, delim) {
    if(typeof container != "string") {
      return {};
    }
    
    var idx = container.indexOf(delim);
    if(idx > 0) {
      var param = container.substring(0, idx);
      var value = unescape(container.substring(idx + 1).replace(/\+/gg, " "));
      return {param: param, value: value};
    } else {
      return { param: "(global)", value: container};
    }
  },
  
  check: function(record) {
    var check = this._checks[record.type];

    if(!check) {
      throw Error("There is no implemented check for " + record.type);
    }
    
    return check(record);
  }
}