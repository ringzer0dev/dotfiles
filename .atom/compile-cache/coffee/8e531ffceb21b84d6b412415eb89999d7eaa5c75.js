(function() {
  var CompositeDisposable, Emitter, Logger, Metrics, os, path, ref, ref1,
    slice = [].slice;

  os = require('os');

  path = require('path');

  ref = require('atom'), CompositeDisposable = ref.CompositeDisposable, Emitter = ref.Emitter;

  ref1 = [], Metrics = ref1[0], Logger = ref1[1];

  window.DEBUG = false;

  module.exports = {
    config: {
      useKite: {
        type: 'boolean',
        "default": true,
        order: 0,
        title: 'Use Kite-powered Completions',
        description: 'Kite is a machine learning powered autocomplete engine.\nChoosing this option will allow you to get more intelligently ranked\ncompletions and other advanced features in addition to the completions\nprovided by Jedi.'
      },
      showDescriptions: {
        type: 'boolean',
        "default": true,
        order: 1,
        title: 'Show Descriptions',
        description: 'Show doc strings from functions, classes, etc.'
      },
      useSnippets: {
        type: 'string',
        "default": 'none',
        order: 2,
        "enum": ['none', 'all', 'required'],
        title: 'Autocomplete Function Parameters',
        description: 'Automatically complete function arguments after typing\nleft parenthesis character. Use completion key to jump between\narguments. See `autocomplete-python:complete-arguments` command if you\nwant to trigger argument completions manually. See README if it does not\nwork for you.'
      },
      pythonPaths: {
        type: 'string',
        "default": '',
        order: 3,
        title: 'Python Executable Paths',
        description: 'Optional semicolon separated list of paths to python\nexecutables (including executable names), where the first one will take\nhigher priority over the last one. By default autocomplete-python will\nautomatically look for virtual environments inside of your project and\ntry to use them as well as try to find global python executable. If you\nuse this config, automatic lookup will have lowest priority.\nUse `$PROJECT` or `$PROJECT_NAME` substitution for project-specific\npaths to point on executables in virtual environments.\nFor example:\n`/Users/name/.virtualenvs/$PROJECT_NAME/bin/python;$PROJECT/venv/bin/python3;/usr/bin/python`.\nSuch config will fall back on `/usr/bin/python` for projects not presented\nwith same name in `.virtualenvs` and without `venv` folder inside of one\nof project folders.\nIf you are using python3 executable while coding for python2 you will get\npython2 completions for some built-ins.'
      },
      extraPaths: {
        type: 'string',
        "default": '',
        order: 4,
        title: 'Extra Paths For Packages',
        description: 'Semicolon separated list of modules to additionally\ninclude for autocomplete. You can use same substitutions as in\n`Python Executable Paths`.\nNote that it still should be valid python package.\nFor example:\n`$PROJECT/env/lib/python2.7/site-packages`\nor\n`/User/name/.virtualenvs/$PROJECT_NAME/lib/python2.7/site-packages`.\nYou don\'t need to specify extra paths for libraries installed with python\nexecutable you use.'
      },
      caseInsensitiveCompletion: {
        type: 'boolean',
        "default": true,
        order: 5,
        title: 'Case Insensitive Completion',
        description: 'The completion is by default case insensitive.'
      },
      triggerCompletionRegex: {
        type: 'string',
        "default": '([\.\ (]|[a-zA-Z_][a-zA-Z0-9_]*)',
        order: 6,
        title: 'Regex To Trigger Autocompletions',
        description: 'By default completions triggered after words, dots, spaces\nand left parenthesis. You will need to restart your editor after changing\nthis.'
      },
      fuzzyMatcher: {
        type: 'boolean',
        "default": true,
        order: 7,
        title: 'Use Fuzzy Matcher For Completions.',
        description: 'Typing `stdr` will match `stderr`.\nFirst character should always match. Uses additional caching thus\ncompletions should be faster. Note that this setting does not affect\nbuilt-in autocomplete-plus provider.'
      },
      outputProviderErrors: {
        type: 'boolean',
        "default": false,
        order: 8,
        title: 'Output Provider Errors',
        description: 'Select if you would like to see the provider errors when\nthey happen. By default they are hidden. Note that critical errors are\nalways shown.'
      },
      outputDebug: {
        type: 'boolean',
        "default": false,
        order: 9,
        title: 'Output Debug Logs',
        description: 'Select if you would like to see debug information in\ndeveloper tools logs. May slow down your editor.'
      },
      showTooltips: {
        type: 'boolean',
        "default": false,
        order: 10,
        title: 'Show Tooltips with information about the object under the cursor',
        description: 'EXPERIMENTAL FEATURE WHICH IS NOT FINISHED YET.\nFeedback and ideas are welcome on github.'
      },
      suggestionPriority: {
        type: 'integer',
        "default": 3,
        minimum: 0,
        maximum: 99,
        order: 11,
        title: 'Suggestion Priority',
        description: 'You can use this to set the priority for autocomplete-python\nsuggestions. For example, you can use lower value to give higher priority\nfor snippets completions which has priority of 2.'
      },
      enableTouchBar: {
        type: 'boolean',
        "default": false,
        order: 12,
        title: 'Enable Touch Bar support',
        description: 'Proof of concept for now, requires tooltips to be enabled and Atom >=1.19.0.'
      }
    },
    installation: null,
    _handleGrammarChangeEvent: function(grammar) {
      var ref2;
      if ((ref2 = grammar.packageName) === 'language-python' || ref2 === 'MagicPython' || ref2 === 'atom-django') {
        this.provider.load();
        this.emitter.emit('did-load-provider');
        return this.disposables.dispose();
      }
    },
    _loadKite: function() {
      var AccountManager, AtomHelper, NodeClient, StateController, checkKiteInstallation, editorCfg, event, firstInstall, install, longRunning, pluginCfg, ref2;
      firstInstall = localStorage.getItem('autocomplete-python.installed') === null;
      localStorage.setItem('autocomplete-python.installed', true);
      longRunning = require('process').uptime() > 10;
      if (firstInstall && longRunning) {
        event = "installed";
      } else if (firstInstall) {
        event = "upgraded";
      } else {
        event = "restarted";
      }
      ref2 = require('kite-installer'), AccountManager = ref2.AccountManager, AtomHelper = ref2.AtomHelper, Metrics = ref2.Metrics, Logger = ref2.Logger, StateController = ref2.StateController, NodeClient = ref2.NodeClient, install = ref2.install;
      if (atom.config.get('kite.loggingLevel')) {
        Logger.LEVEL = Logger.LEVELS[atom.config.get('kite.loggingLevel').toUpperCase()];
      }
      editorCfg = {
        UUID: localStorage.getItem('metrics.userId'),
        name: 'atom'
      };
      pluginCfg = {
        name: 'autocomplete-python'
      };
      Metrics.Tracker.source = 'autocomplete-python';
      Metrics.enabled = atom.config.get('core.telemetryConsent') === 'limited';
      atom.packages.onDidActivatePackage((function(_this) {
        return function(pkg) {
          if (pkg.name === 'kite') {
            return _this.patchKiteCompletions(pkg);
          }
        };
      })(this));
      checkKiteInstallation = (function(_this) {
        return function() {
          var statusBar;
          if (!atom.config.get('autocomplete-python.useKite')) {
            return;
          }
          statusBar = _this.statusBar;
          if (atom.config.get('autocomplete-python.useKite')) {
            return StateController.canInstallKite().then(function() {
              var Install, initialClient, installed, installer, kiteAtom;
              kiteAtom = install.atom();
              Install = install.Install;
              installer = new Install(kiteAtom.autocompletePythonFlow(), {
                path: atom.project.getPaths()[0] || os.homedir()
              }, {
                statusBar: statusBar,
                failureStep: 'termination',
                title: 'Upgrade your autocomplete-python engine'
              });
              initialClient = AccountManager.client;
              AccountManager.client = new NodeClient('alpha.kite.com', -1, '', true);
              atom.workspace.getActivePane().addItem(installer);
              atom.workspace.getActivePane().activateItem(installer);
              installed = false;
              installer.onDidDestroy(function() {
                installed && atom.config.set('autocomplete-python.useKite', installed);
                return AccountManager.client = initialClient;
              });
              installer.onDidUdpdateState(function(state) {
                if (typeof state.install !== 'undefined') {
                  return installed = state.install.done || false;
                }
              });
              installer.on('did-skip-install', function() {
                installed = false;
                return atom.config.set('autocomplete-python.useKite', installed);
              });
              installer.on('not-admin-shown', function() {
                return installed = true;
              });
              installer.on('not-admin-dismissed', function() {
                installed = false;
                return atom.config.set('autocomplete-python.useKite', installed);
              });
              installer.on('headless-error', function(arg) {
                var error, errorView;
                error = arg.error;
                installer.updateState({
                  error: error
                });
                errorView = new kiteAtom.InstallErrorView(installer);
                atom.workspace.getActivePane().addItem(errorView);
                return atom.workspace.getActivePane().activateItem(errorView);
              });
              return installer.start();
            }, function(err) {
              if (typeof err !== 'undefined' && err.type === 'denied') {
                return atom.config.set('autocomplete-python.useKite', false);
              }
            });
          }
        };
      })(this);
      checkKiteInstallation();
      return atom.config.onDidChange('autocomplete-python.useKite', function(arg) {
        var newValue, oldValue;
        newValue = arg.newValue, oldValue = arg.oldValue;
        if (newValue) {
          checkKiteInstallation();
          return AtomHelper.enablePackage();
        } else {
          return AtomHelper.disablePackage();
        }
      });
    },
    load: function() {
      var disposable;
      this.disposables = new CompositeDisposable;
      disposable = atom.workspace.observeTextEditors((function(_this) {
        return function(editor) {
          _this._handleGrammarChangeEvent(editor.getGrammar());
          disposable = editor.onDidChangeGrammar(function(grammar) {
            return _this._handleGrammarChangeEvent(grammar);
          });
          return _this.disposables.add(disposable);
        };
      })(this));
      this.disposables.add(disposable);
      return this._loadKite();
    },
    activate: function(state) {
      var disposable;
      this.emitter = new Emitter;
      this.provider = require('./provider');
      if (typeof atom.packages.hasActivatedInitialPackages === 'function' && atom.packages.hasActivatedInitialPackages()) {
        return this.load();
      } else {
        return disposable = atom.packages.onDidActivateInitialPackages((function(_this) {
          return function() {
            _this.load();
            return disposable.dispose();
          };
        })(this));
      }
    },
    deactivate: function() {
      if (this.provider) {
        this.provider.dispose();
      }
      if (this.installation) {
        return this.installation.destroy();
      }
    },
    getProvider: function() {
      return this.provider;
    },
    getHyperclickProvider: function() {
      return require('./hyperclick-provider');
    },
    consumeSnippets: function(snippetsManager) {
      var disposable;
      return disposable = this.emitter.on('did-load-provider', (function(_this) {
        return function() {
          _this.provider.setSnippetsManager(snippetsManager);
          return disposable.dispose();
        };
      })(this));
    },
    consumeStatusBar: function(statusBar) {
      return this.statusBar = statusBar;
    },
    patchKiteCompletions: function(kite) {
      var getSuggestions;
      if (this.kitePackage != null) {
        return;
      }
      this.kitePackage = kite.mainModule;
      this.kiteProvider = this.kitePackage.completions();
      getSuggestions = this.kiteProvider.getSuggestions;
      return this.kiteProvider.getSuggestions = (function(_this) {
        return function() {
          var args, ref2, ref3;
          args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
          return getSuggestions != null ? (ref2 = getSuggestions.apply(_this.kiteProvider, args)) != null ? (ref3 = ref2.then(function(suggestions) {
            _this.lastKiteSuggestions = suggestions;
            _this.kiteSuggested = suggestions != null;
            return suggestions;
          })) != null ? ref3["catch"](function(err) {
            _this.lastKiteSuggestions = [];
            _this.kiteSuggested = false;
            throw err;
          }) : void 0 : void 0 : void 0;
        };
      })(this);
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3Jvb3QvLmF0b20vcGFja2FnZXMvYXV0b2NvbXBsZXRlLXB5dGhvbi9saWIvbWFpbi5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLGtFQUFBO0lBQUE7O0VBQUEsRUFBQSxHQUFLLE9BQUEsQ0FBUSxJQUFSOztFQUNMLElBQUEsR0FBTyxPQUFBLENBQVEsTUFBUjs7RUFDUCxNQUFpQyxPQUFBLENBQVEsTUFBUixDQUFqQyxFQUFDLDZDQUFELEVBQXNCOztFQUV0QixPQUFvQixFQUFwQixFQUFDLGlCQUFELEVBQVU7O0VBRVYsTUFBTSxDQUFDLEtBQVAsR0FBZTs7RUFDZixNQUFNLENBQUMsT0FBUCxHQUNFO0lBQUEsTUFBQSxFQUNFO01BQUEsT0FBQSxFQUNFO1FBQUEsSUFBQSxFQUFNLFNBQU47UUFDQSxDQUFBLE9BQUEsQ0FBQSxFQUFTLElBRFQ7UUFFQSxLQUFBLEVBQU8sQ0FGUDtRQUdBLEtBQUEsRUFBTyw4QkFIUDtRQUlBLFdBQUEsRUFBYSwwTkFKYjtPQURGO01BU0EsZ0JBQUEsRUFDRTtRQUFBLElBQUEsRUFBTSxTQUFOO1FBQ0EsQ0FBQSxPQUFBLENBQUEsRUFBUyxJQURUO1FBRUEsS0FBQSxFQUFPLENBRlA7UUFHQSxLQUFBLEVBQU8sbUJBSFA7UUFJQSxXQUFBLEVBQWEsZ0RBSmI7T0FWRjtNQWVBLFdBQUEsRUFDRTtRQUFBLElBQUEsRUFBTSxRQUFOO1FBQ0EsQ0FBQSxPQUFBLENBQUEsRUFBUyxNQURUO1FBRUEsS0FBQSxFQUFPLENBRlA7UUFHQSxDQUFBLElBQUEsQ0FBQSxFQUFNLENBQUMsTUFBRCxFQUFTLEtBQVQsRUFBZ0IsVUFBaEIsQ0FITjtRQUlBLEtBQUEsRUFBTyxrQ0FKUDtRQUtBLFdBQUEsRUFBYSx5UkFMYjtPQWhCRjtNQTBCQSxXQUFBLEVBQ0U7UUFBQSxJQUFBLEVBQU0sUUFBTjtRQUNBLENBQUEsT0FBQSxDQUFBLEVBQVMsRUFEVDtR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QSxJQUFVLHdCQUFWO0FBQUEsZUFBQTs7TUFFQSxJQUFDLENBQUEsV0FBRCxHQUFlLElBQUksQ0FBQztNQUNwQixJQUFDLENBQUEsWUFBRCxHQUFnQixJQUFDLENBQUEsV0FBVyxDQUFDLFdBQWIsQ0FBQTtNQUNoQixjQUFBLEdBQWlCLElBQUMsQ0FBQSxZQUFZLENBQUM7YUFDL0IsSUFBQyxDQUFBLFlBQVksQ0FBQyxjQUFkLEdBQStCLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQTtBQUM3QixjQUFBO1VBRDhCOzs7Ozs0QkFNOUIsRUFBRSxLQUFGLEVBTEEsQ0FLUSxTQUFDLEdBQUQ7WUFDTixLQUFDLENBQUEsbUJBQUQsR0FBdUI7WUFDdkIsS0FBQyxDQUFBLGFBQUQsR0FBaUI7QUFDakIsa0JBQU07VUFIQSxDQUxSO1FBRDZCO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQTtJQU5YLENBMVJ0Qjs7QUFSRiIsInNvdXJjZXNDb250ZW50IjpbIm9zID0gcmVxdWlyZSAnb3MnXG5wYXRoID0gcmVxdWlyZSAncGF0aCdcbntDb21wb3NpdGVEaXNwb3NhYmxlLCBFbWl0dGVyfSA9IHJlcXVpcmUgJ2F0b20nXG5cbltNZXRyaWNzLCBMb2dnZXJdID0gW11cblxud2luZG93LkRFQlVHID0gZmFsc2Vcbm1vZHVsZS5leHBvcnRzID1cbiAgY29uZmlnOlxuICAgIHVzZUtpdGU6XG4gICAgICB0eXBlOiAnYm9vbGVhbidcbiAgICAgIGRlZmF1bHQ6IHRydWVcbiAgICAgIG9yZGVyOiAwXG4gICAgICB0aXRsZTogJ1VzZSBLaXRlLXBvd2VyZWQgQ29tcGxldGlvbnMnXG4gICAgICBkZXNjcmlwdGlvbjogJycnS2l0ZSBpcyBhIG1hY2hpbmUgbGVhcm5pbmcgcG93ZXJlZCBhdXRvY29tcGxldGUgZW5naW5lLlxuICAgICAgQ2hvb3NpbmcgdGhpcyBvcHRpb24gd2lsbCBhbGxvdyB5b3UgdG8gZ2V0IG1vcmUgaW50ZWxsaWdlbnRseSByYW5rZWRcbiAgICAgIGNvbXBsZXRpb25zIGFuZCBvdGhlciBhZHZhbmNlZCBmZWF0dXJlcyBpbiBhZGRpdGlvbiB0byB0aGUgY29tcGxldGlvbnNcbiAgICAgIHByb3ZpZGVkIGJ5IEplZGkuJycnXG4gICAgc2hvd0Rlc2NyaXB0aW9uczpcbiAgICAgIHR5cGU6ICdib29sZWFuJ1xuICAgICAgZGVmYXVsdDogdHJ1ZVxuICAgICAgb3JkZXI6IDFcbiAgICAgIHRpdGxlOiAnU2hvdyBEZXNjcmlwdGlvbnMnXG4gICAgICBkZXNjcmlwdGlvbjogJ1Nob3cgZG9jIHN0cmluZ3MgZnJvbSBmdW5jdGlvbnMsIGNsYXNzZXMsIGV0Yy4nXG4gICAgdXNlU25pcHBldHM6XG4gICAgICB0eXBlOiAnc3RyaW5nJ1xuICAgICAgZGVmYXVsdDogJ25vbmUnXG4gICAgICBvcmRlcjogMlxuICAgICAgZW51bTogWydub25lJywgJ2FsbCcsICdyZXF1aXJlZCddXG4gICAgICB0aXRsZTogJ0F1dG9jb21wbGV0ZSBGdW5jdGlvbiBQYXJhbWV0ZXJzJ1xuICAgICAgZGVzY3JpcHRpb246ICcnJ0F1dG9tYXRpY2FsbHkgY29tcGxldGUgZnVuY3Rpb24gYXJndW1lbnRzIGFmdGVyIHR5cGluZ1xuICAgICAgbGVmdCBwYXJlbnRoZXNpcyBjaGFyYWN0ZXIuIFVzZSBjb21wbGV0aW9uIGtleSB0byBqdW1wIGJldHdlZW5cbiAgICAgIGFyZ3VtZW50cy4gU2VlIGBhdXRvY29tcGxldGUtcHl0aG9uOmNvbXBsZXRlLWFyZ3VtZW50c2AgY29tbWFuZCBpZiB5b3VcbiAgICAgIHdhbnQgdG8gdHJpZ2dlciBhcmd1bWVudCBjb21wbGV0aW9ucyBtYW51YWxseS4gU2VlIFJFQURNRSBpZiBpdCBkb2VzIG5vdFxuICAgICAgd29yayBmb3IgeW91LicnJ1xuICAgIHB5dGhvblBhdGhzOlxuICAgICAgdHlwZTogJ3N0cmluZydcbiAgICAgIGRlZmF1bHQ6ICcnXG4gICAgICBvcmRlcjogM1xuICAgICAgdGl0bGU6ICdQeXRob24gRXhlY3V0YWJsZSBQYXRocydcbiAgICAgIGRlc2NyaXB0aW9uOiAnJydPcHRpb25hbCBzZW1pY29sb24gc2VwYXJhdGVkIGxpc3Qgb2YgcGF0aHMgdG8gcHl0aG9uXG4gICAgICBleGVjdXRhYmxlcyAoaW5jbHVkaW5nIGV4ZWN1dGFibGUgbmFtZXMpLCB3aGVyZSB0aGUgZmlyc3Qgb25lIHdpbGwgdGFrZVxuICAgICAgaGlnaGVyIHByaW9yaXR5IG92ZXIgdGhlIGxhc3Qgb25lLiBCeSBkZWZhdWx0IGF1dG9jb21wbGV0ZS1weXRob24gd2lsbFxuICAgICAgYXV0b21hdGljYWxseSBsb29rIGZvciB2aXJ0dWFsIGVudmlyb25tZW50cyBpbnNpZGUgb2YgeW91ciBwcm9qZWN0IGFuZFxuICAgICAgdHJ5IHRvIHVzZSB0aGVtIGFzIHdlbGwgYXMgdHJ5IHRvIGZpbmQgZ2xvYmFsIHB5dGhvbiBleGVjdXRhYmxlLiBJZiB5b3VcbiAgICAgIHVzZSB0aGlzIGNvbmZpZywgYXV0b21hdGljIGxvb2t1cCB3aWxsIGhhdmUgbG93ZXN0IHByaW9yaXR5LlxuICAgICAgVXNlIGAkUFJPSkVDVGAgb3IgYCRQUk9KRUNUX05BTUVgIHN1YnN0aXR1dGlvbiBmb3IgcHJvamVjdC1zcGVjaWZpY1xuICAgICAgcGF0aHMgdG8gcG9pbnQgb24gZXhlY3V0YWJsZXMgaW4gdmlydHVhbCBlbnZpcm9ubWVudHMuXG4gICAgICBGb3IgZXhhbXBsZTpcbiAgICAgIGAvVXNlcnMvbmFtZS8udmlydHVhbGVudnMvJFBST0pFQ1RfTkFNRS9iaW4vcHl0aG9uOyRQUk9KRUNUL3ZlbnYvYmluL3B5dGhvbjM7L3Vzci9iaW4vcHl0aG9uYC5cbiAgICAgIFN1Y2ggY29uZmlnIHdpbGwgZmFsbCBiYWNrIG9uIGAvdXNyL2Jpbi9weXRob25gIGZvciBwcm9qZWN0cyBub3QgcHJlc2VudGVkXG4gICAgICB3aXRoIHNhbWUgbmFtZSBpbiBgLnZpcnR1YWxlbnZzYCBhbmQgd2l0aG91dCBgdmVudmAgZm9sZGVyIGluc2lkZSBvZiBvbmVcbiAgICAgIG9mIHByb2plY3QgZm9sZGVycy5cbiAgICAgIElmIHlvdSBhcmUgdXNpbmcgcHl0aG9uMyBleGVjdXRhYmxlIHdoaWxlIGNvZGluZyBmb3IgcHl0aG9uMiB5b3Ugd2lsbCBnZXRcbiAgICAgIHB5dGhvbjIgY29tcGxldGlvbnMgZm9yIHNvbWUgYnVpbHQtaW5zLicnJ1xuICAgIGV4dHJhUGF0aHM6XG4gICAgICB0eXBlOiAnc3RyaW5nJ1xuICAgICAgZGVmYXVsdDogJydcbiAgICAgIG9yZGVyOiA0XG4gICAgICB0aXRsZTogJ0V4dHJhIFBhdGhzIEZvciBQYWNrYWdlcydcbiAgICAgIGRlc2NyaXB0aW9uOiAnJydTZW1pY29sb24gc2VwYXJhdGVkIGxpc3Qgb2YgbW9kdWxlcyB0byBhZGRpdGlvbmFsbHlcbiAgICAgIGluY2x1ZGUgZm9yIGF1dG9jb21wbGV0ZS4gWW91IGNhbiB1c2Ugc2FtZSBzdWJzdGl0dXRpb25zIGFzIGluXG4gICAgICBgUHl0aG9uIEV4ZWN1dGFibGUgUGF0aHNgLlxuICAgICAgTm90ZSB0aGF0IGl0IHN0aWxsIHNob3VsZCBiZSB2YWxpZCBweXRob24gcGFja2FnZS5cbiAgICAgIEZvciBleGFtcGxlOlxuICAgICAgYCRQUk9KRUNUL2Vudi9saWIvcHl0aG9uMi43L3NpdGUtcGFja2FnZXNgXG4gICAgICBvclxuICAgICAgYC9Vc2VyL25hbWUvLnZpcnR1YWxlbnZzLyRQUk9KRUNUX05BTUUvbGliL3B5dGhvbjIuNy9zaXRlLXBhY2thZ2VzYC5cbiAgICAgIFlvdSBkb24ndCBuZWVkIHRvIHNwZWNpZnkgZXh0cmEgcGF0aHMgZm9yIGxpYnJhcmllcyBpbnN0YWxsZWQgd2l0aCBweXRob25cbiAgICAgIGV4ZWN1dGFibGUgeW91IHVzZS4nJydcbiAgICBjYXNlSW5zZW5zaXRpdmVDb21wbGV0aW9uOlxuICAgICAgdHlwZTogJ2Jvb2xlYW4nXG4gICAgICBkZWZhdWx0OiB0cnVlXG4gICAgICBvcmRlcjogNVxuICAgICAgdGl0bGU6ICdDYXNlIEluc2Vuc2l0aXZlIENvbXBsZXRpb24nXG4gICAgICBkZXNjcmlwdGlvbjogJ1RoZSBjb21wbGV0aW9uIGlzIGJ5IGRlZmF1bHQgY2FzZSBpbnNlbnNpdGl2ZS4nXG4gICAgdHJpZ2dlckNvbXBsZXRpb25SZWdleDpcbiAgICAgIHR5cGU6ICdzdHJpbmcnXG4gICAgICBkZWZhdWx0OiAnKFtcXC5cXCAoXXxbYS16QS1aX11bYS16QS1aMC05X10qKSdcbiAgICAgIG9yZGVyOiA2XG4gICAgICB0aXRsZTogJ1JlZ2V4IFRvIFRyaWdnZXIgQXV0b2NvbXBsZXRpb25zJ1xuICAgICAgZGVzY3JpcHRpb246ICcnJ0J5IGRlZmF1bHQgY29tcGxldGlvbnMgdHJpZ2dlcmVkIGFmdGVyIHdvcmRzLCBkb3RzLCBzcGFjZXNcbiAgICAgIGFuZCBsZWZ0IHBhcmVudGhlc2lzLiBZb3Ugd2lsbCBuZWVkIHRvIHJlc3RhcnQgeW91ciBlZGl0b3IgYWZ0ZXIgY2hhbmdpbmdcbiAgICAgIHRoaXMuJycnXG4gICAgZnV6enlNYXRjaGVyOlxuICAgICAgdHlwZTogJ2Jvb2xlYW4nXG4gICAgICBkZWZhdWx0OiB0cnVlXG4gICAgICBvcmRlcjogN1xuICAgICAgdGl0bGU6ICdVc2UgRnV6enkgTWF0Y2hlciBGb3IgQ29tcGxldGlvbnMuJ1xuICAgICAgZGVzY3JpcHRpb246ICcnJ1R5cGluZyBgc3RkcmAgd2lsbCBtYXRjaCBgc3RkZXJyYC5cbiAgICAgIEZpcnN0IGNoYXJhY3RlciBzaG91bGQgYWx3YXlzIG1hdGNoLiBVc2VzIGFkZGl0aW9uYWwgY2FjaGluZyB0aHVzXG4gICAgICBjb21wbGV0aW9ucyBzaG91bGQgYmUgZmFzdGVyLiBOb3RlIHRoYXQgdGhpcyBzZXR0aW5nIGRvZXMgbm90IGFmZmVjdFxuICAgICAgYnVpbHQtaW4gYXV0b2NvbXBsZXRlLXBsdXMgcHJvdmlkZXIuJycnXG4gICAgb3V0cHV0UHJvdmlkZXJFcnJvcnM6XG4gICAgICB0eXBlOiAnYm9vbGVhbidcbiAgICAgIGRlZmF1bHQ6IGZhbHNlXG4gICAgICBvcmRlcjogOFxuICAgICAgdGl0bGU6ICdPdXRwdXQgUHJvdmlkZXIgRXJyb3JzJ1xuICAgICAgZGVzY3JpcHRpb246ICcnJ1NlbGVjdCBpZiB5b3Ugd291bGQgbGlrZSB0byBzZWUgdGhlIHByb3ZpZGVyIGVycm9ycyB3aGVuXG4gICAgICB0aGV5IGhhcHBlbi4gQnkgZGVmYXVsdCB0aGV5IGFyZSBoaWRkZW4uIE5vdGUgdGhhdCBjcml0aWNhbCBlcnJvcnMgYXJlXG4gICAgICBhbHdheXMgc2hvd24uJycnXG4gICAgb3V0cHV0RGVidWc6XG4gICAgICB0eXBlOiAnYm9vbGVhbidcbiAgICAgIGRlZmF1bHQ6IGZhbHNlXG4gICAgICBvcmRlcjogOVxuICAgICAgdGl0bGU6ICdPdXRwdXQgRGVidWcgTG9ncydcbiAgICAgIGRlc2NyaXB0aW9uOiAnJydTZWxlY3QgaWYgeW91IHdvdWxkIGxpa2UgdG8gc2VlIGRlYnVnIGluZm9ybWF0aW9uIGluXG4gICAgICBkZXZlbG9wZXIgdG9vbHMgbG9ncy4gTWF5IHNsb3cgZG93biB5b3VyIGVkaXRvci4nJydcbiAgICBzaG93VG9vbHRpcHM6XG4gICAgICB0eXBlOiAnYm9vbGVhbidcbiAgICAgIGRlZmF1bHQ6IGZhbHNlXG4gICAgICBvcmRlcjogMTBcbiAgICAgIHRpdGxlOiAnU2hvdyBUb29sdGlwcyB3aXRoIGluZm9ybWF0aW9uIGFib3V0IHRoZSBvYmplY3QgdW5kZXIgdGhlIGN1cnNvcidcbiAgICAgIGRlc2NyaXB0aW9uOiAnJydFWFBFUklNRU5UQUwgRkVBVFVSRSBXSElDSCBJUyBOT1QgRklOSVNIRUQgWUVULlxuICAgICAgRmVlZGJhY2sgYW5kIGlkZWFzIGFyZSB3ZWxjb21lIG9uIGdpdGh1Yi4nJydcbiAgICBzdWdnZXN0aW9uUHJpb3JpdHk6XG4gICAgICB0eXBlOiAnaW50ZWdlcidcbiAgICAgIGRlZmF1bHQ6IDNcbiAgICAgIG1pbmltdW06IDBcbiAgICAgIG1heGltdW06IDk5XG4gICAgICBvcmRlcjogMTFcbiAgICAgIHRpdGxlOiAnU3VnZ2VzdGlvbiBQcmlvcml0eSdcbiAgICAgIGRlc2NyaXB0aW9uOiAnJydZb3UgY2FuIHVzZSB0aGlzIHRvIHNldCB0aGUgcHJpb3JpdHkgZm9yIGF1dG9jb21wbGV0ZS1weXRob25cbiAgICAgIHN1Z2dlc3Rpb25zLiBGb3IgZXhhbXBsZSwgeW91IGNhbiB1c2UgbG93ZXIgdmFsdWUgdG8gZ2l2ZSBoaWdoZXIgcHJpb3JpdHlcbiAgICAgIGZvciBzbmlwcGV0cyBjb21wbGV0aW9ucyB3aGljaCBoYXMgcHJpb3JpdHkgb2YgMi4nJydcbiAgICBlbmFibGVUb3VjaEJhcjpcbiAgICAgIHR5cGU6ICdib29sZWFuJ1xuICAgICAgZGVmYXVsdDogZmFsc2VcbiAgICAgIG9yZGVyOiAxMlxuICAgICAgdGl0bGU6ICdFbmFibGUgVG91Y2ggQmFyIHN1cHBvcnQnXG4gICAgICBkZXNjcmlwdGlvbjogJycnUHJvb2Ygb2YgY29uY2VwdCBmb3Igbm93LCByZXF1aXJlcyB0b29sdGlwcyB0byBiZSBlbmFibGVkIGFuZCBBdG9tID49MS4xOS4wLicnJ1xuXG4gIGluc3RhbGxhdGlvbjogbnVsbFxuXG4gIF9oYW5kbGVHcmFtbWFyQ2hhbmdlRXZlbnQ6IChncmFtbWFyKSAtPlxuICAgICMgdGhpcyBzaG91bGQgYmUgc2FtZSB3aXRoIGFjdGl2YXRpb25Ib29rcyBuYW1lc1xuICAgIGlmIGdyYW1tYXIucGFja2FnZU5hbWUgaW4gWydsYW5ndWFnZS1weXRob24nLCAnTWFnaWNQeXRob24nLCAnYXRvbS1kamFuZ28nXVxuICAgICAgQHByb3ZpZGVyLmxvYWQoKVxuICAgICAgQGVtaXR0ZXIuZW1pdCAnZGlkLWxvYWQtcHJvdmlkZXInXG4gICAgICBAZGlzcG9zYWJsZXMuZGlzcG9zZSgpXG5cbiAgX2xvYWRLaXRlOiAtPlxuICAgIGZpcnN0SW5zdGFsbCA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKCdhdXRvY29tcGxldGUtcHl0aG9uLmluc3RhbGxlZCcpID09IG51bGxcbiAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgnYXV0b2NvbXBsZXRlLXB5dGhvbi5pbnN0YWxsZWQnLCB0cnVlKVxuICAgIGxvbmdSdW5uaW5nID0gcmVxdWlyZSgncHJvY2VzcycpLnVwdGltZSgpID4gMTBcbiAgICBpZiBmaXJzdEluc3RhbGwgYW5kIGxvbmdSdW5uaW5nXG4gICAgICBldmVudCA9IFwiaW5zdGFsbGVkXCJcbiAgICBlbHNlIGlmIGZpcnN0SW5zdGFsbFxuICAgICAgZXZlbnQgPSBcInVwZ3JhZGVkXCJcbiAgICBlbHNlXG4gICAgICBldmVudCA9IFwicmVzdGFydGVkXCJcblxuICAgIHtcbiAgICAgIEFjY291bnRNYW5hZ2VyLFxuICAgICAgQXRvbUhlbHBlcixcbiAgICAgIE1ldHJpY3MsXG4gICAgICBMb2dnZXIsXG4gICAgICBTdGF0ZUNvbnRyb2xsZXIsXG4gICAgICBOb2RlQ2xpZW50LFxuICAgICAgaW5zdGFsbFxuICAgIH0gPSByZXF1aXJlICdraXRlLWluc3RhbGxlcidcblxuICAgIGlmIGF0b20uY29uZmlnLmdldCgna2l0ZS5sb2dnaW5nTGV2ZWwnKVxuICAgICAgTG9nZ2VyLkxFVkVMID0gTG9nZ2VyLkxFVkVMU1thdG9tLmNvbmZpZy5nZXQoJ2tpdGUubG9nZ2luZ0xldmVsJykudG9VcHBlckNhc2UoKV1cblxuICAgIGVkaXRvckNmZyA9XG4gICAgICBVVUlEOiBsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnbWV0cmljcy51c2VySWQnKVxuICAgICAgbmFtZTogJ2F0b20nXG4gICAgcGx1Z2luQ2ZnID1cbiAgICAgIG5hbWU6ICdhdXRvY29tcGxldGUtcHl0aG9uJ1xuXG4gICAgTWV0cmljcy5UcmFja2VyLnNvdXJjZSA9ICdhdXRvY29tcGxldGUtcHl0aG9uJ1xuICAgIE1ldHJpY3MuZW5hYmxlZCA9IGF0b20uY29uZmlnLmdldCgnY29yZS50ZWxlbWV0cnlDb25zZW50JykgaXMgJ2xpbWl0ZWQnXG5cbiAgICBhdG9tLnBhY2thZ2VzLm9uRGlkQWN0aXZhdGVQYWNrYWdlIChwa2cpID0+XG4gICAgICBpZiBwa2cubmFtZSBpcyAna2l0ZSdcbiAgICAgICAgQHBhdGNoS2l0ZUNvbXBsZXRpb25zKHBrZylcblxuICAgIGNoZWNrS2l0ZUluc3RhbGxhdGlvbiA9ICgpID0+XG4gICAgICByZXR1cm4gdW5sZXNzIGF0b20uY29uZmlnLmdldCAnYXV0b2NvbXBsZXRlLXB5dGhvbi51c2VLaXRlJ1xuXG4gICAgICBzdGF0dXNCYXIgPSBAc3RhdHVzQmFyXG5cbiAgICAgIFN0YXRlQ29udHJvbGxlci5jYW5JbnN0YWxsS2l0ZSgpLnRoZW4oKCkgLT5cbiAgICAgICAga2l0ZUF0b20gPSBpbnN0YWxsLmF0b20oKVxuICAgICAgICBJbnN0YWxsID0gaW5zdGFsbC5JbnN0YWxsXG4gICAgICAgIGluc3RhbGxlciA9IG5ldyBJbnN0YWxsKGtpdGVBdG9tLmF1dG9jb21wbGV0ZVB5dGhvbkZsb3coKSwge1xuICAgICAgICAgIHBhdGg6IGF0b20ucHJvamVjdC5nZXRQYXRocygpWzBdIHx8IG9zLmhvbWVkaXIoKSxcbiAgICAgICAgfSwge1xuICAgICAgICAgIHN0YXR1c0Jhcjogc3RhdHVzQmFyLFxuICAgICAgICAgIGZhaWx1cmVTdGVwOiAndGVybWluYXRpb24nLFxuICAgICAgICAgIHRpdGxlOiAnVXBncmFkZSB5b3VyIGF1dG9jb21wbGV0ZS1weXRob24gZW5naW5lJyxcbiAgICAgICAgfSlcblxuICAgICAgICBpbml0aWFsQ2xpZW50ID0gQWNjb3VudE1hbmFnZXIuY2xpZW50XG4gICAgICAgIEFjY291bnRNYW5hZ2VyLmNsaWVudCA9IG5ldyBOb2RlQ2xpZW50KCdhbHBoYS5raXRlLmNvbScsIC0xLCAnJywgdHJ1ZSlcblxuICAgICAgICBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVQYW5lKCkuYWRkSXRlbShpbnN0YWxsZXIpXG4gICAgICAgIGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVBhbmUoKS5hY3RpdmF0ZUl0ZW0oaW5zdGFsbGVyKVxuXG4gICAgICAgIGluc3RhbGxlZCA9IGZhbHNlXG5cbiAgICAgICAgaW5zdGFsbGVyLm9uRGlkRGVzdHJveSgtPlxuICAgICAgICAgIGluc3RhbGxlZCAmJiBhdG9tLmNvbmZpZy5zZXQoJ2F1dG9jb21wbGV0ZS1weXRob24udXNlS2l0ZScsIGluc3RhbGxlZClcbiAgICAgICAgICBBY2NvdW50TWFuYWdlci5jbGllbnQgPSBpbml0aWFsQ2xpZW50XG4gICAgICAgIClcblxuICAgICAgICBpbnN0YWxsZXIub25EaWRVZHBkYXRlU3RhdGUoKHN0YXRlKSAtPlxuICAgICAgICAgIGlmIHR5cGVvZiBzdGF0ZS5pbnN0YWxsICE9ICd1bmRlZmluZWQnXG4gICAgICAgICAgICBpbnN0YWxsZWQgPSBzdGF0ZS5pbnN0YWxsLmRvbmUgfHwgZmFsc2VcbiAgICAgICAgKVxuXG4gICAgICAgIGluc3RhbGxlci5vbignZGlkLXNraXAtaW5zdGFsbCcsICgpIC0+XG4gICAgICAgICAgaW5zdGFsbGVkID0gZmFsc2VcbiAgICAgICAgICBhdG9tLmNvbmZpZy5zZXQoJ2F1dG9jb21wbGV0ZS1weXRob24udXNlS2l0ZScsIGluc3RhbGxlZClcbiAgICAgICAgKVxuXG4gICAgICAgIGluc3RhbGxlci5vbignbm90LWFkbWluLXNob3duJywgKCkgLT5cbiAgICAgICAgICAjIFNob3cgaW5zdGFsbGF0aW9uIGFnYWluIGlmIHVzZXIgcmVzdGFydHMgYXMgYWRtaW4uIFRoZXJlIGlzIGFcbiAgICAgICAgICAjIHNlcGFyYXRlIHVzZXIgb3B0aW9uIHRvIGV4cGxpY2l0bHkgbm90IHNob3cgdGhpcyBhZ2Fpbi5cbiAgICAgICAgICBpbnN0YWxsZWQgPSB0cnVlXG4gICAgICAgIClcblxuICAgICAgICBpbnN0YWxsZXIub24oJ25vdC1hZG1pbi1kaXNtaXNzZWQnLCAoKSAtPlxuICAgICAgICAgIGluc3RhbGxlZCA9IGZhbHNlXG4gICAgICAgICAgYXRvbS5jb25maWcuc2V0KCdhdXRvY29tcGxldGUtcHl0aG9uLnVzZUtpdGUnLCBpbnN0YWxsZWQpXG4gICAgICAgIClcblxuICAgICAgICBpbnN0YWxsZXIub24oJ2hlYWRsZXNzLWVycm9yJywgKHtlcnJvcn0pIC0+XG4gICAgICAgICAgaW5zdGFsbGVyLnVwZGF0ZVN0YXRlKHtlcnJvcn0pO1xuXG4gICAgICAgICAgZXJyb3JWaWV3ID0gbmV3IGtpdGVBdG9tLkluc3RhbGxFcnJvclZpZXcoaW5zdGFsbGVyKTtcbiAgICAgICAgICBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVQYW5lKCkuYWRkSXRlbShlcnJvclZpZXcpXG4gICAgICAgICAgYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlUGFuZSgpLmFjdGl2YXRlSXRlbShlcnJvclZpZXcpXG4gICAgICAgIClcblxuICAgICAgICBpbnN0YWxsZXIuc3RhcnQoKVxuICAgICAgLCAoZXJyKSA9PlxuICAgICAgICBpZiB0eXBlb2YgZXJyICE9ICd1bmRlZmluZWQnIGFuZCBlcnIudHlwZSA9PSAnZGVuaWVkJ1xuICAgICAgICAgIGF0b20uY29uZmlnLnNldCAnYXV0b2NvbXBsZXRlLXB5dGhvbi51c2VLaXRlJywgZmFsc2VcbiAgICAgICkgaWYgYXRvbS5jb25maWcuZ2V0ICdhdXRvY29tcGxldGUtcHl0aG9uLnVzZUtpdGUnXG5cbiAgICBjaGVja0tpdGVJbnN0YWxsYXRpb24oKVxuXG4gICAgYXRvbS5jb25maWcub25EaWRDaGFuZ2UgJ2F1dG9jb21wbGV0ZS1weXRob24udXNlS2l0ZScsICh7IG5ld1ZhbHVlLCBvbGRWYWx1ZSB9KSAtPlxuICAgICAgaWYgbmV3VmFsdWVcbiAgICAgICAgY2hlY2tLaXRlSW5zdGFsbGF0aW9uKClcbiAgICAgICAgQXRvbUhlbHBlci5lbmFibGVQYWNrYWdlKClcbiAgICAgIGVsc2VcbiAgICAgICAgQXRvbUhlbHBlci5kaXNhYmxlUGFja2FnZSgpXG5cbiAgbG9hZDogLT5cbiAgICBAZGlzcG9zYWJsZXMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZVxuICAgIGRpc3Bvc2FibGUgPSBhdG9tLndvcmtzcGFjZS5vYnNlcnZlVGV4dEVkaXRvcnMgKGVkaXRvcikgPT5cbiAgICAgIEBfaGFuZGxlR3JhbW1hckNoYW5nZUV2ZW50KGVkaXRvci5nZXRHcmFtbWFyKCkpXG4gICAgICBkaXNwb3NhYmxlID0gZWRpdG9yLm9uRGlkQ2hhbmdlR3JhbW1hciAoZ3JhbW1hcikgPT5cbiAgICAgICAgQF9oYW5kbGVHcmFtbWFyQ2hhbmdlRXZlbnQoZ3JhbW1hcilcbiAgICAgIEBkaXNwb3NhYmxlcy5hZGQgZGlzcG9zYWJsZVxuICAgIEBkaXNwb3NhYmxlcy5hZGQgZGlzcG9zYWJsZVxuICAgIEBfbG9hZEtpdGUoKVxuXG4gIGFjdGl2YXRlOiAoc3RhdGUpIC0+XG4gICAgQGVtaXR0ZXIgPSBuZXcgRW1pdHRlclxuICAgIEBwcm92aWRlciA9IHJlcXVpcmUoJy4vcHJvdmlkZXInKVxuICAgIGlmIHR5cGVvZiBhdG9tLnBhY2thZ2VzLmhhc0FjdGl2YXRlZEluaXRpYWxQYWNrYWdlcyA9PSAnZnVuY3Rpb24nIGFuZFxuICAgICAgICBhdG9tLnBhY2thZ2VzLmhhc0FjdGl2YXRlZEluaXRpYWxQYWNrYWdlcygpXG4gICAgICBAbG9hZCgpXG4gICAgZWxzZVxuICAgICAgZGlzcG9zYWJsZSA9IGF0b20ucGFja2FnZXMub25EaWRBY3RpdmF0ZUluaXRpYWxQYWNrYWdlcyA9PlxuICAgICAgICBAbG9hZCgpXG4gICAgICAgIGRpc3Bvc2FibGUuZGlzcG9zZSgpXG5cbiAgZGVhY3RpdmF0ZTogLT5cbiAgICBAcHJvdmlkZXIuZGlzcG9zZSgpIGlmIEBwcm92aWRlclxuICAgIEBpbnN0YWxsYXRpb24uZGVzdHJveSgpIGlmIEBpbnN0YWxsYXRpb25cblxuICBnZXRQcm92aWRlcjogLT5cbiAgICByZXR1cm4gQHByb3ZpZGVyXG5cbiAgZ2V0SHlwZXJjbGlja1Byb3ZpZGVyOiAtPlxuICAgIHJldHVybiByZXF1aXJlKCcuL2h5cGVyY2xpY2stcHJvdmlkZXInKVxuXG4gIGNvbnN1bWVTbmlwcGV0czogKHNuaXBwZXRzTWFuYWdlcikgLT5cbiAgICBkaXNwb3NhYmxlID0gQGVtaXR0ZXIub24gJ2RpZC1sb2FkLXByb3ZpZGVyJywgPT5cbiAgICAgIEBwcm92aWRlci5zZXRTbmlwcGV0c01hbmFnZXIgc25pcHBldHNNYW5hZ2VyXG4gICAgICBkaXNwb3NhYmxlLmRpc3Bvc2UoKVxuXG4gIGNvbnN1bWVTdGF0dXNCYXI6IChzdGF0dXNCYXIpIC0+XG4gICAgQHN0YXR1c0JhciA9IHN0YXR1c0JhclxuXG4gIHBhdGNoS2l0ZUNvbXBsZXRpb25zOiAoa2l0ZSkgLT5cbiAgICByZXR1cm4gaWYgQGtpdGVQYWNrYWdlP1xuXG4gICAgQGtpdGVQYWNrYWdlID0ga2l0ZS5tYWluTW9kdWxlXG4gICAgQGtpdGVQcm92aWRlciA9IEBraXRlUGFja2FnZS5jb21wbGV0aW9ucygpXG4gICAgZ2V0U3VnZ2VzdGlvbnMgPSBAa2l0ZVByb3ZpZGVyLmdldFN1Z2dlc3Rpb25zXG4gICAgQGtpdGVQcm92aWRlci5nZXRTdWdnZXN0aW9ucyA9IChhcmdzLi4uKSA9PlxuICAgICAgZ2V0U3VnZ2VzdGlvbnM/LmFwcGx5KEBraXRlUHJvdmlkZXIsIGFyZ3MpXG4gICAgICA/LnRoZW4gKHN1Z2dlc3Rpb25zKSA9PlxuICAgICAgICBAbGFzdEtpdGVTdWdnZXN0aW9ucyA9IHN1Z2dlc3Rpb25zXG4gICAgICAgIEBraXRlU3VnZ2VzdGVkID0gc3VnZ2VzdGlvbnM/XG4gICAgICAgIHN1Z2dlc3Rpb25zXG4gICAgICA/LmNhdGNoIChlcnIpID0+XG4gICAgICAgIEBsYXN0S2l0ZVN1Z2dlc3Rpb25zID0gW11cbiAgICAgICAgQGtpdGVTdWdnZXN0ZWQgPSBmYWxzZVxuICAgICAgICB0aHJvdyBlcnJcbiJdfQ==
