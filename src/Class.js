/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Copyright 2012, 2013 Matthew Jaquish
Licensed under the Apache License, Version 2.0
http://www.apache.org/licenses/LICENSE-2.0
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

/*
 * A standard way of defining instantiated objects based on composition and
 * delegation.
 *
 * Based on Core's core.Class object with minor changes. See attributions.md.
 */
(function () {

    /** {=Integer} A count used in creating unique instance IDs of classes. */
    var count = 0;

    var Class = null;

    /**
     * {String} Returns a useful value to use in class checking.
     */
    function classToString() {
        return '[class ' + this.className + ']';
    }

    /**
     * Check for mixin conflicts between each {shibui.Class} in the
     * @include {Array[shibui.Class]} using @members {Object} of the class with
     * @name {String}.
     */
    function checkMixinMemberConflicts(include, members, name) {
        var i = 0;
        var l = include.length;
        var j = 0;
        var jl = 0;
        var allIncludedMembers = {};
        var includedClass = null;
        var includedMembers = null;
        var key = null;
        var privatePrefix = '__';

        members = members || {};

        for ( ; i < l; i += 1 ) {

            includedClass = include[i];
            includedMembers = Object.keys(includedClass.prototype);

            for ( jl = includedMembers.length; j < jl; j += 1 ) {

                key = includedMembers[j];

                /*
                 * Check for a private member conflict with the class being
                 * included. This must always fail. A private member is
                 * designated with the prepended double underscore "__".
                 *
                 * Members are allowed to override protected and public
                 * members of a included class.
                 */
                if ( members.hasOwnProperty(key) ) {

                    if ( key.substring(0, 2) == privatePrefix ) {
                        throw new Error("Included class '" +
                            includedClass.className +
                            "' overwrites a private member called '" +
                            key +
                            "' in class '" +
                            name +
                            "'.");
                    }
                }

                /*
                 * Check for a private member conflict between included
                 * classes. This must always fail.
                 */
                if ( allIncludedMembers.hasOwnProperty(key) ) {

                    if ( key.substring(0, 2) == privatePrefix ) {

                        throw new Error("Included class '" +
                            includedClass.className +
                            "' overwrites the private member '" +
                            key +
                            "' of another included class '" +
                            allIncludedMembers[key].className +
                            "' in class '" +
                            name +
                            "'.");
                    }

                    /*
                     * If both included classes have the same function name,
                     * check whether the members has the function as well, since
                     * that may call both of the other functions. Otherwise, we
                     * must fail.
                     */
                    if (key in members &&
                        members[key] instanceof Function &&
                        includedClass.prototype[key] instanceof Function &&
                        allIncludedMembers[key] instanceof Function ) {

                        // This test passes.
                    }
                    else {

                        throw new Error("Included class '" +
                            includedClass.className +
                            "' overwrites the private member '" +
                            key +
                            "' of another included class '" +
                            allIncludedMembers[key].className +
                            "' in class '" +
                            name +
                            "'.");
                    }
                }

                allIncludedMembers[key] = includedClass;
            }
        }
    }

    /**
     * Check for event conflicts between each {shibui.Class} in the
     * @include {Array[shibui.Class]} using @members {Object} of the class with
     * @name {String}.
     */
    function checkMixinEventConflicts(include, events, name) {
        var allIncludedEvents = {};
        var i = 0;
        var l = include.length;
        var includedClass = null;
        var includedEvents = null;
        var eventName = null;

        for ( ; i < l; i += 1 ) {

            includedClass = include[i];
            includedEvents = includedClass.__events;

            for ( eventName in includedEvents ) {
                if ( eventName in allIncludedEvents ) {
                    throw new Error("Included class '" +
                        includedClass.className +
                        "' overwrites an event '" +
                        eventName +
                        "' of another included class '" +
                        allIncludedEvents[eventName].className +
                        "' in class '" +
                        name +
                        "'.");
                }

                allIncludedEvents[eventName] = includedClass;
            }
        }
    }

    /**
     * The main Class object, used to create a new instantiatable class
     * with the @name {String} and @config {Object}.
     */
    shibui.Sys.assign('shibui.Class', function (name, config) {
        var ctor = null;
        var events = null;
        var proto = null;
        var include = null;
        var i = 0;
        var l = 0;
        var includedClass = null;
        var includedMembers = null;
        var includedEvents = null;
        var key = null;
        var members = null;
        var entry = null;
        var implement = null;
        var iface = null;

        /**
         * {String} Utility function to return the string type of a @val {Any}.
         */
        function getType(val) {
            return Object.prototype.toString.call(val).slice(8, -1);
        }

        if ( shibui.Env.isSet('debug') ) {

            // Shares the same naming convention as modules.
            if ( !shibui.Module.isModuleName(name) ) {
                throw new Error("Invalid class name '" + name + "'.");
            }

            if ('ctor' in config) {
                if ( getType(config.ctor) !== 'Function' ) {
                    throw new Error("Invalid constructor in class '" +
                        name + "'.");
                }
            }

            if ('events' in config) {
                if ( getType(config.events) !== 'Object' ) {
                    throw new Error("Invalid events section in class '" +
                        name + "'.");
                }
            }

            if ('members' in config) {
                if ( getType(config.members) !== 'Object' ) {
                    throw new Error("Invalid members section in class '" +
                        name + "'.");
                }
            }

            if ('include' in config) {
                if ( getType(config.include) !== 'Array' ) {
                    throw new Error("Invalid include list in class '" +
                        name + "'.");
                }
            }

            if ('implement' in config) {
                if ( getType(config.implement) !== 'Array' ) {
                    throw new Error("Invalid implement list in class '" +
                        name + "'.");
                }
            }
        }


        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Constructor.
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

        /*
         * Set up the new class's constructor. Use the provided function, or
         * default to an empty one.
         */
         ctor = config.ctor || function () {};

         ctor.className   = name;
         ctor.displayName = name;
         ctor.__isClass   = true;
         ctor.toString    = classToString;
         ctor.valueOf     = classToString;

         events = ctor.__events = config.events || {};

         proto = ctor.prototype;
         proto.toString = function () {
            return '[' + this.ctor.className + '-' + this.getId() + ']';
         };


        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Mixins.
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

        include = config.include;

        if (include) {
            if (shibui.Env.isSet('debug')) {
                for (i = 0, l = include.length; i < l; i += 1) {
                    includedClass = include[i];
                    shibui.Class.assertIsClass(includedClass, "Class " +
                        name + " includes an invalid class " + includedClass);
                }

                checkMixinMemberConflicts(include, config.members, name);
                checkMixinEventConflicts(include, config.members, name);
            }

            ctor.__includes = include;

            for (i = 0, l = include.length; i < l; i += 1) {
                includedClass = include[i];

                // Flatten includes of the included class into this class.
                if (includedClass.__includes) {
                    include.push.apply(include, includedClass.__includes);
                }


                // Remap the members from included class into the new class.
                includedMembers = includedClass.prototype;

                for (key in includedMembers) {
                    proto[key] = includedMembers[key];
                }

                // Copy events data.
                includedEvents = includedClass.__events;

                for (key in includedEvents) {
                    events[key] = includedEvents[key];
                }
            }
        }


        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Members.
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

        members = config.members;

        if (members) {

            for (key in members) {
                entry = proto[key] = members[key];
                if (entry instanceof Function) {
                    entry.displayName = name + '.' + key;
                }
            }

        }


        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Interfaces.
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

        if (shibui.Env.isSet('debug')) {
            implement = config.implement;

            if (implement) {

                for (i = 0, l = implement.length; i < l; i += 1) {
                    iface = implement[i];

                    if (!iface) {
                        throw new Error(
                            "Class " +
                            name +
                            " implements an invalid interface " +
                            iface +
                            " at position: " +
                            i);
                    }

                    try {
                        shibui.Interface.assert(ctor, iface);
                    }
                    catch (e) {
                        throw new Error(
                            "Class " +
                            name +
                            " fails to implement the interface: " +
                            iface +
                            ": " +
                            e);
                    }
                }
            }
        }


        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Finalize.
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

        shibui.Sys.assign(name, ctor);

        // Prevent changes to the prototype.
        if (shibui.Env.isSet('debug')) {
            Object.seal(ctor.prototype);
        }
    });


    Class = shibui.Class;

    /**
     * {Boolean} Checks whether or not the @obj {Object} is a {shibui.Class}.
     */
    function isClass(obj) {
        return !!(obj && typeof obj == 'function' && obj.__isClass);
    }

    function assertIsClass(obj, msg) {
        if (!isClass(obj)) {
            throw new Error(msg || "Invalid class: " + obj);
        }
    }

    /**
     * {shibui.Class} Uses @name {String} to find a {shibui.Class}.
     */
    function getByName(name) {
        var obj = null;

        if (shibui.Env.isSet('debug')) {
            shibui.Assert.isType(name, 'String');
        }

        obj = shibui.Sys.resolveName(name);
        return isClass(obj) ? obj : null;
    }

    function getEvents(obj) {
        if (shibui.Env.isSet('debug')) {
            shibui.Class.assertIsClass(obj);
        }

        return obj.__events;
    }

    function includesClass(obj, included) {
        var includes = null;

        if (shibui.Env.isSet('debug')) {
            shibui.Class.assertIsClass(obj,
                "The class you want to check is not a class: " + obj);
            shibui.Class.assertIsClass(included,
                "You wanted to see if " + included + " was included in " +
                obj + ", but it wasn't a class.");
        }

        includes = obj.__includes;
        return includes && (includes.indexOf(included) != -1);
    }

    shibui.Sys.addStatics('shibui.Class', {
        isClass      : isClass,
        assertIsClass: assertIsClass,
        getByName    : getByName,
        getEvents    : getEvents,
        includesClass: includesClass
    });

} ());
