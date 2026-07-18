import { Product, Supplier, CashierUser, Sale, FinancialTransaction, TableComandaState } from '../types';

export const INITIAL_CASHIER_USERS: CashierUser[] = [
  { id: 'u1', name: 'Carlos (Dono/Admin)', pin: '1234', role: 'admin', active: true },
  { id: 'u2', name: 'Vanessa (Gerente)', pin: '2222', role: 'manager', active: true },
  { id: 'u3', name: 'João (Garçom)', pin: '3333', role: 'waiter', active: true },
  { id: 'u4', name: 'Lucas (Garçom)', pin: '4444', role: 'waiter', active: true },
  { id: 'u5', name: 'Roberto (Financeiro)', pin: '5555', role: 'finance', active: true },
  { id: 'u6', name: 'Márcia (Caixa)', pin: '6666', role: 'cashier', active: true },
  { id: 'u7', name: 'Ana (Cozinha)', pin: '7777', role: 'kitchen', active: true },
  { id: 'u8', name: 'Felipe (Barman)', pin: '8888', role: 'bar', active: true },
];

export const INITIAL_SUPPLIERS: Supplier[] = [
  { id: 's1', companyName: 'Ambev Distribuidora S.A.', contactName: 'Ricardo Silva', phone: '(11) 98765-4321', whatsapp: '11987654321', email: 'ricardo.silva@ambev.com.br', notes: 'Entregas nas terças e quintas. Prazo de pagamento: 14 dias.' },
  { id: 's2', companyName: 'Coca-Cola FEMSA Brasil', contactName: 'Mariana Costa', phone: '(11) 99888-7766', whatsapp: '11998887766', email: 'mariana.costa@femsa.com', notes: 'Pedido mínimo R$ 800,00. Entregas quartas-feiras.' },
  { id: 's3', companyName: 'Vinhos & Cia Importadora', contactName: 'Stefano Rossi', phone: '(11) 97766-5544', whatsapp: '11977665544', email: 'vendas@vinhosecia.com.br', notes: 'Importador exclusivo de vinhos chilenos e argentinos.' },
  { id: 's4', companyName: 'Atacadão de Bebidas Centro-Oeste', contactName: 'Roberto Alencar', phone: '(61) 98822-3344', whatsapp: '61988223344', email: 'roberto@atacadaobebidas.com', notes: 'Compra pontual de destilados em lote com ótimos preços.' },
  { id: 's5', companyName: 'Gelo Cristal S.A.', contactName: 'Junior Gelo', phone: '(11) 96655-4433', whatsapp: '11966554433', email: 'contato@gelocristal.com.br', notes: 'Entregas diárias ou sob demanda rápida.' },
];

