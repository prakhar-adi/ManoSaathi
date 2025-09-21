-- Safe Resource Hub Migration - handles existing tables
-- This script safely adds missing columns and creates new tables

-- Create resource categories table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.resource_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT, -- Icon name for UI display
  color TEXT DEFAULT '#3B82F6', -- Hex color for category cards
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create resources table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('video', 'audio', 'article', 'link')),
  category_id UUID REFERENCES public.resource_categories(id) ON DELETE CASCADE NOT NULL,
  language TEXT NOT NULL CHECK (language IN ('english', 'hindi', 'urdu')),
  duration_minutes INTEGER, -- Duration in minutes (for video/audio)
  content_url TEXT, -- URL for external links or uploaded files
  content_text TEXT, -- Text content for articles
  thumbnail_url TEXT, -- Thumbnail image URL
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Add missing columns to existing resources table
DO $$ 
BEGIN
    -- Add is_active column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'resources' AND column_name = 'is_active') THEN
        ALTER TABLE public.resources ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;
    END IF;
    
    -- Add created_by column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'resources' AND column_name = 'created_by') THEN
        ALTER TABLE public.resources ADD COLUMN created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;
    
    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'resources' AND column_name = 'updated_at') THEN
        ALTER TABLE public.resources ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL;
    END IF;
    
    -- Add content_type column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'resources' AND column_name = 'content_type') THEN
        ALTER TABLE public.resources ADD COLUMN content_type TEXT NOT NULL DEFAULT 'article';
    END IF;
    
    -- Add category_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'resources' AND column_name = 'category_id') THEN
        ALTER TABLE public.resources ADD COLUMN category_id UUID;
    END IF;
    
    -- Add language column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'resources' AND column_name = 'language') THEN
        ALTER TABLE public.resources ADD COLUMN language TEXT NOT NULL DEFAULT 'english';
    END IF;
    
    -- Add duration_minutes column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'resources' AND column_name = 'duration_minutes') THEN
        ALTER TABLE public.resources ADD COLUMN duration_minutes INTEGER;
    END IF;
    
    -- Add content_url column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'resources' AND column_name = 'content_url') THEN
        ALTER TABLE public.resources ADD COLUMN content_url TEXT;
    END IF;
    
    -- Add content_text column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'resources' AND column_name = 'content_text') THEN
        ALTER TABLE public.resources ADD COLUMN content_text TEXT;
    END IF;
    
    -- Add thumbnail_url column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'resources' AND column_name = 'thumbnail_url') THEN
        ALTER TABLE public.resources ADD COLUMN thumbnail_url TEXT;
    END IF;
END $$;

-- Create user resource interactions table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.user_resource_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  resource_id UUID REFERENCES public.resources(id) ON DELETE CASCADE NOT NULL,
  is_bookmarked BOOLEAN NOT NULL DEFAULT false,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(user_id, resource_id)
);

-- Create resource tags table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.resource_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#6B7280',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create many-to-many relationship between resources and tags (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.resource_tag_assignments (
  resource_id UUID REFERENCES public.resources(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES public.resource_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (resource_id, tag_id)
);

-- Enable RLS on all tables
ALTER TABLE public.resource_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_resource_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_tag_assignments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Anyone can view active resource categories" ON public.resource_categories;
DROP POLICY IF EXISTS "Admins and counselors can manage categories" ON public.resource_categories;
DROP POLICY IF EXISTS "Anyone can view active resources" ON public.resources;
DROP POLICY IF EXISTS "Admins and counselors can manage resources" ON public.resources;
DROP POLICY IF EXISTS "Users can view their own interactions" ON public.user_resource_interactions;
DROP POLICY IF EXISTS "Users can manage their own interactions" ON public.user_resource_interactions;
DROP POLICY IF EXISTS "Admins can view all interactions" ON public.user_resource_interactions;
DROP POLICY IF EXISTS "Anyone can view resource tags" ON public.resource_tags;
DROP POLICY IF EXISTS "Admins and counselors can manage tags" ON public.resource_tags;
DROP POLICY IF EXISTS "Anyone can view tag assignments" ON public.resource_tag_assignments;
DROP POLICY IF EXISTS "Admins and counselors can manage tag assignments" ON public.resource_tag_assignments;

