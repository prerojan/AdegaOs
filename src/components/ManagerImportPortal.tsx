import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  FileSpreadsheet, Download, Upload, Check, X, Barcode, 
  UserCheck, Truck, AlertCircle, HelpCircle, Keyboard, Play, RefreshCw, Layers
} from 'lucide-react';
import { Product, Supplier, CashierUser } from '../types';
import * as XLSX from 'xlsx';
import { exportStyledTemplate } from '../lib/excelExport';

interface ManagerImportPortalProps {
  products: Product[];
  suppliers: Supplier[];
  usersList: CashierUser[];
  onAddProduct: (prod: Product) => void;
  onUpdateProduct: (prod: Product) => void;
  onBatchImportProducts?: (newProds: Product[], updatedProds: Product[]) => void;
  onAddSupplier: (sup: Supplier) => void;
  onAddUser: (user: CashierUser) => void;
  categories: string[];
  onAddCategory: (cat: string) => void;
  theme: 'dark' | 'light';
  startWithWizardOpen?: boolean;
  onCloseWizard?: () => void;
}

// Helper to find column value in a row regardless of exact header capitalization/accents/aliases
function getRowVal(row: any, aliases: string[]): any {
  if (!row || typeof row !== 'object') return undefined;
  const rowKeys = Object.keys(row);
  
  // 1. Exact or normalized key search
  for (const alias of aliases) {
    const target = alias.toLowerCase().replace(/[^a-z0-9]/g, '');
    const foundKey = rowKeys.find(k => k.toLowerCase().replace(/[^a-z0-9]/g, '') === target);
    if (foundKey !== undefined && row[foundKey] !== undefined && row[foundKey] !== null) {
      return row[foundKey];
    }
  }

  // 2. Contains key search
  for (const alias of aliases) {
    const target = alias.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (target.length < 3) continue;
    const foundKey = rowKeys.find(k => k.toLowerCase().replace(/[^a-z0-9]/g, '').includes(target));
    if (foundKey !== undefined && row[foundKey] !== undefined && row[foundKey] !== null) {
      return row[foundKey];
    }
  }

  return undefined;
}

// Extract product name with intelligent fallback for non-standard spreadsheets
function getProductName(row: any): string {
  if (!row || typeof row !== 'object') return '';

  // 1. Search by known aliases
  const val = getRowVal(row, [
    'nome', 'name', 'nome do produto', 'nome_do_produto', 'descrição', 'descricao', 
    'descrição do produto', 'descricao do produto', 'descrição_do_produto', 'descricao_do_produto', 
    'produto', 'item', 'mercadoria', 'artigo', 'especificação', 'especificacao', 
    'denominação', 'denominacao', 'título', 'titulo', 'detalhes', 'desc', 'desc_prod', 
    'descricao_item', 'desc_item', 'prod', 'DESCRICAO', 'PRODUTO', 'DESCRICAO_DO_PRODUTO'
  ]);

  if (val !== undefined && val !== null) {
    const strVal = String(val).trim();
    if (strVal && !/^(total|relatório|relatorio|subtotal|página|pagina)$/i.test(strVal)) {
      return strVal;
    }
  }

  // 2. Smart fallback: inspect all row keys/values for a non-numeric text string >= 2 chars
  const values = Object.values(row);
  for (const v of values) {
    if (v === null || v === undefined) continue;
    let str = String(v).trim();
    if (!str) continue;

    // Skip pure numbers, prices, dates, units, barcodes
    if (/^\d+(\.\d+)?$/.test(str)) continue;
    if (/^r\$\s*\d+/i.test(str)) continue;
    if (/^(un|lt|kg|cx|pct|fd|l|g|ml)$/i.test(str)) continue;
    if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(str)) continue;
    if (/^(total|relatório|relatorio|subtotal|página|pagina)$/i.test(str)) continue;

    if (str.length >= 2 && !/^\d{8,14}$/.test(str)) {
      return str;
    }
  }

  return '';
}

// Converts a worksheet into normalized object rows by auto-detecting the header row
function extractRowsFromWorksheet(ws: XLSX.WorkSheet): any[] {
  if (!ws) return [];

  const matrix: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  const standardObjects: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

  if (!matrix || matrix.length === 0) return standardObjects;

  const headerKeywords = [
    'nome', 'descri', 'produto', 'item', 'preco', 'preço', 'custo', 'venda', 
    'estoque', 'qtd', 'quant', 'codigo', 'código', 'barras', 'sku', 'categoria', 
    'marca', 'valor', 'saldo', 'ref', 'unidade', 'descricao'
  ];

  let bestHeaderRowIndex = -1;
  let maxMatches = 0;

  for (let r = 0; r < Math.min(matrix.length, 15); r++) {
    const row = matrix[r];
    if (!Array.isArray(row)) continue;

    let matches = 0;
    row.forEach(cell => {
      const cellStr = String(cell || '').toLowerCase().replace(/[^a-z0-9áéíóúçãõ]/g, '');
      if (headerKeywords.some(kw => cellStr.includes(kw))) {
        matches++;
      }
    });

    if (matches > maxMatches) {
      maxMatches = matches;
      bestHeaderRowIndex = r;
    }
  }

  if (bestHeaderRowIndex >= 0 && maxMatches >= 1) {
    const headers = matrix[bestHeaderRowIndex].map(h => String(h || '').trim());
    const extractedRows: any[] = [];

    for (let r = bestHeaderRowIndex + 1; r < matrix.length; r++) {
      const row = matrix[r];
      if (!Array.isArray(row) || row.every(cell => String(cell || '').trim() === '')) {
        continue;
      }

      const obj: Record<string, any> = {};
      let hasData = false;
      headers.forEach((h, colIdx) => {
        const key = h || `col_${colIdx}`;
        const val = row[colIdx] !== undefined ? row[colIdx] : '';
        obj[key] = val;
        if (String(val).trim()) hasData = true;
      });
      if (hasData) {
        extractedRows.push(obj);
      }
    }

    if (extractedRows.length > 0) {
      return extractedRows;
    }
  }

  return standardObjects;
}

// Parses prices like "R$ 15,90", "15,90", "1.250,50", 15.9
function parseFormattedPrice(val: any): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  let str = String(val).trim();
  if (!str) return 0;

  str = str.replace(/[R$\s]/gi, '');

  if (str.includes('.') && str.includes(',')) {
    str = str.replace(/\./g, '').replace(',', '.');
  } else if (str.includes(',')) {
    str = str.replace(',', '.');
  }

  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

// Parses integers like "10", "10,00", "10.0"
function parseFormattedInt(val: any): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : Math.round(val);
  const num = parseFormattedPrice(val);
  return Math.round(num);
}

// Cleans barcodes
function cleanBarcodeStr(val: any): string {
  if (val === null || val === undefined) return '';
  let str = String(val).trim();
  if (!str || str.toLowerCase() === 'null' || str.toLowerCase() === 'undefined' || str.toLowerCase() === 'sem_codigo' || str === '0') {
    return '';
  }
  if (/^\d+\.0$/.test(str)) {
    str = str.replace(/\.0$/, '');
  }
  if (str.toLowerCase().includes('e+')) {
    const num = Number(val);
    if (!isNaN(num)) {
      str = BigInt(Math.round(num)).toString();
    }
  }
  return str;
}

