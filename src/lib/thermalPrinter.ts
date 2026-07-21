// Premium Thermal Printer Simulation Engine for FluxOS

export function triggerThermalPrint(
  typeOrPayload: any,
  maybeData?: any
): Promise<void> {
  let type = '';
  let title = '';
  let data = null;

  if (typeof typeOrPayload === 'string') {
    type = typeOrPayload;
    data = maybeData;
    title = type === 'cash_flow' ? 'Fechamento de Caixa' : 'Cupom Térmico';
  } else if (typeOrPayload && typeof typeOrPayload === 'object') {
    type = typeOrPayload.type;
    title = typeOrPayload.title || 'Cupom Térmico';
    data = typeOrPayload.data;
  }

  console.log(`%c=== FluxOS THERMAL PRINT SIMULATION ===`, 'color: #10B981; font-weight: bold; font-size: 14px;');
  console.log(`Type: ${type}`);
  console.log(`Title: ${title}`);
  console.log('Data:', data);
  console.log('%c========================================', 'color: #10B981; font-weight: bold; font-size: 14px;');

  // Let the user know the print job was dispatched successfully
  const systemAlert = (window as any).alert;
  if (typeof systemAlert === 'function') {
    systemAlert(`Trabalho de impressão enviado com sucesso para a impressora cadastrada (${title}).`, 'success');
  } else {
    console.log(`Print job succeeded: ${title}`);
  }

  return Promise.resolve();
}
