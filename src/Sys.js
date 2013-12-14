/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Copyright 2012, 2013 Matthew Jaquish
Licensed under the Apache License, Version 2.0
http://www.apache.org/licenses/LICENSE-2.0
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

/*
 * System-level bootstrap and base functionality.
 *
 * Based on Core's core.Main with modifications. See attributions.md.
 */
(function (root, undefined) {

    // The global root for this module.
    var global = root;

    // The cache of package names for easy lookup.
    var cache = {};

    /*
     * Create a namespaced package on a root.
     */
    function createPkg(name, root) {
        return root[name] = createDict();
    }

    /*
     * Split name by periods and make sure each package level has an object
     * created for it.
     */
    function definePkg(pkg, root) {
        var levels = pkg.split('.');
        var startLevel = root || global;
        var pkgObj = null;

        levels.reduce(function (prevVal, curVal) {
            pkgObj = prevVal[curVal];
            if (typeof pkgObj !== 'object') {
                pkgObj = createPkg(curVal, prevVal);
            }
            return pkgObj;
        }, startLevel);

        return pkgObj;
    }

    function createDict() {
        return Object.create(null);
    }

    /**
     * Assign an object to a package.
     *
     * Example:
     *   var package = 'foo.Zot';
     *   var obj = Zot;
     *   assignObj(package, obj);
     */
    function assign(path, obj, root) {
        var levels = path.split('.');
        var objName = levels.splice(levels.length - 1, 1)[0];
        var pkg = levels.join('.');
        var pkgObj = null;

        // Default to the module's global root.
        root = root || global;

        pkgObj = definePkg(pkg, root);
        pkgObj[objName] = obj;

        cache[path] = obj;

        return obj;
    }

    function mixin(obj) {
        Object.keys(obj.prototype).forEach(function (key) {
            this[key] = obj.prototype[key];
        }, this);

        return this;
    }

    /**
     * Copy the properties from a list of mixin objects to the target.
     */
    function mixinObjs(objs, target) {
        objs.forEach(mixin, target);
        return target;
    }

    function addStatic(obj, staticName, staticItem) {
        Object.defineProperty(obj, staticName, {
            value       : staticItem,
            configurable: true,
            enumerable  : false,
            writeable   : true
        });
    }

    function addStatics(pkg, statics) {
        var pkgObj = cache[pkg];

        if (!pkgObj) {
            throw new Error("Object '" + pkg + "' doesn't exist!");
        }

        Object.keys(statics).forEach(function(name) {
            addStatic(pkgObj, name, statics[name]);
        });
    }

    function resolveName(name) {
        var current = cache[name];
        var splitted = null;
        var i = 0;
        var l = 0;

        if (!current) {
            current = global;

            if (name) {
                splitted = name.split('.');

                for (i = 0, l = splitted.length; i < l; i += 1) {
                    current = current[splitted[i]];

                    if (!current) {
                        current = null;
                        break;
                    }
                }
            }
        }

        return current;
    }


    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Public module.
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    assign('shibui.Sys', {
        definePkg  : definePkg,
        createDict : createDict,
        assign     : assign,
        mixinObjs  : mixinObjs,
        addStatics : addStatics,
        resolveName: resolveName
    });
} (this));