export const INITIAL_PRODUCTS: Product[] = [
  // Cervejas
  {
    id: 'p1',
    name: 'Cerveja Heineken Long Neck 330ml',
    barcode: '7891008100021',
    sku: 'BEER-HEI-330',
    category: 'Cervejas',
    brand: 'Heineken',
    supplierId: 's1',
    costPrice: 4.80,
    sellPrice: 8.50,
    margin: 43.53,
    unit: 'UN',
    boxQuantity: 24,
    stockBoxes: 15,
    stockUnits: 12, // Total = 15 * 24 + 12 = 372
    minStockUnits: 120,
    maxStockUnits: 600,
    active: true,
    ageRestricted: true,
    image: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?q=80&w=200&auto=format&fit=crop',
    notes: 'Manter gelada. Giro extremamente alto.'
  },
  {
    id: 'p2',
    name: 'Cerveja Corona Extra 355ml',
    barcode: '7501064112154',
    sku: 'BEER-COR-355',
    category: 'Cervejas',
    brand: 'Corona',
    supplierId: 's1',
    costPrice: 5.10,
    sellPrice: 9.00,
    margin: 43.33,
    unit: 'UN',
    boxQuantity: 24,
    stockBoxes: 8,
    stockUnits: 18, // Total = 210
    minStockUnits: 96,
    maxStockUnits: 300,
    active: true,
    ageRestricted: true,
    image: 'https://images.unsplash.com/photo-1600718374662-0483d2b9da44?q=80&w=200&auto=format&fit=crop',
    notes: 'Exige limão na operação se servido na mesa.'
  },
  {
    id: 'p3',
    name: 'Cerveja Amstel Latão 473ml',
    barcode: '7891008121040',
    sku: 'BEER-AMS-473',
    category: 'Cervejas',
    brand: 'Amstel',
    supplierId: 's1',
    costPrice: 2.90,
    sellPrice: 5.50,
    margin: 47.27,
    unit: 'UN',
    boxQuantity: 12,
    stockBoxes: 4,
    stockUnits: 2, // Total = 50 (Alerta crítico: mínimo é 72)
    minStockUnits: 72,
    maxStockUnits: 240,
    active: true,
    ageRestricted: true,
    image: 'https://images.unsplash.com/photo-1597075687490-8f673c6c17f6?q=80&w=200&auto=format&fit=crop',
    notes: 'Estoque baixo, repor com Ambev urgente.'
  },

  // Destilados
  {
    id: 'p4',
    name: 'Whisky Johnnie Walker Red Label 1L',
    barcode: '5000267014201',
    sku: 'DIST-RED-1L',
    category: 'Destilados',
    brand: 'Johnnie Walker',
    supplierId: 's4',
    costPrice: 72.00,
    sellPrice: 119.90,
    margin: 39.95,
    unit: 'UN',
    boxQuantity: 6,
    stockBoxes: 12,
    stockUnits: 4, // Total = 76
    minStockUnits: 24,
    maxStockUnits: 120,
    active: true,
    ageRestricted: true,
    image: 'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?q=80&w=200&auto=format&fit=crop',
    notes: 'Usado muito para venda de combos.'
  },
  {
    id: 'p5',
    name: 'Vodka Absolut Regular 1L',
    barcode: '7312040017072',
    sku: 'DIST-ABS-1L',
    category: 'Destilados',
    brand: 'Absolut',
    supplierId: 's4',
    costPrice: 65.00,
    sellPrice: 105.00,
    margin: 38.10,
    unit: 'UN',
    boxQuantity: 6,
    stockBoxes: 5,
    stockUnits: 1, // Total = 31
    minStockUnits: 18,
    maxStockUnits: 60,
    active: true,
    ageRestricted: true,
    image: 'https://images.unsplash.com/photo-1569529465841-dfedd87500f8?q=80&w=200&auto=format&fit=crop'
  },
  {
    id: 'p6',
    name: 'Gin Tanqueray London Dry 750ml',
    barcode: '5000291020704',
    sku: 'DIST-TAN-750',
    category: 'Destilados',
    brand: 'Tanqueray',
    supplierId: 's4',
    costPrice: 85.00,
    sellPrice: 139.90,
    margin: 39.24,
    unit: 'UN',
    boxQuantity: 6,
    stockBoxes: 2,
    stockUnits: 5, // Total = 17
    minStockUnits: 12,
    maxStockUnits: 36,
    active: true,
    ageRestricted: true,
    image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=200&auto=format&fit=crop'
  },

  // Vinhos
  {
    id: 'p7',
    name: 'Vinho Casillero del Diablo Cabernet Sauvignon 750ml',
    barcode: '7804320753232',
    sku: 'WINE-CAS-CAB',
    category: 'Vinhos',
    brand: 'Concha y Toro',
    supplierId: 's3',
    costPrice: 32.50,
    sellPrice: 59.90,
    margin: 45.74,
    unit: 'UN',
    boxQuantity: 6,
    stockBoxes: 10,
    stockUnits: 3, // Total = 63
    minStockUnits: 18,
    maxStockUnits: 90,
    active: true,
    ageRestricted: true,
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=200&auto=format&fit=crop'
  },
  {
    id: 'p8',
    name: 'Vinho Quinta do Morgado Tinto Suave 750ml',
    barcode: '7896022201019',
    sku: 'WINE-QTM-SUA',
    category: 'Vinhos',
    brand: 'Quinta do Morgado',
    supplierId: 's3',
    costPrice: 11.20,
    sellPrice: 22.00,
    margin: 49.09,
    unit: 'UN',
    boxQuantity: 12,
    stockBoxes: 3,
    stockUnits: 11, // Total = 47
    minStockUnits: 24,
    maxStockUnits: 120,
    active: true,
    ageRestricted: true,
    image: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?q=80&w=200&auto=format&fit=crop',
    notes: 'Vinho de mesa mais vendido.'
  },

  // Não alcoólicos / Conveniência
  {
    id: 'p9',
    name: 'Refrigerante Coca-Cola Lata 350ml',
    barcode: '7894900011517',
    sku: 'SOFT-COC-350',
    category: 'Refrigerantes',
    brand: 'Coca-Cola',
    supplierId: 's2',
    costPrice: 2.10,
    sellPrice: 5.00,
    margin: 58.00,
    unit: 'UN',
    boxQuantity: 12,
    stockBoxes: 40,
    stockUnits: 5, // Total = 485
    minStockUnits: 120,
    maxStockUnits: 1000,
    active: true,
    ageRestricted: false,
    image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=200&auto=format&fit=crop'
  },
  {
    id: 'p10',
    name: 'Energético Red Bull Energy Drink 250ml',
    barcode: '9002490100070',
    sku: 'SOFT-RDB-250',
    category: 'Energéticos',
    brand: 'Red Bull',
    supplierId: 's2',
    costPrice: 5.20,
    sellPrice: 10.00,
    margin: 48.00,
    unit: 'UN',
    boxQuantity: 24,
    stockBoxes: 20,
    stockUnits: 14, // Total = 494
    minStockUnits: 96,
    maxStockUnits: 480,
    active: true,
    ageRestricted: false,
    image: 'https://images.unsplash.com/photo-1622543953490-0b70039a4ac1?q=80&w=200&auto=format&fit=crop',
    notes: 'Combina muito com whiskies and vodkas.'
  },
  {
    id: 'p11',
    name: 'Gelo de Coco Fardo c/ 10 un',
    barcode: '7898877660012',
    sku: 'CONV-ICE-COC',
    category: 'Gelo',
    brand: 'Gelo Cristal',
    supplierId: 's5',
    costPrice: 14.00,
    sellPrice: 28.00,
    margin: 50.00,
    unit: 'UN',
    boxQuantity: 1,
    stockBoxes: 0,
    stockUnits: 18, // Total = 18 (Alerta crítico: mínimo é 20)
    minStockUnits: 20,
    maxStockUnits: 100,
    active: true,
    ageRestricted: false,
    image: 'https://images.unsplash.com/photo-1559811814-e2c57b5e69df?q=80&w=200&auto=format&fit=crop',
    notes: 'Manter no freezer horizontal de conveniência.'
  },

  // Combos
  {
    id: 'p12',
    name: 'Combo Red Label + 5 Red Bull + Gelo de Coco',
    barcode: '9991112223330',
    sku: 'CMB-RED-RDB',
    category: 'Combos',
    brand: 'Vários',
    supplierId: 's4',
    costPrice: 112.00,
    sellPrice: 189.90,
    margin: 41.02,
    unit: 'UN',
    boxQuantity: 1,
    stockBoxes: 0,
    stockUnits: 15, // Produção sob demanda, mas estocado virtualmente
    minStockUnits: 5,
    maxStockUnits: 30,
    active: true,
    ageRestricted: true,
    image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?q=80&w=200&auto=format&fit=crop',
    notes: 'Produto campeão de vendas de sexta e sábado.'
  },
  {
    id: 'p13',
    name: 'Cigarro Marlboro Gold Box',
    barcode: '78923456',
    sku: 'CONV-MAR-GBX',
    category: 'Cigarros',
    brand: 'Marlboro',
    supplierId: 's4',
    costPrice: 9.50,
    sellPrice: 12.00,
    margin: 20.83,
    unit: 'UN',
    boxQuantity: 10, // 1 fardo com 10 carteiras
    stockBoxes: 2,
    stockUnits: 4, // Total = 24 carteiras
    minStockUnits: 20,
    maxStockUnits: 100,
    active: true,
    ageRestricted: true,
    image: 'https://images.unsplash.com/photo-1556997685-309989c1aa82?q=80&w=200&auto=format&fit=crop',
    notes: 'Margem baixa mas gera muito tráfego.'
  },
  {
    id: 'p14',
    name: 'Batata Frita Especial com Cheddar e Bacon 400g',
    barcode: '7898877660029',
    sku: 'FOOD-FRY-SPE',
    category: 'Petiscos',
    brand: 'Cozinha Adega',
    supplierId: 's5',
    costPrice: 12.00,
    sellPrice: 28.90,
    margin: 58.48,
    unit: 'UN',
    boxQuantity: 1,
    stockBoxes: 0,
    stockUnits: 50,
    minStockUnits: 10,
    maxStockUnits: 100,
    active: true,
    ageRestricted: false,
    image: 'https://images.unsplash.com/photo-1576107232684-1279f390859f?q=80&w=200&auto=format&fit=crop',
    notes: 'Preparado frito na hora pela cozinha.'
  },
  {
    id: 'p15',
    name: 'Frango a Passarinho Crocante com Alho',
    barcode: '7898877660036',
    sku: 'FOOD-CHIK-CRO',
    category: 'Petiscos',
    brand: 'Cozinha Adega',
    supplierId: 's5',
    costPrice: 16.50,
    sellPrice: 38.00,
    margin: 56.58,
    unit: 'UN',
    boxQuantity: 1,
    stockBoxes: 0,
    stockUnits: 30,
    minStockUnits: 5,
    maxStockUnits: 60,
    active: true,
    ageRestricted: false,
    image: 'https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?q=80&w=200&auto=format&fit=crop',
    notes: 'Porção inteira frita na hora.'
  }
];

