## Configuration files in DOM Snitch ##
Starting with version 0.723, DOM Snitch supports the use of configuration files to ensure consistent deployment across multiple running instances of the extension. This document describes the structure of such a file and how it can affect the performance of the tool.

### Field summary ###
The following snippet shows what a configuration file looks like, the supported fields, and sample values that can be provided for those fields.

```
{
  "profile" : "Default",
  "components" : ["DOMSnitch"],
  "scope" : ["*.example.com"],
  "heuristics" : ["httpHeaders", "invalidJson", "mixedContent"],
  "safeOrigins" : ["*.example.com"],
  "ignoreRules" : []
}
```


### Field details ###
This section describes the different fields that can be specified in a configuration file.

#### profile ####
Provides a name for the current configuration profile.
```
"profile" : "Default"
```

#### components ####
Specifies the components that will be enabled by default for all tabs that fall in scope for testing.
```
"components" : ["DOMSnitch"]
```

Supported values:
  * DOMSnitch


#### scope ####
Specifies the scope for testing. URLs are allowed to contain wildcards that will replace all preceding or succeeding alphanumeric, “.”, and “-” characters (e.g. `*`.example.com will correspond to all of its subdomains, recursively including their subdomains as well). If the scope setting is left empty, a catch all rule will apply.
```
"scope" : ["*.example.com"]
```


#### heuristics ####
Specifies the heuristics that will report when DOM Snitch runs.
```
"heuristics" : ["mixedContent", "untrustedCode", "scriptInclusion"]
```


Supported values (case-insensitive):
  * httpHeaders
  * invalidJson
  * mixedContent
  * reflectedInput
  * untrustedCode
  * scriptInclusion


#### safeOrigins ####
Used by the untrustedCode heuristic, this field specifies the origins that are considered trusted for hosting scripts, CSS, and Flash movies.
```
"safeOrigins" : ["*.example.com", "foo.example.com/example/*"]
```


#### ignoreRules ####
Ignore rules provide the ability to filter known issues or known false positives out of all reports that DOM Snitch produces.
```
"ignoreRules" : [
  {
    "url":"http://www.example.com/*",
    "heuristic":"httpHeaders",
    "conditions":"x-frame-options"
  },
  {
    "url" : "*",
    "heuristic" : "reflectedInput",
    "conditions" : "term=(\\w|\\d+)"
  }
]
```

An ignore rule consists of the following pieces:
  * _**url**_
> Defines the scope of this rule. As with the scope field, wildcards are allowed.
  * _**heuristic**_
> Defines the heuristic for which it applies. Supported values are:
    * httpHeaders
    * reflectedInput
  * _**conditions**_
> Specifies the conditions under which a report from the given heuristic will be ignored. The condition statement is heuristic-dependent. The condition values for each heuristic are described below.

##### reflectedInput #####
```
"conditions" : "term=(\\w|\\d+);source=cookie;sink=innerHTML"
```

A condition statement for reflectedInput consists of:
  * _**term**_
> Specifies the value of the data that is rendered inside the DOM. For instance, specifying _term=test_ will ignore findings that report the string “test” being rendered. Simple regular expressions are supported.
  * _**source**_
> Specifies the source from where input data could possibly come. For example, specifying source=cookie will ignore findings where the input comes from cookies.
> Accepted values: cookie, post message, hash, search, referrer
  * _**sink**_
> Specifies the location where data is rendered on screen. Example: sink=innerHTML will filter findings that report data being rendered through the use of innerHTML.
> Accepted values: attribute, innerHTML, text

##### httpHeaders #####
```
"conditions":"x-frame-options,charset"
```


A condition statement for httpHeaders consists of:
  * _**x-frame-options**_
> When set, all findings that report a missing or insecurely set X-Frame-Options HTTP header will be ignored and not reported.
  * _**charset**_
> When set, all findings that report missing character set for a rendered HTML document will be ignored and not reported.