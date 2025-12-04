-- Add language column to menu_items table
ALTER TABLE public.menu_items 
ADD COLUMN language character varying(50) DEFAULT 'English'::character varying;

COMMENT ON COLUMN public.menu_items.language IS 'Language for the menu item (English, Vietnamese, Korean, Japanese, Chinese, French, Russian)';

-- Add language column to promotions table
ALTER TABLE public.promotions 
ADD COLUMN language character varying(50) DEFAULT 'English'::character varying;

COMMENT ON COLUMN public.promotions.language IS 'Language for the promotion (English, Vietnamese, Korean, Japanese, Chinese, French, Russian)';

-- Add language column to resort_events table
ALTER TABLE public.resort_events 
ADD COLUMN language character varying(50) DEFAULT 'English'::character varying;

COMMENT ON COLUMN public.resort_events.language IS 'Language for the resort event (English, Vietnamese, Korean, Japanese, Chinese, French, Russian)';

-- Create indexes for better query performance
CREATE INDEX idx_menu_items_language ON public.menu_items USING btree (language);
CREATE INDEX idx_promotions_language ON public.promotions USING btree (language);
CREATE INDEX idx_resort_events_language ON public.resort_events USING btree (language);