// Generate last 30 days of sales dynamically to build gorgeous charts and metrics
export const generateMockSales = (): Sale[] => {
  const sales: Sale[] = [];
  const startDay = new Date();
  startDay.setDate(startDay.getDate() - 30);

  let saleCounter = 1204;

  const paymentMethods: ('pix' | 'dinheiro' | 'debito' | 'credito' | 'dividido' | 'fiado')[] = [
    'pix', 'pix', 'credito', 'credito', 'debito', 'dinheiro', 'dividido', 'fiado'
  ];

  const types: ('mesa' | 'comanda' | 'balcao' | 'entrega')[] = [
    'balcao', 'balcao', 'mesa', 'comanda', 'entrega'
  ];

  const waitering = ['João (Garçom)', 'Lucas (Garçom)', undefined];

  // 30 days loop
  for (let i = 0; i <= 30; i++) {
    const currentDate = new Date(startDay);
    currentDate.setDate(startDay.getDate() + i);

    // Number of sales in a day: higher on weekends (Friday, Saturday, Sunday)
    const dayOfWeek = currentDate.getDay(); // 0 is Sunday, 5 is Friday, 6 is Saturday
    let salesCount = 15 + Math.floor(Math.random() * 10);
    if (dayOfWeek === 5 || dayOfWeek === 6) {
      salesCount = 35 + Math.floor(Math.random() * 25); // high traffic weekends
    } else if (dayOfWeek === 0) {
      salesCount = 20 + Math.floor(Math.random() * 15);
    }

    for (let s = 0; s < salesCount; s++) {
      const saleDate = new Date(currentDate);
      // Hour of sale: mostly evening (16:00 to 23:59 or 02:00)
      let hour = 14 + Math.floor(Math.random() * 10);
      if (Math.random() > 0.5) {
        hour = (20 + Math.floor(Math.random() * 6)) % 24; // evening/early morning
      }
      saleDate.setHours(hour);
      saleDate.setMinutes(Math.floor(Math.random() * 60));
      saleDate.setSeconds(Math.floor(Math.random() * 60));

      const type = types[Math.floor(Math.random() * types.length)];
      const payMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];

      // Pick random 1 to 4 items
      const itemQty = 1 + Math.floor(Math.random() * 3);
      const saleItems: any[] = [];
      let subtotal = 0;

      // Ensure at least 1 item is pickable
      const shuffledProducts = [...INITIAL_PRODUCTS].sort(() => 0.5 - Math.random());
      for (let k = 0; k < Math.min(itemQty, shuffledProducts.length); k++) {
        const prod = shuffledProducts[k];
        const qty = 1 + Math.floor(Math.random() * 3);
        saleItems.push({
          productId: prod.id,
          quantity: qty,
          unitPrice: prod.sellPrice,
          notes: Math.random() > 0.8 ? 'Gelo extra' : undefined
        });
        subtotal += prod.sellPrice * qty;
      }

      const discount = Math.random() > 0.8 ? Math.floor(subtotal * 0.05) : 0;
      const total = subtotal - discount;

      const isCanceled = Math.random() > 0.95 && i < 28; // avoid canceling on today's latest sales so the UI looks active
      const status = isCanceled ? 'cancelado' : 'pago';
      const cancelReason = isCanceled ? ['Desistência do cliente', 'Erro de lançamento', 'Cartão recusado', 'Mudança de mesa'][Math.floor(Math.random() * 4)] : undefined;

      const identifier = type === 'mesa' ? `Mesa ${1 + Math.floor(Math.random() * 15)}` :
                         type === 'comanda' ? `Comanda ${100 + Math.floor(Math.random() * 80)}` :
                         type === 'entrega' ? `WhatsApp - Ent. ${1 + Math.floor(Math.random() * 5)}` :
                         `Balcão #${1 + Math.floor(Math.random() * 50)}`;

      sales.push({
        id: `sale-${saleCounter}`,
        number: String(saleCounter),
        timestamp: saleDate.toISOString(),
        type,
        identifier,
        items: saleItems,
        subtotal,
        discount,
        total,
        paymentMethod: payMethod,
        cardBrand: payMethod === 'credito' || payMethod === 'debito' ? 'Stone - Visa' : undefined,
        status,
        cancelReason,
        cashierId: ['u1', 'u2', 'u6'][Math.floor(Math.random() * 3)],
        waiterName: type === 'mesa' || type === 'comanda' ? waitering[Math.floor(Math.random() * waitering.length)] : undefined
      });

      saleCounter++;
    }
  }

  // Sort sales from newest to oldest
  return sales.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

