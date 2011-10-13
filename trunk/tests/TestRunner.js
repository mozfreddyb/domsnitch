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

DOMSnitch.TestRunner = function() {
  this._testModules = [];
}

DOMSnitch.TestRunner.prototype = {
  add: function(testsUrl) {
    this._testModules.push(new DOMSnitch.TestModule(testsUrl));
  },
  
  run: function() {
    for(var i = 0; i < this._testModules.length; i++) {
      this._testModules[i].run();
    }
  },
  
  runOnly: function(modName) {
    for(var i = 0; i < this._testModules.length; i++) {
      var mod = this._testModules[i];
      if(mod.name == modName) {
        mod.run();
      }
    }
  }
}

function assertTrue(modName, msg, condition) {
  if(condition) {
    console.debug(modName + ": " + msg + ": PASSED");
  } else {
    console.error(modName + ": " + msg + ": FAILED");
  }
}

function markCovered(func) {
  func.tested = true;
}

function markOmitted(func) {
  func.omitted = true;
}

function checkCoverage(modName, obj) {
  for(child in obj) {
    var func = obj[child];
    if(func instanceof Function) {
      if(func.omitted) {
        console.debug(modName + ": Coverage for " + child + ": OMITTED");
      } else {
        assertTrue(modName, "Coverage for " + child, !!func.tested);
      }
    }
  }
}

testRunner = new DOMSnitch.TestRunner();

//Register all classes for unit testing
document.addEventListener(
  "DOMContentLoaded", 
  function() {
    registerModule("DOMSnitch", DOMSnitch);
  }, 
  true
);


function registerModule(root, obj) {
  for(child in obj) {
    var modName = root + "." + child;
    if(obj[child] instanceof Function) {
      testRunner.add(modName);
    }
    registerModule(modName, obj[child]);
  }
}