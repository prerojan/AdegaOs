import React, { useState } from 'react';
import { FileText, FileSpreadsheet, Download, RefreshCw, BarChart2, Calendar, ShieldAlert } from 'lucide-react';

interface ManagerReportsProps {
  theme: 'dark' | 'light';
}

export default function ManagerReports({ theme }: ManagerReportsProps) {
  const [loadingReport, setLoadingReport] = useState<string | null>(null);

  const handleGenerateReport = (name: string, format: 'PDF' | 'XLS') => {
    setLoadingReport(name);
    setTimeout(() => {
      setLoadingReport(null);
      
      // Generate a tiny mock document to trigger real browser file download
      const content = `AdegaOS - Relatório de ${name}\nGerado em: ${new Date().toLocaleString()}\nFormato: ${format}\nStatus: Homologado\n\n[DADOS DE EXEMPLO CRISTALINOS COMPILADOS COM SUCESSO]`;
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `adegaos_relatorio_${name.toLowerCase().replace(/\s/g, '_')}.${format.toLowerCase()}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      alert(`Relatório "${name}" exportado com sucesso no formato ${format}! O download começará automaticamente.`);
    }, 1200); // realistic mock compilation wait
  };

  const reportsList = [
    {
      id: 'r1',
      title: 'Fechamento de Caixa Diário (Turnos)',
      description: 'Auditoria consolidada de conciliação de espécie, PIX e cartões por operador de caixa.',
      category: 'Financeiro'
    },
    {
      id: 'r2',
      title: 'DRE e Rentabilidade de Canais',
      description: 'Demonstrativo completo de Receita Bruta, CMV, custos fixos e margens por canal (mesa, balcão, WhatsApp).',
      category: 'Financeiro'
    },
    {
      id: 'r3',
      title: 'Curva ABC de Giro de Estoque',
      description: 'Classificação de mercadorias por faturamento e volume para otimização de compras com fornecedores.',
      category: 'Estoque'
    },
    {
      id: 'r4',
      title: 'Auditoria de Cancelamentos e Estornos',
      description: 'Rastreabilidade total de lançamentos de mesa e balcão estornados, com justificativas registradas.',
      category: 'Segurança'
    }
  ];

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Exportação de Relatórios e BI</h2>
        <p className="text-xs text-gray-400">Gere demonstrativos e planilhas analíticas homologadas de todas as esferas operacionais.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reportsList.map(report => (
          <div
            key={report.id}
            className={`p-4 rounded-xl border flex flex-col justify-between gap-4 transition-all ${
              theme === 'dark' ? 'bg-[#111111] border-[#1A1A1A]' : 'bg-white border-gray-200 shadow-sm'
            }`}
          >
            <div>
              <div className="flex justify-between items-start">
                <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase border ${
                  report.category === 'Financeiro' 
                    ? theme === 'dark' ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/30' : 'bg-emerald-100 text-emerald-900 border-emerald-200'
                    : report.category === 'Estoque' 
                      ? theme === 'dark' ? 'bg-sky-950/40 text-sky-400 border-sky-900/30' : 'bg-sky-100 text-sky-900 border-sky-200'
                      : theme === 'dark' ? 'bg-red-950/40 text-red-400 border-red-900/30' : 'bg-red-100 text-red-900 border-red-200'
                }`}>
                  {report.category}
                </span>
                <BarChart2 className="w-4 h-4 text-gray-500" />
              </div>
              <h3 className="font-semibold text-sm mt-2 leading-snug">{report.title}</h3>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">{report.description}</p>
            </div>

            {/* Downloader triggers */}
            <div className="flex gap-2 pt-3 border-t border-[#1C1C1C]" style={{ borderColor: theme === 'dark' ? '#1C1C1C' : '#E5E5E5' }}>
              <button
                disabled={loadingReport !== null}
                onClick={() => handleGenerateReport(report.title, 'PDF')}
                className={`flex-1 py-1.5 rounded text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  loadingReport === report.title
                    ? 'bg-[#1A1A1A] text-gray-400'
                    : theme === 'dark'
                      ? 'bg-[#1A1A1A] hover:bg-[#222] text-gray-300'
                      : 'bg-gray-100 border hover:bg-gray-200 text-gray-700'
                }`}
              >
                {loadingReport === report.title ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Compilando...
                  </>
                ) : (
                  <>
                    <FileText className="w-3.5 h-3.5 text-red-500" />
                    Exportar PDF
                  </>
                )}
              </button>

              <button
                disabled={loadingReport !== null}
                onClick={() => handleGenerateReport(report.title, 'XLS')}
                className={`flex-1 py-1.5 rounded text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  loadingReport === report.title
                    ? 'bg-[#1A1A1A] text-gray-400'
                    : theme === 'dark'
                      ? 'bg-[#1A1A1A] hover:bg-[#222] text-gray-300'
                      : 'bg-gray-100 border hover:bg-gray-200 text-gray-700'
                }`}
              >
                {loadingReport === report.title ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Compilando...
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
                    Exportar Excel
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
