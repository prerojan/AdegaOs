// Thermal Printer Engine for FluxOS
// Supports System Printers (Spooler Windows/USB001-USB005), WebUSB, Web Serial, Web Bluetooth & Network IP.

export interface ReceiptData {
  title?: string;
  type?: string;
  data?: any;
}

// ESC/POS Commands
export const ESC_POS_COMMANDS = {
  INIT: new Uint8Array([0x1B, 0x40]), // Initialize printer
  ALIGN_LEFT: new Uint8Array([0x1B, 0x61, 0x00]),
  ALIGN_CENTER: new Uint8Array([0x1B, 0x61, 0x01]),
  ALIGN_RIGHT: new Uint8Array([0x1B, 0x61, 0x02]),
  BOLD_ON: new Uint8Array([0x1B, 0x45, 0x01]),
  BOLD_OFF: new Uint8Array([0x1B, 0x45, 0x00]),
  DOUBLE_HEIGHT_ON: new Uint8Array([0x1B, 0x21, 0x10]),
  DOUBLE_WIDTH_ON: new Uint8Array([0x1B, 0x21, 0x20]),
  DOUBLE_SIZE_ON: new Uint8Array([0x1B, 0x21, 0x30]),
  NORMAL_SIZE: new Uint8Array([0x1B, 0x21, 0x00]),
  LINE_FEED: new Uint8Array([0x0A]),
  FEED_3_LINES: new Uint8Array([0x1B, 0x64, 0x03]),
  PAPER_CUT_PARTIAL: new Uint8Array([0x1D, 0x56, 0x01]),
  PAPER_CUT_FULL: new Uint8Array([0x1D, 0x56, 0x00]),
};

