import {inject, Signal} from "@angular/core";
import {NavigationEnd, Router} from "@angular/router";
import {toSignal} from "@angular/core/rxjs-interop";
import {filter, map} from "rxjs";
import {$computed} from "./$hooks";

export function getPageCodeSignal(): Signal<string | undefined> {
  const router = inject(Router, {optional: true});
  if (!router) {
    return $computed(() => undefined);
  }

  const url = toSignal(router.events.pipe(filter((event) => event instanceof NavigationEnd), map((event) => event.url)), {
    initialValue: router.url
  });

  return $computed(() => url()
    .split("/")
    .slice(2)
    .map((item) => item.split(/[;?]/).first())
    .join("."));
}
