import { ExpoRoot } from "expo-router";

const context = require.context("./apps/user-app/app");

export default function App() {
  return <ExpoRoot context={context} />;
}
