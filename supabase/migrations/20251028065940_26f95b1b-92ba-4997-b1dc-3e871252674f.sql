-- Remove admin role from checkchirasha@gmail.com if exists
DELETE FROM user_roles 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'checkchirasha@gmail.com')
AND role = 'admin';

-- Grant admin role to mapseujers@gmail.com
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'mapseujers@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;