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

DOMSnitch.Scanner.Origin = function() {
  this._checks = {
    "doc.domain": this._checkDomain.bind(this)
  };
}

DOMSnitch.Scanner.Origin.prototype = new DOMSnitch.Scanner.Base;

DOMSnitch.Scanner.Origin.prototype._checkDomain = function(record) {
  var code = DOMSnitch.Scanner.STATUS.NONE;
  var notes = "";

  var location = this._extractLocation(record.env.location);
  if(record.data != location.hostname) {
    code = DOMSnitch.Scanner.STATUS.MED;
    notes = "Attempted change of document.domain from ";
    notes += location.hostname + " to " + record.data + ".\n";
  }
  
  return {code: code, notes: notes};
}