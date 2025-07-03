import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { WasmLoaderService } from './services/wasm-loader.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit {
  title = 'BI Embedded Application';

  wasmLoaderSE = inject(WasmLoaderService);

  ngOnInit() {
    // Inicializar WASM al arrancar la aplicación
    this.wasmLoaderSE.loadWasm().catch(() => {
      // Error silencioso en inicialización WASM
    });
  }
}
