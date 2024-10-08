import {
  computed,
  effect,
  EffectCleanupRegisterFn,
  EffectRef,
  inject,
  Injector,
  Signal,
  signal,
  untracked,
  WritableSignal,
} from "@angular/core";
import {
  producerIncrementEpoch,
  producerNotifyConsumers, producerUpdatesAllowed,
  runPostSignalSetFn,
  SIGNAL
} from "@angular/core/primitives/signals";
import { ActivatedRoute, CanDeactivateFn, Route } from "@angular/router";

const initializedRouteConfigSet = new Set<Route>();

export function canDeactivate(fn: () => boolean) {
  const activatedRoute = inject(ActivatedRoute);
  const injector = inject(Injector);

  if (!initializedRouteConfigSet.has(activatedRoute.routeConfig!)) {
    initializedRouteConfigSet.add(activatedRoute.routeConfig!);

    const canDeactivateFn: CanDeactivateFn<{ __sdCanDeactivate__(): boolean }> = (component) => {
      return component.__sdCanDeactivate__();
    };
    activatedRoute.routeConfig!.canDeactivate = [canDeactivateFn];
  }

  requestAnimationFrame(() => {
    const comp = injector["_lView"][8];
    comp["__sdCanDeactivate__"] = fn;
  });
}

export interface SdWritableSignal<T> extends WritableSignal<T> {
  $mark(): void;
}

export function $signal<T>(): SdWritableSignal<T | undefined>;
export function $signal<T>(initialValue: T): SdWritableSignal<T>;
export function $signal<T>(initialValue?: T): SdWritableSignal<T | undefined> {
  const sig = signal(initialValue) as SdWritableSignal<T | undefined>;
  sig.$mark = () => {
    if (!producerUpdatesAllowed()) {
      throw new Error();
    }

    const node = sig[SIGNAL] as any;
    node.version++;
    producerIncrementEpoch();
    producerNotifyConsumers(node);
    runPostSignalSetFn();
  };
  return sig;
}

export interface SdWritableSignalSet<T> extends SdWritableSignal<Set<T>> {
  $toggle(v: T, addOrDel?: "add" | "del"): void;
}

export function $signalSet<T>(initialValue?: Set<T>): SdWritableSignalSet<T> {
  const sig = $signal(initialValue ?? new Set<T>()) as SdWritableSignalSet<T>;
  sig.$toggle = (value, addOrDel) => {
    sig.update((v) => new Set(v).toggle(value, addOrDel));
  };
  return sig;
}

export interface SdWritableSignalMap<K, T> extends SdWritableSignal<Map<K, T>> {
  $set(k: K, v: T): void;

  $update(k: K, v: (val: T | undefined) => T): void;
}

export function $signalMap<K, T>(
  initialValue?: Map<K, T>,
): WritableSignal<Map<K, T>> & {
  $mark(): void;
  $set(k: K, v: T): void;
  $update(k: K, v: (val: T | undefined) => T): void;
} {
  const sig = $signal(initialValue ?? new Map<K, T>()) as SdWritableSignalMap<K, T>;
  sig.$set = (k, v) => {
    sig.update((m) => new Map(m).set(k, v));
  };
  sig.$update = (k, v) => {
    sig.update((m) => new Map(m).set(k, v(m.get(k))));
  };
  return sig as any;
}

export function $effect(fn: (onCleanup: EffectCleanupRegisterFn) => Promise<void>): never;
export function $effect(fn: (onCleanup: EffectCleanupRegisterFn) => void): EffectRef;
export function $effect(signals: Signal<any>[], fn: (onCleanup: EffectCleanupRegisterFn) => void): EffectRef;
export function $effect(
  arg1: ((onCleanup: EffectCleanupRegisterFn) => void) | Signal<any>[],
  arg2?: (onCleanup: EffectCleanupRegisterFn) => void,
): EffectRef {
  const sigs = (arg2 ? arg1 : undefined) as Signal<any>[] | undefined;
  const fn = (arg2 ? arg2 : arg1) as (onCleanup: EffectCleanupRegisterFn) => void;

  if (sigs) {
    return effect(
      (onCleanup) => {
        for (const sig of sigs) {
          sig();
        }

        untracked(() => {
          fn(onCleanup);
        });
      },
      { allowSignalWrites: true },
    );
  } else {
    return effect((onCleanup) => fn(onCleanup), { allowSignalWrites: true });
  }
}

export function $computed<R>(fn: () => Promise<R>): Signal<R | undefined>;
export function $computed<R>(fn: () => Promise<R>, opt: { initialValue?: R }): Signal<R>;
export function $computed<R>(signals: Signal<any>[], fn: () => Promise<R>): Signal<R | undefined>;
export function $computed<R>(signals: Signal<any>[], fn: () => Promise<R>, opt: { initialValue?: R }): Signal<R>;
export function $computed<R>(fn: () => R): Signal<R>;
export function $computed<R>(signals: Signal<any>[], fn: () => R): Signal<R>;
export function $computed(...args: any): Signal<any> {
  const signals: Signal<any>[] | undefined = args[0] instanceof Array ? args[0] : undefined;
  const fn: () => any | Promise<any> = args[0] instanceof Array ? args[1] : args[0];
  const opt: { initialValue?: any } | undefined = args[0] instanceof Array ? args[2] : args[1];

  if (signals) {
    const resultSig = signal<any>(opt?.initialValue);

    effect(
      () => {
        for (const sig of signals) {
          sig();
        }

        void untracked(async () => {
          resultSig.set(await fn());
        });
      },
      { allowSignalWrites: true },
    );

    return resultSig;
  } else {
    return computed(() => fn());
  }
}

/*
export function $getter<F extends (...args: any[]) => any>(fn: F): F {
  const sigCache = new TreeMap<{ value: any }>();

  return ((...args) => {
    return sigCache.getOrCreate(
      args,
      $computed(() => fn(args)),
    ).value;
  }) as F;
}
*/
