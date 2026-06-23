'use client';

import React, { useState } from 'react';
import { Category } from '@/types';
import { createCategory, deleteCategory } from '@/app/actions/categories';
import { useRouter } from 'next/navigation';
import { 
  Utensils, 
  Home, 
  GraduationCap, 
  ShoppingBag, 
  Car, 
  TrendingUp, 
  Heart, 
  Dumbbell, 
  Music, 
  Plane, 
  Tv, 
  Gamepad2, 
  BookOpen, 
  Sparkles, 
  MoreHorizontal,
  Plus,
  Trash2,
  Loader2,
  Tag,
  AlertTriangle
} from 'lucide-react';

interface CategoryManagerProps {
  categories: Category[];
  onCategoryChange?: () => void;
}

// Map các icon key thành React Component
export const ICON_MAP: Record<string, React.ComponentType<any>> = {
  Utensils, 
  Home, 
  GraduationCap, 
  ShoppingBag, 
  Car, 
  TrendingUp, 
  Heart, 
  Dumbbell, 
  Music, 
  Plane, 
  Tv, 
  Gamepad2, 
  BookOpen, 
  Sparkles, 
  MoreHorizontal
};

const PRESET_COLORS = [
  '#e5c158', // Gold
  '#10b981', // Emerald
  '#f43f5e', // Rose
  '#60a5fa', // Blue
  '#c084fc', // Purple
  '#f472b6', // Pink
  '#fb923c', // Orange
  '#f87171', // Red
  '#2dd4bf', // Teal
  '#38bdf8', // Sky
  '#9ca3af', // Gray
];

