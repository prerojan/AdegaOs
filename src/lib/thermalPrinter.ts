// Thermal Printer Integration Utility for AdegaOS
// Handles: Comandas (Orders), Cupons de Venda Não Fiscal (Sales), and Extratos de Fluxo de Caixa (Shift Summary)
// Communication methods: Virtual on-screen Simulator, ESC/POS Web Bluetooth, and optimized Web Browser Printing.

export type ThermalDocType = 'comanda' | 'sale' | 'cash_flow';

export interface PrinterConfig {
  mode: 'virtual' | 'bluetooth' | 'browser';
  paperSize: '58mm' | '80mm';
  charLimit: number;
  extraFeed: number;
  autoCut: boolean;
  autoDuplicate: boolean;
  headerText: string;
  footerText: string;
}

// Global Bluetooth states cached in memory to persist across screen transitions
let bluetoothDevice: any = null;
let bluetoothCharacteristic: any = null;
let onVirtualPrintCallback: ((receiptText: string) => void) | null = null;

// Get latest configurations from localStorage with robust fallbacks
export function getPrinterConfig(): PrinterConfig {
  const mode = (localStorage.getItem('adegaos_printer_mode') as any) || 'virtual';
  const paperSize = (localStorage.getItem('adegaos_paper_size') as any) || '58mm';
  const charLimit = Number(localStorage.getItem('adegaos_char_limit') || (paperSize === '58mm' ? '32' : '48'));
  const extraFeed = Number(localStorage.getItem('adegaos_extra_feed') || '4');
  const autoCut = localStorage.getItem('adegaos_auto_cut') !== 'false';
  const autoDuplicate = localStorage.getItem('adegaos_auto_duplicate') === 'true';
  const headerText = localStorage.getItem('adegaos_header_text') || 'ADEGA CENTRAL PREMIUM\nCNPJ: 12.345.678/0001-99\nTEL: (11) 99999-8888';
  const footerText = localStorage.getItem('adegaos_footer_text') || 'OBRIGADO PELA PREFERENCIA\n--- CUPOM NAO FISCAL ---';

  return { mode, paperSize, charLimit, extraFeed, autoCut, autoDuplicate, headerText, footerText };
}

// Helper to register callback to display a simulated virtual thermal receipt on the screen
export function registerVirtualPrintHandler(callback: (receiptText: string) => void) {
  onVirtualPrintCallback = callback;
}

export function getPairedBluetoothDevice() {
  return bluetoothDevice;
}

// Pair Bluetooth Printer (Web Bluetooth API)
export async function pairBluetoothPrinter(): Promise<string> {
  try {
    const nav = navigator as any;
    if (!nav.bluetooth) {
      throw new Error('Bluetooth não é suportado neste navegador. Use Google Chrome ou Edge.');
    }

    const device = await nav.bluetooth.requestDevice({
      filters: [
        { services: ['000018f0-0000-1000-8000-00805f9b34fb'] }, // Standard ESC/POS printer service UUID
        { namePrefix: 'Printer' },
        { namePrefix: 'MPT' },
        { namePrefix: 'Thermal' },
        { namePrefix: '58' },
        { namePrefix: '80' }
      ],
      optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb']
    });

    const server = await device.gatt.connect();
    const service = await server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb');
    const characteristics = await service.getCharacteristics();

    if (characteristics.length > 0) {
      bluetoothDevice = device;
      bluetoothCharacteristic = characteristics[0];
      return device.name || 'Impressora Bluetooth';
    } else {
      throw new Error('Serviço de gravação térmica não encontrado no dispositivo.');
    }
  } catch (error: any) {
    console.error('Erro ao conectar impressora Bluetooth:', error);
    throw error;
  }
}

// Format columns helper to perfectly align key-value pairs based on char limit (e.g., product ... price)
export function padLine(left: string, right: string, limit: number): string {
  const leftClean = left.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase(); // Strip accents for old thermal fonts
  const rightClean = right.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
  const spacesNeeded = limit - (leftClean.length + rightClean.length);
  if (spacesNeeded <= 0) {
    // Truncate left string to fit
    const truncatedLeft = leftClean.substring(0, limit - rightClean.length - 1);
    return truncatedLeft + ' ' + rightClean;
  }
  return leftClean + ' '.repeat(spacesNeeded) + rightClean;
}

