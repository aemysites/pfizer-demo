class Helpers {
    constructor() {
        this.INFINITY = 1 / 0;
        this.toString = Object.prototype.toString;
        this.reIsDeepProp = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/;
        this.reIsPlainProp = /^\w*$/;
        this.charCodeOfDot = '.'.charCodeAt(0);
        this.reEscapeChar = /\\(\\)?/g
        this.rePropName = RegExp(
            // Match anything that isn't a dot or bracket.
            // eslint-disable-next-line no-useless-concat
            '[^.[\\]]+' + '|' +
            // Or match property names within brackets.
            '\\[(?:' +
            // Match a non-string expression.
            // eslint-disable-next-line no-useless-concat
            '([^"\'][^[]*)' + '|' +
            // Or match strings (supports escaping characters).
            '(["\'])((?:(?!\\2)[^\\\\]|\\\\.)*?)\\2' +
            // eslint-disable-next-line no-useless-concat
            ')\\]' + '|' +
            // Or match "" as the space between consecutive dots or empty brackets.
            '(?=(?:\\.|\\[\\])(?:\\.|\\[\\]|$))'
            , 'g');
    }

    /**
    * @param {Object} object The object to query.
    * @param {Array|string} path The path of the property to get.
    * @param {*} [defaultValue] The value returned for `undefined` resolved values.
    * @returns {*} Returns the resolved value.
    */
    get(object, path, defaultValue) {
        const result = object == null ? undefined : this.baseGet(object, path);
        return result === undefined ? defaultValue : result;
    }

    /* private methods */
    baseGet(object, path) {
        // eslint-disable-next-line no-param-reassign
        path = this.castPath(path, object)

        let index = 0
        const {length} = path

        while (object != null && index < length) {
          // eslint-disable-next-line no-param-reassign, no-plusplus
          object = object[this.toKey(path[index++])]
        }
        return (index && index === length) ? object : undefined
    }

    castPath(value, object) {
        if (Array.isArray(value)) {
          return value
        }
        return this.isKey(value, object) ? [value] : this.stringToPath(value)
    }

    stringToPath(string) {
        const result = []
        if (string.charCodeAt(0) === this.charCodeOfDot) {
          result.push('')
        }
        string.replace(this.rePropName, (match, expression, quote, subString) => {
          let key = match
          if (quote) {
            key = subString.replace(this.reEscapeChar, '$1')
          }
          else if (expression) {
            key = expression.trim()
          }
          result.push(key)
        })
        return result
    }

    isKey(value, object) {
        if (Array.isArray(value)) {
          return false
        }
        const type = typeof value
        if (type === 'number' || type === 'boolean' || value == null || this.isSymbol(value)) {
          return true
        }
        return this.reIsPlainProp.test(value) || !this.reIsDeepProp.test(value) ||
          (object != null && value in Object(object))
      }

    toKey(value) {
        if (typeof value === 'string' || this.isSymbol(value)) {
            return value
        }
        const result = `${value}`
        return (result === '0' && (1 / value) === -this.INFINITY) ? '-0' : result
    }

    isSymbol(value) {
        const type = typeof value;
        return (
            type === 'symbol' ||
            (type === 'object' && value != null && this.getTag(value) === '[object Symbol]')
        );
    }

    getTag(value) {
        if (value == null) {
          return value === undefined ? '[object Undefined]' : '[object Null]'
        }
        return this.toString.call(value)
      }
}

export default Helpers;