(function (root, undefined) {
    // The public module object.
    var module  = {};   // the public module object.
    var global  = root; // the global root for this module.

    /*
     * Special object construction properties that are timing sensitive.
     *
     * ctor:
     *   The constructor function.
     *
     * traits:
     *   Other objects that are mixed in to the new object's
     *   prototype, which can be overriden by instance properties.
     */
    var propsRe = /^(ctor|traits)$/;

    function createPkg(name, root) {
        return root[name] = {};
    }

    /**
     * Split name by periods and make sure each package level has an object
     * created for it.
     */
    function definePackage(package, root) {
        var levels = package.split('.');
        var startLevel = root || global; // default to module's global.
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

    /**
     * Assign an an object to a package.
     *
     * Example:
     *   var package = 'foo.Zot';
     *   var obj = Zot;
     *   assignObj(path, obj);
     */
    function assignObj(path, obj, root) {
        var levels = path.split('.');
        var objName = levels.splice(levels.length - 1, 1)[0];
        var pkg = levels.join('.');
        var pkgObj = null;

        // Default to the module's global root.
        root = root || global;

        pkgObj = definePackage(pkg, root);
        pkgObj[objName] = obj;
        return obj;
    }

    function mixin(trait) {
        Object.keys(trait.prototype).forEach(function (key) {
            this[key] = trait.prototype[key];
        }, this);
        return this;
    }

    /**
     * Copy the properties from a list of traits to the target.
     */
    function mixinTraits(traits, target) {
        traits.forEach(mixin, target);
        return target;
    }

    function setupCtor(proto, name, ctor, root) {
        ctor.prototype = proto;
        ctor.name = name.split('.').pop();
        return assignObj(name, ctor, root);
    }

    /*
     * Create a new object type/instance based on the config options that can
     * be used to instantiate new objects.
     */
    function clz(name, cfg) {
        var proto  = {};
        var ctor   = cfg.ctor;
        var traits = cfg.traits;

        if (traits) mixinTraits(traits, proto); // Mixin other objects

        Object.keys(cfg).forEach(function (key) {
            if (key.search(propsRe) > -1) return; // skip the construction props
            proto[key] = cfg[key];                // add proto property
        });

        return setupCtor(proto, name, ctor, root); // set up the constructor
    }

    /*
     * Add a module to a namespace.
     */
    function mod(name, mod) {
        assignObj(name, mod, root);
    }


    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Public module.
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    module.definePackage = definePackage;
    module.assignObj     = assignObj;
    module.clz           = clz;
    module.mod           = mod;

    // Define this module's package and bootstrap itself so others can use it.
    definePackage('shibui', root);
    root['shibui'] = module;
} (this));
