function assertExhaustive(x: never): never {
    throw new Error("Non-exhaustive switch. Unhandled case:" + x);
}

export = assertExhaustive;