export const MOCK_SALES = generateMockSales();

export const MOCK_FINANCIAL_TRANSACTIONS = (): FinancialTransaction[] => {
  const transactions: FinancialTransaction[] = [];
  
  // Backfill 30 days of fixed expenses and some purchases
  const startDay = new Date();
  startDay.setDate(startDay.getDate() - 30);

  // Fixed Monthly Expenses
  transactions.push(
    { id: 'f1', date: '2026-07-05', type: 'despesa', category: 'Aluguel', description: 'Aluguel do Galpão Adega', value: 3200.00, status: 'pago' },
    { id: 'f2', date: '2026-07-10', type: 'despesa', category: 'Energia', description: 'Enel - Conta de Luz (Freezers ligados 24h)', value: 1450.00, status: 'pago' },
    { id: 'f3', date: '2026-07-08', type: 'despesa', category: 'Salários', description: 'Folha de pagamento colaboradores', value: 5800.00, status: 'pago' },
    { id: 'f4', date: '2026-07-12', type: 'despesa', category: 'Internet', description: 'Vivo Fibra Dedicada 500MB', value: 180.00, status: 'pago' },
    { id: 'f5', date: '2026-07-01', type: 'despesa', category: 'Sistemas', description: 'Mensalidade AdegaOS Cloud', value: 149.90, status: 'pago' }
  );

  // Future Account Payables & Receivables
  const today = new Date();
  const nextWeek1 = new Date(); nextWeek1.setDate(today.getDate() + 4);
  const nextWeek2 = new Date(); nextWeek2.setDate(today.getDate() + 8);
  const prevWeek1 = new Date(); prevWeek1.setDate(today.getDate() - 3);

  transactions.push(
    { id: 'f6', date: prevWeek1.toISOString().split('T')[0], type: 'despesa', category: 'Fornecedores', description: 'Ambev - Fatura Cervejas', value: 2450.00, status: 'pago' },
    { id: 'f7', date: nextWeek1.toISOString().split('T')[0], type: 'despesa', category: 'Fornecedores', description: 'Coca-Cola - Fatura Refrigerantes', value: 1200.00, status: 'pendente', dueDate: nextWeek1.toISOString().split('T')[0] },
    { id: 'f8', date: nextWeek2.toISOString().split('T')[0], type: 'despesa', category: 'Fornecedores', description: 'Wine Importadora - Parcelado Vinhos', value: 1850.00, status: 'pendente', dueDate: nextWeek2.toISOString().split('T')[0] },
    { id: 'f9', date: nextWeek1.toISOString().split('T')[0], type: 'receita', category: 'Outros', description: 'Contrato de Parceria Heineken Evento', value: 1500.00, status: 'pendente', dueDate: nextWeek1.toISOString().split('T')[0] }
  );

  return transactions;
};