export default function ManagerImportPortal({
  products,
  suppliers,
  usersList,
  onAddProduct,
  onUpdateProduct,
  onBatchImportProducts,
  onAddSupplier,
  onAddUser,
  categories,
  onAddCategory,
  theme,
  startWithWizardOpen = false,
  onCloseWizard
}: ManagerImportPortalProps) {
  
  const [activeTab, setActiveTab] = useState<'produtos' | 'funcionarios' | 'fornecedores'>('produtos');
  const [dragOver, setDragOver] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Import mode for handling duplicates: 'upsert' (update existing + add new), 'skip' (ignore duplicates), 'allowAll' (add as new)
  const [importMode, setImportMode] = useState<'upsert' | 'skip' | 'allowAll'>('upsert');
  const [rawSheetRows, setRawSheetRows] = useState<any[] | null>(null);

  // Parsed states for preview
  const [previewProducts, setPreviewProducts] = useState<Product[]>([]);
  const [previewToUpdate, setPreviewToUpdate] = useState<Product[]>([]);
  const [previewUsers, setPreviewUsers] = useState<CashierUser[]>([]);
  const [previewSuppliers, setPreviewSuppliers] = useState<Supplier[]>([]);
  const [newCategoriesToRegister, setNewCategoriesToRegister] = useState<string[]>([]);
  const [skippedItems, setSkippedItems] = useState<{
    rowNumber: number;
    name: string;
    barcode: string;
    reason: string;
    rawRow: any;
  }[]>([]);

  // Filter for preview table: 'all', 'new', 'update', 'skipped'
  const [tableFilter, setTableFilter] = useState<'all' | 'new' | 'update' | 'skipped'>('all');
  const [stats, setStats] = useState<{ total: number; valid: number; duplicates: number } | null>(null);

  // Barcode Wizard States
  const [showWizard, setShowWizard] = useState(startWithWizardOpen);
  const [wizardProducts, setWizardProducts] = useState<Product[]>([]);
  const [wizardIndex, setWizardIndex] = useState(0);
  const [wizardInput, setWizardInput] = useState('');
  const [wizardWarning, setWizardWarning] = useState<string | null>(null);
  const [wizardSuccess, setWizardSuccess] = useState<string | null>(null);
  const [scanHistory, setScanHistory] = useState<{
    id: string;
    productName: string;
    barcode: string;
    timestamp: string;
    skipped: boolean;
  }[]>([]);

  const scanInputRef = useRef<HTMLInputElement>(null);

  // Sync showWizard if prop changes
  useEffect(() => {
    if (startWithWizardOpen) {
      setShowWizard(true);
    }
  }, [startWithWizardOpen]);

  // Compute products that have empty barcode
  const pendingBarcodeProducts = useMemo(() => {
    return products.filter(p => !p.barcode && p.active);
  }, [products]);

  // Handle opening of wizard
  useEffect(() => {
    if (showWizard) {
      setWizardProducts(pendingBarcodeProducts);
      setWizardIndex(0);
      setWizardWarning(null);
      setWizardSuccess(null);
      // Auto focus input
      setTimeout(() => {
        scanInputRef.current?.focus();
      }, 300);
    }
  }, [showWizard, pendingBarcodeProducts.length]);

  // Auto focus scanning input on click anywhere inside wizard box
  const handleWizardClick = () => {
    scanInputRef.current?.focus();
  };

  // 1. Download templates dynamically
  const handleDownloadTemplate = (type: 'produtos' | 'funcionarios' | 'fornecedores') => {
    exportStyledTemplate(type)
      .then(() => {
        // Success
      })
      .catch(err => {
        console.error('Erro ao baixar modelo de planilha:', err);
        alert('Ocorreu um erro ao gerar a planilha modelo.');
      });
  };

  // 2. Drag & Drop events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      parseFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      parseFile(file);
    }
  };

  // 3. Parse spreadsheet
  const parseFile = (file: File) => {
    setParseError(null);
    setSuccessMessage(null);
    setPreviewProducts([]);
    setPreviewToUpdate([]);
    setPreviewUsers([]);
    setPreviewSuppliers([]);
    setNewCategoriesToRegister([]);
    setSkippedItems([]);
    setTableFilter('all');
    setRawSheetRows(null);
    setStats(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data: any[] = extractRowsFromWorksheet(ws);

        if (!data || data.length === 0) {
          setParseError("A planilha selecionada está vazia.");
          return;
        }

        setRawSheetRows(data);
        processImportedData(data, importMode);
      } catch (err: any) {
        setParseError("Erro ao decodificar a planilha. Verifique se o arquivo está corrompido ou no formato incorreto (.xlsx, .xls, .csv).");
        console.error(err);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleModeChange = (mode: 'upsert' | 'skip' | 'allowAll') => {
    setImportMode(mode);
    if (rawSheetRows && rawSheetRows.length > 0) {
      processImportedData(rawSheetRows, mode);
    }
  };

  // 4. Process spreadsheets with flexible headers & smart mode handling
  const processImportedData = (rows: any[], mode: 'upsert' | 'skip' | 'allowAll' = importMode) => {
    if (activeTab === 'produtos') {
      const toAdd: Product[] = [];
      const toUpdate: Product[] = [];
      const skipped: { rowNumber: number; name: string; barcode: string; reason: string; rawRow: any }[] = [];
      const newCats = new Set<string>();

      // Build quick lookup maps for existing products in store
      const existingNameMap = new Map<string, Product>();
      const existingBarcodeMap = new Map<string, Product>();

      products.forEach(p => {
        if (p.name) existingNameMap.set(p.name.toLowerCase().trim(), p);
        if (p.barcode && p.barcode !== 'SEM_CODIGO') existingBarcodeMap.set(p.barcode.trim(), p);
      });

      const batchSeenNames = new Set<string>();
      const batchSeenBarcodes = new Set<string>();

      rows.forEach((row, i) => {
        // Smart search for product name using aliases & value inspection
        const name = getProductName(row);
        const rawBarcode = getRowVal(row, [
          'codigo_barras', 'codigo de barras', 'código de barras', 'cod_barras', 'cod.barras', 
          'codbarras', 'barcode', 'ean', 'gtin', 'plu', 'código', 'codigo', 'cod'
        ]);
        const barcode = cleanBarcodeStr(rawBarcode);

        if (!name) {
          const rowHasData = Object.values(row).some(v => v !== null && v !== undefined && String(v).trim() !== '');
          if (rowHasData) {
            skipped.push({
              rowNumber: i + 2,
              name: 'Linha sem nome/descrição',
              barcode,
              reason: 'Nome de produto não identificado na linha',
              rawRow: row
            });
          }
          return;
        }

        const rawCat = getRowVal(row, ['categoria', 'category', 'grupo', 'secao', 'seção', 'família', 'familia', 'tipo', 'departamento']);
        const category = String(rawCat || 'Outros').trim();

        const rawSku = getRowVal(row, ['sku', 'código interno', 'codigo interno', 'cod_interno', 'cod.interno', 'ref', 'referencia', 'referência', 'id']);
        const sku = String(rawSku || '').trim() || `P-${Date.now()}-${i}`;

        const rawCost = getRowVal(row, ['preco_custo', 'preço de custo', 'preco de custo', 'cost_price', 'custo', 'val_custo', 'preço custo', 'preco custo']);
        const costPrice = parseFormattedPrice(rawCost);

        const rawSell = getRowVal(row, [
          'preco_venda', 'preço de venda', 'preco de venda', 'sell_price', 'venda', 
          'val_venda', 'preço venda', 'preco venda', 'preco', 'preço', 'valor', 'r$'
        ]);
        const sellPrice = parseFormattedPrice(rawSell);

        const rawUnit = getRowVal(row, ['unidade', 'unit', 'un', 'medida', 'um', 'u.m.']);
        const unitStr = String(rawUnit || 'UN').toUpperCase().trim();
        const unit = (unitStr === 'LT' || unitStr === 'KG' ? unitStr : 'UN') as any;

        const rawStock = getRowVal(row, [
          'estoque_unidades', 'estoque unidades', 'stock_units', 'estoque', 'quantidade', 
          'qtd', 'qtd_estoque', 'saldo', 'quantidade atual', 'estoque atual', 'stock'
        ]);
        const stockUnits = parseFormattedInt(rawStock);

        const rawMinStock = getRowVal(row, ['estoque_minimo', 'estoque mínimo', 'estoque minimo', 'min_stock', 'estoque min', 'minimo', 'mínimo']);
        const minStockUnits = parseFormattedInt(rawMinStock);

        const rawBrand = getRowVal(row, ['marca', 'brand', 'fabricante', 'fornecedor']);
        const brand = String(rawBrand || '').trim();

        const margin = sellPrice > 0 ? parseFloat((((sellPrice - costPrice) / sellPrice) * 100).toFixed(2)) : 0;

        if (category && !categories.includes(category)) {
          newCats.add(category);
        }

        const nameLower = name.toLowerCase();
        const existingByBarcode = barcode ? existingBarcodeMap.get(barcode) : undefined;
        const existingByName = existingNameMap.get(nameLower);
        const existingProd = existingByBarcode || existingByName;

        // Skip intra-batch duplicate rows
        if (batchSeenNames.has(nameLower) || (barcode && batchSeenBarcodes.has(barcode))) {
          const isBarcodeDup = barcode && batchSeenBarcodes.has(barcode);
          skipped.push({
            rowNumber: i + 2,
            name,
            barcode,
            reason: isBarcodeDup ? 'Código de barras repetido na mesma planilha' : 'Nome de produto repetido na mesma planilha',
            rawRow: row
          });
          return;
        }

        batchSeenNames.add(nameLower);
        if (barcode) batchSeenBarcodes.add(barcode);

        if (existingProd) {
          if (mode === 'upsert') {
            // Prepare product for updating
            toUpdate.push({
              ...existingProd,
              name,
              category: category || existingProd.category,
              barcode: barcode || existingProd.barcode,
              costPrice: costPrice > 0 ? costPrice : existingProd.costPrice,
              sellPrice: sellPrice > 0 ? sellPrice : existingProd.sellPrice,
              margin: margin > 0 ? margin : existingProd.margin,
              stockUnits: stockUnits > 0 ? stockUnits : existingProd.stockUnits,
              minStockUnits: minStockUnits > 0 ? minStockUnits : existingProd.minStockUnits,
              brand: brand || existingProd.brand,
              unit: unit || existingProd.unit
            });
          } else if (mode === 'skip') {
            skipped.push({
              rowNumber: i + 2,
              name,
              barcode,
              reason: `Já cadastrado no sistema (${existingProd.name}) - Modo Ignorar Duplicados`,
              rawRow: row
            });
            return;
          } else if (mode === 'allowAll') {
            toAdd.push({
              id: `p-imp-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`,
              name,
              category: category || 'Outros',
              barcode,
              sku,
              supplierId: '',
              costPrice,
              sellPrice,
              margin,
              unit,
              boxQuantity: 1,
              stockBoxes: 0,
              stockUnits,
              minStockUnits,
              maxStockUnits: 9999,
              active: true,
              brand,
              ageRestricted: false
            });
          }
        } else {
          // Brand new product!
          toAdd.push({
            id: `p-imp-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`,
            name,
            category: category || 'Outros',
            barcode,
            sku,
            supplierId: '',
            costPrice,
            sellPrice,
            margin,
            unit,
            boxQuantity: 1,
            stockBoxes: 0,
            stockUnits,
            minStockUnits,
            maxStockUnits: 9999,
            active: true,
            brand,
            ageRestricted: false
          });
        }
      });

      setPreviewProducts(toAdd);
      setPreviewToUpdate(toUpdate);
      setSkippedItems(skipped);
      setNewCategoriesToRegister(Array.from(newCats));
      setStats({
        total: rows.length,
        valid: toAdd.length + toUpdate.length,
        duplicates: skipped.length
      });

    } else if (activeTab === 'funcionarios') {
      const parsed: CashierUser[] = [];
      const existingNames = new Set(usersList.map(u => u.name.toLowerCase().trim()));
      const existingPins = new Set(usersList.map(u => u.pin));
      let dupCount = 0;

      rows.forEach((row, i) => {
        const nameVal = getRowVal(row, ['nome_completo', 'nome completo', 'nome', 'funcionario', 'colaborador']);
        const name = String(nameVal || '').trim();
        if (!name) return;

        let pinVal = getRowVal(row, ['senha_pin', 'pin', 'senha', 'codigo']);
        let pin = String(pinVal || '').trim();
        if (!pin) {
          pin = String(Math.floor(1000 + Math.random() * 9000));
        }

        if (existingNames.has(name.toLowerCase()) || existingPins.has(pin)) {
          dupCount++;
          return;
        }

        const roleVal = getRowVal(row, ['cargo', 'role', 'funcao']);
        let role = String(roleVal || 'cashier').toLowerCase().trim();
        const validRoles = ['admin', 'manager', 'finance', 'cashier', 'waiter', 'stock', 'kitchen', 'bar'];
        if (!validRoles.includes(role)) {
          role = 'cashier';
        }

        const activeVal = getRowVal(row, ['ativo', 'active', 'status']);
        const activeStr = String(activeVal || 'Sim').toLowerCase();
        const active = activeStr === 'sim' || activeStr === 'true' || activeStr === 'yes' || activeStr === '1';

        parsed.push({
          id: `u-imp-${Date.now()}-${i}`,
          name,
          pin,
          role: role as any,
          active
        });
      });

      setPreviewUsers(parsed);
      setStats({
        total: rows.length,
        valid: parsed.length,
        duplicates: dupCount
      });

    } else if (activeTab === 'fornecedores') {
      const parsed: Supplier[] = [];
      const existingNames = new Set(suppliers.map(s => s.companyName.toLowerCase().trim()));
      let dupCount = 0;

      rows.forEach((row, i) => {
        const companyVal = getRowVal(row, ['razao_social_ou_nome', 'razao_social', 'razão social', 'nome', 'empresa', 'fornecedor']);
        const companyName = String(companyVal || '').trim();
        if (!companyName) return;

        if (existingNames.has(companyName.toLowerCase())) {
          dupCount++;
          return;
        }

        const contactVal = getRowVal(row, ['nome_contato', 'contato', 'representante']);
        const contactName = String(contactVal || 'Representante').trim();

        const phoneVal = getRowVal(row, ['telefone', 'fone', 'tel', 'celular']);
        const phone = String(phoneVal || '').trim();

        const whatsVal = getRowVal(row, ['whatsapp', 'zap', 'whats']);
        const whatsapp = String(whatsVal || '').trim().replace(/\D/g, '') || phone.replace(/\D/g, '');

        const emailVal = getRowVal(row, ['email', 'e-mail']);
        const email = String(emailVal || '').trim();

        const notesVal = getRowVal(row, ['anotacoes', 'anotações', 'observacoes', 'observações', 'notas']);
        const notes = String(notesVal || '').trim();

        parsed.push({
          id: `s-imp-${Date.now()}-${i}`,
          companyName,
          contactName,
          phone,
          whatsapp,
          email,
          notes
        });
      });

      setPreviewSuppliers(parsed);
      setStats({
        total: rows.length,
        valid: parsed.length,
        duplicates: dupCount
      });
    }
  };

  // 5. Save imported preview data to actual DB
  const handleConfirmImport = () => {
    if (activeTab === 'produtos') {
      if (previewProducts.length === 0 && previewToUpdate.length === 0) return;

      // 1. Register categories
      newCategoriesToRegister.forEach(cat => {
        onAddCategory(cat);
      });

      // 2. Add / Update products
      if (onBatchImportProducts) {
        onBatchImportProducts(previewProducts, previewToUpdate);
      } else {
        previewProducts.forEach(prod => onAddProduct(prod));
        previewToUpdate.forEach(prod => onUpdateProduct(prod));
      }

      const totalProcessed = previewProducts.length + previewToUpdate.length;
      const missingCount = previewProducts.filter(p => !p.barcode).length;

      let msg = `Sucesso! `;
      if (previewProducts.length > 0 && previewToUpdate.length > 0) {
        msg += `${previewProducts.length} novos produtos cadastrados e ${previewToUpdate.length} produtos existentes atualizados!`;
      } else if (previewToUpdate.length > 0) {
        msg += `${previewToUpdate.length} produtos existentes atualizados com sucesso!`;
      } else {
        msg += `${previewProducts.length} novos produtos cadastrados com sucesso!`;
      }

      setSuccessMessage(msg);
      
      if (missingCount > 0) {
        if (confirm(`Importação concluída!\n\nIdentificamos que ${missingCount} produtos novos não possuem código de barras na planilha.\n\nDeseja iniciar o Assistente de Escaneamento Rápido agora para vincular os códigos com seu leitor óptico?`)) {
          setShowWizard(true);
        }
      }

      setPreviewProducts([]);
      setPreviewToUpdate([]);

    } else if (activeTab === 'funcionarios') {
      if (previewUsers.length === 0) return;
      previewUsers.forEach(user => {
        onAddUser(user);
      });
      setSuccessMessage(`Sucesso! ${previewUsers.length} funcionários cadastrados com êxito.`);
      setPreviewUsers([]);

    } else if (activeTab === 'fornecedores') {
      if (previewSuppliers.length === 0) return;
      previewSuppliers.forEach(sup => {
        onAddSupplier(sup);
      });
      setSuccessMessage(`Sucesso! ${previewSuppliers.length} fornecedores cadastrados com êxito.`);
      setPreviewSuppliers([]);
    }

    setStats(null);
  };

  // 6. Barcode wizard operations
  const currentWizardProduct = wizardProducts[wizardIndex];

  // Listener inside input for optical barcode scanner (fast string followed by enter)
  const handleWizardInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const code = wizardInput.trim();
      if (!code) {
        handleMarkNoBarcode();
      } else {
        submitScannedBarcode(code);
      }
    } else if (e.key === ' ') {
      // Space key skips or registers as no barcode if input is empty
      if (!wizardInput.trim() && currentWizardProduct) {
        e.preventDefault();
        handleMarkNoBarcode();
      }
    }
  };

  // Bypasses the active product as having no barcode (for prepared food/manual items)
  const handleMarkNoBarcode = () => {
    if (!currentWizardProduct) return;
    
    const updated: Product = {
      ...currentWizardProduct,
      barcode: 'SEM_CODIGO' // Explicit value for bypassed items
    };
    
    onUpdateProduct(updated);

    // Record in history
    setScanHistory(prev => [
      {
        id: `hist-${Date.now()}-${Math.random()}`,
        productName: currentWizardProduct.name,
        barcode: 'Sem Código (Confirmado)',
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        skipped: true
      },
      ...prev
    ]);
    
    setWizardSuccess(`Produto "${currentWizardProduct.name}" cadastrado sem código de barras.`);
    setWizardWarning(null);
    setWizardInput('');

    // Advance index
    if (wizardIndex < wizardProducts.length - 1) {
      setWizardIndex(prev => prev + 1);
    } else {
      // Finished all pending!
      alert('Todos os produtos pendentes foram processados com sucesso.');
      setShowWizard(false);
      if (onCloseWizard) onCloseWizard();
    }
  };

  const submitScannedBarcode = (code: string) => {
    if (!currentWizardProduct) return;

    // 1. Duplicate checks
    const alreadyLinkedProd = products.find(p => p.barcode === code && p.id !== currentWizardProduct.id);
    
    if (alreadyLinkedProd) {
      setWizardWarning(`O código "${code}" já foi cadastrado para o produto "${alreadyLinkedProd.name}". Insira outro código para evitar duplicidade.`);
      setWizardSuccess(null);
      setWizardInput('');
      return;
    }

    // 2. Success path
    const updated: Product = {
      ...currentWizardProduct,
      barcode: code
    };

    onUpdateProduct(updated);

    // Record in history
    setScanHistory(prev => [
      {
        id: `hist-${Date.now()}-${Math.random()}`,
        productName: currentWizardProduct.name,
        barcode: code,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        skipped: false
      },
      ...prev
    ]);

    setWizardSuccess(`Produto "${currentWizardProduct.name}" cadastrado com sucesso (${code}).`);
    setWizardWarning(null);
    setWizardInput('');

    // Advance index automatically
    if (wizardIndex < wizardProducts.length - 1) {
      setWizardIndex(prev => prev + 1);
    } else {
      alert('Todos os produtos pendentes foram processados e vinculados com sucesso.');
      setShowWizard(false);
      if (onCloseWizard) onCloseWizard();
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in text-xs">
      
      {/* Upper header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Importação de Dados em Lote</h2>
          <p className="text-xs text-gray-400">Cadastre massivamente seu inventário, quadro de funcionários e parceiros fornecedores via planilha do Excel ou CSV.</p>
        </div>

        {pendingBarcodeProducts.length > 0 && (
          <button
            onClick={() => setShowWizard(true)}
            className="px-4 py-2 bg-amber-500 text-black font-extrabold rounded-lg flex items-center gap-2 hover:bg-amber-400 transition-all active:scale-95 cursor-pointer"
          >
            <Barcode className="w-4 h-4 animate-pulse" />
            Assistente de Código de Barras ({pendingBarcodeProducts.length})
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-800/20" style={{ borderColor: theme === 'dark' ? '#1A1A1A' : '#E5E5E5' }}>
        <button
          onClick={() => {
            setActiveTab('produtos');
            setStats(null);
            setParseError(null);
            setSuccessMessage(null);
          }}
          className={`pb-2.5 px-3 font-bold transition-all border-b-2 cursor-pointer ${
            activeTab === 'produtos'
              ? (theme === 'dark' ? 'border-[#18F2A4] text-white' : 'border-[#10B981] text-[#10B981]')
              : 'border-transparent text-gray-400 hover:text-gray-300'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Layers className="w-4 h-4" />
            Produtos / Bebidas
          </div>
        </button>

        <button
          onClick={() => {
            setActiveTab('funcionarios');
            setStats(null);
            setParseError(null);
            setSuccessMessage(null);
          }}
          className={`pb-2.5 px-3 font-bold transition-all border-b-2 cursor-pointer ${
            activeTab === 'funcionarios'
              ? (theme === 'dark' ? 'border-[#18F2A4] text-white' : 'border-[#10B981] text-[#10B981]')
              : 'border-transparent text-gray-400 hover:text-gray-300'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <UserCheck className="w-4 h-4" />
            Funcionários (PIN / Cargos)
          </div>
        </button>

        <button
          onClick={() => {
            setActiveTab('fornecedores');
            setStats(null);
            setParseError(null);
            setSuccessMessage(null);
          }}
          className={`pb-2.5 px-3 font-bold transition-all border-b-2 cursor-pointer ${
            activeTab === 'fornecedores'
              ? (theme === 'dark' ? 'border-[#18F2A4] text-white' : 'border-[#10B981] text-[#10B981]')
              : 'border-transparent text-gray-400 hover:text-gray-300'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Truck className="w-4 h-4" />
            Fornecedores
          </div>
        </button>
      </div>

      {/* Main split grid: Uploader + Instructions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Box 1: File Uploader Card */}
        <div className={`p-6 rounded-xl border flex flex-col gap-4 lg:col-span-2 ${
          theme === 'dark' ? 'bg-[#111111] border-[#1A1A1A]' : 'bg-white border-gray-200'
        }`}>
          <span className="font-extrabold uppercase tracking-widest text-[10px] text-gray-400">1. Upload do Arquivo</span>

          {/* Interactive Drag zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-3 transition-all cursor-pointer ${
              dragOver 
                ? (theme === 'dark' ? 'border-[#18F2A4] bg-[#18F2A4]/5' : 'border-emerald-500 bg-emerald-500/5')
                : (theme === 'dark' ? 'border-gray-800 hover:border-gray-700 bg-black/20' : 'border-gray-300 hover:border-gray-400 bg-gray-50')
            }`}
            onClick={() => document.getElementById('file-upload-input')?.click()}
          >
            <input
              id="file-upload-input"
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleFileChange}
            />
            <div className={`p-3 rounded-full ${theme === 'dark' ? 'bg-[#1C1C1C]' : 'bg-white shadow-sm'}`}>
              <Upload className={`w-6 h-6 ${theme === 'dark' ? 'text-[#18F2A4]' : 'text-emerald-500'}`} />
            </div>
            <div className="text-center">
              <span className="font-bold text-xs block">Arraste seu arquivo Excel / CSV aqui</span>
              <span className="text-[10px] text-gray-400 mt-1 block">ou clique para navegar nos seus arquivos locais</span>
            </div>
          </div>

          {/* Error and Success Notifications */}
          {parseError && (
            <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-[11px]">Falha na leitura do arquivo</span>
                <p className="text-[10px] text-gray-400 mt-0.5">{parseError}</p>
              </div>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-start gap-2.5">
              <Check className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-[11px]">Dados Gravados</span>
                <p className="text-[10px] text-gray-400 mt-0.5">{successMessage}</p>
              </div>
            </div>
          )}

          {/* Preview Panel if parsed data is loaded */}
          {stats && (
            <div className={`p-4 rounded-xl border flex flex-col gap-3 mt-2 ${
              theme === 'dark' ? 'bg-[#0A0A0A] border-gray-900' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex justify-between items-center border-b pb-2" style={{ borderColor: theme === 'dark' ? '#1A1A1A' : '#E5E5E5' }}>
                <span className="font-bold text-[11px]">Resumo do arquivo importado</span>
                <span className="text-[10px] text-gray-400">Confirme as informações abaixo</span>
              </div>

              {/* Duplicate / Update mode selection bar for Products */}
              {activeTab === 'produtos' && (
                <div className="flex flex-col gap-1.5 p-2.5 rounded-lg border bg-black/20 border-gray-800">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Comportamento para Produtos Já Existentes no Sistema:</span>
                  <div className="flex flex-wrap gap-2 text-[10px]">
                    <button
                      type="button"
                      onClick={() => handleModeChange('upsert')}
                      className={`px-2.5 py-1 rounded font-bold transition-all cursor-pointer ${
                        importMode === 'upsert' ? 'bg-emerald-500 text-black shadow-sm' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      Atualizar Preços/Estoque & Cadastrar Novos
                    </button>
                    <button
                      type="button"
                      onClick={() => handleModeChange('skip')}
                      className={`px-2.5 py-1 rounded font-bold transition-all cursor-pointer ${
                        importMode === 'skip' ? 'bg-amber-500 text-black shadow-sm' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      Ignorar Duplicados (Cadastrar Apenas Inexistentes)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleModeChange('allowAll')}
                      className={`px-2.5 py-1 rounded font-bold transition-all cursor-pointer ${
                        importMode === 'allowAll' ? 'bg-blue-500 text-white shadow-sm' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      Cadastrar Todos (Permitir Duplicados)
                    </button>
                  </div>
                </div>
              )}

              {/* Interactive Stat Cards / Filters */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <button
                  type="button"
                  onClick={() => setTableFilter('all')}
                  className={`p-2 rounded-lg border text-center transition-all cursor-pointer ${
                    tableFilter === 'all'
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : (theme === 'dark' ? 'bg-[#111111] border-[#1C1C1C] hover:bg-[#181818]' : 'bg-white border-gray-200 hover:bg-gray-50')
                  }`}
                >
                  <span className="text-gray-400 block text-[9px] uppercase font-bold">Total Lido</span>
                  <span className="text-base font-mono font-bold">{stats.total}</span>
                </button>

                {activeTab === 'produtos' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setTableFilter('new')}
                      className={`p-2 rounded-lg border text-center transition-all cursor-pointer ${
                        tableFilter === 'new'
                          ? 'border-emerald-500 bg-emerald-500/10'
                          : (theme === 'dark' ? 'bg-[#111111] border-[#1C1C1C] hover:bg-[#181818]' : 'bg-white border-gray-200 hover:bg-gray-50')
                      }`}
                    >
                      <span className={`text-[9px] uppercase font-bold block ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`}>Novos a Cadastrar</span>
                      <span className={`text-base font-mono font-bold ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-700'}`}>{previewProducts.length}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTableFilter('update')}
                      className={`p-2 rounded-lg border text-center transition-all cursor-pointer ${
                        tableFilter === 'update'
                          ? 'border-blue-500 bg-blue-500/10'
                          : (theme === 'dark' ? 'bg-[#111111] border-[#1C1C1C] hover:bg-[#181818]' : 'bg-white border-gray-200 hover:bg-gray-50')
                      }`}
                    >
                      <span className={`text-[9px] uppercase font-bold block ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>A Atualizar</span>
                      <span className={`text-base font-mono font-bold ${theme === 'dark' ? 'text-blue-400' : 'text-blue-700'}`}>{previewToUpdate.length}</span>
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setTableFilter('all')}
                    className={`p-2 rounded-lg border text-center transition-all cursor-pointer ${
                      theme === 'dark' ? 'bg-[#111111] border-[#1C1C1C]' : 'bg-white border-gray-200'
                    }`}
                  >
                    <span className={`text-[9px] uppercase font-bold block ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`}>Prontos p/ Cadastrar</span>
                    <span className={`text-base font-mono font-bold ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-700'}`}>{stats.valid}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setTableFilter('skipped')}
                  className={`p-2 rounded-lg border text-center transition-all cursor-pointer ${
                    tableFilter === 'skipped'
                      ? 'border-amber-500 bg-amber-500/10'
                      : (theme === 'dark' ? 'bg-[#111111] border-[#1C1C1C] hover:bg-[#181818]' : 'bg-white border-gray-200 hover:bg-gray-50')
                  }`}
                >
                  <span className={`text-[9px] uppercase font-bold block ${skippedItems.length > 0 ? (theme === 'dark' ? 'text-amber-400 font-extrabold' : 'text-amber-600 font-extrabold') : 'text-gray-400'}`}>
                    Ignorados / Removidos
                  </span>
                  <span className={`text-base font-mono font-bold ${skippedItems.length > 0 ? (theme === 'dark' ? 'text-amber-400' : 'text-amber-700') : 'text-gray-400'}`}>
                    {stats.duplicates}
                  </span>
                </button>
              </div>

              {/* View filter buttons bar */}
              {activeTab === 'produtos' && (
                <div className="flex items-center justify-between border-b pb-2 gap-2 text-[10px]">
                  <span className="text-gray-400 font-bold uppercase tracking-wider text-[9px]">Filtro de Visualização:</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setTableFilter('all')}
                      className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${
                        tableFilter === 'all'
                          ? 'bg-emerald-500 text-black'
                          : 'bg-gray-800 text-gray-400 hover:text-white'
                      }`}
                    >
                      Ver Todos ({previewProducts.length + previewToUpdate.length + skippedItems.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setTableFilter('new')}
                      className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${
                        tableFilter === 'new'
                          ? 'bg-emerald-500 text-black'
                          : 'bg-gray-800 text-gray-400 hover:text-white'
                      }`}
                    >
                      Novos ({previewProducts.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setTableFilter('update')}
                      className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${
                        tableFilter === 'update'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-800 text-gray-400 hover:text-white'
                      }`}
                    >
                      A Atualizar ({previewToUpdate.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setTableFilter('skipped')}
                      className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${
                        tableFilter === 'skipped'
                          ? 'bg-amber-500 text-black'
                          : 'bg-gray-800 text-gray-400 hover:text-white'
                      }`}
                    >
                      Ignorados / Duplicados ({skippedItems.length})
                    </button>
                  </div>
                </div>
              )}

              {/* Warnings on new categories */}
              {activeTab === 'produtos' && newCategoriesToRegister.length > 0 && tableFilter !== 'skipped' && (
                <div className={`p-2.5 rounded border ${
                  theme === 'dark' 
                    ? 'bg-[#18F2A4]/5 border-[#18F2A4]/10 text-[#18F2A4]' 
                    : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                }`}>
                  <span className="font-bold text-[10px] flex items-center gap-1">Novas Categorias Detectadas ({newCategoriesToRegister.length}):</span>
                  <p className={`text-[9px] mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    Serão cadastradas automaticamente: <span className={`font-mono font-bold ${theme === 'dark' ? 'text-white' : 'text-emerald-950'}`}>{newCategoriesToRegister.join(', ')}</span>
                  </p>
                </div>
              )}

              {/* Data Table Preview */}
              <div className="overflow-x-auto max-h-56 border border-gray-800/10 rounded">
                <table className="w-full text-[10px] text-left">
                  <thead>
                    <tr className={`border-b ${theme === 'dark' ? 'bg-[#141414] border-gray-900 text-gray-400' : 'bg-gray-100 border-gray-200'}`}>
                      {tableFilter === 'skipped' ? (
                        <>
                          <th className="p-2 text-center w-16">Linha</th>
                          <th className="p-2">Item / Descrição no Arquivo</th>
                          <th className="p-2">Cod. Barras</th>
                          <th className="p-2">Motivo pelo Qual Foi Ignorado</th>
                        </>
                      ) : (
                        <>
                          {activeTab === 'produtos' && <th className="p-2 text-center w-12">Ação</th>}
                          <th className="p-2">Nome / Razão</th>
                          {activeTab === 'produtos' && <th className="p-2">Categoria</th>}
                          {activeTab === 'produtos' && <th className="p-2 text-right">Venda</th>}
                          {activeTab === 'produtos' && <th className="p-2 text-center">Estoque</th>}
                          {activeTab === 'produtos' && <th className="p-2">Cod. Barras</th>}
                          {activeTab === 'funcionarios' && <th className="p-2">PIN</th>}
                          {activeTab === 'funcionarios' && <th className="p-2">Cargo</th>}
                          {activeTab === 'fornecedores' && <th className="p-2">WhatsApp</th>}
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {/* Render Skipped Items exclusively if selected */}
                    {tableFilter === 'skipped' ? (
                      skippedItems.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-4 text-center text-gray-500 italic">
                            Nenhum produto foi ignorado ou duplicado nesta planilha.
                          </td>
                        </tr>
                      ) : (
                        skippedItems.map((s, idx) => (
                          <tr key={idx} className="border-b border-gray-800/10 bg-amber-500/5">
                            <td className="p-2 text-center font-mono font-bold text-gray-400">Linha {s.rowNumber}</td>
                            <td className="p-2 font-semibold text-gray-300">{s.name}</td>
                            <td className="p-2 font-mono text-gray-400">{s.barcode || 'N/A'}</td>
                            <td className="p-2">
                              <span className="px-2 py-0.5 rounded text-[8px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                {s.reason}
                              </span>
                            </td>
                          </tr>
                        ))
                      )
                    ) : (
                      <>
                        {activeTab === 'produtos' && [
                          ...(tableFilter === 'all' || tableFilter === 'new' ? previewProducts.map(p => ({ ...p, _status: 'novo' })) : []),
                          ...(tableFilter === 'all' || tableFilter === 'update' ? previewToUpdate.map(p => ({ ...p, _status: 'atualizar' })) : [])
                        ].map((p, idx) => (
                          <tr key={idx} className="border-b border-gray-800/5">
                            <td className="p-2 text-center">
                              {p._status === 'novo' ? (
                                <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">NOVO</span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">ATUALIZAR</span>
                              )}
                            </td>
                            <td className="p-2 font-semibold truncate max-w-[150px]">{p.name}</td>
                            <td className="p-2">{p.category}</td>
                            <td className="p-2 text-right font-mono font-bold">R$ {p.sellPrice.toFixed(2)}</td>
                            <td className={`p-2 text-center font-mono font-bold ${p.stockUnits > 0 ? (theme === 'dark' ? 'text-emerald-400' : 'text-emerald-700') : 'text-gray-400'}`}>{p.stockUnits} un</td>
                            <td className="p-2 text-gray-400 font-mono">{p.barcode || <span className="text-amber-500 italic">Pendente scan</span>}</td>
                          </tr>
                        ))}
                        {activeTab === 'funcionarios' && previewUsers.map((u, idx) => (
                          <tr key={idx} className="border-b border-gray-800/5">
                            <td className="p-2 font-semibold">{u.name}</td>
                            <td className="p-2 font-mono">{u.pin}</td>
                            <td className="p-2 text-gray-400 uppercase font-bold text-[9px]">{u.role}</td>
                          </tr>
                        ))}
                        {activeTab === 'fornecedores' && previewSuppliers.map((s, idx) => (
                          <tr key={idx} className="border-b border-gray-800/5">
                            <td className="p-2 font-semibold">{s.companyName}</td>
                            <td className="p-2 font-mono">{s.whatsapp || 'N/A'}</td>
                          </tr>
                        ))}
                      </>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Action trigger button */}
              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={stats.valid === 0}
                className={`w-full py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  stats.valid === 0 
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : (theme === 'dark' ? 'bg-[#18F2A4] text-black hover:bg-[#12d58f]' : 'bg-[#10B981] text-white hover:bg-[#0e9f6e]')
                }`}
              >
                <Check className="w-4 h-4" />
                {activeTab === 'produtos' 
                  ? (previewProducts.length > 0 && previewToUpdate.length > 0
                      ? `Gravar ${previewProducts.length} Novos e Atualizar ${previewToUpdate.length} Produtos Existentes`
                      : previewToUpdate.length > 0
                        ? `Atualizar ${previewToUpdate.length} Produtos no Sistema`
                        : `Gravar ${previewProducts.length} Novos Produtos no Sistema`
                    )
                  : `Gravar ${stats.valid} Cadastros no Sistema`
                }
              </button>
            </div>
          )}
        </div>

        {/* Box 2: Column Layout Instructions and Downloads */}
        <div className={`p-6 rounded-xl border flex flex-col gap-5 ${
          theme === 'dark' ? 'bg-[#111111] border-[#1A1A1A]' : 'bg-white border-gray-200'
        }`}>
          <div className="flex flex-col gap-1">
            <span className="font-extrabold uppercase tracking-widest text-[10px] text-gray-400">Instruções Importantes</span>
            <span className="text-gray-400 text-[10px]">Baixe as planilhas modelos para ver as colunas corretas.</span>
          </div>

          <button
            type="button"
            onClick={() => handleDownloadTemplate(activeTab)}
            className={`p-3 rounded-lg border text-left flex items-center justify-between gap-3 transition-all hover:scale-[1.01] cursor-pointer ${
              theme === 'dark' ? 'bg-black/30 border-gray-800 hover:bg-black/50' : 'bg-gray-50 border-gray-250 hover:bg-gray-100 shadow-xs'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400 shrink-0" />
              <div className="flex flex-col text-left">
                <span className="font-bold text-[11px]" style={{ color: theme === 'dark' ? '#FFF' : '#333' }}>
                  Download de Modelo
                </span>
                <span className="text-[10px] text-gray-500 capitalize">Template {activeTab}.xlsx</span>
              </div>
            </div>
            <Download className="w-4 h-4 text-gray-400" />
          </button>

          <div className="flex flex-col gap-3">
            <span className="text-gray-400 font-bold uppercase text-[9px]">Topologia Flexível de Dados</span>
            
            <ul className="space-y-2.5 text-[10px] text-gray-400">
              <li className="flex gap-2 items-start">
                <span className={`p-0.5 rounded text-[8px] font-bold font-mono mt-0.5 ${
                  theme === 'dark' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-800'
                }`}>OK</span>
                <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-700'}><strong>Categorias auto-criadas</strong>: Se adicionar uma categoria que não existe na planilha de produtos, ela é registrada em tempo real.</span>
              </li>
              <li className="flex gap-2 items-start">
                <span className={`p-0.5 rounded text-[8px] font-bold font-mono mt-0.5 ${
                  theme === 'dark' ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-800'
                }`}>WARN</span>
                <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-700'}><strong>Código de barras ausente</strong>: Produtos com código de barras vazio serão importados normalmente e adicionados ao Assistente de Escaneamento rápido.</span>
              </li>
              <li className="flex gap-2 items-start">
                <span className={`p-0.5 rounded text-[8px] font-bold font-mono mt-0.5 ${
                  theme === 'dark' ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-800'
                }`}>DUPLIC</span>
                <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-700'}><strong>Segurança duplicados</strong>: Itens com nomes, PINs de funcionários ou códigos de barras idênticos aos cadastrados serão pulados automaticamente para segurança contábil.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Barcode Scanning Wizard Dialog (Modal overlay) */}
      {showWizard && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
          onClick={handleWizardClick}
        >
          <div 
            className={`w-full max-w-lg rounded-2xl border flex flex-col shadow-2xl relative overflow-hidden transition-all duration-300 ${
              theme === 'dark' ? 'bg-[#0A0A0A] border-[#1C1C1C] text-white' : 'bg-white border-gray-200 text-[#111111]'
            }`}
            onClick={(e) => e.stopPropagation()} // Prevent losing focus inside modal
          >
            {/* Modal top bar */}
            <div className={`p-4 border-b flex justify-between items-center ${
              theme === 'dark' ? 'border-[#1C1C1C]' : 'border-gray-100'
            }`}>
              <div className="flex items-center gap-2">
                <Barcode className="w-5 h-5 text-amber-500 animate-pulse" />
                <span className="font-bold text-sm tracking-tight">Assistente de Escaneamento Rápido</span>
              </div>
              <button
                onClick={() => {
                  setShowWizard(false);
                  if (onCloseWizard) onCloseWizard();
                }}
                className="text-gray-400 hover:text-red-400 transition-colors cursor-pointer"
                title="Pausar fluxo"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal scroll area */}
            <div className="p-5 flex flex-col gap-4 overflow-y-auto max-h-[70vh]">
              {wizardProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
                  <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-full">
                    <Check className="w-8 h-8" />
                  </div>
                  <div>
                    <span className="font-bold text-xs block text-emerald-400">Tudo Pronto e Atualizado!</span>
                    <span className="text-[10px] text-gray-500 mt-1 block max-w-xs leading-relaxed">
                      Não existem produtos ativos com códigos de barras faltantes no inventário da adega.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowWizard(false);
                      if (onCloseWizard) onCloseWizard();
                    }}
                    className={`mt-2 px-4 py-1.5 text-[10px] rounded font-bold ${
                      theme === 'dark' ? 'bg-[#1C1C1C] text-gray-300 hover:bg-gray-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Fechar Janela
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center text-[10px] text-gray-400">
                    <span className="font-mono font-bold">Lote: {wizardIndex + 1} de {wizardProducts.length} itens pendentes</span>
                    <span className="font-mono">Progresso: {Math.round(((wizardIndex) / wizardProducts.length) * 100)}%</span>
                  </div>

                  {/* Progress bar */}
                  <div className={`w-full h-1.5 rounded-full overflow-hidden ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'}`}>
                    <div 
                      className="bg-amber-500 h-full transition-all duration-300"
                      style={{ width: `${((wizardIndex + 1) / wizardProducts.length) * 100}%` }}
                    />
                  </div>

                  {/* HIGH FOCUS PRODUCT CARD */}
                  {currentWizardProduct && (
                    <div className={`p-5 rounded-2xl border-2 flex flex-col items-center text-center gap-2 relative ${
                      theme === 'dark' 
                        ? 'bg-black/50 border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.05)]' 
                        : 'bg-amber-500/5 border-amber-500/20 shadow-xs'
                    }`}>
                      <span className="p-1 px-2.5 rounded-full bg-amber-500/10 text-amber-500 text-[8px] font-extrabold uppercase tracking-widest">
                        Escanear agora
                      </span>
                      <h3 className="text-base font-extrabold tracking-tight mt-1" style={{ color: theme === 'dark' ? '#FFF' : '#000' }}>
                        {currentWizardProduct.name}
                      </h3>
                      <div className="flex gap-4 text-[10px] mt-0.5">
                        <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Categoria: <strong className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{currentWizardProduct.category}</strong></span>
                        <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>SKU: <strong className={`font-mono font-bold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-800'}`}>{currentWizardProduct.sku}</strong></span>
                      </div>

                      {/* Optical Scanner simulated target */}
                      <div className="relative w-full max-w-[280px] mt-4 flex flex-col gap-2">
                        {/* Invisible/beauty input to capture scanner */}
                        <input
                          ref={scanInputRef}
                          type="text"
                          value={wizardInput}
                          onChange={(e) => setWizardInput(e.target.value)}
                          onKeyDown={handleWizardInputKeyDown}
                          placeholder="Aproxime o leitor do produto..."
                          className={`w-full p-2.5 text-center text-xs font-mono font-bold tracking-widest rounded-lg border focus:outline-none transition-all ${
                            theme === 'dark' 
                              ? 'bg-[#080808] border-amber-500/30 text-amber-400 focus:border-amber-400' 
                              : 'bg-white border-amber-500/30 text-amber-700 focus:border-amber-500 shadow-inner'
                          }`}
                          autoFocus
                        />
                        <span className="text-[9px] text-gray-500 flex justify-center items-center gap-1">
                          <Keyboard className="w-3 h-3" />
                          Simulador de leitor óptico (digite o código e aperte Enter)
                        </span>
                      </div>
                    </div>
                  )}

                  {/* DUPLICATE WARNINGS & SUCCESS FEEDBACK */}
                  {wizardWarning && (
                    <div className={`p-4 rounded-xl border-2 text-xs leading-relaxed animate-pulse flex gap-3 items-start shadow-lg ${
                      theme === 'dark' 
                        ? 'bg-red-500/10 border-red-500/30 text-red-400' 
                        : 'bg-red-50 border-red-200 text-red-800'
                     }`}>
                      <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-extrabold block uppercase tracking-wider text-[10px]">Alerta de Duplicidade</span>
                        <p className={`mt-0.5 text-[10px] ${theme === 'dark' ? 'text-gray-300' : 'text-red-900/85'}`}>{wizardWarning}</p>
                      </div>
                    </div>
                  )}

                  {wizardSuccess && (
                    <div className={`p-4 rounded-xl border-2 text-xs leading-relaxed animate-fade-in flex gap-3 items-start shadow-lg ${
                      theme === 'dark' 
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                        : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    }`}>
                      <Check className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-extrabold block uppercase tracking-wider text-[10px]">Produto Confirmado e Salvo</span>
                        <p className={`mt-0.5 text-[10px] ${theme === 'dark' ? 'text-gray-300' : 'text-emerald-950'}`}>{wizardSuccess}</p>
                      </div>
                    </div>
                  )}

                  {/* NO BARCODE SHORTCUT BUTTON (SPACEBAR / ENTER CAPABLE) */}
                  <div className={`p-4 rounded-xl border flex flex-col sm:flex-row gap-3 justify-between items-center transition-all ${
                    theme === 'dark' ? 'bg-[#111] border-gray-900' : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="text-left">
                      <span className="font-bold block text-[10px] uppercase text-amber-500 tracking-wider">Não possui código de barras?</span>
                      <span className={`text-[9px] ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Aperte <kbd className={`p-0.5 px-1 rounded text-[8px] font-mono font-bold ${theme === 'dark' ? 'bg-zinc-800 text-white' : 'bg-gray-200 text-gray-800 border border-gray-300'}`}>ENTER</kbd> ou <kbd className={`p-0.5 px-1 rounded text-[8px] font-mono font-bold ${theme === 'dark' ? 'bg-zinc-800 text-white' : 'bg-gray-200 text-gray-800 border border-gray-300'}`}>ESPAÇO</kbd> com o campo vazio, ou clique ao lado:</span>
                    </div>

                    <button
                      type="button"
                      onClick={handleMarkNoBarcode}
                      className={`px-4 py-2.5 rounded-lg font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer text-xs w-full sm:w-auto justify-center ${
                        theme === 'dark' 
                          ? 'bg-[#1C1C1C] text-white hover:bg-zinc-800 border border-zinc-700' 
                          : 'bg-white border border-gray-300 text-gray-800 hover:bg-gray-100'
                      }`}
                    >
                      <span className={`p-1 px-1.5 text-[8px] font-mono rounded font-bold ${
                        theme === 'dark' ? 'bg-black/40 text-gray-400' : 'bg-gray-100 text-gray-600'
                      }`}>ESPAÇO / ENTER</span>
                      Sem Código de Barras
                    </button>
                  </div>

                  {/* SESSION SCAN HISTORY LOG */}
                  {scanHistory.length > 0 && (
                    <div className="flex flex-col gap-1.5 mt-1 text-left">
                      <span className={`font-extrabold uppercase text-[9px] tracking-wider flex items-center gap-1 ${
                        theme === 'dark' ? 'text-emerald-500' : 'text-emerald-700'
                      }`}>
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping shrink-0" />
                        Histórico desta Sessão (Salvos em Tempo Real):
                      </span>
                      <div className={`max-h-24 overflow-y-auto pr-1 flex flex-col gap-1 border rounded-lg p-1.5 ${
                        theme === 'dark' ? 'border-emerald-500/10 bg-emerald-500/5' : 'border-emerald-200 bg-emerald-50/50'
                      }`}>
                        {scanHistory.map((item) => (
                          <div 
                            key={item.id} 
                            className={`p-1 px-2 text-[9px] rounded flex justify-between items-center border ${
                              theme === 'dark' 
                                ? 'bg-emerald-950/20 text-emerald-300 border-emerald-500/10' 
                                : 'bg-white text-emerald-900 border-emerald-100 shadow-2xs'
                            }`}
                          >
                            <span className="truncate max-w-[240px] font-semibold flex items-center gap-1">
                              <Check className="w-3 h-3 text-[#18F2A4]" /> {item.productName}
                            </span>
                            <div className="flex items-center gap-2 shrink-0 font-mono text-[8px] text-gray-400">
                              <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>{item.barcode}</span>
                              <span className={`${theme === 'dark' ? 'text-emerald-500' : 'text-emerald-700'} font-bold`}>{item.timestamp}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* List preview of all upcoming missing barcode items */}
                  <div className="flex flex-col gap-1 mt-1 text-left">
                    <span className="text-gray-500 font-bold uppercase text-[9px] tracking-wider">Fila de Pendentes Restantes ({wizardProducts.length - wizardIndex} itens):</span>
                    <div className={`max-h-24 overflow-y-auto pr-1 flex flex-col gap-1 border rounded-lg p-1 ${
                      theme === 'dark' ? 'border-gray-800/10 bg-black/10' : 'border-gray-200 bg-gray-50'
                    }`}>
                      {wizardProducts.slice(wizardIndex).map((p, i) => (
                        <div 
                          key={p.id} 
                          className={`p-1.5 px-2.5 text-[10px] rounded flex justify-between items-center ${
                            i === 0 
                              ? (theme === 'dark' 
                                  ? 'bg-amber-500/10 text-amber-400 font-bold border border-amber-500/20 animate-pulse' 
                                  : 'bg-amber-100 text-amber-900 font-bold border border-amber-200 animate-pulse')
                              : (theme === 'dark' ? 'text-gray-500' : 'text-gray-600')
                          }`}
                        >
                          <span className="truncate max-w-[280px]">{i === 0 ? '[Atual] ' : ''}{p.name}</span>
                          <span className={`text-[8px] font-mono ${theme === 'dark' ? 'text-gray-600' : 'text-gray-500'}`}>{p.sku}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer Controls */}
            <div className={`p-4 border-t flex justify-between items-center ${
              theme === 'dark' ? 'border-[#1C1C1C]' : 'border-gray-100'
            }`}>
              <span className="text-[9px] text-gray-500 italic max-w-[240px]">
                Você pode fechar a qualquer momento. Suas alterações já foram salvas em tempo real.
              </span>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowWizard(false);
                    if (onCloseWizard) onCloseWizard();
                  }}
                  className={`px-4 py-1.5 rounded font-bold text-[11px] cursor-pointer transition-all ${
                    theme === 'dark' ? 'bg-[#141414] text-gray-300 hover:bg-zinc-900 border border-[#222]' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Continuar Depois
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
