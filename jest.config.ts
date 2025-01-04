import type { JestConfigWithTsJest } from "ts-jest";

const jestConfig: JestConfigWithTsJest = {
  testEnvironment: "node",
  verbose: true,
  coverageDirectory: "coverage/",
  testRegex: "test/.*\\.test\\.ts$",
};

export default jestConfig;
