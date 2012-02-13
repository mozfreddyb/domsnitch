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

DOMSnitch.Modules.Base = function() {
}

DOMSnitch.Modules.Base.prototype = {
  _overloadMethod: function(target, type, methodPtr, callback) {
    var targetMethod = typeof target == "string" ? this._targets[target] : target;    
        
    if(targetMethod.funcName) {
      targetMethod.obj[targetMethod.funcName] = methodPtr;      
    }
  },

  generateGlobalId: function() {
    throw Error("generateGlobalId() is not implemented.");
  },

  load: function() {
    throw Error("load() is not implemented.");
  },

  unload: function() {
    throw Error("unload() is not implemented.");
  }
}