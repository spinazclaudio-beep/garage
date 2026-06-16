-- ============================================================
-- SPINAZ GARAGE - Schema completo para base de datos nueva
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Profiles (Drivers and Admins)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE,
    full_name TEXT,
    role TEXT DEFAULT 'driver' CHECK (role IN ('admin', 'driver', 'developer', 'gestor')),
    phone TEXT,
    dni TEXT,
    vehicle_id UUID,
    metrics JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Vehicles
CREATE TABLE IF NOT EXISTS public.vehicles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    plate TEXT UNIQUE NOT NULL,
    brand TEXT,
    model TEXT,
    year INTEGER,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'lubricentro', 'lavadero', 'out_of_service')),
    driver_id UUID,
    last_lat DOUBLE PRECISION,
    last_lng DOUBLE PRECISION,
    metrics JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key constraints
ALTER TABLE public.profiles ADD CONSTRAINT fk_vehicle FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id) ON DELETE SET NULL;
ALTER TABLE public.vehicles ADD CONSTRAINT fk_driver FOREIGN KEY (driver_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 3. Applicants (Postulantes)
CREATE TABLE IF NOT EXISTS public.applicants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name TEXT NOT NULL,
    dni TEXT NOT NULL,
    age INTEGER,
    phone TEXT NOT NULL,
    zone TEXT,
    app_experience TEXT,
    accident_history TEXT,
    has_professional_license BOOLEAN DEFAULT false,
    can_pay_advance BOOLEAN DEFAULT false,
    dni_front_url TEXT,
    dni_back_url TEXT,
    license_url TEXT,
    selfie_url TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Payments & Debts
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    driver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    type TEXT DEFAULT 'payment' CHECK (type IN ('payment', 'debt', 'penalty')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
    due_date DATE,
    receipt_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Incidents
CREATE TABLE IF NOT EXISTS public.incidents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    driver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    photo_url TEXT,
    audio_url TEXT,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Announcements
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    driver_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Daily Reports
CREATE TABLE IF NOT EXISTS public.daily_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    driver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
    start_km INTEGER NOT NULL,
    end_km INTEGER,
    start_time TIMESTAMPTZ DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    revenue DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Benefits (Spinaz Club)
CREATE TABLE IF NOT EXISTS public.benefits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    location TEXT,
    icon TEXT,
    color TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Vehicle Logs
CREATE TABLE IF NOT EXISTS public.vehicle_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    date TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Driver Logs
CREATE TABLE IF NOT EXISTS public.driver_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    driver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    date TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applicants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.benefits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- PROFILES
CREATE POLICY "Admins can manage all profiles" ON public.profiles
FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Users can view own profile" ON public.profiles
FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE USING (id = auth.uid());

-- VEHICLES
CREATE POLICY "Admins can manage vehicles" ON public.vehicles
FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Authenticated users can view vehicles" ON public.vehicles
FOR SELECT USING (auth.role() = 'authenticated');

-- APPLICANTS
CREATE POLICY "Public can insert applicants" ON public.applicants
FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can manage applicants" ON public.applicants
FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- PAYMENTS
CREATE POLICY "Admins can manage payments" ON public.payments
FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Drivers can view own payments" ON public.payments
FOR SELECT USING (driver_id = auth.uid());

-- INCIDENTS
CREATE POLICY "Admins can manage incidents" ON public.incidents
FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Drivers can manage own incidents" ON public.incidents
FOR ALL USING (driver_id = auth.uid());

-- ANNOUNCEMENTS
CREATE POLICY "Admins can manage announcements" ON public.announcements
FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Everyone can view active announcements" ON public.announcements
FOR SELECT USING (is_active = true);

-- DAILY REPORTS
CREATE POLICY "Admins can manage all daily reports" ON public.daily_reports
FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Drivers can manage own daily reports" ON public.daily_reports
FOR ALL USING (driver_id = auth.uid());

-- BENEFITS
CREATE POLICY "Admins can manage benefits" ON public.benefits
FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Everyone can view active benefits" ON public.benefits
FOR SELECT USING (is_active = true);

-- VEHICLE LOGS
CREATE POLICY "Permitir lectura y escritura a usuarios autenticados en vehicle_logs"
ON public.vehicle_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- DRIVER LOGS
CREATE POLICY "Permitir lectura y escritura a usuarios autenticados en driver_logs"
ON public.driver_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- TRIGGER: auto-crear profile al registrar usuario
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'driver')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
