-- ============ ENUMS ============
CREATE TYPE public.import_method AS ENUM ('uscloser', 'cssbuy', 'direct', 'other');
CREATE TYPE public.importation_status AS ENUM ('draft', 'ordered', 'in_transit', 'customs', 'received', 'cancelled');
CREATE TYPE public.goal_status AS ENUM ('active', 'completed', 'cancelled');
CREATE TYPE public.sale_channel AS ENUM ('instagram', 'whatsapp', 'marketplace', 'in_person', 'other');

-- ============ SHARED FUNCTIONS ============
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  display_name TEXT,
  store_name TEXT NOT NULL DEFAULT 'Atlas Store',
  base_currency TEXT NOT NULL DEFAULT 'BRL',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_own" ON public.profiles FOR ALL TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ SETTINGS ============
CREATE TABLE public.settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users ON DELETE CASCADE,
  available_profit_percentage NUMERIC(5,2) NOT NULL DEFAULT 50 CHECK (available_profit_percentage >= 0 AND available_profit_percentage <= 100),
  reinvestment_percentage NUMERIC(5,2) NOT NULL DEFAULT 50 CHECK (reinvestment_percentage >= 0 AND reinvestment_percentage <= 100),
  usd_exchange_rate NUMERIC(12,4) NOT NULL DEFAULT 5.4000,
  cny_exchange_rate NUMERIC(12,4) NOT NULL DEFAULT 0.7500,
  import_tax_percentage NUMERIC(5,2) NOT NULL DEFAULT 60,
  icms_percentage NUMERIC(5,2) NOT NULL DEFAULT 17,
  payment_fee_percentage NUMERIC(5,2) NOT NULL DEFAULT 4.99,
  other_fees_percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
  default_markup_percentage NUMERIC(6,2) NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT settings_profit_split_sum CHECK (available_profit_percentage + reinvestment_percentage = 100)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.settings TO authenticated;
GRANT ALL ON public.settings TO service_role;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings_own" ON public.settings FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER settings_updated_at BEFORE UPDATE ON public.settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ NEW USER BOOTSTRAP ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)))
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.settings (user_id) VALUES (NEW.id) ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ SUPPLIERS ============
CREATE TABLE public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name TEXT NOT NULL,
  country TEXT,
  platform TEXT,
  contact TEXT,
  website TEXT,
  default_import_method public.import_method,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.suppliers TO authenticated;
GRANT ALL ON public.suppliers TO service_role;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "suppliers_own" ON public.suppliers FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX suppliers_user_idx ON public.suppliers (user_id);
CREATE TRIGGER suppliers_updated_at BEFORE UPDATE ON public.suppliers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ IMPORTATIONS ============
CREATE TABLE public.importations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  reference TEXT,
  method public.import_method NOT NULL DEFAULT 'other',
  supplier_id UUID REFERENCES public.suppliers ON DELETE SET NULL,
  supplier TEXT,
  origin_country TEXT,
  currency TEXT NOT NULL DEFAULT 'USD',
  exchange_rate NUMERIC(12,4) NOT NULL DEFAULT 1 CHECK (exchange_rate > 0),
  product_total NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (product_total >= 0),
  shipping_cost NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (shipping_cost >= 0),
  taxes NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (taxes >= 0),
  fees NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (fees >= 0),
  insurance NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (insurance >= 0),
  total_cost NUMERIC(14,2) NOT NULL GENERATED ALWAYS AS (product_total + shipping_cost + taxes + fees + insurance) STORED,
  status public.importation_status NOT NULL DEFAULT 'draft',
  ordered_at DATE,
  received_at DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.importations TO authenticated;