// Generate receipt content formatted for thermal output
export function generateReceiptText(type: ThermalDocType, data: any, config: PrinterConfig): string {
  const limit = config.charLimit;
  const separator = '-'.repeat(limit);
  const thickSeparator = '='.repeat(limit);
  let text = '';

  // 1. HEADER
  if (type === 'sale' || type === 'cash_flow') {
    const headerLines = config.headerText.split('\n');
    headerLines.forEach(line => {
      text += centerText(line, limit) + '\n';
    });
  } else {
    text += centerText('--- PEDIDO DE PRODUCAO ---', limit) + '\n';
  }
  text += separator + '\n';

  // 2. DOCUMENT BODY
  if (type === 'comanda') {
    // Comanda de Produção
    text += padLine('DATA: ' + (data.date || new Date().toLocaleDateString('pt-BR')), (data.time || new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })), limit) + '\n';
    text += padLine('ORIGEM:', data.table || 'MESA/COMANDA', limit) + '\n';
    if (data.waiter) {
      text += padLine('ATENDENTE:', data.waiter, limit) + '\n';
    }
    text += separator + '\n';
    text += centerText('ITENS DO PEDIDO', limit) + '\n';
    text += separator + '\n';

    const items = data.items || [];
    items.forEach((it: any) => {
      text += `${it.qty}x ${it.name.toUpperCase()}\n`;
      if (it.notes) {
        text += `  * OBS: ${it.notes}\n`;
      }
    });

  } else if (type === 'sale') {
    // Cupom de Venda Não Fiscal
    text += padLine('CUPOM:', '#' + (data.number || '0001'), limit) + '\n';
    text += padLine('DATA:', (data.date || new Date().toLocaleDateString('pt-BR')) + ' ' + (data.time || new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })), limit) + '\n';
    text += padLine('CLIENTE:', (data.identifier || 'BALCAO'), limit) + '\n';
    if (data.cashierId) {
      text += padLine('OPERADOR:', data.cashierId, limit) + '\n';
    }
    if (data.deliveryAddress) {
      text += `END: ${data.deliveryAddress.toUpperCase()}\n`;
    }
    if (data.customerPhone) {
      text += padLine('TEL:', data.customerPhone, limit) + '\n';
    }
    if (data.deliveryDriverName) {
      text += padLine('ENTREGADOR:', data.deliveryDriverName.toUpperCase(), limit) + '\n';
    }
    text += separator + '\n';
    text += padLine('QTD PRODUTO', 'VALOR', limit) + '\n';
    text += separator + '\n';

    const items = data.items || [];
    items.forEach((it: any) => {
      const lineLeft = `${it.qty}x ${it.name}`;
      const lineRight = `R$ ${Number(it.qty * it.unitPrice).toFixed(2)}`;
      text += padLine(lineLeft, lineRight, limit) + '\n';
      if (it.notes) {
        text += `  * OBS: ${it.notes}\n`;
      }
    });
    text += separator + '\n';

    text += padLine('SUBTOTAL:', `R$ ${Number(data.subtotal || 0).toFixed(2)}`, limit) + '\n';
    if (data.discount > 0) {
      text += padLine('DESCONTO:', `-R$ ${Number(data.discount).toFixed(2)}`, limit) + '\n';
    }
    if (data.deliveryFee > 0) {
      text += padLine('TAXA ENTREGA:', `R$ ${Number(data.deliveryFee).toFixed(2)}`, limit) + '\n';
    }
    text += thickSeparator + '\n';
    text += padLine('TOTAL GERAL:', `R$ ${Number(data.total || 0).toFixed(2)}`, limit) + '\n';
    text += thickSeparator + '\n';

    // Payment details
    text += padLine('FORMA PAGTO:', (data.paymentMethod || 'DINHEIRO').toUpperCase(), limit) + '\n';
    
    if (data.paymentSplit && data.paymentSplit.length > 0) {
      data.paymentSplit.forEach((sp: any) => {
        text += padLine(`  - ${sp.method.toUpperCase()}:`, `R$ ${Number(sp.value).toFixed(2)}`, limit) + '\n';
      });
    }

    if (data.paidAmount !== undefined) {
      text += padLine('VALOR PAGO:', `R$ ${Number(data.paidAmount).toFixed(2)}`, limit) + '\n';
    }
    if (data.changeAmount !== undefined && data.changeAmount > 0) {
      text += padLine('TROCO:', `R$ ${Number(data.changeAmount).toFixed(2)}`, limit) + '\n';
    }

  } else if (type === 'cash_flow') {
    // Extrato de Fluxo de Caixa (Fechamento/Resumo)
    text += centerText('EXTRATO DO FLUXO DE CAIXA', limit) + '\n';
    text += padLine('DATA REF:', data.date || new Date().toLocaleDateString('pt-BR'), limit) + '\n';
    text += padLine('EMISSÃO:', new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }), limit) + '\n';
    text += padLine('OPERADOR:', data.cashierName || 'GERENTE', limit) + '\n';
    text += separator + '\n';

    text += padLine('SALDO INICIAL:', `R$ ${Number(data.initialBalance || 0).toFixed(2)}`, limit) + '\n';
    text += separator + '\n';

    text += centerText('ENTRADAS POR CATEGORIA', limit) + '\n';
    const entries = data.methods || {};
    Object.keys(entries).forEach(key => {
      text += padLine(`(+) ${key.toUpperCase()}:`, `R$ ${Number(entries[key]).toFixed(2)}`, limit) + '\n';
    });
    text += padLine('TOTAL VENDAS:', `R$ ${Number(data.totalSales || 0).toFixed(2)}`, limit) + '\n';
    text += separator + '\n';

    text += centerText('RETIRADAS / SAÍDAS', limit) + '\n';
    const expenses = data.expenses || [];
    if (expenses.length === 0) {
      text += centerText('NENHUMA RETIRADA REGISTRADA', limit) + '\n';
    } else {
      expenses.forEach((ex: any) => {
        text += padLine(`(-) ${ex.description.substring(0, 15)}`, `R$ ${Number(ex.value).toFixed(2)}`, limit) + '\n';
      });
    }
    text += padLine('TOTAL RETIRADAS:', `R$ ${Number(data.totalExpenses || 0).toFixed(2)}`, limit) + '\n';
    text += thickSeparator + '\n';
    text += padLine('SALDO FINAL ESTIMADO:', `R$ ${Number(data.finalBalance || 0).toFixed(2)}`, limit) + '\n';
    text += thickSeparator + '\n';
  }

  // 3. FOOTER
  text += separator + '\n';
  if (type === 'sale' || type === 'cash_flow') {
    const footerLines = config.footerText.split('\n');
    footerLines.forEach(line => {
      text += centerText(line, limit) + '\n';
    });
  } else {
    text += centerText('SETOR: ' + (data.sector || 'COZINHA').toUpperCase(), limit) + '\n';
    text += centerText('SISTEMA ADEGAOS', limit) + '\n';
  }

  // 4. EXTRA FEED MARGINS
  for (let i = 0; i < config.extraFeed; i++) {
    text += '\n';
  }

  // 5. GUILHOTINE NOTIFICATION
  if (config.autoCut) {
    text += centerText('✂------ CORTE AUTOMATICO ------', limit) + '\n';
  }

  return text;
}