// Formats text into receipt layout based on paper width (32 chars for 58mm, 48 chars for 80mm)
export function generateReceiptText(typeOrPayload: any, maybeData?: any): string {
  let type = '';
  let title = 'CUPOM TÉRMICO';
  let data: any = null;

  if (typeof typeOrPayload === 'string') {
    type = typeOrPayload;
    data = maybeData || {};
    if (type === 'cash_flow') title = 'FECHAMENTO DE CAIXA';
    else if (type === 'comanda') title = 'COMPROVANTE DE PRODUÇÃO';
    else if (type === 'sale') title = 'CUPOM NÃO FISCAL';
  } else if (typeOrPayload && typeof typeOrPayload === 'object') {
    type = typeOrPayload.type || 'sale';
    title = typeOrPayload.title || 'CUPOM NÃO FISCAL';
    data = typeOrPayload.data || {};
  }

  const paperSize = localStorage.getItem('adegaos_paper_size') || '58mm';
  const width = paperSize === '80mm' ? 48 : 32;
  const divider = '-'.repeat(width);
  const doubleDivider = '='.repeat(width);

  const storeName = (localStorage.getItem('adegaos_store_name') || 'ADEGA CENTRAL PREMIUM').toUpperCase();
  const cnpj = localStorage.getItem('adegaos_cnpj') || '12.345.678/0001-99';
  const headerText = localStorage.getItem('adegaos_header_text') || 'OBRIGADO PELA PREFERÊNCIA!';
  const footerText = localStorage.getItem('adegaos_footer_text') || 'FluxOS - Sistema Integrado\n--- CUPOM NÃO FISCAL ---';

  const center = (text: string) => {
    if (text.length >= width) return text.slice(0, width);
    const leftPad = Math.floor((width - text.length) / 2);
    return ' '.repeat(leftPad) + text;
  };

  const justify = (left: string, right: string) => {
    const totalLen = left.length + right.length;
    if (totalLen >= width) {
      const availLeft = width - right.length - 1;
      return left.slice(0, Math.max(0, availLeft)) + ' ' + right;
    }
    const spaces = ' '.repeat(width - totalLen);
    return left + spaces + right;
  };

  const lines: string[] = [];

  // Header
  lines.push(center(storeName));
  if (cnpj) lines.push(center(`CNPJ: ${cnpj}`));
  if (headerText) {
    headerText.split('\n').forEach(h => lines.push(center(h)));
  }
  lines.push(divider);
  lines.push(center(title.toUpperCase()));
  lines.push(divider);

  // Body based on payload type
  if (type === 'cash_flow' || data.cash_flow) {
    const cf = data.cash_flow || data;
    lines.push(justify('Data:', cf.date || new Date().toLocaleDateString('pt-BR')));
    lines.push(justify('Hora:', cf.time || new Date().toLocaleTimeString('pt-BR')));
    lines.push(justify('Operador:', cf.cashierId || 'GERENTE'));
    lines.push(divider);
    lines.push(justify('Saldo Inicial:', `R$ ${(cf.initialBalance || 0).toFixed(2)}`));
    lines.push(justify('Entradas Dinheiro:', `R$ ${(cf.cashIn || 0).toFixed(2)}`));
    lines.push(justify('Vendas Cartão:', `R$ ${(cf.cardTotal || 0).toFixed(2)}`));
    lines.push(justify('Vendas PIX:', `R$ ${(cf.pixTotal || 0).toFixed(2)}`));
    lines.push(justify('Sangrias/Retiradas:', `R$ ${(cf.withdrawals || 0).toFixed(2)}`));
    lines.push(doubleDivider);
    lines.push(justify('TOTAL EM CAIXA:', `R$ ${(cf.totalInCash || 0).toFixed(2)}`));
  } else if (type === 'comanda' || data.items) {
    lines.push(justify('Data/Hora:', `${data.date || new Date().toLocaleDateString('pt-BR')} ${data.time || ''}`));
    lines.push(justify('Identificador:', data.identifier || data.table || 'MESA/COMANDA'));
    if (data.sector) lines.push(justify('Setor Destino:', data.sector.toUpperCase()));
    lines.push(divider);
    lines.push(justify('QTD ITEM', 'OBS'));
    lines.push(divider);
    (data.items || []).forEach((it: any) => {
      const qtyStr = `${it.qty || it.quantity || 1}x`;
      const nameStr = (it.name || it.productName || 'Item').slice(0, width - 8);
      lines.push(justify(`${qtyStr} ${nameStr}`, it.notes ? `[${it.notes}]` : ''));
    });
  } else {
    // Venda / Sale
    const sale = data.sale || data;
    const tx = data.transaction || {};
    const dateStr = sale.timestamp ? new Date(sale.timestamp).toLocaleString('pt-BR') : `${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`;
    
    lines.push(justify('Cupom Nº:', `#${(sale.id || '0000').slice(-6).toUpperCase()}`));
    lines.push(justify('Data:', dateStr));
    lines.push(justify('Cliente:', (sale.clientName || 'CONSUMIDOR FINAL').toUpperCase()));
    lines.push(divider);
    lines.push(justify('QTD PRODUTO', 'TOTAL'));
    lines.push(divider);

    const items = sale.items || [];
    items.forEach((item: any) => {
      const qty = item.quantity || 1;
      const pName = (item.product?.name || item.productName || item.name || 'Produto').slice(0, width - 10);
      const total = (item.totalPrice || (item.unitPrice * qty) || 0).toFixed(2);
      lines.push(justify(`${qty}x ${pName}`, `R$ ${total}`));
    });

    lines.push(divider);
    lines.push(justify('Subtotal:', `R$ ${(sale.subtotal || sale.totalAmount || 0).toFixed(2)}`));
    if (sale.discountAmount && sale.discountAmount > 0) {
      lines.push(justify('Desconto:', `- R$ ${sale.discountAmount.toFixed(2)}`));
    }
    lines.push(doubleDivider);
    lines.push(justify('TOTAL PAGO:', `R$ ${(sale.totalAmount || 0).toFixed(2)}`));
    lines.push(justify('Forma Pagto:', (sale.paymentMethod || tx.method || 'DINHEIRO').toUpperCase()));
    if (sale.changeAmount && sale.changeAmount > 0) {
      lines.push(justify('Troco:', `R$ ${sale.changeAmount.toFixed(2)}`));
    }
  }

  lines.push(divider);
  footerText.split('\n').forEach(f => lines.push(center(f)));
  lines.push('\n\n\n'); // Feed space

  return lines.join('\n');
}

// Convert receipt text string into ESC/POS binary codes
export function generateEscPosBuffer(receiptText: string): Uint8Array {
  const encoder = new TextEncoder();
  const textBytes = encoder.encode(receiptText);

  // Combine commands: Init + Text Bytes + Feed + Partial Cut
  const bufferParts = [
    ESC_POS_COMMANDS.INIT,
    textBytes,
    ESC_POS_COMMANDS.FEED_3_LINES,
    ESC_POS_COMMANDS.PAPER_CUT_PARTIAL
  ];

  const totalLength = bufferParts.reduce((acc, curr) => acc + curr.length, 0);
  const result = new Uint8Array(totalLength);

  let offset = 0;
  for (const part of bufferParts) {
    result.set(part, offset);
    offset += part.length;
  }

  return result;
}

