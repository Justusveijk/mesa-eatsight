-- Add drink-specific tags to existing drink menu items
-- These tags support the new branching drink question flow

DO $$
DECLARE
  v_item_id UUID;
BEGIN
  -- House Red Wine
  SELECT id INTO v_item_id FROM menu_items WHERE name = 'House Red Wine' LIMIT 1;
  IF v_item_id IS NOT NULL THEN
    INSERT INTO item_tags (item_id, tag) VALUES (v_item_id, 'drink_mood_unwind') ON CONFLICT DO NOTHING;
    INSERT INTO item_tags (item_id, tag) VALUES (v_item_id, 'drink_flavor_dry') ON CONFLICT DO NOTHING;
  END IF;

  -- Craft IPA
  SELECT id INTO v_item_id FROM menu_items WHERE name LIKE '%Craft IPA%' LIMIT 1;
  IF v_item_id IS NOT NULL THEN
    INSERT INTO item_tags (item_id, tag) VALUES (v_item_id, 'drink_mood_unwind') ON CONFLICT DO NOTHING;
    INSERT INTO item_tags (item_id, tag) VALUES (v_item_id, 'drink_flavor_bitter') ON CONFLICT DO NOTHING;
  END IF;

  -- Espresso Martini
  SELECT id INTO v_item_id FROM menu_items WHERE name = 'Espresso Martini' LIMIT 1;
  IF v_item_id IS NOT NULL THEN
    INSERT INTO item_tags (item_id, tag) VALUES (v_item_id, 'drink_mood_celebrate') ON CONFLICT DO NOTHING;
    INSERT INTO item_tags (item_id, tag) VALUES (v_item_id, 'drink_mood_energize') ON CONFLICT DO NOTHING;
    INSERT INTO item_tags (item_id, tag) VALUES (v_item_id, 'drink_flavor_sweet') ON CONFLICT DO NOTHING;
  END IF;

  -- Fresh Lemonade
  SELECT id INTO v_item_id FROM menu_items WHERE name = 'Fresh Lemonade' LIMIT 1;
  IF v_item_id IS NOT NULL THEN
    INSERT INTO item_tags (item_id, tag) VALUES (v_item_id, 'drink_mood_refresh') ON CONFLICT DO NOTHING;
    INSERT INTO item_tags (item_id, tag) VALUES (v_item_id, 'drink_flavor_fruity') ON CONFLICT DO NOTHING;
    INSERT INTO item_tags (item_id, tag) VALUES (v_item_id, 'drink_non_alcoholic') ON CONFLICT DO NOTHING;
  END IF;

  -- Mezcal Margarita
  SELECT id INTO v_item_id FROM menu_items WHERE name LIKE '%Mezcal Margarita%' LIMIT 1;
  IF v_item_id IS NOT NULL THEN
    INSERT INTO item_tags (item_id, tag) VALUES (v_item_id, 'drink_mood_celebrate') ON CONFLICT DO NOTHING;
    INSERT INTO item_tags (item_id, tag) VALUES (v_item_id, 'drink_mood_treat') ON CONFLICT DO NOTHING;
    INSERT INTO item_tags (item_id, tag) VALUES (v_item_id, 'drink_flavor_smoky') ON CONFLICT DO NOTHING;
  END IF;
END $$;
