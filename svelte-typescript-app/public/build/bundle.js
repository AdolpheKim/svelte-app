
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35730/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_data(text, data) {
        data = '' + data;
        if (text.wholeText !== data)
            text.data = data;
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : options.context || []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    function createCommonjsModule(fn) {
      var module = { exports: {} };
    	return fn(module, module.exports), module.exports;
    }

    var page = createCommonjsModule(function (module, exports) {
    (function (global, factory) {
    	module.exports = factory() ;
    }(commonjsGlobal, (function () {
    var isarray = Array.isArray || function (arr) {
      return Object.prototype.toString.call(arr) == '[object Array]';
    };

    /**
     * Expose `pathToRegexp`.
     */
    var pathToRegexp_1 = pathToRegexp;
    var parse_1 = parse;
    var compile_1 = compile;
    var tokensToFunction_1 = tokensToFunction;
    var tokensToRegExp_1 = tokensToRegExp;

    /**
     * The main path matching regexp utility.
     *
     * @type {RegExp}
     */
    var PATH_REGEXP = new RegExp([
      // Match escaped characters that would otherwise appear in future matches.
      // This allows the user to escape special characters that won't transform.
      '(\\\\.)',
      // Match Express-style parameters and un-named parameters with a prefix
      // and optional suffixes. Matches appear as:
      //
      // "/:test(\\d+)?" => ["/", "test", "\d+", undefined, "?", undefined]
      // "/route(\\d+)"  => [undefined, undefined, undefined, "\d+", undefined, undefined]
      // "/*"            => ["/", undefined, undefined, undefined, undefined, "*"]
      '([\\/.])?(?:(?:\\:(\\w+)(?:\\(((?:\\\\.|[^()])+)\\))?|\\(((?:\\\\.|[^()])+)\\))([+*?])?|(\\*))'
    ].join('|'), 'g');

    /**
     * Parse a string for the raw tokens.
     *
     * @param  {String} str
     * @return {Array}
     */
    function parse (str) {
      var tokens = [];
      var key = 0;
      var index = 0;
      var path = '';
      var res;

      while ((res = PATH_REGEXP.exec(str)) != null) {
        var m = res[0];
        var escaped = res[1];
        var offset = res.index;
        path += str.slice(index, offset);
        index = offset + m.length;

        // Ignore already escaped sequences.
        if (escaped) {
          path += escaped[1];
          continue
        }

        // Push the current path onto the tokens.
        if (path) {
          tokens.push(path);
          path = '';
        }

        var prefix = res[2];
        var name = res[3];
        var capture = res[4];
        var group = res[5];
        var suffix = res[6];
        var asterisk = res[7];

        var repeat = suffix === '+' || suffix === '*';
        var optional = suffix === '?' || suffix === '*';
        var delimiter = prefix || '/';
        var pattern = capture || group || (asterisk ? '.*' : '[^' + delimiter + ']+?');

        tokens.push({
          name: name || key++,
          prefix: prefix || '',
          delimiter: delimiter,
          optional: optional,
          repeat: repeat,
          pattern: escapeGroup(pattern)
        });
      }

      // Match any characters still remaining.
      if (index < str.length) {
        path += str.substr(index);
      }

      // If the path exists, push it onto the end.
      if (path) {
        tokens.push(path);
      }

      return tokens
    }

    /**
     * Compile a string to a template function for the path.
     *
     * @param  {String}   str
     * @return {Function}
     */
    function compile (str) {
      return tokensToFunction(parse(str))
    }

    /**
     * Expose a method for transforming tokens into the path function.
     */
    function tokensToFunction (tokens) {
      // Compile all the tokens into regexps.
      var matches = new Array(tokens.length);

      // Compile all the patterns before compilation.
      for (var i = 0; i < tokens.length; i++) {
        if (typeof tokens[i] === 'object') {
          matches[i] = new RegExp('^' + tokens[i].pattern + '$');
        }
      }

      return function (obj) {
        var path = '';
        var data = obj || {};

        for (var i = 0; i < tokens.length; i++) {
          var token = tokens[i];

          if (typeof token === 'string') {
            path += token;

            continue
          }

          var value = data[token.name];
          var segment;

          if (value == null) {
            if (token.optional) {
              continue
            } else {
              throw new TypeError('Expected "' + token.name + '" to be defined')
            }
          }

          if (isarray(value)) {
            if (!token.repeat) {
              throw new TypeError('Expected "' + token.name + '" to not repeat, but received "' + value + '"')
            }

            if (value.length === 0) {
              if (token.optional) {
                continue
              } else {
                throw new TypeError('Expected "' + token.name + '" to not be empty')
              }
            }

            for (var j = 0; j < value.length; j++) {
              segment = encodeURIComponent(value[j]);

              if (!matches[i].test(segment)) {
                throw new TypeError('Expected all "' + token.name + '" to match "' + token.pattern + '", but received "' + segment + '"')
              }

              path += (j === 0 ? token.prefix : token.delimiter) + segment;
            }

            continue
          }

          segment = encodeURIComponent(value);

          if (!matches[i].test(segment)) {
            throw new TypeError('Expected "' + token.name + '" to match "' + token.pattern + '", but received "' + segment + '"')
          }

          path += token.prefix + segment;
        }

        return path
      }
    }

    /**
     * Escape a regular expression string.
     *
     * @param  {String} str
     * @return {String}
     */
    function escapeString (str) {
      return str.replace(/([.+*?=^!:${}()[\]|\/])/g, '\\$1')
    }

    /**
     * Escape the capturing group by escaping special characters and meaning.
     *
     * @param  {String} group
     * @return {String}
     */
    function escapeGroup (group) {
      return group.replace(/([=!:$\/()])/g, '\\$1')
    }

    /**
     * Attach the keys as a property of the regexp.
     *
     * @param  {RegExp} re
     * @param  {Array}  keys
     * @return {RegExp}
     */
    function attachKeys (re, keys) {
      re.keys = keys;
      return re
    }

    /**
     * Get the flags for a regexp from the options.
     *
     * @param  {Object} options
     * @return {String}
     */
    function flags (options) {
      return options.sensitive ? '' : 'i'
    }

    /**
     * Pull out keys from a regexp.
     *
     * @param  {RegExp} path
     * @param  {Array}  keys
     * @return {RegExp}
     */
    function regexpToRegexp (path, keys) {
      // Use a negative lookahead to match only capturing groups.
      var groups = path.source.match(/\((?!\?)/g);

      if (groups) {
        for (var i = 0; i < groups.length; i++) {
          keys.push({
            name: i,
            prefix: null,
            delimiter: null,
            optional: false,
            repeat: false,
            pattern: null
          });
        }
      }

      return attachKeys(path, keys)
    }

    /**
     * Transform an array into a regexp.
     *
     * @param  {Array}  path
     * @param  {Array}  keys
     * @param  {Object} options
     * @return {RegExp}
     */
    function arrayToRegexp (path, keys, options) {
      var parts = [];

      for (var i = 0; i < path.length; i++) {
        parts.push(pathToRegexp(path[i], keys, options).source);
      }

      var regexp = new RegExp('(?:' + parts.join('|') + ')', flags(options));

      return attachKeys(regexp, keys)
    }

    /**
     * Create a path regexp from string input.
     *
     * @param  {String} path
     * @param  {Array}  keys
     * @param  {Object} options
     * @return {RegExp}
     */
    function stringToRegexp (path, keys, options) {
      var tokens = parse(path);
      var re = tokensToRegExp(tokens, options);

      // Attach keys back to the regexp.
      for (var i = 0; i < tokens.length; i++) {
        if (typeof tokens[i] !== 'string') {
          keys.push(tokens[i]);
        }
      }

      return attachKeys(re, keys)
    }

    /**
     * Expose a function for taking tokens and returning a RegExp.
     *
     * @param  {Array}  tokens
     * @param  {Array}  keys
     * @param  {Object} options
     * @return {RegExp}
     */
    function tokensToRegExp (tokens, options) {
      options = options || {};

      var strict = options.strict;
      var end = options.end !== false;
      var route = '';
      var lastToken = tokens[tokens.length - 1];
      var endsWithSlash = typeof lastToken === 'string' && /\/$/.test(lastToken);

      // Iterate over the tokens and create our regexp string.
      for (var i = 0; i < tokens.length; i++) {
        var token = tokens[i];

        if (typeof token === 'string') {
          route += escapeString(token);
        } else {
          var prefix = escapeString(token.prefix);
          var capture = token.pattern;

          if (token.repeat) {
            capture += '(?:' + prefix + capture + ')*';
          }

          if (token.optional) {
            if (prefix) {
              capture = '(?:' + prefix + '(' + capture + '))?';
            } else {
              capture = '(' + capture + ')?';
            }
          } else {
            capture = prefix + '(' + capture + ')';
          }

          route += capture;
        }
      }

      // In non-strict mode we allow a slash at the end of match. If the path to
      // match already ends with a slash, we remove it for consistency. The slash
      // is valid at the end of a path match, not in the middle. This is important
      // in non-ending mode, where "/test/" shouldn't match "/test//route".
      if (!strict) {
        route = (endsWithSlash ? route.slice(0, -2) : route) + '(?:\\/(?=$))?';
      }

      if (end) {
        route += '$';
      } else {
        // In non-ending mode, we need the capturing groups to match as much as
        // possible by using a positive lookahead to the end or next path segment.
        route += strict && endsWithSlash ? '' : '(?=\\/|$)';
      }

      return new RegExp('^' + route, flags(options))
    }

    /**
     * Normalize the given path string, returning a regular expression.
     *
     * An empty array can be passed in for the keys, which will hold the
     * placeholder key descriptions. For example, using `/user/:id`, `keys` will
     * contain `[{ name: 'id', delimiter: '/', optional: false, repeat: false }]`.
     *
     * @param  {(String|RegExp|Array)} path
     * @param  {Array}                 [keys]
     * @param  {Object}                [options]
     * @return {RegExp}
     */
    function pathToRegexp (path, keys, options) {
      keys = keys || [];

      if (!isarray(keys)) {
        options = keys;
        keys = [];
      } else if (!options) {
        options = {};
      }

      if (path instanceof RegExp) {
        return regexpToRegexp(path, keys)
      }

      if (isarray(path)) {
        return arrayToRegexp(path, keys, options)
      }

      return stringToRegexp(path, keys, options)
    }

    pathToRegexp_1.parse = parse_1;
    pathToRegexp_1.compile = compile_1;
    pathToRegexp_1.tokensToFunction = tokensToFunction_1;
    pathToRegexp_1.tokensToRegExp = tokensToRegExp_1;

    /**
       * Module dependencies.
       */

      

      /**
       * Short-cuts for global-object checks
       */

      var hasDocument = ('undefined' !== typeof document);
      var hasWindow = ('undefined' !== typeof window);
      var hasHistory = ('undefined' !== typeof history);
      var hasProcess = typeof process !== 'undefined';

      /**
       * Detect click event
       */
      var clickEvent = hasDocument && document.ontouchstart ? 'touchstart' : 'click';

      /**
       * To work properly with the URL
       * history.location generated polyfill in https://github.com/devote/HTML5-History-API
       */

      var isLocation = hasWindow && !!(window.history.location || window.location);

      /**
       * The page instance
       * @api private
       */
      function Page() {
        // public things
        this.callbacks = [];
        this.exits = [];
        this.current = '';
        this.len = 0;

        // private things
        this._decodeURLComponents = true;
        this._base = '';
        this._strict = false;
        this._running = false;
        this._hashbang = false;

        // bound functions
        this.clickHandler = this.clickHandler.bind(this);
        this._onpopstate = this._onpopstate.bind(this);
      }

      /**
       * Configure the instance of page. This can be called multiple times.
       *
       * @param {Object} options
       * @api public
       */

      Page.prototype.configure = function(options) {
        var opts = options || {};

        this._window = opts.window || (hasWindow && window);
        this._decodeURLComponents = opts.decodeURLComponents !== false;
        this._popstate = opts.popstate !== false && hasWindow;
        this._click = opts.click !== false && hasDocument;
        this._hashbang = !!opts.hashbang;

        var _window = this._window;
        if(this._popstate) {
          _window.addEventListener('popstate', this._onpopstate, false);
        } else if(hasWindow) {
          _window.removeEventListener('popstate', this._onpopstate, false);
        }

        if (this._click) {
          _window.document.addEventListener(clickEvent, this.clickHandler, false);
        } else if(hasDocument) {
          _window.document.removeEventListener(clickEvent, this.clickHandler, false);
        }

        if(this._hashbang && hasWindow && !hasHistory) {
          _window.addEventListener('hashchange', this._onpopstate, false);
        } else if(hasWindow) {
          _window.removeEventListener('hashchange', this._onpopstate, false);
        }
      };

      /**
       * Get or set basepath to `path`.
       *
       * @param {string} path
       * @api public
       */

      Page.prototype.base = function(path) {
        if (0 === arguments.length) return this._base;
        this._base = path;
      };

      /**
       * Gets the `base`, which depends on whether we are using History or
       * hashbang routing.

       * @api private
       */
      Page.prototype._getBase = function() {
        var base = this._base;
        if(!!base) return base;
        var loc = hasWindow && this._window && this._window.location;

        if(hasWindow && this._hashbang && loc && loc.protocol === 'file:') {
          base = loc.pathname;
        }

        return base;
      };

      /**
       * Get or set strict path matching to `enable`
       *
       * @param {boolean} enable
       * @api public
       */

      Page.prototype.strict = function(enable) {
        if (0 === arguments.length) return this._strict;
        this._strict = enable;
      };


      /**
       * Bind with the given `options`.
       *
       * Options:
       *
       *    - `click` bind to click events [true]
       *    - `popstate` bind to popstate [true]
       *    - `dispatch` perform initial dispatch [true]
       *
       * @param {Object} options
       * @api public
       */

      Page.prototype.start = function(options) {
        var opts = options || {};
        this.configure(opts);

        if (false === opts.dispatch) return;
        this._running = true;

        var url;
        if(isLocation) {
          var window = this._window;
          var loc = window.location;

          if(this._hashbang && ~loc.hash.indexOf('#!')) {
            url = loc.hash.substr(2) + loc.search;
          } else if (this._hashbang) {
            url = loc.search + loc.hash;
          } else {
            url = loc.pathname + loc.search + loc.hash;
          }
        }

        this.replace(url, null, true, opts.dispatch);
      };

      /**
       * Unbind click and popstate event handlers.
       *
       * @api public
       */

      Page.prototype.stop = function() {
        if (!this._running) return;
        this.current = '';
        this.len = 0;
        this._running = false;

        var window = this._window;
        this._click && window.document.removeEventListener(clickEvent, this.clickHandler, false);
        hasWindow && window.removeEventListener('popstate', this._onpopstate, false);
        hasWindow && window.removeEventListener('hashchange', this._onpopstate, false);
      };

      /**
       * Show `path` with optional `state` object.
       *
       * @param {string} path
       * @param {Object=} state
       * @param {boolean=} dispatch
       * @param {boolean=} push
       * @return {!Context}
       * @api public
       */

      Page.prototype.show = function(path, state, dispatch, push) {
        var ctx = new Context(path, state, this),
          prev = this.prevContext;
        this.prevContext = ctx;
        this.current = ctx.path;
        if (false !== dispatch) this.dispatch(ctx, prev);
        if (false !== ctx.handled && false !== push) ctx.pushState();
        return ctx;
      };

      /**
       * Goes back in the history
       * Back should always let the current route push state and then go back.
       *
       * @param {string} path - fallback path to go back if no more history exists, if undefined defaults to page.base
       * @param {Object=} state
       * @api public
       */

      Page.prototype.back = function(path, state) {
        var page = this;
        if (this.len > 0) {
          var window = this._window;
          // this may need more testing to see if all browsers
          // wait for the next tick to go back in history
          hasHistory && window.history.back();
          this.len--;
        } else if (path) {
          setTimeout(function() {
            page.show(path, state);
          });
        } else {
          setTimeout(function() {
            page.show(page._getBase(), state);
          });
        }
      };

      /**
       * Register route to redirect from one path to other
       * or just redirect to another route
       *
       * @param {string} from - if param 'to' is undefined redirects to 'from'
       * @param {string=} to
       * @api public
       */
      Page.prototype.redirect = function(from, to) {
        var inst = this;

        // Define route from a path to another
        if ('string' === typeof from && 'string' === typeof to) {
          page.call(this, from, function(e) {
            setTimeout(function() {
              inst.replace(/** @type {!string} */ (to));
            }, 0);
          });
        }

        // Wait for the push state and replace it with another
        if ('string' === typeof from && 'undefined' === typeof to) {
          setTimeout(function() {
            inst.replace(from);
          }, 0);
        }
      };

      /**
       * Replace `path` with optional `state` object.
       *
       * @param {string} path
       * @param {Object=} state
       * @param {boolean=} init
       * @param {boolean=} dispatch
       * @return {!Context}
       * @api public
       */


      Page.prototype.replace = function(path, state, init, dispatch) {
        var ctx = new Context(path, state, this),
          prev = this.prevContext;
        this.prevContext = ctx;
        this.current = ctx.path;
        ctx.init = init;
        ctx.save(); // save before dispatching, which may redirect
        if (false !== dispatch) this.dispatch(ctx, prev);
        return ctx;
      };

      /**
       * Dispatch the given `ctx`.
       *
       * @param {Context} ctx
       * @api private
       */

      Page.prototype.dispatch = function(ctx, prev) {
        var i = 0, j = 0, page = this;

        function nextExit() {
          var fn = page.exits[j++];
          if (!fn) return nextEnter();
          fn(prev, nextExit);
        }

        function nextEnter() {
          var fn = page.callbacks[i++];

          if (ctx.path !== page.current) {
            ctx.handled = false;
            return;
          }
          if (!fn) return unhandled.call(page, ctx);
          fn(ctx, nextEnter);
        }

        if (prev) {
          nextExit();
        } else {
          nextEnter();
        }
      };

      /**
       * Register an exit route on `path` with
       * callback `fn()`, which will be called
       * on the previous context when a new
       * page is visited.
       */
      Page.prototype.exit = function(path, fn) {
        if (typeof path === 'function') {
          return this.exit('*', path);
        }

        var route = new Route(path, null, this);
        for (var i = 1; i < arguments.length; ++i) {
          this.exits.push(route.middleware(arguments[i]));
        }
      };

      /**
       * Handle "click" events.
       */

      /* jshint +W054 */
      Page.prototype.clickHandler = function(e) {
        if (1 !== this._which(e)) return;

        if (e.metaKey || e.ctrlKey || e.shiftKey) return;
        if (e.defaultPrevented) return;

        // ensure link
        // use shadow dom when available if not, fall back to composedPath()
        // for browsers that only have shady
        var el = e.target;
        var eventPath = e.path || (e.composedPath ? e.composedPath() : null);

        if(eventPath) {
          for (var i = 0; i < eventPath.length; i++) {
            if (!eventPath[i].nodeName) continue;
            if (eventPath[i].nodeName.toUpperCase() !== 'A') continue;
            if (!eventPath[i].href) continue;

            el = eventPath[i];
            break;
          }
        }

        // continue ensure link
        // el.nodeName for svg links are 'a' instead of 'A'
        while (el && 'A' !== el.nodeName.toUpperCase()) el = el.parentNode;
        if (!el || 'A' !== el.nodeName.toUpperCase()) return;

        // check if link is inside an svg
        // in this case, both href and target are always inside an object
        var svg = (typeof el.href === 'object') && el.href.constructor.name === 'SVGAnimatedString';

        // Ignore if tag has
        // 1. "download" attribute
        // 2. rel="external" attribute
        if (el.hasAttribute('download') || el.getAttribute('rel') === 'external') return;

        // ensure non-hash for the same path
        var link = el.getAttribute('href');
        if(!this._hashbang && this._samePath(el) && (el.hash || '#' === link)) return;

        // Check for mailto: in the href
        if (link && link.indexOf('mailto:') > -1) return;

        // check target
        // svg target is an object and its desired value is in .baseVal property
        if (svg ? el.target.baseVal : el.target) return;

        // x-origin
        // note: svg links that are not relative don't call click events (and skip page.js)
        // consequently, all svg links tested inside page.js are relative and in the same origin
        if (!svg && !this.sameOrigin(el.href)) return;

        // rebuild path
        // There aren't .pathname and .search properties in svg links, so we use href
        // Also, svg href is an object and its desired value is in .baseVal property
        var path = svg ? el.href.baseVal : (el.pathname + el.search + (el.hash || ''));

        path = path[0] !== '/' ? '/' + path : path;

        // strip leading "/[drive letter]:" on NW.js on Windows
        if (hasProcess && path.match(/^\/[a-zA-Z]:\//)) {
          path = path.replace(/^\/[a-zA-Z]:\//, '/');
        }

        // same page
        var orig = path;
        var pageBase = this._getBase();

        if (path.indexOf(pageBase) === 0) {
          path = path.substr(pageBase.length);
        }

        if (this._hashbang) path = path.replace('#!', '');

        if (pageBase && orig === path && (!isLocation || this._window.location.protocol !== 'file:')) {
          return;
        }

        e.preventDefault();
        this.show(orig);
      };

      /**
       * Handle "populate" events.
       * @api private
       */

      Page.prototype._onpopstate = (function () {
        var loaded = false;
        if ( ! hasWindow ) {
          return function () {};
        }
        if (hasDocument && document.readyState === 'complete') {
          loaded = true;
        } else {
          window.addEventListener('load', function() {
            setTimeout(function() {
              loaded = true;
            }, 0);
          });
        }
        return function onpopstate(e) {
          if (!loaded) return;
          var page = this;
          if (e.state) {
            var path = e.state.path;
            page.replace(path, e.state);
          } else if (isLocation) {
            var loc = page._window.location;
            page.show(loc.pathname + loc.search + loc.hash, undefined, undefined, false);
          }
        };
      })();

      /**
       * Event button.
       */
      Page.prototype._which = function(e) {
        e = e || (hasWindow && this._window.event);
        return null == e.which ? e.button : e.which;
      };

      /**
       * Convert to a URL object
       * @api private
       */
      Page.prototype._toURL = function(href) {
        var window = this._window;
        if(typeof URL === 'function' && isLocation) {
          return new URL(href, window.location.toString());
        } else if (hasDocument) {
          var anc = window.document.createElement('a');
          anc.href = href;
          return anc;
        }
      };

      /**
       * Check if `href` is the same origin.
       * @param {string} href
       * @api public
       */
      Page.prototype.sameOrigin = function(href) {
        if(!href || !isLocation) return false;

        var url = this._toURL(href);
        var window = this._window;

        var loc = window.location;

        /*
           When the port is the default http port 80 for http, or 443 for
           https, internet explorer 11 returns an empty string for loc.port,
           so we need to compare loc.port with an empty string if url.port
           is the default port 80 or 443.
           Also the comparition with `port` is changed from `===` to `==` because
           `port` can be a string sometimes. This only applies to ie11.
        */
        return loc.protocol === url.protocol &&
          loc.hostname === url.hostname &&
          (loc.port === url.port || loc.port === '' && (url.port == 80 || url.port == 443)); // jshint ignore:line
      };

      /**
       * @api private
       */
      Page.prototype._samePath = function(url) {
        if(!isLocation) return false;
        var window = this._window;
        var loc = window.location;
        return url.pathname === loc.pathname &&
          url.search === loc.search;
      };

      /**
       * Remove URL encoding from the given `str`.
       * Accommodates whitespace in both x-www-form-urlencoded
       * and regular percent-encoded form.
       *
       * @param {string} val - URL component to decode
       * @api private
       */
      Page.prototype._decodeURLEncodedURIComponent = function(val) {
        if (typeof val !== 'string') { return val; }
        return this._decodeURLComponents ? decodeURIComponent(val.replace(/\+/g, ' ')) : val;
      };

      /**
       * Create a new `page` instance and function
       */
      function createPage() {
        var pageInstance = new Page();

        function pageFn(/* args */) {
          return page.apply(pageInstance, arguments);
        }

        // Copy all of the things over. In 2.0 maybe we use setPrototypeOf
        pageFn.callbacks = pageInstance.callbacks;
        pageFn.exits = pageInstance.exits;
        pageFn.base = pageInstance.base.bind(pageInstance);
        pageFn.strict = pageInstance.strict.bind(pageInstance);
        pageFn.start = pageInstance.start.bind(pageInstance);
        pageFn.stop = pageInstance.stop.bind(pageInstance);
        pageFn.show = pageInstance.show.bind(pageInstance);
        pageFn.back = pageInstance.back.bind(pageInstance);
        pageFn.redirect = pageInstance.redirect.bind(pageInstance);
        pageFn.replace = pageInstance.replace.bind(pageInstance);
        pageFn.dispatch = pageInstance.dispatch.bind(pageInstance);
        pageFn.exit = pageInstance.exit.bind(pageInstance);
        pageFn.configure = pageInstance.configure.bind(pageInstance);
        pageFn.sameOrigin = pageInstance.sameOrigin.bind(pageInstance);
        pageFn.clickHandler = pageInstance.clickHandler.bind(pageInstance);

        pageFn.create = createPage;

        Object.defineProperty(pageFn, 'len', {
          get: function(){
            return pageInstance.len;
          },
          set: function(val) {
            pageInstance.len = val;
          }
        });

        Object.defineProperty(pageFn, 'current', {
          get: function(){
            return pageInstance.current;
          },
          set: function(val) {
            pageInstance.current = val;
          }
        });

        // In 2.0 these can be named exports
        pageFn.Context = Context;
        pageFn.Route = Route;

        return pageFn;
      }

      /**
       * Register `path` with callback `fn()`,
       * or route `path`, or redirection,
       * or `page.start()`.
       *
       *   page(fn);
       *   page('*', fn);
       *   page('/user/:id', load, user);
       *   page('/user/' + user.id, { some: 'thing' });
       *   page('/user/' + user.id);
       *   page('/from', '/to')
       *   page();
       *
       * @param {string|!Function|!Object} path
       * @param {Function=} fn
       * @api public
       */

      function page(path, fn) {
        // <callback>
        if ('function' === typeof path) {
          return page.call(this, '*', path);
        }

        // route <path> to <callback ...>
        if ('function' === typeof fn) {
          var route = new Route(/** @type {string} */ (path), null, this);
          for (var i = 1; i < arguments.length; ++i) {
            this.callbacks.push(route.middleware(arguments[i]));
          }
          // show <path> with [state]
        } else if ('string' === typeof path) {
          this['string' === typeof fn ? 'redirect' : 'show'](path, fn);
          // start [options]
        } else {
          this.start(path);
        }
      }

      /**
       * Unhandled `ctx`. When it's not the initial
       * popstate then redirect. If you wish to handle
       * 404s on your own use `page('*', callback)`.
       *
       * @param {Context} ctx
       * @api private
       */
      function unhandled(ctx) {
        if (ctx.handled) return;
        var current;
        var page = this;
        var window = page._window;

        if (page._hashbang) {
          current = isLocation && this._getBase() + window.location.hash.replace('#!', '');
        } else {
          current = isLocation && window.location.pathname + window.location.search;
        }

        if (current === ctx.canonicalPath) return;
        page.stop();
        ctx.handled = false;
        isLocation && (window.location.href = ctx.canonicalPath);
      }

      /**
       * Escapes RegExp characters in the given string.
       *
       * @param {string} s
       * @api private
       */
      function escapeRegExp(s) {
        return s.replace(/([.+*?=^!:${}()[\]|/\\])/g, '\\$1');
      }

      /**
       * Initialize a new "request" `Context`
       * with the given `path` and optional initial `state`.
       *
       * @constructor
       * @param {string} path
       * @param {Object=} state
       * @api public
       */

      function Context(path, state, pageInstance) {
        var _page = this.page = pageInstance || page;
        var window = _page._window;
        var hashbang = _page._hashbang;

        var pageBase = _page._getBase();
        if ('/' === path[0] && 0 !== path.indexOf(pageBase)) path = pageBase + (hashbang ? '#!' : '') + path;
        var i = path.indexOf('?');

        this.canonicalPath = path;
        var re = new RegExp('^' + escapeRegExp(pageBase));
        this.path = path.replace(re, '') || '/';
        if (hashbang) this.path = this.path.replace('#!', '') || '/';

        this.title = (hasDocument && window.document.title);
        this.state = state || {};
        this.state.path = path;
        this.querystring = ~i ? _page._decodeURLEncodedURIComponent(path.slice(i + 1)) : '';
        this.pathname = _page._decodeURLEncodedURIComponent(~i ? path.slice(0, i) : path);
        this.params = {};

        // fragment
        this.hash = '';
        if (!hashbang) {
          if (!~this.path.indexOf('#')) return;
          var parts = this.path.split('#');
          this.path = this.pathname = parts[0];
          this.hash = _page._decodeURLEncodedURIComponent(parts[1]) || '';
          this.querystring = this.querystring.split('#')[0];
        }
      }

      /**
       * Push state.
       *
       * @api private
       */

      Context.prototype.pushState = function() {
        var page = this.page;
        var window = page._window;
        var hashbang = page._hashbang;

        page.len++;
        if (hasHistory) {
            window.history.pushState(this.state, this.title,
              hashbang && this.path !== '/' ? '#!' + this.path : this.canonicalPath);
        }
      };

      /**
       * Save the context state.
       *
       * @api public
       */

      Context.prototype.save = function() {
        var page = this.page;
        if (hasHistory) {
            page._window.history.replaceState(this.state, this.title,
              page._hashbang && this.path !== '/' ? '#!' + this.path : this.canonicalPath);
        }
      };

      /**
       * Initialize `Route` with the given HTTP `path`,
       * and an array of `callbacks` and `options`.
       *
       * Options:
       *
       *   - `sensitive`    enable case-sensitive routes
       *   - `strict`       enable strict matching for trailing slashes
       *
       * @constructor
       * @param {string} path
       * @param {Object=} options
       * @api private
       */

      function Route(path, options, page) {
        var _page = this.page = page || globalPage;
        var opts = options || {};
        opts.strict = opts.strict || _page._strict;
        this.path = (path === '*') ? '(.*)' : path;
        this.method = 'GET';
        this.regexp = pathToRegexp_1(this.path, this.keys = [], opts);
      }

      /**
       * Return route middleware with
       * the given callback `fn()`.
       *
       * @param {Function} fn
       * @return {Function}
       * @api public
       */

      Route.prototype.middleware = function(fn) {
        var self = this;
        return function(ctx, next) {
          if (self.match(ctx.path, ctx.params)) {
            ctx.routePath = self.path;
            return fn(ctx, next);
          }
          next();
        };
      };

      /**
       * Check if this route matches `path`, if so
       * populate `params`.
       *
       * @param {string} path
       * @param {Object} params
       * @return {boolean}
       * @api private
       */

      Route.prototype.match = function(path, params) {
        var keys = this.keys,
          qsIndex = path.indexOf('?'),
          pathname = ~qsIndex ? path.slice(0, qsIndex) : path,
          m = this.regexp.exec(decodeURIComponent(pathname));

        if (!m) return false;

        delete params[0];

        for (var i = 1, len = m.length; i < len; ++i) {
          var key = keys[i - 1];
          var val = this.page._decodeURLEncodedURIComponent(m[i]);
          if (val !== undefined || !(hasOwnProperty.call(params, key.name))) {
            params[key.name] = val;
          }
        }

        return true;
      };


      /**
       * Module exports.
       */

      var globalPage = createPage();
      var page_js = globalPage;
      var default_1 = globalPage;

    page_js.default = default_1;

    return page_js;

    })));
    });

    const landMarks = [
        { id: 'korea', name: '경복궁' },
        { id: 'japan', name: '천황궁' },
        { id: 'china', name: '자금성' },
        { id: 'america', name: '자유의 여신상' },
        { id: 'yeongdeok', name: '해맞이 공원' },
        { id: 'taiwan', name: '타이페이 어세신즈' },
    ];
    let currentScreenId;
    let currentScreenName;
    function ChangeCurrent(id, name) {
        currentScreenId = id;
        currentScreenName = name;
    }
    function LoadCurrent() {
        return [currentScreenId, currentScreenName];
    }

    function styleInject(css, ref) {
      if ( ref === void 0 ) ref = {};
      var insertAt = ref.insertAt;

      if (!css || typeof document === 'undefined') { return; }

      var head = document.head || document.getElementsByTagName('head')[0];
      var style = document.createElement('style');
      style.type = 'text/css';

      if (insertAt === 'top') {
        if (head.firstChild) {
          head.insertBefore(style, head.firstChild);
        } else {
          head.appendChild(style);
        }
      } else {
        head.appendChild(style);
      }

      if (style.styleSheet) {
        style.styleSheet.cssText = css;
      } else {
        style.appendChild(document.createTextNode(css));
      }
    }

    var css_248z$9 = "";
    styleInject(css_248z$9);

    /* src\Item.svelte generated by Svelte v3.37.0 */

    function create_fragment$9(ctx) {
    	let ul1;
    	let img;
    	let img_src_value;
    	let t0;
    	let ul0;
    	let li0;
    	let t1;
    	let t2;
    	let li1;
    	let t3;

    	return {
    		c() {
    			ul1 = element("ul");
    			img = element("img");
    			t0 = space();
    			ul0 = element("ul");
    			li0 = element("li");
    			t1 = text(/*name*/ ctx[0]);
    			t2 = space();
    			li1 = element("li");
    			t3 = text(/*id*/ ctx[1]);
    			if (img.src !== (img_src_value = "./img/" + /*name*/ ctx[0] + ".png")) attr(img, "src", img_src_value);
    			attr(img, "alt", "not found");
    			attr(img, "class", "svelte-1a53o14");
    			attr(ul0, "class", "svelte-1a53o14");
    			attr(ul1, "class", "svelte-1a53o14");
    		},
    		m(target, anchor) {
    			insert(target, ul1, anchor);
    			append(ul1, img);
    			append(ul1, t0);
    			append(ul1, ul0);
    			append(ul0, li0);
    			append(li0, t1);
    			append(ul0, t2);
    			append(ul0, li1);
    			append(li1, t3);
    		},
    		p(ctx, [dirty]) {
    			if (dirty & /*name*/ 1 && img.src !== (img_src_value = "./img/" + /*name*/ ctx[0] + ".png")) {
    				attr(img, "src", img_src_value);
    			}

    			if (dirty & /*name*/ 1) set_data(t1, /*name*/ ctx[0]);
    			if (dirty & /*id*/ 2) set_data(t3, /*id*/ ctx[1]);
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(ul1);
    		}
    	};
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let { name } = $$props;
    	let { id } = $$props;

    	$$self.$$set = $$props => {
    		if ("name" in $$props) $$invalidate(0, name = $$props.name);
    		if ("id" in $$props) $$invalidate(1, id = $$props.id);
    	};

    	return [name, id];
    }

    class Item extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, { name: 0, id: 1 });
    	}
    }

    var css_248z$8 = "";
    styleInject(css_248z$8);

    /* src\Main.svelte generated by Svelte v3.37.0 */

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i].name;
    	child_ctx[3] = list[i].id;
    	return child_ctx;
    }

    // (10:2) {#each landMarks as {name, id}}
    function create_each_block$2(ctx) {
    	let li;
    	let item;
    	let t;
    	let current;
    	let mounted;
    	let dispose;

    	item = new Item({
    			props: { name: /*id*/ ctx[3], id: /*name*/ ctx[2] }
    		});

    	function click_handler() {
    		return /*click_handler*/ ctx[1](/*id*/ ctx[3], /*name*/ ctx[2]);
    	}

    	return {
    		c() {
    			li = element("li");
    			create_component(item.$$.fragment);
    			t = space();
    			attr(li, "href", "/");
    			attr(li, "class", "svelte-vlhi05");
    		},
    		m(target, anchor) {
    			insert(target, li, anchor);
    			mount_component(item, li, null);
    			append(li, t);
    			current = true;

    			if (!mounted) {
    				dispose = listen(li, "click", click_handler);
    				mounted = true;
    			}
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		i(local) {
    			if (current) return;
    			transition_in(item.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(item.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(li);
    			destroy_component(item);
    			mounted = false;
    			dispose();
    		}
    	};
    }

    function create_fragment$8(ctx) {
    	let ul;
    	let current;
    	let each_value = landMarks;
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	return {
    		c() {
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr(ul, "class", "svelte-vlhi05");
    		},
    		m(target, anchor) {
    			insert(target, ul, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			current = true;
    		},
    		p(ctx, [dirty]) {
    			if (dirty & /*onClick, landMarks*/ 1) {
    				each_value = landMarks;
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(ul, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(ul);
    			destroy_each(each_blocks, detaching);
    		}
    	};
    }

    function instance$8($$self) {
    	function onClick(id, name) {
    		ChangeCurrent(id, name);
    		page.show("/info");
    	}

    	const click_handler = (id, name) => onClick(id, name);
    	return [onClick, click_handler];
    }

    class Main extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});
    	}
    }

    let reviewList = [
        { id: 'korea', review: [{ name: "김태훈", review: "음", star: 3, good: true }, { name: "박 앤세일", review: "메우!", star: 5, good: false }] },
        { id: 'japan', review: [{ name: "김태훈", review: "음", star: 5, good: true }] },
        { id: 'china', review: [{ name: "김태훈", review: "음", star: 5, good: true }] },
        { id: 'america', review: [{ name: "김태훈", review: "음", star: 5, good: true }] },
        { id: 'yeongdeok', review: [{ name: "김태훈", review: "별로에요!", star: 0, good: false }] },
        { id: 'taiwan', review: [{ name: "김태훈", review: "별로에요!", star: 4, good: false }] }
    ];
    function addReview(num, n, r, s, g) {
        let rv = {
            name: n,
            review: r,
            star: s,
            good: g
        };
        reviewList[num].review.push(rv);
    }
    function getReview(i) {
        let j;
        for (j = 0; j < reviewList.length; j++) {
            if (reviewList[j].id == i)
                break;
        }
        return [j, reviewList[j].review];
    }

    var css_248z$7 = "";
    styleInject(css_248z$7);

    /* src\ToggleRecommend.svelte generated by Svelte v3.37.0 */

    function create_else_block_1(ctx) {
    	let img;
    	let img_src_value;
    	let mounted;
    	let dispose;

    	return {
    		c() {
    			img = element("img");
    			if (img.src !== (img_src_value = "/img/good.png")) attr(img, "src", img_src_value);
    			attr(img, "alt", "not found");
    			attr(img, "class", "svelte-bpzt4p");
    		},
    		m(target, anchor) {
    			insert(target, img, anchor);

    			if (!mounted) {
    				dispose = listen(img, "click", /*dispatchGoodImage*/ ctx[2]);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d(detaching) {
    			if (detaching) detach(img);
    			mounted = false;
    			dispose();
    		}
    	};
    }

    // (19:0) {#if filledGoodImg}
    function create_if_block_1$1(ctx) {
    	let img;
    	let img_src_value;

    	return {
    		c() {
    			img = element("img");
    			if (img.src !== (img_src_value = "/img/fillgood.png")) attr(img, "src", img_src_value);
    			attr(img, "alt", "not found");
    			attr(img, "class", "svelte-bpzt4p");
    		},
    		m(target, anchor) {
    			insert(target, img, anchor);
    		},
    		p: noop,
    		d(detaching) {
    			if (detaching) detach(img);
    		}
    	};
    }

    // (27:0) {:else}
    function create_else_block$3(ctx) {
    	let img;
    	let img_src_value;
    	let mounted;
    	let dispose;

    	return {
    		c() {
    			img = element("img");
    			if (img.src !== (img_src_value = "/img/bad.png")) attr(img, "src", img_src_value);
    			attr(img, "alt", "not found");
    			attr(img, "class", "svelte-bpzt4p");
    		},
    		m(target, anchor) {
    			insert(target, img, anchor);

    			if (!mounted) {
    				dispose = listen(img, "click", /*dispatchBadImage*/ ctx[3]);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d(detaching) {
    			if (detaching) detach(img);
    			mounted = false;
    			dispose();
    		}
    	};
    }

    // (25:0) {#if filledBadImg}
    function create_if_block$5(ctx) {
    	let img;
    	let img_src_value;

    	return {
    		c() {
    			img = element("img");
    			if (img.src !== (img_src_value = "/img/fillbad.png")) attr(img, "src", img_src_value);
    			attr(img, "alt", "not found");
    			attr(img, "class", "svelte-bpzt4p");
    		},
    		m(target, anchor) {
    			insert(target, img, anchor);
    		},
    		p: noop,
    		d(detaching) {
    			if (detaching) detach(img);
    		}
    	};
    }

    function create_fragment$7(ctx) {
    	let t;
    	let if_block1_anchor;

    	function select_block_type(ctx, dirty) {
    		if (/*filledGoodImg*/ ctx[0]) return create_if_block_1$1;
    		return create_else_block_1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type(ctx);

    	function select_block_type_1(ctx, dirty) {
    		if (/*filledBadImg*/ ctx[1]) return create_if_block$5;
    		return create_else_block$3;
    	}

    	let current_block_type_1 = select_block_type_1(ctx);
    	let if_block1 = current_block_type_1(ctx);

    	return {
    		c() {
    			if_block0.c();
    			t = space();
    			if_block1.c();
    			if_block1_anchor = empty();
    		},
    		m(target, anchor) {
    			if_block0.m(target, anchor);
    			insert(target, t, anchor);
    			if_block1.m(target, anchor);
    			insert(target, if_block1_anchor, anchor);
    		},
    		p(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block0) {
    				if_block0.p(ctx, dirty);
    			} else {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(t.parentNode, t);
    				}
    			}

    			if (current_block_type_1 === (current_block_type_1 = select_block_type_1(ctx)) && if_block1) {
    				if_block1.p(ctx, dirty);
    			} else {
    				if_block1.d(1);
    				if_block1 = current_block_type_1(ctx);

    				if (if_block1) {
    					if_block1.c();
    					if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if_block0.d(detaching);
    			if (detaching) detach(t);
    			if_block1.d(detaching);
    			if (detaching) detach(if_block1_anchor);
    		}
    	};
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { filledGoodImg } = $$props;
    	let { filledBadImg } = $$props;
    	const dispatch = createEventDispatcher();

    	function dispatchGoodImage() {
    		dispatch("message", { goodImg: true, badImg: false });
    	}

    	function dispatchBadImage() {
    		dispatch("message", { goodImg: false, badImg: true });
    	}

    	$$self.$$set = $$props => {
    		if ("filledGoodImg" in $$props) $$invalidate(0, filledGoodImg = $$props.filledGoodImg);
    		if ("filledBadImg" in $$props) $$invalidate(1, filledBadImg = $$props.filledBadImg);
    	};

    	return [filledGoodImg, filledBadImg, dispatchGoodImage, dispatchBadImage];
    }

    class ToggleRecommend extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { filledGoodImg: 0, filledBadImg: 1 });
    	}
    }

    var css_248z$6 = "";
    styleInject(css_248z$6);

    /* src\SetStarPoint.svelte generated by Svelte v3.37.0 */

    function create_fragment$6(ctx) {
    	let img0;
    	let img0_src_value;
    	let t0;
    	let img1;
    	let img1_src_value;
    	let t1;
    	let img2;
    	let img2_src_value;
    	let t2;
    	let img3;
    	let img3_src_value;
    	let t3;
    	let img4;
    	let img4_src_value;
    	let mounted;
    	let dispose;

    	return {
    		c() {
    			img0 = element("img");
    			t0 = space();
    			img1 = element("img");
    			t1 = space();
    			img2 = element("img");
    			t2 = space();
    			img3 = element("img");
    			t3 = space();
    			img4 = element("img");
    			if (img0.src !== (img0_src_value = /*fillStars*/ ctx[0][1])) attr(img0, "src", img0_src_value);
    			attr(img0, "alt", "not found");
    			attr(img0, "class", "svelte-bpzt4p");
    			if (img1.src !== (img1_src_value = /*fillStars*/ ctx[0][2])) attr(img1, "src", img1_src_value);
    			attr(img1, "alt", "not found");
    			attr(img1, "class", "svelte-bpzt4p");
    			if (img2.src !== (img2_src_value = /*fillStars*/ ctx[0][3])) attr(img2, "src", img2_src_value);
    			attr(img2, "alt", "not found");
    			attr(img2, "class", "svelte-bpzt4p");
    			if (img3.src !== (img3_src_value = /*fillStars*/ ctx[0][4])) attr(img3, "src", img3_src_value);
    			attr(img3, "alt", "not found");
    			attr(img3, "class", "svelte-bpzt4p");
    			if (img4.src !== (img4_src_value = /*fillStars*/ ctx[0][5])) attr(img4, "src", img4_src_value);
    			attr(img4, "alt", "not found");
    			attr(img4, "class", "svelte-bpzt4p");
    		},
    		m(target, anchor) {
    			insert(target, img0, anchor);
    			insert(target, t0, anchor);
    			insert(target, img1, anchor);
    			insert(target, t1, anchor);
    			insert(target, img2, anchor);
    			insert(target, t2, anchor);
    			insert(target, img3, anchor);
    			insert(target, t3, anchor);
    			insert(target, img4, anchor);

    			if (!mounted) {
    				dispose = [
    					listen(img0, "click", /*click_handler*/ ctx[3]),
    					listen(img1, "click", /*click_handler_1*/ ctx[4]),
    					listen(img2, "click", /*click_handler_2*/ ctx[5]),
    					listen(img3, "click", /*click_handler_3*/ ctx[6]),
    					listen(img4, "click", /*click_handler_4*/ ctx[7])
    				];

    				mounted = true;
    			}
    		},
    		p(ctx, [dirty]) {
    			if (dirty & /*fillStars*/ 1 && img0.src !== (img0_src_value = /*fillStars*/ ctx[0][1])) {
    				attr(img0, "src", img0_src_value);
    			}

    			if (dirty & /*fillStars*/ 1 && img1.src !== (img1_src_value = /*fillStars*/ ctx[0][2])) {
    				attr(img1, "src", img1_src_value);
    			}

    			if (dirty & /*fillStars*/ 1 && img2.src !== (img2_src_value = /*fillStars*/ ctx[0][3])) {
    				attr(img2, "src", img2_src_value);
    			}

    			if (dirty & /*fillStars*/ 1 && img3.src !== (img3_src_value = /*fillStars*/ ctx[0][4])) {
    				attr(img3, "src", img3_src_value);
    			}

    			if (dirty & /*fillStars*/ 1 && img4.src !== (img4_src_value = /*fillStars*/ ctx[0][5])) {
    				attr(img4, "src", img4_src_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(img0);
    			if (detaching) detach(t0);
    			if (detaching) detach(img1);
    			if (detaching) detach(t1);
    			if (detaching) detach(img2);
    			if (detaching) detach(t2);
    			if (detaching) detach(img3);
    			if (detaching) detach(t3);
    			if (detaching) detach(img4);
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    function instance$6($$self, $$props, $$invalidate) {
    	const dispatch = createEventDispatcher();
    	let { LastStarPoint } = $$props;

    	let fillStars = [
    		"/img/unfill.png",
    		"/img/unfill.png",
    		"/img/unfill.png",
    		"/img/unfill.png",
    		"/img/unfill.png",
    		"/img/unfill.png"
    	];

    	function onClick(index) {
    		if (LastStarPoint == index) index = 0;

    		for (let i = 1; i <= 5; i++) {
    			if (i <= index) $$invalidate(0, fillStars[i] = "/img/fill.png", fillStars); else $$invalidate(0, fillStars[i] = "/img/unfill.png", fillStars);
    		}

    		dispatch("message", { starPoints: index });
    	}

    	const click_handler = () => onClick(1);
    	const click_handler_1 = () => onClick(2);
    	const click_handler_2 = () => onClick(3);
    	const click_handler_3 = () => onClick(4);
    	const click_handler_4 = () => onClick(5);

    	$$self.$$set = $$props => {
    		if ("LastStarPoint" in $$props) $$invalidate(2, LastStarPoint = $$props.LastStarPoint);
    	};

    	return [
    		fillStars,
    		onClick,
    		LastStarPoint,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4
    	];
    }

    class SetStarPoint extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { LastStarPoint: 2 });
    	}
    }

    var css_248z$5 = "";
    styleInject(css_248z$5);

    /* src\Write.svelte generated by Svelte v3.37.0 */

    function create_if_block$4(ctx) {
    	let div;
    	let br0;
    	let t0;
    	let t1;
    	let t2;
    	let br1;
    	let t3;
    	let br2;
    	let t4;
    	let t5;

    	return {
    		c() {
    			div = element("div");
    			br0 = element("br");
    			t0 = text("\r\n            장소 : ");
    			t1 = text(/*name*/ ctx[1]);
    			t2 = space();
    			br1 = element("br");
    			t3 = space();
    			br2 = element("br");
    			t4 = text("\r\n            국가 : ");
    			t5 = text(/*id*/ ctx[0]);
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			append(div, br0);
    			append(div, t0);
    			append(div, t1);
    			append(div, t2);
    			append(div, br1);
    			append(div, t3);
    			append(div, br2);
    			append(div, t4);
    			append(div, t5);
    		},
    		p(ctx, dirty) {
    			if (dirty & /*name*/ 2) set_data(t1, /*name*/ ctx[1]);
    			if (dirty & /*id*/ 1) set_data(t5, /*id*/ ctx[0]);
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    		}
    	};
    }

    function create_fragment$5(ctx) {
    	let div4;
    	let t0;
    	let br0;
    	let t1;
    	let div0;
    	let t2;
    	let input;
    	let t3;
    	let br1;
    	let t4;
    	let div1;
    	let t5;
    	let br2;
    	let t6;
    	let toggler;
    	let t7;
    	let br3;
    	let t8;
    	let div2;
    	let t9;
    	let br4;
    	let t10;
    	let setsp;
    	let t11;
    	let br5;
    	let t12;
    	let div3;
    	let t13;
    	let br6;
    	let t14;
    	let textarea;
    	let t15;
    	let center;
    	let button;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block = /*reviewlist*/ ctx[7] != null && create_if_block$4(ctx);

    	toggler = new ToggleRecommend({
    			props: {
    				filledGoodImg: /*filledGoodImg*/ ctx[3],
    				filledBadImg: /*filledBadImg*/ ctx[4]
    			}
    		});

    	toggler.$on("message", /*callBackRecommend*/ ctx[8]);

    	setsp = new SetStarPoint({
    			props: { LastStarPoint: /*starPoints*/ ctx[5] }
    		});

    	setsp.$on("message", /*callBackStarPoint*/ ctx[9]);

    	return {
    		c() {
    			div4 = element("div");
    			if (if_block) if_block.c();
    			t0 = space();
    			br0 = element("br");
    			t1 = space();
    			div0 = element("div");
    			t2 = text("작성자 이름 :\r\n        ");
    			input = element("input");
    			t3 = space();
    			br1 = element("br");
    			t4 = space();
    			div1 = element("div");
    			t5 = text("추천 :\r\n        ");
    			br2 = element("br");
    			t6 = space();
    			create_component(toggler.$$.fragment);
    			t7 = space();
    			br3 = element("br");
    			t8 = space();
    			div2 = element("div");
    			t9 = text("별점 :\r\n        ");
    			br4 = element("br");
    			t10 = space();
    			create_component(setsp.$$.fragment);
    			t11 = space();
    			br5 = element("br");
    			t12 = space();
    			div3 = element("div");
    			t13 = text("내용 :\r\n        ");
    			br6 = element("br");
    			t14 = space();
    			textarea = element("textarea");
    			t15 = space();
    			center = element("center");
    			button = element("button");
    			button.textContent = "완료";
    			attr(input, "type", "text");
    			attr(input, "placeholder", "EX)홍길동");
    			attr(textarea, "id", "rev");
    			attr(textarea, "class", "svelte-j2bmg0");
    			attr(div4, "id", "BlockWrite");
    			attr(div4, "class", "svelte-j2bmg0");
    		},
    		m(target, anchor) {
    			insert(target, div4, anchor);
    			if (if_block) if_block.m(div4, null);
    			append(div4, t0);
    			append(div4, br0);
    			append(div4, t1);
    			append(div4, div0);
    			append(div0, t2);
    			append(div0, input);
    			set_input_value(input, /*setName*/ ctx[2]);
    			append(div4, t3);
    			append(div4, br1);
    			append(div4, t4);
    			append(div4, div1);
    			append(div1, t5);
    			append(div1, br2);
    			append(div1, t6);
    			mount_component(toggler, div1, null);
    			append(div4, t7);
    			append(div4, br3);
    			append(div4, t8);
    			append(div4, div2);
    			append(div2, t9);
    			append(div2, br4);
    			append(div2, t10);
    			mount_component(setsp, div2, null);
    			append(div4, t11);
    			append(div4, br5);
    			append(div4, t12);
    			append(div4, div3);
    			append(div3, t13);
    			append(div3, br6);
    			append(div3, t14);
    			append(div3, textarea);
    			set_input_value(textarea, /*review*/ ctx[6]);
    			append(div4, t15);
    			append(div4, center);
    			append(center, button);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen(input, "input", /*input_input_handler*/ ctx[11]),
    					listen(textarea, "input", /*textarea_input_handler*/ ctx[12]),
    					listen(button, "click", /*onClick*/ ctx[10])
    				];

    				mounted = true;
    			}
    		},
    		p(ctx, [dirty]) {
    			if (/*reviewlist*/ ctx[7] != null) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$4(ctx);
    					if_block.c();
    					if_block.m(div4, t0);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*setName*/ 4 && input.value !== /*setName*/ ctx[2]) {
    				set_input_value(input, /*setName*/ ctx[2]);
    			}

    			const toggler_changes = {};
    			if (dirty & /*filledGoodImg*/ 8) toggler_changes.filledGoodImg = /*filledGoodImg*/ ctx[3];
    			if (dirty & /*filledBadImg*/ 16) toggler_changes.filledBadImg = /*filledBadImg*/ ctx[4];
    			toggler.$set(toggler_changes);
    			const setsp_changes = {};
    			if (dirty & /*starPoints*/ 32) setsp_changes.LastStarPoint = /*starPoints*/ ctx[5];
    			setsp.$set(setsp_changes);

    			if (dirty & /*review*/ 64) {
    				set_input_value(textarea, /*review*/ ctx[6]);
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(toggler.$$.fragment, local);
    			transition_in(setsp.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(toggler.$$.fragment, local);
    			transition_out(setsp.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div4);
    			if (if_block) if_block.d();
    			destroy_component(toggler);
    			destroy_component(setsp);
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    function instance$5($$self, $$props, $$invalidate) {
    	var __awaiter = this && this.__awaiter || function (thisArg, _arguments, P, generator) {
    		function adopt(value) {
    			return value instanceof P
    			? value
    			: new P(function (resolve) {
    						resolve(value);
    					});
    		}

    		return new (P || (P = Promise))(function (resolve, reject) {
    				function fulfilled(value) {
    					try {
    						step(generator.next(value));
    					} catch(e) {
    						reject(e);
    					}
    				}

    				function rejected(value) {
    					try {
    						step(generator["throw"](value));
    					} catch(e) {
    						reject(e);
    					}
    				}

    				function step(result) {
    					result.done
    					? resolve(result.value)
    					: adopt(result.value).then(fulfilled, rejected);
    				}

    				step((generator = generator.apply(thisArg, _arguments || [])).next());
    			});
    	};

    	let id;
    	let name;
    	let length;
    	let setName;
    	let filledGoodImg = false;
    	let filledBadImg = false;
    	let lastFilledImg;
    	let starPoints = 0;
    	let review;
    	let reviewlist;

    	onMount(() => __awaiter(void 0, void 0, void 0, function* () {
    		$$invalidate(0, [id, name] = LoadCurrent(), id, $$invalidate(1, name));
    		$$invalidate(7, [length, reviewlist] = getReview(id), reviewlist);
    	}));

    	function callBackRecommend(event) {
    		$$invalidate(3, filledGoodImg = event.detail.goodImg);
    		$$invalidate(4, filledBadImg = event.detail.badImg);
    		console.log(filledGoodImg, filledBadImg);
    	}

    	function callBackStarPoint(event) {
    		$$invalidate(5, starPoints = event.detail.starPoints);
    	}

    	function onClick() {
    		if (setName == null) {
    			alert("이름을 작성해주세요.");
    		} else if (!filledGoodImg && !filledBadImg) {
    			alert("추천을 선택하여 주세요");
    		} else {
    			if (review == null) $$invalidate(6, review = "");
    			if (filledGoodImg) lastFilledImg = true; else lastFilledImg = false;
    			addReview(length, setName, review, starPoints, lastFilledImg);
    			page.show("/info");
    		}
    	}

    	function input_input_handler() {
    		setName = this.value;
    		$$invalidate(2, setName);
    	}

    	function textarea_input_handler() {
    		review = this.value;
    		$$invalidate(6, review);
    	}

    	return [
    		id,
    		name,
    		setName,
    		filledGoodImg,
    		filledBadImg,
    		starPoints,
    		review,
    		reviewlist,
    		callBackRecommend,
    		callBackStarPoint,
    		onClick,
    		input_input_handler,
    		textarea_input_handler
    	];
    }

    class Write extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});
    	}
    }

    var css_248z$4 = "";
    styleInject(css_248z$4);

    /* src\recommend.svelte generated by Svelte v3.37.0 */

    function create_else_block$2(ctx) {
    	let img;
    	let img_src_value;

    	return {
    		c() {
    			img = element("img");
    			if (img.src !== (img_src_value = "/img/fillbad.png")) attr(img, "src", img_src_value);
    			attr(img, "alt", "not found");
    			attr(img, "class", "svelte-g7ln0f");
    		},
    		m(target, anchor) {
    			insert(target, img, anchor);
    		},
    		d(detaching) {
    			if (detaching) detach(img);
    		}
    	};
    }

    // (4:0) {#if recommend}
    function create_if_block$3(ctx) {
    	let img;
    	let img_src_value;

    	return {
    		c() {
    			img = element("img");
    			if (img.src !== (img_src_value = "/img/fillgood.png")) attr(img, "src", img_src_value);
    			attr(img, "alt", "not found");
    			attr(img, "class", "svelte-g7ln0f");
    		},
    		m(target, anchor) {
    			insert(target, img, anchor);
    		},
    		d(detaching) {
    			if (detaching) detach(img);
    		}
    	};
    }

    function create_fragment$4(ctx) {
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (/*recommend*/ ctx[0]) return create_if_block$3;
    		return create_else_block$2;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	return {
    		c() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m(target, anchor) {
    			if_block.m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    		},
    		p(ctx, [dirty]) {
    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach(if_block_anchor);
    		}
    	};
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { recommend } = $$props;

    	$$self.$$set = $$props => {
    		if ("recommend" in $$props) $$invalidate(0, recommend = $$props.recommend);
    	};

    	return [recommend];
    }

    class Recommend extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { recommend: 0 });
    	}
    }

    var css_248z$3 = "";
    styleInject(css_248z$3);

    /* src\stars.svelte generated by Svelte v3.37.0 */

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	return child_ctx;
    }

    // (14:4) {:else}
    function create_else_block$1(ctx) {
    	let img;
    	let img_src_value;

    	return {
    		c() {
    			img = element("img");
    			if (img.src !== (img_src_value = "/img/unfill.png")) attr(img, "src", img_src_value);
    			attr(img, "alt", "not found");
    			attr(img, "class", "svelte-7etrb5");
    		},
    		m(target, anchor) {
    			insert(target, img, anchor);
    		},
    		d(detaching) {
    			if (detaching) detach(img);
    		}
    	};
    }

    // (12:4) {#if i == "star"}
    function create_if_block$2(ctx) {
    	let img;
    	let img_src_value;

    	return {
    		c() {
    			img = element("img");
    			if (img.src !== (img_src_value = "/img/fill.png")) attr(img, "src", img_src_value);
    			attr(img, "alt", "not found");
    			attr(img, "class", "svelte-7etrb5");
    		},
    		m(target, anchor) {
    			insert(target, img, anchor);
    		},
    		d(detaching) {
    			if (detaching) detach(img);
    		}
    	};
    }

    // (11:0) {#each starlist.star as i}
    function create_each_block$1(ctx) {
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (/*i*/ ctx[2] == "star") return create_if_block$2;
    		return create_else_block$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	return {
    		c() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m(target, anchor) {
    			if_block.m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    		},
    		p(ctx, dirty) {
    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		d(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach(if_block_anchor);
    		}
    	};
    }

    function create_fragment$3(ctx) {
    	let each_1_anchor;
    	let each_value = /*starlist*/ ctx[0].star;
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	return {
    		c() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert(target, each_1_anchor, anchor);
    		},
    		p(ctx, [dirty]) {
    			if (dirty & /*starlist*/ 1) {
    				each_value = /*starlist*/ ctx[0].star;
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach(each_1_anchor);
    		}
    	};
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { star } = $$props;
    	let starlist = { star: ["", "", "", "", ""] };

    	onMount(() => {
    		for (let i = 0; i < star; i++) {
    			$$invalidate(0, starlist.star[i] = "star", starlist);
    		}
    	});

    	$$self.$$set = $$props => {
    		if ("star" in $$props) $$invalidate(1, star = $$props.star);
    	};

    	return [starlist, star];
    }

    class Stars extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { star: 1 });
    	}
    }

    var css_248z$2 = "";
    styleInject(css_248z$2);

    /* src\Tab.svelte generated by Svelte v3.37.0 */

    function create_else_block(ctx) {
    	let img0;
    	let img0_src_value;
    	let t;
    	let img1;
    	let img1_src_value;
    	let mounted;
    	let dispose;

    	return {
    		c() {
    			img0 = element("img");
    			t = space();
    			img1 = element("img");
    			if (img0.src !== (img0_src_value = "/img/info.png")) attr(img0, "src", img0_src_value);
    			attr(img0, "alt", "not found");
    			attr(img0, "class", "svelte-i2k75g");
    			if (img1.src !== (img1_src_value = "/img/filledreview.png")) attr(img1, "src", img1_src_value);
    			attr(img1, "alt", "not found");
    			attr(img1, "class", "svelte-i2k75g");
    		},
    		m(target, anchor) {
    			insert(target, img0, anchor);
    			insert(target, t, anchor);
    			insert(target, img1, anchor);

    			if (!mounted) {
    				dispose = listen(img0, "click", /*click_handler_1*/ ctx[3]);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d(detaching) {
    			if (detaching) detach(img0);
    			if (detaching) detach(t);
    			if (detaching) detach(img1);
    			mounted = false;
    			dispose();
    		}
    	};
    }

    // (11:0) {#if check == 1}
    function create_if_block$1(ctx) {
    	let img0;
    	let img0_src_value;
    	let t;
    	let img1;
    	let img1_src_value;
    	let mounted;
    	let dispose;

    	return {
    		c() {
    			img0 = element("img");
    			t = space();
    			img1 = element("img");
    			if (img0.src !== (img0_src_value = "/img/filledinfo.png")) attr(img0, "src", img0_src_value);
    			attr(img0, "alt", "not found");
    			attr(img0, "class", "svelte-i2k75g");
    			if (img1.src !== (img1_src_value = "/img/review.png")) attr(img1, "src", img1_src_value);
    			attr(img1, "alt", "not found");
    			attr(img1, "class", "svelte-i2k75g");
    		},
    		m(target, anchor) {
    			insert(target, img0, anchor);
    			insert(target, t, anchor);
    			insert(target, img1, anchor);

    			if (!mounted) {
    				dispose = listen(img1, "click", /*click_handler*/ ctx[2]);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d(detaching) {
    			if (detaching) detach(img0);
    			if (detaching) detach(t);
    			if (detaching) detach(img1);
    			mounted = false;
    			dispose();
    		}
    	};
    }

    function create_fragment$2(ctx) {
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (/*check*/ ctx[0] == 1) return create_if_block$1;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	return {
    		c() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m(target, anchor) {
    			if_block.m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    		},
    		p(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach(if_block_anchor);
    		}
    	};
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { check } = $$props;
    	const dispatch = createEventDispatcher();

    	function dispatchCheck(i) {
    		dispatch("message", { check: i });
    	}

    	const click_handler = () => {
    		dispatchCheck(2);
    	};

    	const click_handler_1 = () => {
    		dispatchCheck(1);
    	};

    	$$self.$$set = $$props => {
    		if ("check" in $$props) $$invalidate(0, check = $$props.check);
    	};

    	return [check, dispatchCheck, click_handler, click_handler_1];
    }

    class Tab extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { check: 0 });
    	}
    }

    var css_248z$1 = "";
    styleInject(css_248z$1);

    /* src\Info.svelte generated by Svelte v3.37.0 */

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[9] = list[i].name;
    	child_ctx[10] = list[i].review;
    	child_ctx[11] = list[i].star;
    	child_ctx[12] = list[i].good;
    	return child_ctx;
    }

    // (58:21) 
    function create_if_block_1(ctx) {
    	let nav;
    	let div0;
    	let img;
    	let img_src_value;
    	let t0;
    	let br;
    	let t1;
    	let div1;
    	let ul;
    	let current;
    	let mounted;
    	let dispose;
    	let each_value = /*Rlist*/ ctx[3];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	return {
    		c() {
    			nav = element("nav");
    			div0 = element("div");
    			img = element("img");
    			t0 = space();
    			br = element("br");
    			t1 = text("`\r\n    ");
    			div1 = element("div");
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			if (img.src !== (img_src_value = "/img/writeReview.png")) attr(img, "src", img_src_value);
    			attr(img, "alt", "not found");
    			attr(img, "class", "svelte-1oal0mu");
    			attr(div0, "id", "btn");
    			attr(div0, "class", "svelte-1oal0mu");
    			attr(ul, "id", "review");
    			attr(ul, "class", "svelte-1oal0mu");
    		},
    		m(target, anchor) {
    			insert(target, nav, anchor);
    			append(nav, div0);
    			append(div0, img);
    			insert(target, t0, anchor);
    			insert(target, br, anchor);
    			insert(target, t1, anchor);
    			insert(target, div1, anchor);
    			append(div1, ul);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = listen(img, "click", /*onClick*/ ctx[4]);
    				mounted = true;
    			}
    		},
    		p(ctx, dirty) {
    			if (dirty & /*Rlist*/ 8) {
    				each_value = /*Rlist*/ ctx[3];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(ul, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(nav);
    			if (detaching) detach(t0);
    			if (detaching) detach(br);
    			if (detaching) detach(t1);
    			if (detaching) detach(div1);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			dispose();
    		}
    	};
    }

    // (47:0) {#if check == 1}
    function create_if_block(ctx) {
    	let div;
    	let ul1;
    	let img;
    	let img_src_value;
    	let t0;
    	let ul0;
    	let li0;
    	let t1;
    	let t2;
    	let t3;
    	let li1;
    	let t4;
    	let t5;

    	return {
    		c() {
    			div = element("div");
    			ul1 = element("ul");
    			img = element("img");
    			t0 = space();
    			ul0 = element("ul");
    			li0 = element("li");
    			t1 = text("장소 : ");
    			t2 = text(/*cName*/ ctx[0]);
    			t3 = space();
    			li1 = element("li");
    			t4 = text("국가 : ");
    			t5 = text(/*id*/ ctx[1]);
    			if (img.src !== (img_src_value = "./img/" + /*id*/ ctx[1] + ".png")) attr(img, "src", img_src_value);
    			attr(img, "alt", "not found");
    			attr(img, "class", "svelte-1oal0mu");
    			attr(ul0, "class", "svelte-1oal0mu");
    			attr(ul1, "id", "info");
    			attr(ul1, "class", "svelte-1oal0mu");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			append(div, ul1);
    			append(ul1, img);
    			append(ul1, t0);
    			append(ul1, ul0);
    			append(ul0, li0);
    			append(li0, t1);
    			append(li0, t2);
    			append(ul0, t3);
    			append(ul0, li1);
    			append(li1, t4);
    			append(li1, t5);
    		},
    		p(ctx, dirty) {
    			if (dirty & /*id*/ 2 && img.src !== (img_src_value = "./img/" + /*id*/ ctx[1] + ".png")) {
    				attr(img, "src", img_src_value);
    			}

    			if (dirty & /*cName*/ 1) set_data(t2, /*cName*/ ctx[0]);
    			if (dirty & /*id*/ 2) set_data(t5, /*id*/ ctx[1]);
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(div);
    		}
    	};
    }

    // (65:12) {#each Rlist as {name, review, star, good}}
    function create_each_block(ctx) {
    	let div1;
    	let ul;
    	let div0;
    	let stars;
    	let t0;
    	let li0;
    	let recommend;
    	let t1;
    	let li1;
    	let h3;
    	let t2_value = /*review*/ ctx[10] + "";
    	let t2;
    	let t3;
    	let li2;
    	let t4_value = /*name*/ ctx[9] + "";
    	let t4;
    	let t5;
    	let current;
    	stars = new Stars({ props: { star: /*star*/ ctx[11] } });
    	recommend = new Recommend({ props: { recommend: /*good*/ ctx[12] } });

    	return {
    		c() {
    			div1 = element("div");
    			ul = element("ul");
    			div0 = element("div");
    			create_component(stars.$$.fragment);
    			t0 = space();
    			li0 = element("li");
    			create_component(recommend.$$.fragment);
    			t1 = space();
    			li1 = element("li");
    			h3 = element("h3");
    			t2 = text(t2_value);
    			t3 = space();
    			li2 = element("li");
    			t4 = text(t4_value);
    			t5 = space();
    			attr(div0, "id", "hms");
    			attr(div0, "class", "svelte-1oal0mu");
    			attr(ul, "id", "rv");
    			attr(ul, "class", "svelte-1oal0mu");
    			attr(div1, "id", "once");
    			attr(div1, "class", "svelte-1oal0mu");
    		},
    		m(target, anchor) {
    			insert(target, div1, anchor);
    			append(div1, ul);
    			append(ul, div0);
    			mount_component(stars, div0, null);
    			append(ul, t0);
    			append(ul, li0);
    			mount_component(recommend, li0, null);
    			append(ul, t1);
    			append(ul, li1);
    			append(li1, h3);
    			append(h3, t2);
    			append(ul, t3);
    			append(ul, li2);
    			append(li2, t4);
    			append(div1, t5);
    			current = true;
    		},
    		p(ctx, dirty) {
    			const stars_changes = {};
    			if (dirty & /*Rlist*/ 8) stars_changes.star = /*star*/ ctx[11];
    			stars.$set(stars_changes);
    			const recommend_changes = {};
    			if (dirty & /*Rlist*/ 8) recommend_changes.recommend = /*good*/ ctx[12];
    			recommend.$set(recommend_changes);
    			if ((!current || dirty & /*Rlist*/ 8) && t2_value !== (t2_value = /*review*/ ctx[10] + "")) set_data(t2, t2_value);
    			if ((!current || dirty & /*Rlist*/ 8) && t4_value !== (t4_value = /*name*/ ctx[9] + "")) set_data(t4, t4_value);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(stars.$$.fragment, local);
    			transition_in(recommend.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(stars.$$.fragment, local);
    			transition_out(recommend.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div1);
    			destroy_component(stars);
    			destroy_component(recommend);
    		}
    	};
    }

    function create_fragment$1(ctx) {
    	let div0;
    	let img;
    	let img_src_value;
    	let t0;
    	let div1;
    	let tab;
    	let t1;
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	let mounted;
    	let dispose;
    	tab = new Tab({ props: { check: /*check*/ ctx[2] } });
    	tab.$on("message", /*callBackcheck*/ ctx[6]);
    	const if_block_creators = [create_if_block, create_if_block_1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*check*/ ctx[2] == 1) return 0;
    		if (/*check*/ ctx[2] == 2) return 1;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	return {
    		c() {
    			div0 = element("div");
    			img = element("img");
    			t0 = space();
    			div1 = element("div");
    			create_component(tab.$$.fragment);
    			t1 = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			if (img.src !== (img_src_value = "/img/back.png")) attr(img, "src", img_src_value);
    			attr(img, "alt", "not found");
    			attr(img, "class", "svelte-1oal0mu");
    			attr(div0, "id", "bt");
    			attr(div0, "class", "svelte-1oal0mu");
    			attr(div1, "id", "tb");
    			attr(div1, "class", "svelte-1oal0mu");
    		},
    		m(target, anchor) {
    			insert(target, div0, anchor);
    			append(div0, img);
    			insert(target, t0, anchor);
    			insert(target, div1, anchor);
    			mount_component(tab, div1, null);
    			insert(target, t1, anchor);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(target, anchor);
    			}

    			insert(target, if_block_anchor, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = listen(img, "click", /*backClick*/ ctx[5]);
    				mounted = true;
    			}
    		},
    		p(ctx, [dirty]) {
    			const tab_changes = {};
    			if (dirty & /*check*/ 4) tab_changes.check = /*check*/ ctx[2];
    			tab.$set(tab_changes);
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if (~current_block_type_index) {
    					if_blocks[current_block_type_index].p(ctx, dirty);
    				}
    			} else {
    				if (if_block) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block = if_blocks[current_block_type_index];

    					if (!if_block) {
    						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block.c();
    					} else {
    						if_block.p(ctx, dirty);
    					}

    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				} else {
    					if_block = null;
    				}
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(tab.$$.fragment, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o(local) {
    			transition_out(tab.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div0);
    			if (detaching) detach(t0);
    			if (detaching) detach(div1);
    			destroy_component(tab);
    			if (detaching) detach(t1);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d(detaching);
    			}

    			if (detaching) detach(if_block_anchor);
    			mounted = false;
    			dispose();
    		}
    	};
    }

    function instance$1($$self, $$props, $$invalidate) {
    	var __awaiter = this && this.__awaiter || function (thisArg, _arguments, P, generator) {
    		function adopt(value) {
    			return value instanceof P
    			? value
    			: new P(function (resolve) {
    						resolve(value);
    					});
    		}

    		return new (P || (P = Promise))(function (resolve, reject) {
    				function fulfilled(value) {
    					try {
    						step(generator.next(value));
    					} catch(e) {
    						reject(e);
    					}
    				}

    				function rejected(value) {
    					try {
    						step(generator["throw"](value));
    					} catch(e) {
    						reject(e);
    					}
    				}

    				function step(result) {
    					result.done
    					? resolve(result.value)
    					: adopt(result.value).then(fulfilled, rejected);
    				}

    				step((generator = generator.apply(thisArg, _arguments || [])).next());
    			});
    	};

    	let cName;
    	let id;
    	let num;
    	let check = 0;
    	let Rlist;

    	onMount(() => __awaiter(void 0, void 0, void 0, function* () {
    		$$invalidate(1, [id, cName] = LoadCurrent(), id, $$invalidate(0, cName));
    		$$invalidate(3, [num, Rlist] = getReview(id), Rlist);
    		$$invalidate(2, check = 1);
    	}));

    	function onClick() {
    		ChangeCurrent(id, cName);
    		page.show("/write");
    	}

    	function backClick() {
    		page.show("/");
    	}

    	function callBackcheck(event) {
    		$$invalidate(2, check = event.detail.check);
    	}

    	return [cName, id, check, Rlist, onClick, backClick, callBackcheck];
    }

    class Info extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});
    	}
    }

    var css_248z = "";
    styleInject(css_248z);

    /* src\App.svelte generated by Svelte v3.37.0 */

    function create_fragment(ctx) {
    	let center0;
    	let t0;
    	let main;
    	let h1;
    	let t2;
    	let center1;
    	let switch_instance;
    	let current;
    	var switch_value = /*page*/ ctx[0];

    	function switch_props(ctx) {
    		return { props: { params: /*params*/ ctx[1] } };
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props(ctx));
    	}

    	return {
    		c() {
    			center0 = element("center");
    			t0 = space();
    			main = element("main");
    			h1 = element("h1");
    			h1.textContent = "SvelteExample";
    			t2 = space();
    			center1 = element("center");
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			attr(h1, "class", "svelte-3xr0af");
    			attr(main, "class", "svelte-3xr0af");
    		},
    		m(target, anchor) {
    			insert(target, center0, anchor);
    			insert(target, t0, anchor);
    			insert(target, main, anchor);
    			append(main, h1);
    			append(main, t2);
    			append(main, center1);

    			if (switch_instance) {
    				mount_component(switch_instance, center1, null);
    			}

    			current = true;
    		},
    		p(ctx, [dirty]) {
    			if (switch_value !== (switch_value = /*page*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props(ctx));
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, center1, null);
    				} else {
    					switch_instance = null;
    				}
    			}
    		},
    		i(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(center0);
    			if (detaching) detach(t0);
    			if (detaching) detach(main);
    			if (switch_instance) destroy_component(switch_instance);
    		}
    	};
    }

    function instance($$self, $$props, $$invalidate) {
    	let page$1;
    	let params;
    	page("/", () => $$invalidate(0, page$1 = Main));
    	page("/info", () => $$invalidate(0, page$1 = Info));
    	page("/write", () => $$invalidate(0, page$1 = Write));
    	page.start();
    	return [page$1, params];
    }

    class App extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance, create_fragment, safe_not_equal, {});
    	}
    }

    const app = new App({
        target: document.body,
        props: {
            name: 'world'
        }
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
