/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Copyright 2012, 2013 Matthew Jaquish
Licensed under the Apache License, Version 2.0
http://www.apache.org/licenses/LICENSE-2.0
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

/*
 * A Module-pattern object.
 *
 * Based on Core's core.Module with minor changes. See attributions.md
 */
(function () {

    function isModule(obj) {
        return !!(obj && typeof obj == 'object' && module.__isModule);
    }

    function isModuleName(name) {
        return (/^(([a-z][a-z0-9]*\.)*)([A-Z][a-zA-Z0-9]*)$/).test(name);
    }

    function moduleToString() {
        return '[module ' + this.moduleName + ']';
    }

    shibui.Sys.assign('shibui.Module', function (name, members) {

        if (!shibui.Module.isModuleName(name)) {
            throw new Error("Invalid module name: '" + name + "'!");
        }

        if (members.moduleName === null) {
            members.moduleName = name;
        }

        if (!members.hasOwnProperty('toString')) {
            members.toString = moduleToString;
        }

        if (!members.hasOwnProperty('valueOf')) {
            members.valueOf = moduleToString;
        }

        members.__isModule = true;

        shibui.Sys.assign(name, members);
    });

    shibui.Sys.addStatics('shibui.Module', {
        isModule    : isModule,
        isModuleName: isModuleName
    });

})();
