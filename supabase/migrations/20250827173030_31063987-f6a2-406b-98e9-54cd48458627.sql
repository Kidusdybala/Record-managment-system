-- Create enum for user roles
CREATE TYPE public.user_role AS ENUM ('minister', 'record_office', 'department_user');

-- Create enum for letter status
CREATE TYPE public.letter_status AS ENUM ('draft', 'submitted', 'pending_admin_approval', 'pending_minister_approval', 'approved', 'rejected', 'delivered');

-- Create departments table
CREATE TABLE public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    code TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'department_user',
    department_id UUID REFERENCES public.departments(id),
    phone TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create letters table
CREATE TABLE public.letters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference_number TEXT NOT NULL UNIQUE,
    subject TEXT NOT NULL,
    content TEXT NOT NULL,
    sender_id UUID NOT NULL REFERENCES public.profiles(id),
    sender_department_id UUID REFERENCES public.departments(id),
    recipient_department_id UUID REFERENCES public.departments(id),
    status letter_status DEFAULT 'draft',
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    requires_minister_approval BOOLEAN DEFAULT false,
    attachments JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create letter approvals table
CREATE TABLE public.letter_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    letter_id UUID NOT NULL REFERENCES public.letters(id) ON DELETE CASCADE,
    approver_id UUID NOT NULL REFERENCES public.profiles(id),
    approval_type TEXT NOT NULL CHECK (approval_type IN ('admin_review', 'minister_approval')),
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
    comments TEXT,
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create letter tracking table
CREATE TABLE public.letter_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    letter_id UUID NOT NULL REFERENCES public.letters(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    performed_by UUID NOT NULL REFERENCES public.profiles(id),
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert sample departments
INSERT INTO public.departments (name, code, description) VALUES
('Information Technology', 'IT', 'Technology infrastructure and systems'),
('Cybersecurity', 'CS', 'Digital security and threat management'),
('Digital Transformation', 'DT', 'Modernization of government services'),
('Data Analytics', 'DA', 'Data science and business intelligence'),
('Software Development', 'SD', 'Custom software solutions'),
('Network Infrastructure', 'NI', 'Network design and maintenance'),
('Cloud Services', 'CL', 'Cloud computing and migration'),
('AI and Machine Learning', 'AI', 'Artificial intelligence initiatives'),
('E-Government Services', 'EG', 'Digital government platforms'),
('Telecommunications', 'TC', 'Communication systems and policies'),
('Innovation Lab', 'IL', 'Research and development'),
('Digital Skills', 'DS', 'Training and capacity building'),
('Tech Policy', 'TP', 'Technology governance and regulation'),
('Smart Cities', 'SC', 'Urban technology solutions'),
('Blockchain Technology', 'BT', 'Distributed ledger systems'),
('IoT Solutions', 'IOT', 'Internet of Things projects'),
('Mobile Applications', 'MA', 'Mobile development and services'),
('Web Development', 'WD', 'Web platforms and portals'),
('Database Management', 'DB', 'Data storage and management'),
('System Integration', 'SI', 'Enterprise system connectivity'),
('Digital Identity', 'DI', 'Identity verification systems'),
('E-Commerce', 'EC', 'Online business platforms'),
('Tech Support', 'TS', 'Technical assistance and help desk'),
('Quality Assurance', 'QA', 'Software testing and validation');

-- Enable Row Level Security
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.letter_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.letter_tracking ENABLE ROW LEVEL SECURITY;

-- Create security definer functions to avoid RLS recursion
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.get_current_user_department()
RETURNS UUID AS $$
    SELECT department_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- RLS Policies for departments
CREATE POLICY "Everyone can view departments" ON public.departments
    FOR SELECT USING (true);

CREATE POLICY "Only record office can manage departments" ON public.departments
    FOR ALL USING (public.get_current_user_role() = 'record_office');

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Record office can view all profiles" ON public.profiles
    FOR SELECT USING (public.get_current_user_role() = 'record_office');

CREATE POLICY "Minister can view all profiles" ON public.profiles
    FOR SELECT USING (public.get_current_user_role() = 'minister');

CREATE POLICY "Record office can manage profiles" ON public.profiles
    FOR ALL USING (public.get_current_user_role() = 'record_office');

-- RLS Policies for letters
CREATE POLICY "Users can view letters they sent" ON public.letters
    FOR SELECT USING (sender_id = auth.uid());

CREATE POLICY "Users can view letters sent to their department" ON public.letters
    FOR SELECT USING (recipient_department_id = public.get_current_user_department());

CREATE POLICY "Record office can view all letters" ON public.letters
    FOR SELECT USING (public.get_current_user_role() = 'record_office');

CREATE POLICY "Minister can view letters requiring approval" ON public.letters
    FOR SELECT USING (
        public.get_current_user_role() = 'minister' AND 
        (requires_minister_approval = true OR status = 'pending_minister_approval')
    );

CREATE POLICY "Users can create letters" ON public.letters
    FOR INSERT WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can update their own draft letters" ON public.letters
    FOR UPDATE USING (sender_id = auth.uid() AND status = 'draft');

CREATE POLICY "Record office can update letters" ON public.letters
    FOR UPDATE USING (public.get_current_user_role() = 'record_office');

-- RLS Policies for letter approvals
CREATE POLICY "Approvers can view their approvals" ON public.letter_approvals
    FOR SELECT USING (approver_id = auth.uid());

CREATE POLICY "Record office can view all approvals" ON public.letter_approvals
    FOR SELECT USING (public.get_current_user_role() = 'record_office');

CREATE POLICY "Record office can create approvals" ON public.letter_approvals
    FOR INSERT WITH CHECK (public.get_current_user_role() = 'record_office');

CREATE POLICY "Approvers can update their approvals" ON public.letter_approvals
    FOR UPDATE USING (approver_id = auth.uid());

-- RLS Policies for letter tracking
CREATE POLICY "Users can view tracking for their letters" ON public.letter_tracking
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.letters 
            WHERE letters.id = letter_tracking.letter_id 
            AND (sender_id = auth.uid() OR recipient_department_id = public.get_current_user_department())
        )
    );

CREATE POLICY "Record office can view all tracking" ON public.letter_tracking
    FOR SELECT USING (public.get_current_user_role() = 'record_office');

CREATE POLICY "Authenticated users can create tracking entries" ON public.letter_tracking
    FOR INSERT WITH CHECK (performed_by = auth.uid());

-- Create function to handle new user registration
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile when user signs up
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to generate reference numbers
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
$$ LANGUAGE plpgsql;

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON public.departments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_letters_updated_at BEFORE UPDATE ON public.letters FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();