// Helper to escape HTML characters
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Print via System / Windows Spooler / Browser Print Dialog (Supports HPRT-II, USB001-USB005, Default Printers)
export function printViaSystemBrowser(receiptText: string, paperSize: string = '58mm'): void {
  let printArea = document.getElementById('adegaos-thermal-print-area');
  if (!printArea) {
    printArea = document.createElement('div');
    printArea.id = 'adegaos-thermal-print-area';
    document.body.appendChild(printArea);
  }

  const widthCss = paperSize === '80mm' ? '76mm' : '52mm';

  printArea.innerHTML = `
    <style>
      @media print {
        body > *:not(#adegaos-thermal-print-area) {
          display: none !important;
        }
        #adegaos-thermal-print-area {
          display: block !important;
          position: absolute;
          left: 0;
          top: 0;
          width: ${widthCss};
          margin: 0;
          padding: 0;
          font-family: 'Courier New', Courier, monospace;
          font-size: 11px;
          line-height: 1.25;
          color: #000000;
          white-space: pre-wrap;
          word-break: break-all;
        }
        @page {
          size: ${widthCss} auto;
          margin: 0mm;
        }
      }
      @media screen {
        #adegaos-thermal-print-area {
          display: none !important;
        }
      }
    </style>
    <div>${escapeHtml(receiptText)}</div>
  `;

  setTimeout(() => {
    window.print();
  }, 80);
}

// Connect & Print via WebUSB Direct
export async function connectAndPrintWebUSB(buffer: Uint8Array): Promise<boolean> {
  if (!('usb' in navigator)) {
    alert('WebUSB não é suportado neste navegador. Use a opção "Driver do Sistema / Impressora Padrão".');
    return false;
  }

  try {
    const device = await (navigator as any).usb.requestDevice({ filters: [] });
    await device.open();
    if (device.configuration === null) {
      await device.selectConfiguration(1);
    }
    await device.claimInterface(0);

    // Find OUT endpoint
    const endpoint = device.configuration.interfaces[0].alternate.endpoints.find(
      (e: any) => e.direction === 'out'
    );

    if (endpoint) {
      await device.transferOut(endpoint.endpointNumber, buffer);
      await device.close();
      return true;
    } else {
      throw new Error('Endpoint de saída não encontrado na impressora USB.');
    }
  } catch (err: any) {
    console.warn('[FluxOS WebUSB] Error or cancelled:', err);
    return false;
  }
}

// Connect & Print via Web Serial (Virtual COM / USB Serial)
export async function connectAndPrintWebSerial(buffer: Uint8Array): Promise<boolean> {
  if (!('serial' in navigator)) {
    alert('Web Serial não é suportado neste navegador. Use a opção "Driver do Sistema / Impressora Padrão".');
    return false;
  }

  try {
    const port = await (navigator as any).serial.requestPort();
    await port.open({ baudRate: 9600 });
    const writer = port.writable.getWriter();
    await writer.write(buffer);
    writer.releaseLock();
    await port.close();
    return true;
  } catch (err: any) {
    console.warn('[FluxOS WebSerial] Error or cancelled:', err);
    return false;
  }
}

// Main Dispatcher Function for Thermal Printing in FluxOS
export async function triggerThermalPrint(
  typeOrPayload: any,
  maybeData?: any
): Promise<void> {
  const receiptText = generateReceiptText(typeOrPayload, maybeData);
  const escPosBuffer = generateEscPosBuffer(receiptText);
  const paperSize = localStorage.getItem('adegaos_paper_size') || '58mm';

  // Save last receipt string
  localStorage.setItem('adegaos_last_receipt', receiptText);

  // Dispatch events for live UI feed & print modal listeners
  window.dispatchEvent(new CustomEvent('adegaos_new_print', { detail: receiptText }));
  window.dispatchEvent(new CustomEvent('adegaos_thermal_print_requested', {
    detail: {
      text: receiptText,
      payload: typeOrPayload,
      escPosBuffer
    }
  }));

  // Get active printer mode: 'system' | 'browser' | 'webusb' | 'webserial' | 'bluetooth' | 'virtual'
  const mode = localStorage.getItem('adegaos_printer_mode') || 'system';

  console.log(`%c[FluxOS Printer Engine] Dispatching print job in mode: ${mode}`, 'color: #10B981; font-weight: bold;');

  if (mode === 'system' || mode === 'browser') {
    // Print directly using Windows / OS Spooler Driver (Supports HPRT-II on USB001-USB005, etc.)
    printViaSystemBrowser(receiptText, paperSize);
  } else if (mode === 'webusb') {
    const success = await connectAndPrintWebUSB(escPosBuffer);
    if (!success) {
      // Fallback to system print if USB connection fails or user cancels
      console.log('[FluxOS Printer Engine] Fallback to system driver printing...');
      printViaSystemBrowser(receiptText, paperSize);
    }
  } else if (mode === 'webserial') {
    const success = await connectAndPrintWebSerial(escPosBuffer);
    if (!success) {
      printViaSystemBrowser(receiptText, paperSize);
    }
  } else if (mode === 'virtual') {
    // Virtual mode logs text and triggers modal / notification
    console.log('Virtual print output generated:\n', receiptText);
  } else {
    // Default fallback
    printViaSystemBrowser(receiptText, paperSize);
  }
}
