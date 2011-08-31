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

DOMSnitch.Modules.Base = function() {
}

DOMSnitch.Modules.Base.prototype = {
  _createMethod: function(module, type, target, callback) {
    return function(data) {
      var args = [].slice.call(arguments);
      var handler = module.config[type];
      if(handler && target.capture) {
        var trace = "";
        try {
          module.dummyFunctionThatDoesNotExist();
        } catch(e) {
          trace = e.stack.toString();
        }

        var gid = module.generateGlobalId(type);
        var modifiedArgs = handler(arguments.callee, trace, args.join(" | "), type, gid);
        args = modifiedArgs ? modifiedArgs.split(" | ") : args;
      }
      var retVal = target.origPtr.apply(this, args);
      
      if(callback) {
        callback();
      }
      return retVal;
    };
  },

  _createPropertyGet: function(module, type, target) {
    return function() {
      var data = target.origVal;
      var handler = module.config[type];
      if(handler) {
        var trace = "";
        try {
          module.dummyFunctionThatDoesNotExist();
        } catch(e) {
          trace = e.stack.toString();
        }

        var gid = module.generateGlobalId(type);
        var modifiedData = handler(arguments.callee, trace, data, type + "/get", gid);
        data = modifiedData ? modifiedData : data;
      }
          
      return data;
    };
  },
  
  _createPropertySet: function(module, type, target, callback) {
    return function(data) {
      var handler = module.config[type];
      if(handler) {
        var trace = "";
        try {
          module.dummyFunctionThatDoesNotExist();
        } catch(e) {
          trace = e.stack.toString();
        }

        var gid = module.generateGlobalId(type);
        var modifiedData = handler(arguments.callee, trace, data, type + "/set", gid);
        data = modifiedData ? modifiedData : data;
      }
      
      target.origVal = data;
      
      if(callback) {
        callback();
      }
    };
  },

  _overloadMethod: function(target, type, customPtr, callback) {
    var targetMethod = typeof target == "string" ? this._targets[target] : target;    
    var methodPtr = customPtr ? customPtr : this._createMethod(this, type, targetMethod, callback);
        
    if(targetMethod.funcName) {
      targetMethod.obj[targetMethod.funcName] = methodPtr;      
    }
  },

  _overloadProperty: function(target, type, customGet, customSet, callback) {
    var targetProp = typeof target == "string" ? this._targets[target] : target;
    var getPtr = customGet ? customGet : this._createPropertyGet(this, type, targetProp);
    var setPtr = customSet ? customSet : this._createPropertySet(this, type, targetProp, callback);
    
    
    if(targetProp.propName) {
      var lookupGet = targetProp.obj.__lookupGetter__(targetProp.propName);
      var lookupSet = targetProp.obj.__lookupSetter__(targetProp.propName);

      if(lookupGet || lookupSet) {
        return;
      }
      
      targetProp.origVal = targetProp.obj[targetProp.propName];
      targetProp.obj.__defineGetter__(targetProp.propName, getPtr);
      targetProp.obj.__defineSetter__(targetProp.propName, setPtr);
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