UPDATE users SET user_type = 'SUPER_ADMIN' WHERE email = 'giandroft@gmail.com';
SELECT id, name, email, user_type FROM users WHERE email = 'giandroft@gmail.com';