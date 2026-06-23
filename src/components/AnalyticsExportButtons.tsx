'use client';

import React, { useState } from 'react';
import { getTransactionsRange } from '@/app/actions/transactions';
import { CategoryBreakdown } from '@/app/actions/transactions';
import { Download, FileText, Loader2 } from 'lucide-react';

interface AnalyticsExportButtonsProps {
  rangeLabel: string;
  startDateStr?: string;
  endDateStr?: string;
  totalIncome: number;
  totalExpense: number;
  breakdownData: CategoryBreakdown[];
}

export default function AnalyticsExportButtons({
  rangeLabel,
  startDateStr,
  endDateStr,
  totalIncome,
  totalExpense,
  breakdownData
}: AnalyticsExportButtonsProps) {
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  const handlePrintPDF = () => {
    // Gọi in trực tiếp trang hiện tại, CSS print:hidden sẽ xử lý ẩn Sidebar và các nút bấm
    window.print();
  };

  const handleExportExcel = async () => {
    setIsExportingExcel(true);
    try {
      // 1. Tải danh sách giao dịch tương ứng với khoảng thời gian lọc
      const txs = await getTransactionsRange(startDateStr, endDateStr);

      // 2. Thiết lập header cho CSV
      const headers = ['Mã Giao Dịch', 'Loại', 'Số Tiền (VND)', 'Tài Khoản', 'Tài Khoản Nhận', 'Danh Mục', 'Ghi Chú', 'Trạng Thái', 'Ngày Tạo'];
      
      // 3. Định dạng dữ liệu với Escaping đặc biệt để chống vỡ cột trong Excel
      // Quy chuẩn: Bọc tất cả chuỗi trong "" và thay thế các ký tự " thành ""
      const escapeCSV = (val: string | null | undefined) => {
        if (val === null || val === undefined) return '""';
        const strVal = String(val);
        return `"${strVal.replace(/"/g, '""')}"`;
      };

      const rows = txs.map(tx => [
        escapeCSV(tx.id),
        escapeCSV(tx.type === 'INCOME' ? 'Thu nhập' : tx.type === 'EXPENSE' ? 'Chi tiêu' : 'Chuyển khoản'),
        tx.amount, // Số tiền là số nên không cần bọc ""
        escapeCSV(tx.account?.name),
        escapeCSV(tx.to_account?.name),
        escapeCSV(tx.category?.name),
        escapeCSV(tx.description),
        escapeCSV(tx.status === 'SUCCESS' ? 'Thành công' : tx.status === 'PENDING' ? 'Đang xử lý' : 'Thất bại'),
        escapeCSV(tx.created_at)
      ]);

      // Thêm dòng tiêu đề và tóm tắt thống kê vào CSV để chuyên nghiệp hơn
      const summaryRows = [
        ['BÁO CÁO TÀI CHÍNH CÁ NHÂN'],
        [`Khoảng thời gian:`, escapeCSV(rangeLabel)],
        [`Xuất lúc:`, escapeCSV(new Date().toLocaleString('vi-VN'))],
        [],
        ['TÓM TẮT THỐNG KÊ'],
        ['Tổng Thu Nhập (6 Tháng)', totalIncome],
        ['Tổng Chi Tiêu (Khoảng Lọc)', totalExpense],
        ['Tiết Kiệm Ròng', totalIncome - totalExpense],
        [],
        ['PHÂN BỔ CHI TIÊU THEO DANH MỤC'],
        ['Tên Danh Mục', 'Số Tiền Chi (VND)'],
        ...breakdownData.map(b => [escapeCSV(b.categoryName), b.amount]),
        [],
        ['DANH SÁCH GIAO DỊCH CHI TIẾT'],
        headers
      ];

      // Gộp dòng tóm tắt và dòng giao dịch chi tiết
      const csvContent = "\uFEFF" + [ // \uFEFF là UTF-8 BOM để Excel hiển thị đúng tiếng Việt có dấu
        ...summaryRows,
        ...rows
      ].map(e => e.join(",")).join("\n");

      // 4. Tạo download link và trigger click tải xuống
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `bao_cao_tai_chinh_${rangeLabel.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert('Lỗi xuất dữ liệu Excel: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsExportingExcel(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3 print:hidden">
      {/* Nút Xuất PDF */}
      <button
        onClick={handlePrintPDF}
        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-brand-border bg-[#0c0d12]/40 text-brand-text-soft text-xs font-semibold hover:text-white hover:border-white/20 transition cursor-pointer"
        title="In báo cáo ra PDF hoặc in ấn giấy trực tiếp"
      >
        <FileText className="w-4 h-4" />
        <span>Xuất PDF</span>
      </button>

      {/* Nút Xuất Excel */}
      <button
        onClick={handleExportExcel}
        disabled={isExportingExcel}
        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-brand-border bg-[#0c0d12]/40 text-brand-text-soft text-xs font-semibold hover:text-white hover:border-white/20 transition cursor-pointer disabled:opacity-50"
        title="Tải báo cáo chi tiết dạng CSV Excel"
      >
        {isExportingExcel ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
        <span>Xuất Excel</span>
      </button>
    </div>
  );
}
