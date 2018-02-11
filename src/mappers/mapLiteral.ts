import {
  BooleanLiteral,
  IdentifierLiteral,
  Literal,
  NullLiteral,
  NumberLiteral,
  PassthroughLiteral,
  PropertyName,
  RegexLiteral,
  StatementLiteral,
  StringLiteral,
  ThisLiteral,
  UndefinedLiteral,
} from 'decaffeinate-coffeescript/lib/coffee-script/nodes';
import {
  Bool,
  Break,
  Continue,
  Float,
  Identifier,
  Int,
  JavaScript,
  Node,
  Null,
  Regex,
  RegexFlags,
  This,
  Undefined,
} from '../nodes';
import getLocation from '../util/getLocation';
import makeHeregex from '../util/makeHeregex';
import makeString from '../util/makeString';
import ParseContext from '../util/ParseContext';
import parseNumber from '../util/parseNumber';
import parseRegExp from '../util/parseRegExp';

const HEREGEX_PATTERN = /^\/\/\/((?:.|\s)*)\/\/\/([gimy]*)$/;

export default function mapLiteral(context: ParseContext, node: Literal): Node {
  let { line, column, start, end, raw } = getLocation(context, node);

  if (node instanceof ThisLiteral) {
    return new This(line, column, start, end, raw);
  } else if (node instanceof NullLiteral) {
    return new Null(line, column, start, end, raw);
  } else if (node instanceof UndefinedLiteral) {
    return new Undefined(line, column, start, end, raw);
  } else if (node instanceof BooleanLiteral) {
    return new Bool(line, column, start, end, raw, JSON.parse(node.value));
  } else if (node instanceof IdentifierLiteral || node instanceof PropertyName) {
    // Sometimes the CoffeeScript AST contains a string object instead of a
    // string primitive. Convert to string primitive if necessary.
    let value = node.value.valueOf();
    return new Identifier(line, column, start, end, raw, value);
  } else if (node instanceof PassthroughLiteral) {
    return new JavaScript(line, column, start, end, raw, node.value);
  } else if (node instanceof NumberLiteral) {
    if (raw.includes('.')) {
      return new Float(line, column, start, end, raw, parseNumber(node.value));
    } else {
      return new Int(line, column, start, end, raw, parseNumber(node.value));
    }
  } else if (node instanceof RegexLiteral) {
    const heregexMatch = raw.match(HEREGEX_PATTERN);
    if (heregexMatch) {
      let flags = heregexMatch[2];
      return makeHeregex(context, node, flags);
    } else {
      let regExp = parseRegExp(node.value);
      return new Regex(
        line, column, start, end, raw,
        regExp.pattern, RegexFlags.parse(regExp.flags || '')
      );
    }
  } else if (node instanceof StringLiteral) {
    return makeString(context, node);
  } else if (node instanceof StatementLiteral) {
    if (node.value === 'break') {
      return new Break(line, column, start, end, raw);
    } else if (node.value === 'continue') {
      return new Continue(line, column, start, end, raw);
    }
  }

  throw new Error(`Unexpected literal: ${JSON.stringify(node)}`);
}
