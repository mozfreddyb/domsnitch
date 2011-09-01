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

DOMSnitch.Scanner.IgnoreList = function() {
}

DOMSnitch.Scanner.IgnoreList.prototype = {
  addToList: function(gid) {
    var ignoreGidBlob = localStorage["ignoreGidBlob"];
    var ignoreGid = ignoreGidBlob ? JSON.parse(ignoreGidBlob) : {};
    
    ignoreGid[gid] = true;
    localStorage["ignoreGidBlob"] = JSON.stringify(ignoreGid);
  },

  checkGid: function(gid) {
    var ignoredGidBlob = localStorage["ignoreGidBlob"];
    var ignoredGid = ignoredGidBlob ? JSON.parse(ignoredGidBlob) : {};

    return gid in ignoredGid;
  },
  
  removeFromList: function(gid) {
    var ignoreGidBlob = localStorage["ignoreGidBlob"];
    var ignoreGid = ignoreGidBlob ? JSON.parse(ignoreGidBlob) : {};
    
    delete ignoreGid[gid];
    localStorage["ignoreGidBlob"] = JSON.stringify(ignoreGid);
  }
}