-- Create RLS policies for resource_categories
CREATE POLICY "Anyone can view active resource categories" ON public.resource_categories
FOR SELECT USING (true);

CREATE POLICY "Admins and counselors can manage categories" ON public.resource_categories
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'counselor')
  )
);

-- Create RLS policies for resources
CREATE POLICY "Anyone can view active resources" ON public.resources
FOR SELECT USING (is_active = true);

CREATE POLICY "Admins and counselors can manage resources" ON public.resources
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'counselor')
  )
);

-- Create RLS policies for user_resource_interactions
CREATE POLICY "Users can view their own interactions" ON public.user_resource_interactions
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own interactions" ON public.user_resource_interactions
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all interactions" ON public.user_resource_interactions
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create RLS policies for resource_tags
CREATE POLICY "Anyone can view resource tags" ON public.resource_tags
FOR SELECT USING (true);

CREATE POLICY "Admins and counselors can manage tags" ON public.resource_tags
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'counselor')
  )
);

-- Create RLS policies for resource_tag_assignments
CREATE POLICY "Anyone can view tag assignments" ON public.resource_tag_assignments
FOR SELECT USING (true);

CREATE POLICY "Admins and counselors can manage tag assignments" ON public.resource_tag_assignments
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'counselor')
  )
);

-- Create triggers for updated_at columns (only if they don't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_resource_categories_updated_at' AND event_object_table = 'resource_categories') THEN
        CREATE TRIGGER update_resource_categories_updated_at
          BEFORE UPDATE ON public.resource_categories
          FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_resources_updated_at' AND event_object_table = 'resources') THEN
        CREATE TRIGGER update_resources_updated_at
          BEFORE UPDATE ON public.resources
          FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_user_resource_interactions_updated_at' AND event_object_table = 'user_resource_interactions') THEN
        CREATE TRIGGER update_user_resource_interactions_updated_at
          BEFORE UPDATE ON public.user_resource_interactions
          FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_resource_tags_updated_at' AND event_object_table = 'resource_tags') THEN
        CREATE TRIGGER update_resource_tags_updated_at
          BEFORE UPDATE ON public.resource_tags
          FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;

