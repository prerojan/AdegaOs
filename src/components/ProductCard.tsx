import React from 'react';
import { GlassWater } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  key?: any;
  product: Product;
  onAdd: (product: Product) => void;
  theme: 'dark' | 'light';
}

export default function ProductCard({
  product,
  onAdd,
  theme
}: ProductCardProps) {
  const totalStock = (product.stockBoxes * product.boxQuantity) + product.stockUnits;
  const isOutOfStock = totalStock <= 0;

  return (
    <button
      id={`product-card-${product.id}`}
      disabled={isOutOfStock}
      onClick={() => onAdd(product)}
      className={`p-3 rounded-xl border text-left flex gap-3.5 items-center transition-all duration-200 w-full cursor-pointer relative overflow-hidden group ${
        isOutOfStock 
          ? 'opacity-40 cursor-not-allowed bg-transparent' 
          : theme === 'dark' 
            ? 'bg-[#0C0C0C] border-[#1C1C1C] hover:border-[#18F2A4] hover:bg-[#111111]' 
            : 'bg-white border-gray-200 hover:border-[#10B981] hover:shadow-sm'
      }`}
    >
      {/* Product Image or Calm Design Placeholder */}
      <div className="relative shrink-0">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            referrerPolicy="no-referrer"
            className="w-12 h-12 rounded-lg object-cover border transition-transform duration-300 group-hover:scale-105"
            style={{ borderColor: theme === 'dark' ? '#222222' : '#E5E5E5' }}
          />
        ) : (
          /* Calm Design Placeholder */
          <div 
            className={`w-12 h-12 rounded-lg flex items-center justify-center border transition-all duration-300 group-hover:scale-105 ${
              theme === 'dark' 
                ? 'bg-[#151515] border-[#222222] text-gray-600 group-hover:text-[#18F2A4]' 
                : 'bg-gray-100 border-gray-200 text-gray-400 group-hover:text-[#10B981]'
            }`}
          >
            <GlassWater className="w-5 h-5 opacity-80" />
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="flex-1 min-w-0 flex flex-col justify-between h-12">
        <div className="flex justify-between items-start gap-2">
          <span className={`font-bold text-xs tracking-tight truncate flex-1 ${
            theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
          }`} title={product.name}>
            {product.name}
          </span>
          {product.ageRestricted && (
            <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full shrink-0 uppercase tracking-wide border ${
              theme === 'dark'
                ? 'bg-red-950/40 text-red-400 border-red-900/30'
                : 'bg-red-100 text-red-900 border-red-200'
            }`}>
              18+
            </span>
          )}
        </div>

        <div className="flex justify-between items-end gap-2 mt-auto">
          <span className={`text-xs font-black font-mono leading-none ${
            theme === 'dark' ? 'text-[#18F2A4]' : 'text-emerald-700'
          }`}>
            R$ {product.sellPrice.toFixed(2)}
          </span>
          <span className="text-[9px] text-gray-500 font-medium">
            Estoque: {totalStock} un
          </span>
        </div>
      </div>
    </button>
  );
}
