// atob is available globally in React Native's Hermes runtime but is not
// included in the TypeScript lib files used by @react-native/typescript-config.
declare function atob(data: string): string;
declare function btoa(data: string): string;
