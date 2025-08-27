-- Fix security warnings by updating functions with proper search_path

-- Update get_current_user_role function
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- Update get_current_user_department function
CREATE OR REPLACE FUNCTION public.get_current_user_department()
RETURNS UUID AS $$
    SELECT department_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- Update handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        'department_user'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update generate_reference_number function
CREATE OR REPLACE FUNCTION public.generate_reference_number()
RETURNS TEXT AS $$
DECLARE
    year_prefix TEXT;
    sequence_num INTEGER;
    ref_number TEXT;
BEGIN
    year_prefix := 'MIT/' || EXTRACT(YEAR FROM NOW()) || '/';
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(reference_number FROM '\d+$') AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM public.letters
    WHERE reference_number LIKE year_prefix || '%';
    
    ref_number := year_prefix || LPAD(sequence_num::TEXT, 4, '0');
    
    RETURN ref_number;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Update update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;