-- Remove the failed sample data and create a clean migration
-- Just insert sample resources without the user profiles
DELETE FROM public.profiles WHERE user_id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');

-- Insert sample resources if they don't exist
INSERT INTO public.resources (title, description, content_type, language, risk_level, tags) 
SELECT 'Mindfulness for Students', 'Basic mindfulness techniques for stress management', 'video', 'english', 'low', ARRAY['mindfulness', 'stress', 'meditation']
WHERE NOT EXISTS (SELECT 1 FROM public.resources WHERE title = 'Mindfulness for Students');

INSERT INTO public.resources (title, description, content_type, language, risk_level, tags) 
SELECT 'तनाव प्रबंधन तकनीकें', 'छात्रों के लिए तनाव कम करने की तकनीकें', 'article', 'hindi', 'medium', ARRAY['stress', 'hindi']
WHERE NOT EXISTS (SELECT 1 FROM public.resources WHERE title = 'तनाव प्रबंधन तकनीकें');

INSERT INTO public.resources (title, description, content_type, language, risk_level, tags) 
SELECT 'Crisis Support Resources', 'Immediate help resources for mental health crisis', 'guide', 'english', 'high', ARRAY['crisis', 'emergency']
WHERE NOT EXISTS (SELECT 1 FROM public.resources WHERE title = 'Crisis Support Resources');

INSERT INTO public.resources (title, description, content_type, language, risk_level, tags) 
SELECT 'Yoga and Mental Health', 'How yoga practices can improve mental wellbeing', 'video', 'english', 'low', ARRAY['yoga', 'wellness']
WHERE NOT EXISTS (SELECT 1 FROM public.resources WHERE title = 'Yoga and Mental Health');

INSERT INTO public.resources (title, description, content_type, language, risk_level, tags) 
SELECT 'آپ کی ذہنی صحت', 'ذہنی صحت کے بارے میں بنیادی معلومات', 'article', 'urdu', 'medium', ARRAY['mental-health', 'urdu']
WHERE NOT EXISTS (SELECT 1 FROM public.resources WHERE title = 'آپ کی ذہنی صحت');