class Cookie {
  constructor(name, value) {
      this._name = name;
      this._value = value;
  }

  getName() {
      return this._name;
  }

  getValue() {
      return this._value;
  }

  static getCookiesForString(str) {
      return str.split(/; */).map(c => {
          const [ name, value ] = c.split(/=(.*)$/, 2);
          return new Cookie(name, decodeURIComponent(value));
      });
  }
}

export default Cookie;
