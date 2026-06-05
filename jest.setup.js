/**
 * CONCEPT: Jest global setup — runs after the test environment is installed
 * but before each test file. This is where we register mocks for native
 * modules that cannot run in a Node.js test environment.
 *
 * WHY MOCK NATIVE MODULES:
 * react-native-reanimated and react-native-gesture-handler both require
 * native code that only runs on iOS/Android. In tests, we replace them
 * with pure-JS equivalents so tests run instantly in Node.
 *
 * WHY WRITE OUR OWN REANIMATED MOCK (not the library's):
 * Reanimated 4.x changed its mock entry-point (mock.js) to import from
 * the full TypeScript source tree, which transitively requires
 * `react-native-worklets` — a peer package that isn't installed in every
 * project. Rather than depend on that chain, we provide a self-contained
 * mock that returns sensible values for every API we use.
 *
 * Gesture Handler provides jestSetup.js which mocks its native module bridge.
 */

// ─── GLOBALS ─────────────────────────────────────────────────────────────────

// React Native defines __DEV__ as a global at runtime via Metro bundler.
// In Node/Jest there's no bundler, so we define it manually.
global.__DEV__ = true

// React Native's NativeModules.js checks global.nativeModuleProxy first.
// If truthy, it assigns that as NativeModules instead of reading
// __fbBatchedBridgeConfig from the native bridge (which doesn't exist in Node).
// The @react-native/jest-preset setupFiles also mock the native modules at a
// deeper level; this is an additional belt-and-suspenders guard.
global.nativeModuleProxy = {}

// ─── REACT-NATIVE-REANIMATED MOCK ─────────────────────────────────────────────
//
// We provide every hook and animation function used in this codebase.
// Animation functions return their target value immediately (no interpolation),
// hooks return stable objects, and Animated.* components are aliased to their
// plain React Native counterparts so the component tree renders normally.

jest.mock("react-native-reanimated", () => {
  const RN = require("react-native")

  // A shared-value stub: behaves like { value: initialValue }
  const makeSharedValue = (initialValue) => ({ value: initialValue })

  return {
    // ── Animated components (alias to plain RN components) ──────────────────
    // Tests don't care about animation; they just need the component tree.
    default: {
      View: RN.View,
      Text: RN.Text,
      ScrollView: RN.ScrollView,
      Image: RN.Image,
    },
    // Named exports that some files import directly (e.g. Animated.View)
    View: RN.View,
    Text: RN.Text,
    ScrollView: RN.ScrollView,
    Image: RN.Image,

    // ── Shared values & derived values ───────────────────────────────────────
    useSharedValue: jest.fn(makeSharedValue),
    makeMutable: jest.fn(makeSharedValue),
    useDerivedValue: jest.fn((fn) => makeSharedValue(fn())),

    // ── Style hooks ──────────────────────────────────────────────────────────
    // Return an empty style object — components still render, styles are ignored.
    useAnimatedStyle: jest.fn(() => ({})),
    useAnimatedProps: jest.fn(() => ({})),

    // ── Reaction / bridge between UI thread and JS ───────────────────────────
    useAnimatedReaction: jest.fn(), // noop — no animation loop in tests
    runOnJS: jest.fn((fn) => fn),   // pass-through — call JS fn directly
    runOnUI: jest.fn((fn) => fn),

    // ── Animation functions (return target value immediately) ────────────────
    withTiming: jest.fn((value) => value),
    withSpring: jest.fn((value) => value),
    withDelay: jest.fn((_delay, animation) => animation),
    withRepeat: jest.fn((animation) => animation),
    withSequence: jest.fn((...animations) => animations[animations.length - 1]),
    withDecay: jest.fn(() => 0),
    cancelAnimation: jest.fn(),

    // ── Interpolation helpers ────────────────────────────────────────────────
    interpolate: jest.fn((value, inputRange, outputRange) => {
      const idx = inputRange.findIndex((v) => v >= value)
      return idx >= 0 ? outputRange[idx] : outputRange[0]
    }),
    interpolateColor: jest.fn((_value, _inputRange, outputRange) =>
      Array.isArray(outputRange) ? outputRange[0] : outputRange
    ),

    // ── Easing (pure math, no native dependency) ─────────────────────────────
    Easing: {
      linear: (t) => t,
      ease: (t) => t,
      quad: (t) => t * t,
      cubic: (t) => t * t * t,
      poly: (n) => (t) => Math.pow(t, n),
      sin: (t) => 1 - Math.cos((t * Math.PI) / 2),
      circle: (t) => 1 - Math.sqrt(1 - t * t),
      exp: (t) => Math.pow(2, 10 * (t - 1)),
      elastic: () => (t) => t,
      back: () => (t) => t,
      bounce: (t) => t,
      bezier: () => (t) => t,
      bezierFn: () => (t) => t,
      in: (easing) => easing,
      out: (easing) => (t) => 1 - easing(1 - t),
      inOut: (easing) => (t) =>
        t < 0.5 ? easing(t * 2) / 2 : 1 - easing((1 - t) * 2) / 2,
      steps: () => (t) => t,
    },

    // ── Layout animations (no-ops in tests) ─────────────────────────────────
    BounceIn: null,
    BounceOut: null,
    BounceInDown: null,
    BounceInUp: null,
    FadeIn: null,
    FadeOut: null,
    FadeInDown: null,
    FadeInUp: null,
    SlideInRight: null,
    SlideOutRight: null,
    SlideInLeft: null,
    SlideOutLeft: null,
    ZoomIn: null,
    ZoomOut: null,
    FlipInEasyX: null,
    Layout: null,

    // ── Enums ────────────────────────────────────────────────────────────────
    Extrapolation: { CLAMP: "clamp", EXTEND: "extend", IDENTITY: "identity" },
    ReduceMotion: { System: "system", Always: "always", Never: "never" },
    ColorSpace: { RGB: 0, LAB: 1 },

    // ── Misc ─────────────────────────────────────────────────────────────────
    measure: jest.fn(),
    scrollTo: jest.fn(),
    setGestureState: jest.fn(),
    getReanimatedVersion: jest.fn(() => "4.0.0"),
    useAnimatedRef: jest.fn(() => ({ current: null })),
    useAnimatedScrollHandler: jest.fn(() => ({})),
    useAnimatedGestureHandler: jest.fn(() => ({})),
    useFrameCallback: jest.fn(),
  }
})

// ─── GESTURE HANDLER ─────────────────────────────────────────────────────────
// Gesture Handler's setup script mocks the native gesture module bridge.
// Without this, any import of react-native-gesture-handler throws in Node.
require("react-native-gesture-handler/jestSetup")

// ─── MMKV ────────────────────────────────────────────────────────────────────
// Mock MMKV v4 — the native storage library cannot run in Node.
// v4 replaced the `new MMKV()` class constructor with a `createMMKV()` factory.
// Provide a simple in-memory Map as a stand-in.
jest.mock("react-native-mmkv", () => {
  const store = new Map()
  const instance = {
    set: jest.fn((key, value) => store.set(key, value)),
    getString: jest.fn((key) => store.get(key) ?? undefined),
    remove: jest.fn((key) => store.delete(key)),
  }
  return {
    createMMKV: jest.fn(() => instance),
  }
})

// ─── CONSOLE NOISE FILTER ────────────────────────────────────────────────────
// Silence the "act()" warning that appears when async state updates happen
// in tests — this is expected behavior when testing with hooks.
jest.spyOn(console, "error").mockImplementation((msg) => {
  if (typeof msg === "string" && msg.includes("act(")) return
  // Let other errors through so they don't get silently swallowed
})
