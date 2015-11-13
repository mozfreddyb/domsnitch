## DOM Snitch - a passive reconnaissance tool inside the DOM ##
  * Written and maintained by [Radoslav Vasilev](http://radi.r-n-d.org) <[radi@google.com](mailto:radi@google.com)>
  * Copyright 2011 Google Inc, rights reserved.
  * Released under terms and conditions of the Apache License, version 2.0.

### What is DOM Snitch? ###
DOM Snitch is an experimental Chrome extension that enables non-security testers identify common bad practices when producing client-side code and security testers gain better understanding of the transformations that occur within the DOM.

### Current capabilities ###
  * Ability to listen to DOM modification and collect debug data about those modifications
  * Ability to sort and group collected information as means to simplify the analysis process of this data
  * Ability to passively detect and mark as errors or warnings some easy to spot security issues, including:
    * Uses of user-controlled data that comes from either URL, referrer, or cookies while constructing DOM where the data is also checked for containing HTML escape characters (i.e. <>”’)
    * Uses of scripts that are not hosted at the application’s domain
    * Uses of scripts that would result in mixed content errors
    * Uses of invalid JSON syntax, resulting in the use of eval() as opposed to a much safer alternative function (e.g. JSON.parse())
  * Ability to export all or subsets of collected data as plain text or through Google Docs
    * Ability to support larger scale deployments through the use of [configuration files](ConfigFiles.md)

### Output ###
All information that is captured by DOM Snitch is displayed inside the activity log, a page that provides testers with the visibility of the DOM modifications that pose a security risk or are repeated continuously. Items in the activity log may be highlighted with:
  * Red: A security bug is spotted.
  * Yellow: An issue that may or may not be a security bug is spotted.
  * Green: An issue that has minimal impact on security is spotted.
  * Gray: Multiple instances of the same modification are spotted.
When hovered over, all modifications colored green, yellow, or red will provide details on why they are highlighted.

### Credits and feedback ###
DOM Snitch is made possible thanks to the contributions of, and valuable feedback from, Google's engineering productivity and information security engineering teams.

If you have any bug reports, questions, suggestions, or concerns regarding the application, the author can be reached at [radi@google.com](mailto:radi@google.com).