GRANT ALL ON public.importations TO service_role;
ALTER TABLE public.importations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "importations_own" ON public.importations FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX importations_user_idx ON public.importations (user_id, created_at DESC);
CREATE TRIGGER importations_updated_at BEFORE UPDATE ON public.importations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ PRODUCTS ============
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name TEXT NOT NULL,
  brand TEXT,
  category TEXT,
  size TEXT,
  color TEXT,
  sku TEXT,
  supplier_id UUID REFERENCES public.suppliers ON DELETE SET NULL,
  importation_id UUID REFERENCES public.importations ON DELETE SET NULL,
  country TEXT,
  import_method public.import_method,
  purchase_price NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (purchase_price >= 0),
  import_cost NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (import_cost >= 0),
  total_cost NUMERIC(14,2) NOT NULL GENERATED ALWAYS AS (purchase_price + import_cost) STORED,
  sale_price NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (sale_price >= 0),
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  image TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products_own" ON public.products FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX products_user_idx ON public.products (user_id, created_at DESC);
CREATE UNIQUE INDEX products_user_sku_idx ON public.products (user_id, sku) WHERE sku IS NOT NULL;
CREATE TRIGGER products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ IMPORTATION ITEMS ============
CREATE TABLE public.importation_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  importation_id UUID NOT NULL REFERENCES public.importations ON DELETE CASCADE,
  product_id UUID REFERENCES public.products ON DELETE SET NULL,
  description TEXT,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price_original NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (unit_price_original >= 0),
  unit_price_converted NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (unit_price_converted >= 0),
  allocated_import_cost NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (allocated_import_cost >= 0),
  unit_total_cost NUMERIC(14,2) NOT NULL GENERATED ALWAYS AS (unit_price_converted + allocated_import_cost) STORED,
  line_total_cost NUMERIC(16,2) NOT NULL GENERATED ALWAYS AS ((unit_price_converted + allocated_import_cost) * quantity) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.importation_items TO authenticated;