// Center align text utility
function centerText(str: string, limit: number): string {
  const clean = str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
  if (clean.length >= limit) return clean.substring(0, limit);
  const leftSpaces = Math.floor((limit - clean.length) / 2);
  return ' '.repeat(leftSpaces) + clean;
}

// Unified trigger print operation
export async function triggerThermalPrint(type: ThermalDocType, data: any): Promise<boolean> {
  const config = getPrinterConfig();
  const receiptText = generateReceiptText(type, data, config);

  // Play ambient thermal print buzzer chime
  playVirtualBuzzer();

  // Save the last printed receipt text globally so visualizer can render it in real time
  try {
    localStorage.setItem('adegaos_last_receipt', receiptText);
    window.dispatchEvent(new CustomEvent('adegaos_new_print', { detail: receiptText }));
  } catch (e) {
    console.warn('Failed to save last receipt to localStorage:', e);
  }

  if (config.mode === 'virtual') {
    // Broadast receipt payload to active virtual on-screen simulator modal
    if (onVirtualPrintCallback) {
      onVirtualPrintCallback(receiptText);
    } else {
      // Fallback alert with receipt layout if modal is not wired
      console.log("Virtual Thermal Print Simulated:\n", receiptText);
    }
    return true;
  }

  if (config.mode === 'browser') {
    // Open specialized window styled for clean 58mm/80mm thermal outputs
    const width = config.paperSize === '58mm' ? 300 : 400;
    const printWindow = window.open('', '_blank', `width=${width},height=600`);
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>AdegaOS - Impressao Termica</title>
            <style>
              @media print {
                body { margin: 0; padding: 10px; width: ${config.paperSize === '58mm' ? '58mm' : '80mm'}; }
                @page { margin: 0; }
              }
              body {
                font-family: 'Courier New', Courier, monospace;
                font-size: 11px;
                line-height: 1.3;
                white-space: pre-wrap;
                word-wrap: break-word;
                background-color: #fff;
                color: #000;
                padding: 12px;
                width: ${config.paperSize === '58mm' ? '280px' : '360px'};
              }
            </style>
          </head>
          <body>${receiptText.replace(/\n/g, '<br>').replace(/ /g, '&nbsp;')}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      // Brief delay to allow browser styling injection before opening native print dialog
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 300);
      return true;
    }
    return false;
  }

  if (config.mode === 'bluetooth') {
    if (!bluetoothCharacteristic) {
      throw new Error('Impressora térmica Bluetooth não está conectada. Conecte no menu de configurações.');
    }

    try {
      const ESC = '\x1b';
      const GS = '\x1d';
      
      // Initialize ESC/POS
      let commands = ESC + '@';
      commands += receiptText;

      // Add actual hardware cut command if configured
      if (config.autoCut) {
        commands += GS + 'V' + '\x42' + '\x00';
      }

      const encoder = new TextEncoder();
      const bytes = encoder.encode(commands);
      
      // Transmit sequentially in 20-byte chunks to avoid Bluetooth buffer overflows
      const chunkSize = 20;
      for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.slice(i, i + chunkSize);
        await bluetoothCharacteristic.writeValue(chunk);
      }
      return true;
    } catch (err) {
      console.error('Falha na gravação direta ESC/POS Bluetooth:', err);
      throw new Error('Erro de comunicação com a impressora Bluetooth.');
    }
  }

  return false;
}

// Play micro-synthesized sound of a physical printing head mechanism
function playVirtualBuzzer() {
  // Sound simulation completely disabled per user request to avoid any potential sound issues
}
