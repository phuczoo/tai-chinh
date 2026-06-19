# HƯỚNG DẪN TRIỂN KHAI VERCEL & THIẾT LẬP SUPABASE

Tài liệu này hướng dẫn chi tiết cách thiết lập cơ sở dữ liệu Supabase (PostgreSQL) và triển khai ứng dụng quản lý tài chính cá nhân Antigravity Finance lên Vercel.

---

## BƯỚC 1: CẤU HÌNH CƠ SỞ DỮ LIỆU SUPABASE

1. **Tạo Dự án Mới:** Đăng nhập vào [Supabase](https://supabase.com) và khởi tạo một dự án PostgreSQL mới.
2. **Chạy SQL Script:** Truy cập vào **SQL Editor** trong thanh bên trái của Supabase Dashboard, tạo một query mới và dán toàn bộ mã SQL dưới đây vào rồi nhấn **Run**:

```sql
-- ==========================================
-- 1. KHỞI TẠO CÁC LOẠI ENUM CHUẨN HÓA (ASCII)
-- ==========================================
CREATE TYPE account_type AS ENUM ('BANK', 'WALLET', 'CASH');
CREATE TYPE transaction_type AS ENUM ('INCOME', 'EXPENSE', 'TRANSFER');
CREATE TYPE transaction_status AS ENUM ('SUCCESS', 'PENDING', 'FAILED');
CREATE TYPE budget_category AS ENUM ('FOOD', 'FIXED_EXPENSES', 'EDUCATION', 'SHOPPING', 'TRANSPORT', 'INCOME_GEN', 'OTHERS');

-- ==========================================
-- 2. TẠO BẢNG ACCOUNTS
-- ==========================================
CREATE TABLE Accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type account_type NOT NULL,
    initial_balance NUMERIC NOT NULL DEFAULT 0,
    current_balance NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE Accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own accounts" 
ON Accounts FOR ALL 
TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- ==========================================
-- 3. TẠO BẢNG TRANSACTIONS
-- ==========================================
CREATE TABLE Transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES Accounts(id) ON DELETE CASCADE,
    type transaction_type NOT NULL,
    status transaction_status NOT NULL DEFAULT 'SUCCESS',
    amount NUMERIC NOT NULL CHECK (amount > 0),
    category budget_category NOT NULL,
    description TEXT,
    to_account_id UUID REFERENCES Accounts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT transfer_check CHECK (
        (type = 'TRANSFER' AND to_account_id IS NOT NULL AND to_account_id <> account_id) OR
        (type <> 'TRANSFER' AND to_account_id IS NULL)
    )
);

ALTER TABLE Transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own transactions" 
ON Transactions FOR ALL 
TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- ==========================================
-- 4. TẠO BẢNG BUDGETS
-- ==========================================
CREATE TABLE Budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category budget_category NOT NULL,
    amount_limit NUMERIC NOT NULL DEFAULT 0 CHECK (amount_limit >= 0),
    amount_spent NUMERIC NOT NULL DEFAULT 0 CHECK (amount_spent >= 0),
    month_year VARCHAR(7) NOT NULL,
    CONSTRAINT unique_user_category_month UNIQUE (user_id, category, month_year)
);

ALTER TABLE Budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own budgets" 
ON Budgets FOR ALL 
TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- ==========================================
-- 5. TRIGGER TỰ ĐỘNG ĐỒNG BỘ SỐ DƯ & NGÂN SÁCH (ĐÃ VÁ LỖI STATUS)
-- ==========================================
CREATE OR REPLACE FUNCTION handle_transaction_changes()
RETURNS TRIGGER AS $$
DECLARE
    v_old_month_year VARCHAR(7);
    v_new_month_year VARCHAR(7);
BEGIN
    -- A. ĐẢO NGƯỢC TÁC ĐỘNG CỦA DỮ LIỆU CŨ (Chỉ áp dụng nếu giao dịch cũ ở trạng thái SUCCESS)
    IF (TG_OP = 'DELETE' OR TG_OP = 'UPDATE') AND OLD.status = 'SUCCESS' THEN
        IF OLD.type = 'INCOME' THEN
            UPDATE Accounts SET current_balance = current_balance - OLD.amount WHERE id = OLD.account_id;
        ELSIF OLD.type = 'EXPENSE' THEN
            UPDATE Accounts SET current_balance = current_balance + OLD.amount WHERE id = OLD.account_id;
        ELSIF OLD.type = 'TRANSFER' THEN
            UPDATE Accounts SET current_balance = current_balance + OLD.amount WHERE id = OLD.account_id;
            UPDATE Accounts SET current_balance = current_balance - OLD.amount WHERE id = OLD.to_account_id;
        END IF;

        IF OLD.type = 'EXPENSE' THEN
            v_old_month_year := to_char(OLD.created_at, 'YYYY-MM');
            UPDATE Budgets
            SET amount_spent = greatest(0, amount_spent - OLD.amount)
            WHERE user_id = OLD.user_id AND category = OLD.category AND month_year = v_old_month_year;
        END IF;
    END IF;

    -- B. ÁP DỤNG TÁC ĐỘNG CỦA DỮ LIỆU MỚI (Chỉ áp dụng nếu giao dịch mới ở trạng thái SUCCESS)
    IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND NEW.status = 'SUCCESS' THEN
        IF NEW.type = 'INCOME' THEN
            UPDATE Accounts SET current_balance = current_balance + NEW.amount WHERE id = NEW.account_id;
        ELSIF NEW.type = 'EXPENSE' THEN
            UPDATE Accounts SET current_balance = current_balance - NEW.amount WHERE id = NEW.account_id;
        ELSIF NEW.type = 'TRANSFER' THEN
            UPDATE Accounts SET current_balance = current_balance - NEW.amount WHERE id = NEW.account_id;
            UPDATE Accounts SET current_balance = current_balance + NEW.amount WHERE id = NEW.to_account_id;
        END IF;

        IF NEW.type = 'EXPENSE' THEN
            v_new_month_year := to_char(NEW.created_at, 'YYYY-MM');
            
            -- Upsert budget record
            INSERT INTO Budgets (user_id, category, amount_limit, amount_spent, month_year)
            VALUES (NEW.user_id, NEW.category, 0, NEW.amount, v_new_month_year)
            ON CONFLICT (user_id, category, month_year)
            DO UPDATE SET amount_spent = Budgets.amount_spent + NEW.amount;
        END IF;
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_transaction_changes
AFTER INSERT OR UPDATE OR DELETE ON Transactions
FOR EACH ROW
EXECUTE FUNCTION handle_transaction_changes();

-- ==========================================
-- 6. TRIGGER TỰ ĐỘNG TẠO 6 TÀI KHOẢN MẶC ĐỊNH CHO USER MỚI ĐĂNG KÝ
-- ==========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.Accounts (user_id, name, type, initial_balance, current_balance)
  VALUES 
    (new.id, 'Techcombank', 'BANK', 0, 0),
    (new.id, 'Vietcombank', 'BANK', 0, 0),
    (new.id, 'Ví MoMo', 'WALLET', 0, 0),
    (new.id, 'Ví ZaloPay', 'WALLET', 0, 0),
    (new.id, 'Ví VNPay', 'WALLET', 0, 0),
    (new.id, 'Tiền mặt', 'CASH', 0, 0);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## BƯỚC 2: CẤU HÌNH BIẾN MÔI TRƯỜNG TRÊN VERCEL

Khi import dự án của bạn từ GitHub vào Vercel, hãy thiết lập các biến môi trường (Environment Variables) sau trong Vercel Dashboard:

| Tên biến (Key) | Giá trị (Value) | Mô tả |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://your-project-id.supabase.co` | Đường dẫn API Url dự án Supabase của bạn |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI...` | Anon Key bảo mật cấp cho Client của bạn |

> **Tìm kiếm thông tin này ở đâu?**
> Bạn có thể tìm thấy URL và Anon Key trong Supabase Dashboard dưới mục **Project Settings ➔ API**.

---

## BƯỚC 3: TRIỂN KHAI VÀ HOÀN TẤT

1. **Import code:** Đưa mã nguồn của bạn lên một repository GitHub cá nhân.
2. **Vercel Deploy:** 
   - Đăng nhập vào [Vercel](https://vercel.com).
   - Chọn **Add New... ➔ Project**.
   - Chọn Import Repository chứa dự án của bạn.
   - Nhập hai biến môi trường ở trên vào phần **Environment Variables**.
   - Nhấn **Deploy**.
3. **Xác thực Email (Tùy chọn):** 
   - Mặc định, Supabase Auth sẽ gửi email kích hoạt khi người dùng đăng ký. 
   - Nếu bạn muốn bỏ qua bước xác nhận email để thử nghiệm nhanh, hãy truy cập Supabase Dashboard: **Authentication ➔ Providers ➔ Email** và tắt tùy chọn **Confirm email**.
