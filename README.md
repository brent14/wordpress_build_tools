# GULP BUILD TOOLS FOR WORDPRESS

## HOW TO USE
This command is used for dev and it provides the following
* live reload of js, css and php
* compiles sass
* compiles js modules
* image optimization
* can add certs for ssl builds

```bash
gulp 
```

This command is used for production before project is pushed live and it provides the following
* clean dist folder
* copy over current src scripts
* minification of js and css
* bust cache of scripts in functions.php

```bash
gulp prod
```
