#!/bin/bash
# Tự động tắt các tiến trình con khi tắt terminal
trap "kill 0" EXIT

echo "----------------------------------------"
echo "   KHỞI ĐỘNG ỨNG DỤNG ANTIGRAVITY FIN"
echo "----------------------------------------"
echo "Đang di chuyển vào thư mục dự án..."
cd "/Users/fucduu/Tai_chinh"

# Tự động mở trình duyệt sau 2.5 giây
(sleep 2.5 && open http://localhost:3001) &

# Kiểm tra xem đã có bản build chưa để chạy chế độ tối ưu nhất
if [ -d ".next" ]; then
  echo "Phát hiện bản build Production. Đang khởi động Server ở chế độ Production..."
  echo "Ứng dụng sẽ hoạt động tại: http://localhost:3001"
  echo "----------------------------------------"
  echo "Nhấn Ctrl+C để tắt Server."
  echo ""
  PORT=3001 npm run start
else
  echo "Không tìm thấy bản build. Đang khởi động Server ở chế độ Phát triển (Development)..."
  echo "Ứng dụng sẽ hoạt động tại: http://localhost:3001"
  echo "----------------------------------------"
  echo "Nhấn Ctrl+C để tắt Server."
  echo ""
  PORT=3001 npm run dev
fi
