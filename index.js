#!/usr/bin/env node

// args
const args = process.argv;
const packageName = args[2];

require('./yarn-why')(packageName);