-- Insert default resource categories (only if they don't exist)
INSERT INTO public.resource_categories (name, description, icon, color) VALUES
('Academic Stress', 'Resources for managing academic pressure and study-related stress', 'BookOpen', '#EF4444'),
('Career Anxiety', 'Guidance for career planning and professional development', 'Briefcase', '#F59E0B'),
('Family Pressure', 'Support for dealing with family expectations and relationships', 'Users', '#8B5CF6'),
('Relationship Issues', 'Resources for healthy relationships and communication', 'Heart', '#EC4899'),
('Financial Stress', 'Financial planning and money management guidance', 'DollarSign', '#10B981'),
('Mental Health Awareness', 'General mental health education and awareness', 'Brain', '#3B82F6'),
('Campus Life', 'Adjusting to college life and campus community', 'GraduationCap', '#06B6D4'),
('Traditional Wellness Practices', 'Traditional and cultural wellness approaches', 'Flower2', '#84CC16')
ON CONFLICT (name) DO NOTHING;

-- Insert default resource tags (only if they don't exist)
INSERT INTO public.resource_tags (name, color) VALUES
('Quick Read', '#6B7280'),
('Deep Dive', '#3B82F6'),
('Interactive', '#10B981'),
('Beginner Friendly', '#F59E0B'),
('Advanced', '#EF4444'),
('Crisis Support', '#DC2626'),
('Daily Practice', '#8B5CF6'),
('Community', '#EC4899')
ON CONFLICT (name) DO NOTHING;

-- Insert sample resources (only if they don't exist)
INSERT INTO public.resources (title, description, content_type, category_id, language, duration_minutes, content_text, thumbnail_url) 
SELECT 
  'Understanding Academic Stress',
  'A comprehensive guide to recognizing and managing academic stress in college life.',
  'article',
  (SELECT id FROM public.resource_categories WHERE name = 'Academic Stress'),
  'english',
  15,
  '# Understanding Academic Stress

Academic stress is a common experience among students, characterized by feelings of pressure, anxiety, and overwhelm related to academic responsibilities. This comprehensive guide will help you understand, recognize, and manage academic stress effectively.

## What is Academic Stress?

Academic stress refers to the mental and emotional strain students experience due to academic demands, including:
- Heavy coursework and assignments
- Exam pressure and performance anxiety
- Time management challenges
- Competition with peers
- Fear of failure or disappointing others

## Recognizing the Signs

### Physical Symptoms
- Headaches and muscle tension
- Fatigue and sleep disturbances
- Changes in appetite
- Frequent illness due to weakened immune system

### Emotional Symptoms
- Anxiety and worry
- Irritability and mood swings
- Feeling overwhelmed
- Loss of motivation
- Depression or sadness

### Behavioral Symptoms
- Procrastination
- Social withdrawal
- Changes in study habits
- Increased substance use
- Perfectionism

## Effective Management Strategies

### 1. Time Management
- Create a realistic study schedule
- Break large tasks into smaller, manageable chunks
- Use productivity techniques like the Pomodoro Technique
- Set realistic goals and deadlines

### 2. Stress Reduction Techniques
- Practice deep breathing exercises
- Engage in regular physical activity
- Try meditation or mindfulness
- Maintain a healthy sleep schedule

### 3. Academic Support
- Seek help from professors or teaching assistants
- Join study groups
- Utilize campus academic resources
- Consider tutoring if needed

### 4. Self-Care
- Maintain a balanced diet
- Stay hydrated
- Take regular breaks
- Engage in hobbies and interests outside academics

## When to Seek Help

If academic stress is significantly impacting your daily life, relationships, or mental health, consider seeking professional help from:
- Campus counseling services
- Mental health professionals
- Academic advisors
- Support groups

Remember, seeking help is a sign of strength, not weakness. Your mental health and well-being are just as important as your academic success.',
  'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400'
WHERE NOT EXISTS (SELECT 1 FROM public.resources WHERE title = 'Understanding Academic Stress');

-- Insert a sample video resource
INSERT INTO public.resources (title, description, content_type, category_id, language, duration_minutes, content_url, thumbnail_url) 
SELECT 
  'Mindfulness Meditation for Students',
  'A guided meditation session specifically designed for students to reduce stress and improve focus.',
  'video',
  (SELECT id FROM public.resource_categories WHERE name = 'Mental Health Awareness'),
  'english',
  20,
  'https://www.youtube.com/embed/inpok4MKVLM',
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400'
WHERE NOT EXISTS (SELECT 1 FROM public.resources WHERE title = 'Mindfulness Meditation for Students');

-- Insert a sample audio resource
INSERT INTO public.resources (title, description, content_type, category_id, language, duration_minutes, content_url, thumbnail_url) 
SELECT 
  'Stress Relief Breathing Exercise',
  'A calming audio guide for breathing exercises to help manage stress and anxiety.',
  'audio',
  (SELECT id FROM public.resource_categories WHERE name = 'Mental Health Awareness'),
  'english',
  10,
  'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
  'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400'
WHERE NOT EXISTS (SELECT 1 FROM public.resources WHERE title = 'Stress Relief Breathing Exercise');

-- Insert a sample external link resource
INSERT INTO public.resources (title, description, content_type, category_id, language, content_url, thumbnail_url) 
SELECT 
  'National Suicide Prevention Lifeline',
  '24/7 crisis support and suicide prevention resources.',
  'link',
  (SELECT id FROM public.resource_categories WHERE name = 'Mental Health Awareness'),
  'english',
  'https://suicidepreventionlifeline.org',
  'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400'
WHERE NOT EXISTS (SELECT 1 FROM public.resources WHERE title = 'National Suicide Prevention Lifeline');
