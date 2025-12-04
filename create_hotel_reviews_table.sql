-- Create hotel_reviews table
CREATE TABLE IF NOT EXISTS public.hotel_reviews (
    id SERIAL PRIMARY KEY,
    room_number character varying(20) NOT NULL,
    guest_name character varying(100) NOT NULL,
    category_ratings JSONB NOT NULL, -- Store array of {category: string, rating: number}
    average_rating numeric(3,1) NOT NULL,
    comment text,
    timestamp bigint NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT hotel_reviews_room_number_unique UNIQUE (room_number)
);

COMMENT ON TABLE public.hotel_reviews IS 'Hotel reviews submitted by guests';
COMMENT ON COLUMN public.hotel_reviews.category_ratings IS 'JSON array of category ratings: [{"category": "Reception & Front Desk", "rating": 5}, ...]';
COMMENT ON COLUMN public.hotel_reviews.average_rating IS 'Calculated average of all category ratings';

-- Create index for faster queries
CREATE INDEX idx_hotel_reviews_room_number ON public.hotel_reviews USING btree (room_number);
CREATE INDEX idx_hotel_reviews_created_at ON public.hotel_reviews USING btree (created_at DESC);

-- Create trigger to update updated_at
CREATE TRIGGER update_hotel_reviews_updated_at 
    BEFORE UPDATE ON public.hotel_reviews 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

