export const EPS = "ε";

class Fragment {
  constructor(start, accept, transitions) {
    this.start = start;
    this.accept = accept;
    this.transitions = transitions;
  }
}

export function formatRegex(regex) {
  let res = "";
  for (let i = 0; i < regex.length; i++) {
    const c1 = regex[i];
    res += c1;
    if (i + 1 < regex.length) {
      const c2 = regex[i + 1];
      if (c1 !== "(" && c1 !== "|" && c2 !== ")" && c2 !== "|" && c2 !== "*" && c2 !== "+" && c2 !== "?") {
        res += ".";
      }
    }
  }
  return res;
}

export function regexToPostfix(regex) {
  const formatted = formatRegex(regex);
  const prec = { "|": 1, ".": 2, "*": 3, "+": 3, "?": 3 };
  let postfix = "";
  const stack = [];

  for (let i = 0; i < formatted.length; i++) {
    const c = formatted[i];
    if (c === "(") {
      stack.push(c);
    } else if (c === ")") {
      while (stack.length && stack[stack.length - 1] !== "(") postfix += stack.pop();
      stack.pop();
    } else if (prec[c]) {
      while (stack.length && stack[stack.length - 1] !== "(" && prec[stack[stack.length - 1]] >= prec[c]) {
        postfix += stack.pop();
      }
      stack.push(c);
    } else {
      postfix += c;
    }
  }
  while (stack.length) postfix += stack.pop();
  return postfix;
}

export function postfixToNFA(postfix) {
  let counter = 0;
  const createState = () => counter++;
  const stack = [];

  for (let i = 0; i < postfix.length; i++) {
    const token = postfix[i];

    if (token === "*") {
      const frag = stack.pop();
      const start = createState();
      const accept = createState();
      stack.push(new Fragment(start, accept, [
        ...frag.transitions,
        { from: start, to: frag.start, symbol: EPS },
        { from: start, to: accept, symbol: EPS },
        { from: frag.accept, to: frag.start, symbol: EPS },
        { from: frag.accept, to: accept, symbol: EPS }
      ]));
    } else if (token === "+") {
      const frag = stack.pop();
      const start = createState();
      const accept = createState();
      stack.push(new Fragment(start, accept, [
        ...frag.transitions,
        { from: start, to: frag.start, symbol: EPS },
        { from: frag.accept, to: frag.start, symbol: EPS },
        { from: frag.accept, to: accept, symbol: EPS }
      ]));
    } else if (token === "?") {
      const frag = stack.pop();
      const start = createState();
      const accept = createState();
      stack.push(new Fragment(start, accept, [
        ...frag.transitions,
        { from: start, to: frag.start, symbol: EPS },
        { from: start, to: accept, symbol: EPS },
        { from: frag.accept, to: accept, symbol: EPS }
      ]));
    } else if (token === "|") {
      const f2 = stack.pop();
      const f1 = stack.pop();
      const start = createState();
      const accept = createState();
      stack.push(new Fragment(start, accept, [
        ...f1.transitions,
        ...f2.transitions,
        { from: start, to: f1.start, symbol: EPS },
        { from: start, to: f2.start, symbol: EPS },
        { from: f1.accept, to: accept, symbol: EPS },
        { from: f2.accept, to: accept, symbol: EPS }
      ]));
    } else if (token === ".") {
      const f2 = stack.pop();
      const f1 = stack.pop();
      stack.push(new Fragment(f1.start, f2.accept, [
        ...f1.transitions,
        ...f2.transitions,
        { from: f1.accept, to: f2.start, symbol: EPS }
      ]));
    } else {
      const start = createState();
      const accept = createState();
      stack.push(new Fragment(start, accept, [{ from: start, to: accept, symbol: token }]));
    }
  }

  return { nfa: stack.pop(), totalStates: counter };
}

function epsilonClosure(states, transitions) {
  const closure = new Set(states);
  const stack = Array.from(states);
  while (stack.length) {
    const s = stack.pop();
    transitions.forEach((t) => {
      if (t.from === s && t.symbol === EPS && !closure.has(t.to)) {
        closure.add(t.to);
        stack.push(t.to);
      }
    });
  }
  return closure;
}

function move(states, symbol, transitions) {
  const reachable = new Set();
  states.forEach((s) => {
    transitions.forEach((t) => {
      if (t.from === s && t.symbol === symbol) reachable.add(t.to);
    });
  });
  return reachable;
}

const setKey = (set) => Array.from(set).sort((a, b) => a - b).join(",");

export function nfaToDfa(nfa, alphabet) {
  const dfaStates = [];
  const dfaTransitions = [];
  const marked = new Set();

  const startClosure = epsilonClosure([nfa.start], nfa.transitions);
  const queue = [{ name: "S0", set: startClosure }];
  dfaStates.push(queue[0]);

  let counter = 1;
  while (queue.length) {
    const current = queue.shift();
    const key = setKey(current.set);
    if (marked.has(key)) continue;
    marked.add(key);

    alphabet.forEach((symbol) => {
      const reachable = move(current.set, symbol, nfa.transitions);
      const nextClosure = epsilonClosure(reachable, nfa.transitions);

      if (nextClosure.size > 0) {
        const nextKey = setKey(nextClosure);
        let target = dfaStates.find((s) => setKey(s.set) === nextKey);
        if (!target) {
          target = { name: "S" + counter++, set: nextClosure };
          dfaStates.push(target);
          queue.push(target);
        }
        dfaTransitions.push({ from: current.name, to: target.name, symbol });
      }
    });
  }

  const acceptStates = dfaStates.filter((s) => s.set.has(nfa.accept)).map((s) => s.name);

  return {
    start: "S0",
    acceptStates,
    states: dfaStates,
    transitions: dfaTransitions
  };
}

export function evaluateDFA(dfa, input) {
  let current = dfa.start;
  const path = [{ state: current, symbol: null }];

  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    const trans = dfa.transitions.find((t) => t.from === current && t.symbol === char);
    if (!trans) {
      return { accepted: false, path, failedAt: i };
    }
    current = trans.to;
    path.push({ state: current, symbol: char });
  }

  return { accepted: dfa.acceptStates.includes(current), path, failedAt: null };
}