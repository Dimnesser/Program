/**
 * A small, dependency-free arithmetic evaluator.
 *
 * Deliberately not `eval`: input comes straight from a text field, so the
 * expression is tokenised and evaluated with shunting-yard. Percent is handled
 * the way desk calculators do it — `200+10%` is 220, `50%` on its own is 0.5.
 */

export type EvalResult = { ok: true; value: number } | { ok: false; error: 'syntax' | 'empty' | 'divide-zero' };

type Token =
  | { kind: 'number'; value: number }
  | { kind: 'op'; value: string }
  | { kind: 'paren'; value: '(' | ')' };

const PRECEDENCE: Record<string, number> = { '+': 1, '-': 1, '*': 2, '/': 2, '%': 2, '^': 3 };

export function normalizeExpression(input: string): string {
  return input
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/[−–—]/g, '-')
    .replace(/,(\d)/g, '.$1')
    .replace(/\s+/g, '');
}

function tokenize(input: string): Token[] | null {
  const tokens: Token[] = [];
  let i = 0;

  while (i < input.length) {
    const char = input[i];

    if (/\d|\./.test(char)) {
      let number = '';
      while (i < input.length && /[\d.]/.test(input[i])) number += input[i++];
      const value = Number(number);
      if (!Number.isFinite(value)) return null;
      tokens.push({ kind: 'number', value });
      continue;
    }

    if (char === '(' || char === ')') {
      tokens.push({ kind: 'paren', value: char });
      i += 1;
      continue;
    }

    if (char in PRECEDENCE) {
      const previous = tokens[tokens.length - 1];
      const isUnary =
        (char === '-' || char === '+') &&
        (!previous || previous.kind === 'op' || (previous.kind === 'paren' && previous.value === '('));

      if (isUnary) {
        // Represent unary minus as (0 - x) so precedence stays correct.
        tokens.push({ kind: 'number', value: 0 });
        tokens.push({ kind: 'op', value: char });
        i += 1;
        continue;
      }

      // Trailing percent: "50%" or "200+10%".
      if (char === '%') {
        const next = input[i + 1];
        if (!next || next === ')' || next in PRECEDENCE) {
          tokens.push({ kind: 'op', value: '#pct' });
          i += 1;
          continue;
        }
      }

      tokens.push({ kind: 'op', value: char });
      i += 1;
      continue;
    }

    return null; // Unknown character.
  }

  return tokens;
}

export function evaluate(expression: string): EvalResult {
  const normalized = normalizeExpression(expression);
  if (!normalized) return { ok: false, error: 'empty' };

  const tokens = tokenize(normalized);
  if (!tokens || tokens.length === 0) return { ok: false, error: 'syntax' };

  const output: Token[] = [];
  const operators: Token[] = [];

  for (const token of tokens) {
    if (token.kind === 'number') {
      output.push(token);
    } else if (token.kind === 'op') {
      if (token.value === '#pct') {
        output.push(token); // Postfix: applies immediately to the value on top.
        continue;
      }
      while (operators.length > 0) {
        const top = operators[operators.length - 1];
        if (top.kind !== 'op') break;
        const higher = PRECEDENCE[top.value] > PRECEDENCE[token.value];
        const equalLeft = PRECEDENCE[top.value] === PRECEDENCE[token.value] && token.value !== '^';
        if (!higher && !equalLeft) break;
        output.push(operators.pop()!);
      }
      operators.push(token);
    } else if (token.value === '(') {
      operators.push(token);
    } else {
      let matched = false;
      while (operators.length > 0) {
        const top = operators.pop()!;
        if (top.kind === 'paren' && top.value === '(') {
          matched = true;
          break;
        }
        output.push(top);
      }
      if (!matched) return { ok: false, error: 'syntax' };
    }
  }

  while (operators.length > 0) {
    const top = operators.pop()!;
    if (top.kind === 'paren') return { ok: false, error: 'syntax' };
    output.push(top);
  }

  const stack: number[] = [];
  for (const token of output) {
    if (token.kind === 'number') {
      stack.push(token.value);
      continue;
    }
    if (token.kind !== 'op') return { ok: false, error: 'syntax' };

    if (token.value === '#pct') {
      const value = stack.pop();
      if (value === undefined) return { ok: false, error: 'syntax' };
      const base = stack[stack.length - 1];
      // "200 + 10%" -> 10% of 200; a bare "10%" -> 0.1.
      stack.push(base === undefined ? value / 100 : (base * value) / 100);
      continue;
    }

    const right = stack.pop();
    const left = stack.pop();
    if (right === undefined || left === undefined) return { ok: false, error: 'syntax' };

    switch (token.value) {
      case '+':
        stack.push(left + right);
        break;
      case '-':
        stack.push(left - right);
        break;
      case '*':
        stack.push(left * right);
        break;
      case '/':
        if (right === 0) return { ok: false, error: 'divide-zero' };
        stack.push(left / right);
        break;
      case '%':
        if (right === 0) return { ok: false, error: 'divide-zero' };
        stack.push(left % right);
        break;
      case '^':
        stack.push(left ** right);
        break;
      default:
        return { ok: false, error: 'syntax' };
    }
  }

  if (stack.length !== 1 || !Number.isFinite(stack[0])) return { ok: false, error: 'syntax' };
  return { ok: true, value: stack[0] };
}

/** Formats a calculator result without exponent noise or floating-point dust. */
export function formatResult(value: number): string {
  if (!Number.isFinite(value)) return '—';
  if (Number.isInteger(value) && Math.abs(value) < 1e15) return String(value);
  const rounded = Number(value.toPrecision(12));
  if (Math.abs(rounded) >= 1e15 || (Math.abs(rounded) < 1e-6 && rounded !== 0)) return rounded.toExponential(6);
  return String(rounded);
}
