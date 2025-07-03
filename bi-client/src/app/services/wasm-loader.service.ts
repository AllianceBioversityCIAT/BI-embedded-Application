import { Injectable } from '@angular/core';

interface GoWasm {
  importObject: WebAssembly.Imports;
  run(_instance: WebAssembly.Instance): void;
}

interface WindowWithGo extends Window {
  Go: new () => GoWasm;
  generateExcelWasm: (_csvData: string) => ArrayBuffer;
}

@Injectable({
  providedIn: 'root'
})
export class WasmLoaderService {
  private wasmLoaded = false;
  private wasmPromise: Promise<void> | null = null;

  constructor() {}

  async loadWasm(): Promise<void> {
    if (this.wasmLoaded) {
      return Promise.resolve();
    }

    if (this.wasmPromise) {
      return this.wasmPromise;
    }

    this.wasmPromise = this.initWasm();
    return this.wasmPromise;
  }

  private async initWasm(): Promise<void> {
    const windowWithGo = window as unknown as WindowWithGo;

    // Cargar el script wasm_exec.js si no está disponible
    if (typeof windowWithGo.Go === 'undefined') {
      await this.loadScript('assets/go/wasm_exec.js');
    }

    // Crear instancia de Go
    const go = new windowWithGo.Go();

    // Cargar el módulo WASM
    const result = await WebAssembly.instantiateStreaming(
      fetch('assets/go/main.wasm'),
      go.importObject
    );

    // Ejecutar el módulo
    go.run(result.instance);

    this.wasmLoaded = true;
  }

  private loadScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = () => resolve();
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  isWasmLoaded(): boolean {
    return this.wasmLoaded;
  }

  isWasmFunctionAvailable(): boolean {
    const windowWithGo = window as unknown as WindowWithGo;
    return this.wasmLoaded && typeof windowWithGo.generateExcelWasm === 'function';
  }
}
