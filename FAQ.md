## Frequently Asked Questions ##

### What issues does it flag? ###
  * Some variants of reflective cross-site scripting
  * Dynamic inclusion of scripts from external domains
  * Mixed content
  * Uses of invalid (or lax) JSON that will force the application to parse it using eval() as opposed to a much safer alternative such as the browser's native JSON parser
  * Assigning document.domain to a value other than the application's hostname


### Are all findings explicitly a bug? ###
No. DOM Snitch highlights findings based on its certainty whether the finding is a bug or if further investigation is necessary. Highlighted findings may be colored:
  * Red: if the issue is a security bug
  * Yellow: if further investigation is needed
  * Green: if the issue has minimal impact on security
  * Gray: if there are multiple instances of the same issue without any impact on security

In addition, hovering over an issue will provide you with details about why it was highlighted.


### Why am I not seeing anything in the activity log? ###
DOM Snitch runs by default with all modules switched off. Please select the modules that you are interested in running and enable passive mode.