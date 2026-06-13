-- ============================================================
-- YE MERA INDIA - Homepage Builder Seed Content
-- Run after database/homepage_builder.sql
-- ============================================================

INSERT INTO hero_banners
(title, subtitle, description, button1_text, button1_link, button2_text, button2_link, image_url, sort_order, is_active)
VALUES
('Vivid India, One Canvas', 'Author + Artist Stories', 'Explore India through viral moments, cultural stories, state environments, festivals, people, colours and visual art.', 'Read Stories', '/posts', 'Explore Gallery', '#gallery', '', 1, 1),
('Many States, One Soul', 'Unity in Diversity', 'From Himalayan silence to Rajasthan gold, Kerala green and Bengal art — every state adds one brushstroke to India.', 'Explore India', '/posts', 'Open Gallery', '#gallery', '', 2, 1);

INSERT INTO sub_hero_banners
(title, short_text, image_url, button_text, button_link, sort_order, is_active)
VALUES
('Trending India Stories', 'Viral Indian events explained with culture, people and emotion.', '', 'Read Now', '/posts', 1, 1),
('Indian Art & Culture', 'Festivals, folk colours, visual art and timeless traditions.', '', 'Explore', '#gallery', 2, 1),
('State-wise India', 'Stories from Rajasthan, Kerala, Bengal, Kashmir, Gujarat, Tamil Nadu and more.', '', 'Discover', '/posts', 3, 1);

INSERT INTO media_gallery
(media_type, title, caption, file_url, category, is_featured, sort_order, is_active)
VALUES
('image', 'Colours of Rajasthan', 'Desert gold, forts, textiles and folk memories.', '', 'Rajasthan', 1, 1, 1),
('image', 'Monsoon India', 'Rain, rivers, fields and green stories from India.', '', 'Nature', 1, 2, 1),
('image', 'Festival Lights', 'Celebrations that connect different states into one emotion.', '', 'Festivals', 1, 3, 1);

INSERT INTO homepage_tiles
(title, description, image_url, icon_name, bg_color, button_text, button_link, tile_size, sort_order, is_active)
VALUES
('Viral India Events', 'Trending events, moments and social stories from India explained with cultural depth.', '', '🔥', '#32120a', 'Read', '/posts', 'medium', 1, 1),
('Vivid States', 'Different environments of India: mountains, deserts, coasts, rivers and forests.', '', '🗺️', '#170805', 'Explore', '/posts', 'medium', 2, 1),
('Festivals & Culture', 'Stories of colour, devotion, art, food, music and celebration.', '', '🪔', '#291006', 'Discover', '/posts', 'medium', 3, 1),
('Artist Gallery', 'Visual media and edited post artwork for the YE MERA INDIA homepage.', '', '🎨', '#1f1208', 'View', '#gallery', 'medium', 4, 1),
('Author Notes', 'Personal reflections, essays and thoughtful observations from the author.', '', '✍️', '#221006', 'Read', '/posts', 'medium', 5, 1),
('One India', 'Unity in diversity told through stories, images and everyday Indian experiences.', '', '🇮🇳', '#241006', 'Open', '/posts', 'medium', 6, 1);
