(function() {
  module.exports = {
    priority: 1,
    providerName: 'autocomplete-python',
    disableForSelector: '.source.python .comment, .source.python .string, .source.python .numeric, .source.python .integer, .source.python .decimal, .source.python .punctuation, .source.python .keyword, .source.python .storage, .source.python .variable.parameter',
    constructed: false,
    constructor: function() {
      this.provider = require('./provider');
      this.log = require('./log');
      this.selectorsMatchScopeChain = require('./scope-helpers').selectorsMatchScopeChain;
      this.Selector = require('selector-kit').Selector;
      this.constructed = true;
      return this.log.debug('Loading python hyper-click provider...');
    },
    _getScopes: function(editor, range) {
      return editor.scopeDescriptorForBufferPosition(range).scopes;
    },
    getSuggestionForWord: function(editor, text, range) {
      var bufferPosition, callback, disableForSelector, scopeChain, scopeDescriptor;
      if (!this.constructed) {
        this.constructor();
      }
      if (text === '.' || text === ':') {
        return;
      }
      if (editor.getGrammar().scopeName.indexOf('source.python') > -1) {
        bufferPosition = range.start;
        scopeDescriptor = editor.scopeDescriptorForBufferPosition(bufferPosition);
        scopeChain = scopeDescriptor.getScopeChain();
        disableForSelector = this.Selector.create(this.disableForSelector);
        if (this.selectorsMatchScopeChain(disableForSelector, scopeChain)) {
          return;
        }
        if (atom.config.get('autocomplete-python.outputDebug')) {
          this.log.debug(range.start, this._getScopes(editor, range.start));
          this.log.debug(range.end, this._getScopes(editor, range.end));
        }
        callback = (function(_this) {
          return function() {
            return _this.provider.load().goToDefinition(editor, bufferPosition);
          };
        })(this);
        return {
          range: range,
          callback: callback
        };
      }
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL3Jvb3QvLmF0b20vcGFja2FnZXMvYXV0b2NvbXBsZXRlLXB5dGhvbi9saWIvaHlwZXJjbGljay1wcm92aWRlci5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7RUFBQSxNQUFNLENBQUMsT0FBUCxHQUNFO0lBQUEsUUFBQSxFQUFVLENBQVY7SUFDQSxZQUFBLEVBQWMscUJBRGQ7SUFFQSxrQkFBQSxFQUFvQiwrT0FGcEI7SUFHQSxXQUFBLEVBQWEsS0FIYjtJQUtBLFdBQUEsRUFBYSxTQUFBO01BQ1gsSUFBQyxDQUFBLFFBQUQsR0FBWSxPQUFBLENBQVEsWUFBUjtNQUNaLElBQUMsQ0FBQSxHQUFELEdBQU8sT0FBQSxDQUFRLE9BQVI7TUFDTixJQUFDLENBQUEsMkJBQTRCLE9BQUEsQ0FBUSxpQkFBUixFQUE1QjtNQUNELElBQUMsQ0FBQSxXQUFZLE9BQUEsQ0FBUSxjQUFSLEVBQVo7TUFDRixJQUFDLENBQUEsV0FBRCxHQUFlO2FBQ2YsSUFBQyxDQUFBLEdBQUcsQ0FBQyxLQUFMLENBQVcsd0NBQVg7SUFOVyxDQUxiO0lBYUEsVUFBQSxFQUFZLFNBQUMsTUFBRCxFQUFTLEtBQVQ7QUFDVixhQUFPLE1BQU0sQ0FBQyxnQ0FBUCxDQUF3QyxLQUF4QyxDQUE4QyxDQUFDO0lBRDVDLENBYlo7SUFnQkEsb0JBQUEsRUFBc0IsU0FBQyxNQUFELEVBQVMsSUFBVCxFQUFlLEtBQWY7QUFDcEIsVUFBQTtNQUFBLElBQUcsQ0FBSSxJQUFDLENBQUEsV0FBUjtRQUNFLElBQUMsQ0FBQSxXQUFELENBQUEsRUFERjs7TUFFQSxJQUFHLElBQUEsS0FBUyxHQUFULElBQUEsSUFBQSxLQUFjLEdBQWpCO0FBQ0UsZUFERjs7TUFFQSxJQUFHLE1BQU0sQ0FBQyxVQUFQLENBQUEsQ0FBbUIsQ0FBQyxTQUFTLENBQUMsT0FBOUIsQ0FBc0MsZUFBdEMsQ0FBQSxHQUF5RCxDQUFDLENBQTdEO1FBQ0UsY0FBQSxHQUFpQixLQUFLLENBQUM7UUFDdkIsZUFBQSxHQUFrQixNQUFNLENBQUMsZ0NBQVAsQ0FDaEIsY0FEZ0I7UUFFbEIsVUFBQSxHQUFhLGVBQWUsQ0FBQyxhQUFoQixDQUFBO1FBQ2Isa0JBQUEsR0FBcUIsSUFBQyxDQUFBLFFBQVEsQ0FBQyxNQUFWLENBQWlCLElBQUMsQ0FBQSxrQkFBbEI7UUFDckIsSUFBRyxJQUFDLENBQUEsd0JBQUQsQ0FBMEIsa0JBQTFCLEVBQThDLFVBQTlDLENBQUg7QUFDRSxpQkFERjs7UUFHQSxJQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBWixDQUFnQixpQ0FBaEIsQ0FBSDtVQUNFLElBQUMsQ0FBQSxHQUFHLENBQUMsS0FBTCxDQUFXLEtBQUssQ0FBQyxLQUFqQixFQUF3QixJQUFDLENBQUEsVUFBRCxDQUFZLE1BQVosRUFBb0IsS0FBSyxDQUFDLEtBQTFCLENBQXhCO1VBQ0EsSUFBQyxDQUFBLEdBQUcsQ0FBQyxLQUFMLENBQVcsS0FBSyxDQUFDLEdBQWpCLEVBQXNCLElBQUMsQ0FBQSxVQUFELENBQVksTUFBWixFQUFvQixLQUFLLENBQUMsR0FBMUIsQ0FBdEIsRUFGRjs7UUFHQSxRQUFBLEdBQVcsQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQTttQkFDVCxLQUFDLENBQUEsUUFBUSxDQUFDLElBQVYsQ0FBQSxDQUFnQixDQUFDLGNBQWpCLENBQWdDLE1BQWhDLEVBQXdDLGNBQXhDO1VBRFM7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBO0FBRVgsZUFBTztVQUFDLE9BQUEsS0FBRDtVQUFRLFVBQUEsUUFBUjtVQWRUOztJQUxvQixDQWhCdEI7O0FBREYiLCJzb3VyY2VzQ29udGVudCI6WyJtb2R1bGUuZXhwb3J0cyA9XG4gIHByaW9yaXR5OiAxXG4gIHByb3ZpZGVyTmFtZTogJ2F1dG9jb21wbGV0ZS1weXRob24nXG4gIGRpc2FibGVGb3JTZWxlY3RvcjogJy5zb3VyY2UucHl0aG9uIC5jb21tZW50LCAuc291cmNlLnB5dGhvbiAuc3RyaW5nLCAuc291cmNlLnB5dGhvbiAubnVtZXJpYywgLnNvdXJjZS5weXRob24gLmludGVnZXIsIC5zb3VyY2UucHl0aG9uIC5kZWNpbWFsLCAuc291cmNlLnB5dGhvbiAucHVuY3R1YXRpb24sIC5zb3VyY2UucHl0aG9uIC5rZXl3b3JkLCAuc291cmNlLnB5dGhvbiAuc3RvcmFnZSwgLnNvdXJjZS5weXRob24gLnZhcmlhYmxlLnBhcmFtZXRlcidcbiAgY29uc3RydWN0ZWQ6IGZhbHNlXG5cbiAgY29uc3RydWN0b3I6IC0+XG4gICAgQHByb3ZpZGVyID0gcmVxdWlyZSAnLi9wcm92aWRlcidcbiAgICBAbG9nID0gcmVxdWlyZSAnLi9sb2cnXG4gICAge0BzZWxlY3RvcnNNYXRjaFNjb3BlQ2hhaW59ID0gcmVxdWlyZSAnLi9zY29wZS1oZWxwZXJzJ1xuICAgIHtAU2VsZWN0b3J9ID0gcmVxdWlyZSAnc2VsZWN0b3Ita2l0J1xuICAgIEBjb25zdHJ1Y3RlZCA9IHRydWVcbiAgICBAbG9nLmRlYnVnICdMb2FkaW5nIHB5dGhvbiBoeXBlci1jbGljayBwcm92aWRlci4uLidcblxuICBfZ2V0U2NvcGVzOiAoZWRpdG9yLCByYW5nZSkgLT5cbiAgICByZXR1cm4gZWRpdG9yLnNjb3BlRGVzY3JpcHRvckZvckJ1ZmZlclBvc2l0aW9uKHJhbmdlKS5zY29wZXNcblxuICBnZXRTdWdnZXN0aW9uRm9yV29yZDogKGVkaXRvciwgdGV4dCwgcmFuZ2UpIC0+XG4gICAgaWYgbm90IEBjb25zdHJ1Y3RlZFxuICAgICAgQGNvbnN0cnVjdG9yKClcbiAgICBpZiB0ZXh0IGluIFsnLicsICc6J11cbiAgICAgIHJldHVyblxuICAgIGlmIGVkaXRvci5nZXRHcmFtbWFyKCkuc2NvcGVOYW1lLmluZGV4T2YoJ3NvdXJjZS5weXRob24nKSA+IC0xXG4gICAgICBidWZmZXJQb3NpdGlvbiA9IHJhbmdlLnN0YXJ0XG4gICAgICBzY29wZURlc2NyaXB0b3IgPSBlZGl0b3Iuc2NvcGVEZXNjcmlwdG9yRm9yQnVmZmVyUG9zaXRpb24oXG4gICAgICAgIGJ1ZmZlclBvc2l0aW9uKVxuICAgICAgc2NvcGVDaGFpbiA9IHNjb3BlRGVzY3JpcHRvci5nZXRTY29wZUNoYWluKClcbiAgICAgIGRpc2FibGVGb3JTZWxlY3RvciA9IEBTZWxlY3Rvci5jcmVhdGUoQGRpc2FibGVGb3JTZWxlY3RvcilcbiAgICAgIGlmIEBzZWxlY3RvcnNNYXRjaFNjb3BlQ2hhaW4oZGlzYWJsZUZvclNlbGVjdG9yLCBzY29wZUNoYWluKVxuICAgICAgICByZXR1cm5cblxuICAgICAgaWYgYXRvbS5jb25maWcuZ2V0KCdhdXRvY29tcGxldGUtcHl0aG9uLm91dHB1dERlYnVnJylcbiAgICAgICAgQGxvZy5kZWJ1ZyByYW5nZS5zdGFydCwgQF9nZXRTY29wZXMoZWRpdG9yLCByYW5nZS5zdGFydClcbiAgICAgICAgQGxvZy5kZWJ1ZyByYW5nZS5lbmQsIEBfZ2V0U2NvcGVzKGVkaXRvciwgcmFuZ2UuZW5kKVxuICAgICAgY2FsbGJhY2sgPSA9PlxuICAgICAgICBAcHJvdmlkZXIubG9hZCgpLmdvVG9EZWZpbml0aW9uKGVkaXRvciwgYnVmZmVyUG9zaXRpb24pXG4gICAgICByZXR1cm4ge3JhbmdlLCBjYWxsYmFja31cbiJdfQ==