GRANT ALL ON public.importation_items TO service_role;
ALTER TABLE public.importation_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "importation_items_own" ON public.importation_items FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX importation_items_importation_idx ON public.importation_items (importation_id);
CREATE INDEX importation_items_product_idx ON public.importation_items (product_id);
CREATE TRIGGER importation_items_updated_at BEFORE UPDATE ON public.importation_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ SALES ============
CREATE TABLE public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  product_id UUID REFERENCES public.products ON DELETE SET NULL,
  customer_name TEXT,
  channel public.sale_channel NOT NULL DEFAULT 'other',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  sale_price NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (sale_price >= 0),
  payment_fee NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (payment_fee >= 0),
  other_costs NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (other_costs >= 0),
  total_revenue NUMERIC(16,2) NOT NULL DEFAULT 0,
  total_cost NUMERIC(16,2) NOT NULL DEFAULT 0,
  gross_profit NUMERIC(16,2) NOT NULL DEFAULT 0,
  available_profit NUMERIC(16,2) NOT NULL DEFAULT 0,
  reinvestment_profit NUMERIC(16,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales TO authenticated;
GRANT ALL ON public.sales TO service_role;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sales_own" ON public.sales FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX sales_user_idx ON public.sales (user_id, date DESC);
CREATE INDEX sales_product_idx ON public.sales (product_id);
CREATE TRIGGER sales_updated_at BEFORE UPDATE ON public.sales
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ SALE ITEMS ============
CREATE TABLE public.sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  sale_id UUID NOT NULL REFERENCES public.sales ON DELETE CASCADE,
  product_id UUID REFERENCES public.products ON DELETE SET NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_sale_price NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (unit_sale_price >= 0),
  unit_cost NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (unit_cost >= 0),
  line_revenue NUMERIC(16,2) NOT NULL GENERATED ALWAYS AS (unit_sale_price * quantity) STORED,
  line_cost NUMERIC(16,2) NOT NULL GENERATED ALWAYS AS (unit_cost * quantity) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sale_items TO authenticated;
GRANT ALL ON public.sale_items TO service_role;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sale_items_own" ON public.sale_items FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX sale_items_sale_idx ON public.sale_items (sale_id);
CREATE INDEX sale_items_product_idx ON public.sale_items (product_id);
CREATE TRIGGER sale_items_updated_at BEFORE UPDATE ON public.sale_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ GOALS ============
CREATE TABLE public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_amount NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (target_amount >= 0),
  current_amount NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (current_amount >= 0),
  average_ticket NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (average_ticket >= 0),
  deadline DATE,
  status public.goal_status NOT NULL DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.goals TO authenticated;
GRANT ALL ON public.goals TO service_role;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "goals_own" ON public.goals FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX goals_user_idx ON public.goals (user_id, status);
CREATE TRIGGER goals_updated_at BEFORE UPDATE ON public.goals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ EXPENSES ============
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  importation_id UUID REFERENCES public.importations ON DELETE SET NULL,
  description TEXT NOT NULL,
  category TEXT,
  amount NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (amount >= 0),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expenses TO authenticated;
GRANT ALL ON public.expenses TO service_role;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "expenses_own" ON public.expenses FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX expenses_user_idx ON public.expenses (user_id, date DESC);
CREATE TRIGGER expenses_updated_at BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ CURRENCY RATES ============
CREATE TABLE public.currency_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  currency TEXT NOT NULL,
  rate NUMERIC(12,4) NOT NULL CHECK (rate > 0),
  reference_date DATE NOT NULL DEFAULT CURRENT_DATE,
  source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT currency_rates_unique UNIQUE (user_id, currency, reference_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.currency_rates TO authenticated;
GRANT ALL ON public.currency_rates TO service_role;
ALTER TABLE public.currency_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "currency_rates_own" ON public.currency_rates FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX currency_rates_user_idx ON public.currency_rates (user_id, currency, reference_date DESC);
CREATE TRIGGER currency_rates_updated_at BEFORE UPDATE ON public.currency_rates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ SERVER-SIDE SALE FINANCIALS ============
CREATE OR REPLACE FUNCTION public.compute_sale_financials()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_items_revenue NUMERIC(16,2) := 0;
  v_items_cost NUMERIC(16,2) := 0;
  v_has_items BOOLEAN := false;
  v_available_pct NUMERIC(5,2) := 50;
  v_reinvest_pct NUMERIC(5,2) := 50;
BEGIN
  SELECT COALESCE(SUM(line_revenue), 0), COALESCE(SUM(line_cost), 0), COUNT(*) > 0
    INTO v_items_revenue, v_items_cost, v_has_items
  FROM public.sale_items WHERE sale_id = NEW.id;

  IF v_has_items THEN
    NEW.total_revenue := v_items_revenue;
    NEW.total_cost := v_items_cost + NEW.payment_fee + NEW.other_costs;
  ELSE
    NEW.total_revenue := NEW.sale_price * NEW.quantity;
    NEW.total_cost := COALESCE((SELECT total_cost FROM public.products WHERE id = NEW.product_id), 0) * NEW.quantity
                      + NEW.payment_fee + NEW.other_costs;
  END IF;

  NEW.gross_profit := NEW.total_revenue - NEW.total_cost;

  SELECT available_profit_percentage, reinvestment_percentage
    INTO v_available_pct, v_reinvest_pct
  FROM public.settings WHERE user_id = NEW.user_id;
  v_available_pct := COALESCE(v_available_pct, 50);
  v_reinvest_pct := COALESCE(v_reinvest_pct, 50);

  NEW.available_profit := ROUND(NEW.gross_profit * v_available_pct / 100, 2);
  NEW.reinvestment_profit := NEW.gross_profit - NEW.available_profit;
  RETURN NEW;
END; $$;

CREATE TRIGGER sales_compute_financials BEFORE INSERT OR UPDATE ON public.sales
  FOR EACH ROW EXECUTE FUNCTION public.compute_sale_financials();

-- Recompute parent sale when items change
CREATE OR REPLACE FUNCTION public.refresh_sale_from_items()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_sale_id UUID := COALESCE(NEW.sale_id, OLD.sale_id);
BEGIN
  UPDATE public.sales SET updated_at = now() WHERE id = v_sale_id;
  RETURN COALESCE(NEW, OLD);
END; $$;

CREATE TRIGGER sale_items_refresh_sale AFTER INSERT OR UPDATE OR DELETE ON public.sale_items
  FOR EACH ROW EXECUTE FUNCTION public.refresh_sale_from_items();

-- ============ STOCK MOVEMENT FROM SALE ITEMS ============
CREATE OR REPLACE FUNCTION public.apply_sale_item_stock()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.product_id IS NOT NULL THEN
    UPDATE public.products SET quantity = GREATEST(quantity - NEW.quantity, 0) WHERE id = NEW.product_id;
  ELSIF TG_OP = 'DELETE' AND OLD.product_id IS NOT NULL THEN
    UPDATE public.products SET quantity = quantity + OLD.quantity WHERE id = OLD.product_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.product_id IS NOT NULL THEN
      UPDATE public.products SET quantity = quantity + OLD.quantity WHERE id = OLD.product_id;
    END IF;
    IF NEW.product_id IS NOT NULL THEN
      UPDATE public.products SET quantity = GREATEST(quantity - NEW.quantity, 0) WHERE id = NEW.product_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END; $$;

CREATE TRIGGER sale_items_stock AFTER INSERT OR UPDATE OR DELETE ON public.sale_items
  FOR EACH ROW EXECUTE FUNCTION public.apply_sale_item_stock();