export const INITIAL_TABLES_COMANDAS: TableComandaState[] = [
  // Mesas
  {
    id: 'mesa-1',
    type: 'mesa',
    number: 1,
    status: 'ocupada',
    waiterId: 'u3',
    waiterName: 'João (Garçom)',
    items: [
      { productId: 'p1', quantity: 4, status: 'entregue', statusHistory: [{ status: 'entregue', timestamp: new Date().toISOString(), userId: 'u3' }] },
      { productId: 'p12', quantity: 1, status: 'preparo', statusHistory: [{ status: 'preparo', timestamp: new Date().toISOString(), userId: 'u3' }] }
    ],
    subtotal: 4 * 8.50 + 189.90
  },
  { id: 'mesa-2', type: 'mesa', number: 2, status: 'livre', items: [], subtotal: 0 },
  {
    id: 'mesa-3',
    type: 'mesa',
    number: 3,
    status: 'ocupada',
    waiterId: 'u4',
    waiterName: 'Lucas (Garçom)',
    items: [
      { productId: 'p2', quantity: 3, status: 'entregue', statusHistory: [{ status: 'entregue', timestamp: new Date().toISOString(), userId: 'u4' }] },
      { productId: 'p11', quantity: 1, status: 'entregue', statusHistory: [{ status: 'entregue', timestamp: new Date().toISOString(), userId: 'u4' }] }
    ],
    subtotal: 3 * 9.00 + 28.00
  },
  { id: 'mesa-4', type: 'mesa', number: 4, status: 'livre', items: [], subtotal: 0 },
  { id: 'mesa-5', type: 'mesa', number: 5, status: 'livre', items: [], subtotal: 0 },
  { id: 'mesa-6', type: 'mesa', number: 6, status: 'livre', items: [], subtotal: 0 },

  // Comandas
  {
    id: 'comanda-101',
    type: 'comanda',
    number: 101,
    status: 'ocupada',
    waiterId: 'u3',
    waiterName: 'João (Garçom)',
    items: [
      { productId: 'p4', quantity: 1, status: 'entregue', statusHistory: [{ status: 'entregue', timestamp: new Date().toISOString(), userId: 'u3' }] },
      { productId: 'p10', quantity: 2, status: 'entregue', statusHistory: [{ status: 'entregue', timestamp: new Date().toISOString(), userId: 'u3' }] }
    ],
    subtotal: 119.90 + 2 * 10.00
  },
  {
    id: 'comanda-102',
    type: 'comanda',
    number: 102,
    status: 'fechando',
    waiterId: 'u4',
    waiterName: 'Lucas (Garçom)',
    items: [
      { productId: 'p1', quantity: 6, status: 'entregue', statusHistory: [{ status: 'entregue', timestamp: new Date().toISOString(), userId: 'u4' }] },
      { productId: 'p13', quantity: 1, status: 'entregue', statusHistory: [{ status: 'entregue', timestamp: new Date().toISOString(), userId: 'u4' }] }
    ],
    subtotal: 6 * 8.50 + 12.00
  },
  { id: 'comanda-103', type: 'comanda', number: 103, status: 'livre', items: [], subtotal: 0 },
  { id: 'comanda-104', type: 'comanda', number: 104, status: 'livre', items: [], subtotal: 0 },
];