export default function CategoryManager({ categories, onCategoryChange }: CategoryManagerProps) {
  const [activeTab, setActiveTab] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('Utensils');
  const [selectedColor, setSelectedColor] = useState('#e5c158');
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    setError(null);

    try {
      await createCategory(name.trim(), selectedIcon, selectedColor, activeTab);
      setName('');
      setSelectedIcon(activeTab === 'EXPENSE' ? 'Utensils' : 'TrendingUp');
      setSelectedColor(activeTab === 'EXPENSE' ? '#e5c158' : '#10b981');
      
      router.refresh();
      if (onCategoryChange) onCategoryChange();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Lỗi khi tạo danh mục.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, catName: string) => {
    const confirmMsg = `Bạn có chắc chắn muốn xóa danh mục "${catName}"?\n\nLưu ý: Tất cả các hạn mức ngân sách liên quan sẽ bị xóa bỏ. Các giao dịch thuộc danh mục này sẽ chuyển về không có danh mục (Khác).`;
    if (!window.confirm(confirmMsg)) return;

    setDeletingId(id);
    setError(null);

    try {
      await deleteCategory(id);
      router.refresh();
      if (onCategoryChange) onCategoryChange();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Lỗi khi xóa danh mục.');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredCategories = categories.filter((c) => (c.type || 'EXPENSE') === activeTab);

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="flex p-1 bg-[#12141c] rounded-xl border border-brand-border/60 max-w-xs shrink-0">
        {(['EXPENSE', 'INCOME'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => {
              setActiveTab(tab);
              setSelectedIcon(tab === 'EXPENSE' ? 'Utensils' : 'TrendingUp');
              setSelectedColor(tab === 'EXPENSE' ? '#e5c158' : '#10b981');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg cursor-pointer transition duration-200 ${
              activeTab === tab
                ? tab === 'INCOME'
                  ? 'bg-neon-emerald text-brand-charcoal'
                  : 'bg-brand-gold text-brand-charcoal'
                : 'text-brand-text-soft hover:text-white'
            }`}
          >
            {tab === 'INCOME' ? 'THU NHẬP' : 'CHI TIÊU'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Cột trái: Quản lý / Thêm mới */}
      <div className="lg:col-span-1 glass-panel rounded-2xl p-6 shadow-xl space-y-5 h-fit">
        <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-brand-border/40 pb-3">
          <Tag className="w-4.5 h-4.5 text-brand-gold" />
          Thêm danh mục mới
        </h3>

        <form onSubmit={handleCreate} className="space-y-4">
          {/* Tên danh mục */}
          <div className="space-y-1.5">
            <label htmlFor="catNameInput" className="text-xs font-semibold text-brand-text-soft uppercase tracking-wider block">
              Tên danh mục
            </label>
            <input
              id="catNameInput"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ví dụ: Du lịch, Thú cưng..."
              className="w-full bg-[#12141c] border border-brand-border focus:border-brand-gold focus:ring-1 focus:ring-brand-gold text-white text-sm rounded-xl px-4 py-3 outline-none transition"
              required
              maxLength={30}
            />
          </div>

          {/* Chọn Màu sắc */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-brand-text-soft uppercase tracking-wider block">
              Màu đại diện
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`w-7 h-7 rounded-full transition-all duration-150 cursor-pointer ${
                    selectedColor === color 
                      ? 'ring-2 ring-white ring-offset-2 ring-offset-brand-charcoal scale-110 shadow-lg' 
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>

          {/* Chọn Icon */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-brand-text-soft uppercase tracking-wider block">
              Biểu tượng (Icon)
            </label>
            <div className="grid grid-cols-5 gap-2 p-2 bg-[#12141c] rounded-xl border border-brand-border/80">
              {Object.keys(ICON_MAP).map((iconName) => {
                const IconComponent = ICON_MAP[iconName];
                const isSelected = selectedIcon === iconName;
                return (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => setSelectedIcon(iconName)}
                    className={`flex items-center justify-center p-2 rounded-lg transition-all duration-150 cursor-pointer ${
                      isSelected 
                        ? 'bg-brand-gold text-brand-charcoal scale-105 shadow-md shadow-brand-gold/10' 
                        : 'text-brand-text-soft hover:text-white hover:bg-brand-card'
                    }`}
                  >
                    <IconComponent className="w-5 h-5" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Hiển thị Preview */}
          <div className="p-3 bg-[#12141c] rounded-xl border border-brand-border/60 flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center border border-brand-border"
              style={{ 
                color: selectedColor, 
                borderColor: `${selectedColor}30`,
                backgroundColor: `${selectedColor}08`
              }}
            >
              {React.createElement(ICON_MAP[selectedIcon] || MoreHorizontal, { className: 'w-5 h-5' })}
            </div>
            <div>
              <p className="text-[10px] font-semibold text-brand-text-soft uppercase tracking-wider">Xem trước hiển thị</p>
              <p className="text-sm font-bold text-white mt-0.5">{name || 'Tên danh mục'}</p>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-neon-rose/10 border border-neon-rose/20 text-neon-rose text-xs rounded-xl text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSaving || !name.trim()}
            className="w-full bg-brand-gold hover:bg-brand-gold-hover text-brand-charcoal font-bold text-sm rounded-xl py-3 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Plus className="w-4 h-4 stroke-[3px]" />
                Tạo danh mục
              </>
            )}
          </button>
        </form>
      </div>

      {/* Cột phải: Danh sách danh mục hiện có */}
      <div className="lg:col-span-2 glass-panel rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-brand-border/40 pb-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Tag className="w-4.5 h-4.5 text-brand-gold" />
            Danh sách danh mục {activeTab === 'INCOME' ? 'thu nhập' : 'chi tiêu'}
          </h3>
          <span className="text-xs text-brand-text-soft font-semibold bg-brand-border/30 px-3 py-1 rounded-full">
            {filteredCategories.length} Danh mục
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[460px] overflow-y-auto pr-1 scrollbar-thin">
          {filteredCategories.map((category) => {
            const IconComponent = ICON_MAP[category.icon] || MoreHorizontal;
            
            return (
              <div 
                key={category.id} 
                className="p-4 rounded-xl border border-brand-border/60 bg-brand-card/30 flex items-center justify-between group hover:border-brand-border transition duration-200"
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-9 h-9 rounded-xl flex items-center justify-center border"
                    style={{ 
                      color: category.color,
                      borderColor: `${category.color}30`,
                      backgroundColor: `${category.color}08`
                    }}
                  >
                    <IconComponent className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">{category.name}</h4>
                    <p className="text-[10px] text-brand-text-soft mt-0.5 font-mono">
                      Mã màu: <span style={{ color: category.color }}>{category.color.toUpperCase()}</span>
                    </p>
                  </div>
                </div>

                {/* Nút xóa danh mục */}
                <button
                  onClick={() => handleDelete(category.id, category.name)}
                  disabled={deletingId === category.id}
                  className="opacity-0 group-hover:opacity-100 p-2 rounded-lg border border-transparent hover:border-neon-rose/30 hover:bg-neon-rose/10 text-brand-text-soft hover:text-neon-rose transition cursor-pointer disabled:opacity-50 inline-flex items-center justify-center"
                  title="Xóa danh mục này"
                >
                  {deletingId === category.id ? (
                    <Loader2 className="w-4 h-4 animate-spin text-neon-rose" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            );
          })}
        </div>

        <div className="p-3 bg-[#12141c]/50 rounded-xl border border-brand-border/40 flex items-start gap-3 mt-4">
          <AlertTriangle className="w-4.5 h-4.5 text-neon-amber shrink-0 mt-0.5" />
          <p className="text-[11px] text-brand-text-soft leading-normal">
            <span className="font-bold text-white">Mẹo:</span> Rà chuột qua từng danh mục để hiển thị nút xóa <Trash2 className="w-3 h-3 inline-block" />. Khi xóa một danh mục, tất cả hạn mức ngân sách đặt cho danh mục đó sẽ biến mất, các giao dịch cũ thuộc danh mục sẽ không bị xóa mà được gắn nhãn là chưa phân loại.
          </p>
        </div>
      </div>
    </div>
  </div>
  );
}
