// import globalJsdom from "jsdom-global";
import { JSDOM } from "jsdom";
import "systemjs";

declare global {
  type ImportFn = <T>(moduleId: string, parentUrl?: string) => Promise<T>;
  interface System { import: ImportFn; }
  const System: System;
}

if (typeof window == "undefined") {
  const dom = new JSDOM(`<!doctype html><html><body>  
    <div id="GameDiv" cc_exact_fit_screen="true">
    <div id="Cocos3dGameContainer">
      <canvas id="GameCanvas" oncontextmenu="event.preventDefault()" tabindex="99"></canvas>
    </div>
    </body></html>`, {
    // url: "https://example.org/",
    referrer: "https://example.com/",
    contentType: "text/html",
    includeNodeLocations: true,
    storageQuota: 10000000,
    resources: "usable",
  });

  globalThis.window = dom.window as any;
  globalThis.document = dom.window.document;
  globalThis.navigator = dom.window.navigator;
  globalThis.HTMLElement = dom.window.HTMLElement;
  globalThis.HTMLImageElement = dom.window.HTMLImageElement;
  globalThis.HTMLCanvasElement = dom.window.HTMLCanvasElement;
}
// export namespace global {
//     export interface Window { };
//     export interface Storage { };
//     export interface Navigator { };
//     export interface HTMLElement { };
//     export interface Document { };
// }

// if (typeof window == "undefined") {
//     class Window {
//         navigator = {
//             userAgent: "NodeJs/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36",
//             language: "zh-CN",
//             appVersion: "5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36",
//         };
//         addEventListener() { }
//     }

//     class Storage {
//         getItem() { };
//         setItem() { };
//         removeItem() { };
//     }

//     class Navigator {
//         readonly userAgent = "";
//     }

//     class Style {

//     }

//     class HTMLElement {
//         readonly style = new Style();
//         getContext() { return null; }
//         addEventListener() { }
//         toDataURL() { return ""; }
//     }

//     class Document {
//         readonly documentElement = new HTMLElement;
//         addEventListener() { }
//         querySelector() { return new HTMLElement(); }
//         createElement() { return new HTMLElement(); }
//         getElementById(type: string) { return new HTMLElement(); }
//     };
//     globalThis.navigator = new Navigator() as any;
//     globalThis.window = new Window() as any;
//     globalThis.document = new Document() as any;
//     globalThis.window.localStorage = new Storage() as any;
// }

if (typeof performance == "undefined") {
  const hooks = await import("perf_hooks");
  globalThis.performance = hooks.performance as any;
}
